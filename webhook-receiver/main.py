import json
import logging
from typing import Optional

import redis.asyncio as redis
from fastapi import FastAPI, Request, BackgroundTasks
from fastapi.responses import JSONResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("webhook-receiver")

app = FastAPI(title="Traccar Webhook Receiver")

redis_client: Optional[redis.Redis] = None


async def get_redis() -> redis.Redis:
    global redis_client
    if redis_client is None:
        redis_client = redis.from_url("redis://redis:6379/0", decode_responses=True)
    return redis_client


async def publish_position(device_id: int, data: dict):
    r = await get_redis()
    key = f"position:live:{device_id}"
    await r.set(key, json.dumps(data))
    await r.publish("positions:live", json.dumps(data))
    await r.lpush("positions:recent", json.dumps(data))
    await r.ltrim("positions:recent", 0, 999)
    logger.info("Published position for device %d", device_id)


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
        return JSONResponse(
            content={"status": "error", "message": str(e)}, status_code=500
        )


@app.post("/api/webhook/eventos")
async def eventos_webhook(request: Request):
    body = await request.body()
    try:
        data = json.loads(body) if body else {}
        logger.info("Event received: %s", json.dumps(data)[:200])
        return JSONResponse(content={"status": "ok"})
    except Exception as e:
        logger.error("Error processing event: %s", e)
        return JSONResponse(
            content={"status": "error", "message": str(e)}, status_code=500
        )


@app.get("/api/positions/latest/{device_id}")
async def get_latest_position(device_id: int):
    r = await get_redis()
    data = await r.get(f"position:live:{device_id}")
    if data:
        return JSONResponse(content=json.loads(data))
    return JSONResponse(content={"error": "No position found"}, status_code=404)


@app.get("/health")
async def health():
    return {"status": "healthy"}
