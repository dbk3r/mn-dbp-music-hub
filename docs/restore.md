# Restore Runbook (quick steps)

This runbook outlines typical steps to restore a system from backups. Test this process in staging before using in production.

1) Prepare environment
- Ensure you have credentials to fetch from S3 and access to the target DB host.
- Ensure `pg_restore`, `psql`, `aws`, and `gpg` are installed.

2) Identify backup
- Option A: Use the latest backup under `s3://$S3_BUCKET/db/`.
- Option B: Use a specific S3 key you previously noted.

3) Restore DB (example using provided script)
```bash
export S3_BUCKET=my-bucket
export BACKUP_PASSPHRASE=...   # if used
export PG_HOST=localhost
export PG_USER=medusa
export PG_NAME=medusa
# optional: export S3_KEY=medusa-20250101T020000Z.dump.gz.gpg
./backend/scripts/restore-db.sh
```

4) Restore uploads
If you persist uploads locally via docker-compose (host path `./uploads`) you can restore to that path:
```bash
aws s3 sync s3://$S3_BUCKET/uploads/ ./uploads
chown -R appuser:appgroup ./uploads
# If running in container and uploads mounted at /app/uploads, copy into container volume or restart containers.
```

5) Restore Redis (if used)
- Stop Redis service
- Download the RDB file from S3 and replace the `dump.rdb` in the Redis data dir
- Start Redis

6) Post-restore checks
- Run smoke tests (HTTP health endpoints, admin login, sample data checks)
- Verify document/media availability
- Rotate credentials / keys used during restore if required

7) Rollback plan
- If restore fails, document the error and restore from previous backup.

Notes
- For large datasets consider pg_basebackup + WAL replay for PITR.
- Consider an automated DR playbook with runbook steps and contact points.
