# Backup Overview

This repository provides simple scripts to back up Postgres, Redis and Uploads to S3.

Prerequisites
- `aws` CLI configured with credentials that can write to the target bucket
- `pg_dump`, `pg_restore` available
- `gpg` for optional encryption
- `redis-cli` for Redis snapshot

Scripts in `backend/scripts/`:
- `backup-db.sh` — dump Postgres, compress, optional symmetric GPG encryption, upload to `s3://$S3_BUCKET/db/`
- `restore-db.sh` — download latest (or specified) backup from S3, decrypt, restore
- `backup-uploads.sh` — sync uploads directory to S3
	- By default the project stores uploads on the host at `./uploads` (mounted into the backend container at `/app/uploads`). The backup script defaults to this path.
- `backup-redis.sh` — trigger Redis SAVE and upload `dump.rdb`

Suggested cron example (daily at 02:00):
```
0 2 * * * /opt/app/backend/scripts/backup-db.sh >> /var/log/backup-db.log 2>&1
15 2 * * * /opt/app/backend/scripts/backup-uploads.sh >> /var/log/backup-uploads.log 2>&1
30 2 * * * /opt/app/backend/scripts/backup-redis.sh >> /var/log/backup-redis.log 2>&1
```

S3 Lifecycle / Retention
- Configure bucket lifecycle rules to keep: daily for 7 days, weekly for 30 days, monthly for 12 months, or as required by policy.

Security
- Do NOT store `BACKUP_PASSPHRASE` in plaintext in the repo. Use Vault or environment secrets from your cloud provider.
- Use KMS or server-side encryption for S3 if required by policy.

Testing
- Run `./backend/integration-tests/service_jwt_e2e.sh` to check admin-backend auth flow.
- Test restores regularly on staging.
