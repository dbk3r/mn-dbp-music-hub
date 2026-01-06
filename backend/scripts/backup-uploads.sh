#!/usr/bin/env bash
# Backup uploads directory to S3
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "$0")"/.. && pwd)
# default to repo-root ./uploads (when repo structure: ./backend/scripts)
UPLOADS_DIR=${UPLOADS_DIR:-$SCRIPT_DIR/../uploads}
S3_BUCKET=${S3_BUCKET:?"S3_BUCKET must be set"}
BACKUP_PREFIX=${BACKUP_PREFIX:-uploads}

if [ ! -d "$UPLOADS_DIR" ]; then
  echo "Uploads dir $UPLOADS_DIR not found"
  exit 2
fi

echo "Syncing $UPLOADS_DIR -> s3://$S3_BUCKET/$BACKUP_PREFIX/"
aws s3 sync "$UPLOADS_DIR" "s3://$S3_BUCKET/$BACKUP_PREFIX/" --storage-class STANDARD_IA

echo "Done"
