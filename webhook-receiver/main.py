import asyncio
import json
import logging
import time
from typing import Optional

import asyncpg
import httpx
import redis.asyncio as redis
from fastapi import FastAPI, Request, BackgroundTasks
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("webhook-receiver")

app = FastAPI(title="Traccar Webhook Receiver")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

redis_client: Optional[redis.Redis] = None
db_pool: Optional[asyncpg.Pool] = None
session_cache: dict = {}
SESSION_CACHE_TTL = 300


async def get_redis() -> redis.Redis:
    global redis_client
    if redis_client is None:
        redis_client = redis.from_url("redis://redis:6379/0", decode_responses=True)
    return redis_client


async def get_db() -> asyncpg.Pool:
    global db_pool
    if db_pool is None:
        db_pool = await asyncpg.create_pool(
            user="dmt_admin",
            password="dmt_prod_secure_2026_change_me",
            host="timescaledb",
            port=5432,
            database="dmtracker",
            min_size=5,
            max_size=20,
            command_timeout=30,
        )
    return db_pool


async def validate_session(jsessionid: str) -> bool:
    now = time.time()
    cached = session_cache.get(jsessionid)
    if cached and cached["expires"] > now:
        return cached["valid"]
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "http://traccar:8082/api/devices",
                cookies={"JSESSIONID": jsessionid},
                timeout=3,
            )
            valid = resp.status_code == 200
    except Exception:
        valid = False
    session_cache[jsessionid] = {"valid": valid, "expires": now + SESSION_CACHE_TTL}
    if len(session_cache) > 2000:
        cutoff = now - SESSION_CACHE_TTL
        session_cache.clear()
    return valid


async def get_current_user(request: Request):
    cookie = request.cookies.get("JSESSIONID")
    if not cookie:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="No session")
    if not await validate_session(cookie):
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Invalid session")
    return {"id": 1, "email": "admin@dmujeres.com"}


from fastapi import HTTPException

# ---- Existing webhook endpoints ----


@app.post("/api/webhook/traccar")
async def traccar_webhook(request: Request, background_tasks: BackgroundTasks):
    try:
        body = await request.body()
        if not body:
            return JSONResponse(content={"status": "ok"})
        data = json.loads(body)
        positions = data if isinstance(data, list) else [data]
        for pos in positions:
            device_id = pos.get("deviceId") or pos.get("deviceid")
            if device_id:
                background_tasks.add_task(publish_position, device_id, pos)
        return JSONResponse(content={"status": "ok", "count": len(positions)})
    except Exception as e:
        logger.error("Error processing webhook: %s", e)
        return JSONResponse(content={"status": "error", "message": str(e)}, status_code=500)


@app.post("/api/webhook/eventos")
async def eventos_webhook(request: Request):
    body = await request.body()
    try:
        data = json.loads(body) if body else {}
        logger.info("Event received: %s", json.dumps(data)[:200])
        return JSONResponse(content={"status": "ok"})
    except Exception as e:
        logger.error("Error processing event: %s", e)
        return JSONResponse(content={"status": "error", "message": str(e)}, status_code=500)


async def publish_position(device_id: int, data: dict):
    r = await get_redis()
    key = f"position:live:{device_id}"
    await r.set(key, json.dumps(data))
    await r.publish("positions:live", json.dumps(data))
    await r.lpush("positions:recent", json.dumps(data))
    await r.ltrim("positions:recent", 0, 999)
    logger.info("Published position for device %d", device_id)


@app.get("/api/positions/latest/{device_id}")
async def get_latest_position(device_id: int):
    r = await get_redis()
    data = await r.get(f"position:live:{device_id}")
    if data:
        return JSONResponse(content=json.loads(data))
    return JSONResponse(content={"error": "No position found"}, status_code=404)


@app.get("/health")
async def health():
    pool = await get_db()
    async with pool.acquire() as conn:
        val = await conn.fetchval("SELECT 1")
    return {"status": "healthy", "db": val == 1}


# ---- New: Positions endpoint (cache-first, streaming) ----


