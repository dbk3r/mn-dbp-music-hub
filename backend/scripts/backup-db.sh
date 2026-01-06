#!/usr/bin/env bash
# Backup Postgres DB to S3 (customize env vars below)
set -euo pipefail

: "\nRequired env vars:\n  PG_HOST, PG_PORT (optional, default 5432)\n  PG_USER, PG_NAME, PGPASSWORD (or set PGPASSFILE)\n  S3_BUCKET (e.g. s3://my-backups)\nOptional:\n  BACKUP_PASSPHRASE (for symmetric encryption with gpg)\n  BACKUP_PREFIX (path in bucket)\n\nExample: BACKUP_PASSPHRASE=secret S3_BUCKET=my-bucket ./backup-db.sh\"

PG_HOST=${PG_HOST:-localhost}
PG_PORT=${PG_PORT:-5432}
PG_USER=${PG_USER:-medusa}
PG_NAME=${PG_NAME:-medusa}
S3_BUCKET=${S3_BUCKET:?"S3_BUCKET must be set (e.g. my-bucket)"}
BACKUP_PREFIX=${BACKUP_PREFIX:-db}
BACKUP_DIR=${BACKUP_DIR:-/tmp/backups}
BACKUP_PASSPHRASE=${BACKUP_PASSPHRASE:-}

mkdir -p "$BACKUP_DIR"
TS=$(date -u +"%Y%m%dT%H%M%SZ")
FNAME="${PG_NAME}-${TS}.dump"
FILEPATH="$BACKUP_DIR/$FNAME"

export PGPASSWORD=${PGPASSWORD:-$PG_PASS}

echo "Dumping database $PG_NAME from $PG_HOST:$PG_PORT as $PG_USER to $FILEPATH"
pg_dump -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -F c "$PG_NAME" -f "$FILEPATH"

echo "Compressing"
gzip -f "$FILEPATH"
FILEPATH_GZ="$FILEPATH.gz"

if [ -n "$BACKUP_PASSPHRASE" ]; then
  echo "Encrypting with GPG symmetric cipher"
  gpg --batch --yes --passphrase "$BACKUP_PASSPHRASE" -c --cipher-algo AES256 "$FILEPATH_GZ"
  UPLOAD_PATH="$FILEPATH_GZ.gpg"
else
  UPLOAD_PATH="$FILEPATH_GZ"
fi

echo "Uploading to s3://$S3_BUCKET/$BACKUP_PREFIX/"
aws s3 cp "$UPLOAD_PATH" "s3://$S3_BUCKET/$BACKUP_PREFIX/" --storage-class STANDARD_IA

echo "Upload complete. Local temp will be cleaned."
rm -f "$FILEPATH_GZ" "$FILEPATH_GZ.gpg"

echo "Done"
