#!/bin/sh
# Demo reset cron script
# Runs db:demo-reset once per day at the specified hour (UTC)
# Configure via DEMO_RESET_HOUR env var (default: 4 = 4:00 AM UTC)
# Only runs when DEMO_MODE=true

if [ "$DEMO_MODE" != "true" ]; then
  echo "Demo mode is disabled (DEMO_MODE=$DEMO_MODE). Exiting."
  exit 0
fi

TARGET_HOUR="${DEMO_RESET_HOUR:-4}"
echo "Demo reset cron started. Schedule: every day at ${TARGET_HOUR}:00 UTC"

while true; do
  current_hour=$(date -u +%H | sed 's/^0//')
  current_min=$(date -u +%M | sed 's/^0//')
  current_sec=$(date -u +%S | sed 's/^0//')

  now_secs=$((current_hour * 3600 + current_min * 60 + current_sec))
  target_secs=$((TARGET_HOUR * 3600))

  if [ "$now_secs" -ge "$target_secs" ]; then
    sleep_secs=$((86400 - now_secs + target_secs))
  else
    sleep_secs=$((target_secs - now_secs))
  fi

  echo "Next reset in ${sleep_secs}s (at ${TARGET_HOUR}:00 UTC). Current time: $(date -u)"
  sleep "$sleep_secs"

  echo "=== Starting demo reset at $(date -u) ==="
  bun --filter @racona/database db:demo-reset
  echo "=== Demo reset finished at $(date -u) ==="

  # Sleep 60s to avoid double-trigger if we land exactly on the target second
  sleep 60
done
