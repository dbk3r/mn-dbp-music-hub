#!/usr/bin/env bash
# Restore Postgres DB from S3 backup (latest or provided file)
set -euo pipefail

: "\nRequired env vars:\n  PG_HOST, PG_PORT (optional), PG_USER, PG_NAME, PGPASSWORD\n  S3_BUCKET\nOptional:\n  S3_KEY (object key to restore)\n  BACKUP_PREFIX (path in bucket)\n  BACKUP_PASSPHRASE (if encrypted)\n\nIf S3_KEY is not provided, the script downloads the latest object under prefix.\"

PG_HOST=${PG_HOST:-localhost}
PG_PORT=${PG_PORT:-5432}
PG_USER=${PG_USER:-medusa}
PG_NAME=${PG_NAME:-medusa}
S3_BUCKET=${S3_BUCKET:?"S3_BUCKET must be set"}
BACKUP_PREFIX=${BACKUP_PREFIX:-db}
S3_KEY=${S3_KEY:-}
BACKUP_DIR=${BACKUP_DIR:-/tmp/backups}
BACKUP_PASSPHRASE=${BACKUP_PASSPHRASE:-}

mkdir -p "$BACKUP_DIR"

if [ -z "$S3_KEY" ]; then
  echo "No S3_KEY provided — finding latest backup under s3://$S3_BUCKET/$BACKUP_PREFIX/"
  S3_KEY=$(aws s3 ls "s3://$S3_BUCKET/$BACKUP_PREFIX/" | sort | awk '{print $4}' | tail -n1)
  if [ -z "$S3_KEY" ]; then
    echo "No backup files found in s3://$S3_BUCKET/$BACKUP_PREFIX/"
    exit 2
  fi
fi

REMOTE="s3://$S3_BUCKET/$BACKUP_PREFIX/$S3_KEY"
LOCAL="$BACKUP_DIR/$S3_KEY"

echo "Downloading $REMOTE to $LOCAL"
aws s3 cp "$REMOTE" "$LOCAL"

if [[ "$LOCAL" == *.gpg ]]; then
  if [ -z "$BACKUP_PASSPHRASE" ]; then
    echo "Encrypted backup, but BACKUP_PASSPHRASE not set"
    exit 2
  fi
  echo "Decrypting"
  gpg --batch --yes --passphrase "$BACKUP_PASSPHRASE" -o "${LOCAL%.gpg}" -d "$LOCAL"
  LOCAL="${LOCAL%.gpg}"
fi

if [[ "$LOCAL" == *.gz ]]; then
  echo "Decompressing"
  gunzip -f "$LOCAL"
  LOCAL="${LOCAL%.gz}"
fi

echo "Restoring with pg_restore to database $PG_NAME"
export PGPASSWORD=${PGPASSWORD:-$PG_PASS}
pg_restore -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_NAME" -c "$LOCAL"

echo "Restore complete"
