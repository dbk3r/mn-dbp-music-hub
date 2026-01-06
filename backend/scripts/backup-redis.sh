#!/usr/bin/env bash
# Backup Redis RDB snapshot to S3 (assumes access to redis-cli and path to dump.rdb)
set -euo pipefail

REDIS_HOST=${REDIS_HOST:-localhost}
REDIS_PORT=${REDIS_PORT:-6379}
REDIS_DUMP_PATH=${REDIS_DUMP_PATH:-/data/dump.rdb}
S3_BUCKET=${S3_BUCKET:?"S3_BUCKET must be set"}
BACKUP_PREFIX=${BACKUP_PREFIX:-redis}
BACKUP_DIR=${BACKUP_DIR:-/tmp/backups}

mkdir -p "$BACKUP_DIR"
TS=$(date -u +"%Y%m%dT%H%M%SZ")
OUTFILE="$BACKUP_DIR/redis-$TS.rdb"

# Trigger a snapshot
redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" SAVE

if [ ! -f "$REDIS_DUMP_PATH" ]; then
  echo "Cannot find Redis dump at $REDIS_DUMP_PATH. If Redis runs in container, run this script on host with volume mounted."
  exit 2
fi

cp "$REDIS_DUMP_PATH" "$OUTFILE"
aws s3 cp "$OUTFILE" "s3://$S3_BUCKET/$BACKUP_PREFIX/" --storage-class STANDARD_IA
rm -f "$OUTFILE"

echo "Done"
