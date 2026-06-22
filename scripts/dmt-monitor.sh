#!/bin/bash
# D-MUJERES TRACCAR - Service Monitor
# Checks all services and health endpoints, logs status

LOGFILE=/var/log/dmt-monitor.log
ALERTFILE=/var/log/dmt-alert.log
NOW=$(date '+%Y-%m-%d %H:%M:%S')

check_systemd() {
  local svc=$1
  if systemctl is-active --quiet "$svc"; then
    echo "OK:$svc" >> "$LOGFILE"
    return 0
  else
    echo "FAIL:$svc" >> "$LOGFILE"
    return 1
  fi
}

check_http() {
  local name=$1 url=$2 expected=$3
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null)
  if [ "$status" = "$expected" ]; then
    echo "OK:$name (HTTP $status)" >> "$LOGFILE"
    return 0
  else
    echo "FAIL:$name (HTTP $status, expected $expected)" >> "$LOGFILE"
    return 1
  fi
}

{
  echo "=== DMT Monitor [$NOW] ==="
  
  # System services
  echo "--- System Services ---"
  check_systemd postgresql
  check_systemd redis-server
  check_systemd nginx
  check_systemd traccar
  check_systemd dmt-ingestor
  check_systemd dmt-webhook
  check_systemd dmt-route-cron.timer
  check_systemd dmt-refresh-mvs.timer
  
  # HTTP Health
  echo "--- HTTP Health ---"
  check_http "Ingestor" "http://localhost:5055/health" 200
  check_http "Webhook" "http://localhost:8000/health" 200
  check_http "Traccar" "http://localhost:8082/" 200
  check_http "Nginx" "http://localhost:80/" 200
  
  # DB Health
  echo "--- Database ---"
  DB_OK=$(sudo -u postgres psql -d dmtracker -t -c "SELECT count(*) FROM tc_positions;" 2>/dev/null | tr -d ' ')
  if [ -n "$DB_OK" ]; then
    echo "OK:PostgreSQL ($DB_OK positions)" >> "$LOGFILE"
  else
    echo "FAIL:PostgreSQL" >> "$LOGFILE"
  fi
  
  # Redis Health
  REDIS_OK=$(redis-cli PING 2>/dev/null)
  if [ "$REDIS_OK" = "PONG" ]; then
    local KEYS
    KEYS=$(redis-cli DBSIZE)
    echo "OK:Redis ($KEYS keys)" >> "$LOGFILE"
  else
    echo "FAIL:Redis" >> "$LOGFILE"
  fi
  
  # Disk space
  DISK=$(df -h / | awk 'NR==2 {print $5 " used (" $4 " free)"}')
  echo "Disk: $DISK" >> "$LOGFILE"
  
  # Memory
  MEM=$(free -h | awk 'NR==2 {print $3 " used / " $2 " total"}')
  echo "Memory: $MEM" >> "$LOGFILE"
  
  echo "---" >> "$LOGFILE"
}

# Check for failures and alert
FAILURES=$(grep "^FAIL:" "$LOGFILE" 2>/dev/null | tail -5)
if [ -n "$FAILURES" ]; then
  echo "[$NOW] ALERT: Service failures detected:" >> "$ALERTFILE"
  echo "$FAILURES" >> "$ALERTFILE"
fi
