#!/bin/bash
# Refresh materialized views for D-MUJERES TRACCAR
# Runs daily via systemd timer

LOGFILE=/var/log/dmt-refresh-mvs.log
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting MV refresh..." >> $LOGFILE

sudo -u postgres psql -d dmtracker -c "SELECT refresh_materialized_views();" >> $LOGFILE 2>&1

if [ $? -eq 0 ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] MV refresh completed successfully" >> $LOGFILE
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: MV refresh failed" >> $LOGFILE
fi