@app.get("/api/positions")
@app.get("/api/v2/positions")
async def get_positions(
    request: Request,
    deviceId: Optional[int] = None,
    deviceIds: Optional[str] = None,
    from_time: Optional[str] = None,
    to: Optional[str] = None,
):
    user = await get_current_user(request)

    ids = []
    if deviceId:
        ids.append(deviceId)
    if deviceIds:
        ids.extend(int(x.strip()) for x in deviceIds.split(",") if x.strip())

    if not ids:
        return JSONResponse([])

    cache_key = f"route:{min(ids)}:{from_time or ''}:{to or ''}"
    r = await get_redis()
    cached = await r.get(cache_key)
    if cached:
        logger.info("Cache hit: %s", cache_key)
        return JSONResponse(content=json.loads(cached))

    logger.info("Cache miss: %s, querying DB", cache_key)

    pool = await get_db()
    where_clauses = ["deviceid = ANY($1)"]
    params = [ids]
    idx = 2

    if from_time:
        where_clauses.append(f"servertime >= ${idx}")
        params.append(from_time)
        idx += 1
    if to:
        where_clauses.append(f"servertime <= ${idx}")
        params.append(to)
        idx += 1

    where_clauses.append("valid = true")
    query = f"""
        SELECT id, deviceid, servertime, devicetime, fixtime,
               valid, latitude, longitude, altitude, speed, course,
               address, attributes, accuracy
        FROM tc_positions
        WHERE {' AND '.join(where_clauses)}
        ORDER BY servertime ASC
        LIMIT 100000
    """

    async def stream():
        async with pool.acquire() as conn:
            async with conn.transaction():
                first = True
                async for row in conn.cursor(query, *params):
                    if first:
                        yield "["
                        first = False
                    else:
                        yield ","
                    pos = {
                        "id": row[0],
                        "deviceId": row[1],
                        "serverTime": row[2].isoformat() if row[2] else None,
                        "deviceTime": row[3].isoformat() if row[3] else None,
                        "fixTime": row[4].isoformat() if row[4] else None,
                        "valid": row[5],
                        "latitude": row[6],
                        "longitude": row[7],
                        "altitude": row[8],
                        "speed": row[9],
                        "course": row[10],
                        "address": row[11],
                        "attributes": json.loads(row[12]) if row[12] else {},
                        "accuracy": row[13],
                    }
                    yield json.dumps(pos, default=str)
                if first:
                    yield "[]"
                else:
                    yield "]"

    return StreamingResponse(
        stream(),
        media_type="application/json",
        headers={
            "X-Stream": "true",
            "Cache-Control": "public, max-age=60",
        },
    )


# ---- New: Devices endpoint ----


@app.get("/api/devices")
@app.get("/api/v2/devices")
async def get_devices(request: Request):
    user = await get_current_user(request)
    pool = await get_db()

    cache_key = "devices:list"
    r = await get_redis()
    cached = await r.get(cache_key)
    if cached:
        return JSONResponse(content=json.loads(cached))

    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT id, name, uniqueid, status, lastupdate, positionid,
                   groupid, attributes, phone, model, contact, category
            FROM tc_devices
            ORDER BY id
        """)

    devices = []
    for row in rows:
        device = {
            "id": row["id"],
            "name": row["name"],
            "uniqueId": row["uniqueid"],
            "status": row["status"],
            "lastUpdate": row["lastupdate"].isoformat() if row["lastupdate"] else None,
            "positionId": row["positionid"],
            "groupId": row["groupid"],
            "phone": row["phone"],
            "model": row["model"],
            "contact": row["contact"],
            "category": row["category"],
            "attributes": json.loads(row["attributes"]) if row["attributes"] else {},
        }
        devices.append(device)

    await r.setex(cache_key, 30, json.dumps(devices, default=str))
    return JSONResponse(content=devices)


# ---- New: Auth endpoint ----


@app.post("/api/session")
async def login(request: Request):
    body = await request.form()
    email = body.get("email", "")
    password = body.get("password", "")
    async with httpx.AsyncClient() as client:
        resp = await client.post("http://traccar:8082/api/session", data={"email": email, "password": password}, timeout=5)
    if resp.status_code != 200:
        return JSONResponse(content={"error": "Invalid credentials"}, status_code=401)
    jsessionid = resp.cookies.get("JSESSIONID")
    user_data = resp.json()
    response = JSONResponse(content=user_data)
    if jsessionid:
        response.set_cookie(key="JSESSIONID", value=jsessionid, httponly=True, samesite="lax")
    return response

# ---- Compact route endpoint (array format) ----


@app.get("/api/v2/route/{device_id}")
async def get_route_compact(
    request: Request,
    device_id: int,
    date: Optional[str] = None,
    from_time: Optional[str] = None,
    to: Optional[str] = None,
):
    user = await get_current_user(request)

    r = await get_redis()
    if date:
        cache_key = f"route:{device_id}:{date}"
        cached = await r.get(cache_key)
        if cached:
            logger.info("Route cache hit: %s", cache_key)
            return JSONResponse(content=json.loads(cached))

    pool = await get_db()
    where = ["deviceid = $1", "valid = true"]
    params = [device_id]
    idx = 2

    if date:
        where.append(f"servertime::date = ${idx}::date")
        params.append(date)
        idx += 1
    if from_time:
        where.append(f"servertime >= ${idx}")
        params.append(from_time)
        idx += 1
    if to:
        where.append(f"servertime <= ${idx}")
        params.append(to)

    query = f"""
        SELECT latitude, longitude, servertime, speed, course, attributes
        FROM tc_positions
        WHERE {' AND '.join(where)}
        ORDER BY servertime ASC
        LIMIT 100000
    """

    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *params)

    # Compact format: [[lat, lng, timestamp_iso, speed, course, battery], ...]
    compact = []
    for row in rows:
        attrs = json.loads(row[5]) if row[5] else {}
        compact.append([
            row[0],  # lat
            row[1],  # lng
            row[2].isoformat() if row[2] else None,  # time
            row[3],  # speed
            row[4],  # course
            attrs.get("batteryLevel") or attrs.get("battery") or 0,  # battery
        ])

    result = {"deviceId": device_id, "points": compact, "count": len(compact)}

    if date:
        await r.setex(cache_key, 86400, json.dumps(result, default=str))

    return JSONResponse(content=result)


# ---- Serve static files ----

@app.get("/route-worker.js")
async def serve_worker():
    from fastapi.responses import FileResponse
    return FileResponse("/app/route-worker.js", media_type="application/javascript")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
