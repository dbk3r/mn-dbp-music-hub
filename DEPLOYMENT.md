# Deployment Guide

## Lokale Entwicklung

```bash
# Standard Start (Development)
./start-local.sh

# Oder manuell:
docker compose up
```

**URLs:**
- Frontend: http://localhost
- Admin: http://localhost/dbp-admin
- Backend API: http://localhost/dbp-backend

---

## Production Deployment auf VPS

### 1. VPS Vorbereitung

```bash
# Docker installieren
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose installieren
sudo apt install docker-compose-plugin

# Repository klonen
git clone <your-repo> /opt/dbp-music-hub
cd /opt/dbp-music-hub
```

### 2. SSL-Zertifikat einrichten

```bash
# Certbot installieren
sudo apt install certbot

# Zertifikat holen (HTTP-Challenge)
sudo certbot certonly --standalone -d dbp-music-hub.de

# Zertifikat für HAProxy kombinieren
sudo cat /etc/letsencrypt/live/dbp-music-hub.de/fullchain.pem \
         /etc/letsencrypt/live/dbp-music-hub.de/privkey.pem \
         > /etc/letsencrypt/live/dbp-music-hub.de/combined.pem

sudo chmod 600 /etc/letsencrypt/live/dbp-music-hub.de/combined.pem
```

### 3. Environment Variables anpassen

```bash
# Backend Production Config
nano backend/.env.prod
```

**Wichtige Werte ändern:**
- `SMTP_PASS`: Dein E-Mail-Server Passwort
- `JWT_SECRET`: Sicheres Random-Secret generieren

```bash
# JWT Secret generieren:
openssl rand -base64 32
```

### 4. DNS-Einträge setzen

Bei deinem DNS-Provider:
```
A-Record:  dbp-music-hub.de          → VPS-IP (z.B. 85.190.98.24)
A-Record:  www.dbp-music-hub.de      → VPS-IP
MX-Record: dbp-music-hub.de          → mail.dbp-music-hub.de (Prio 10)
TXT:       dbp-music-hub.de          → v=spf1 a mx ~all
```

### 5. Production starten

```bash
# Scripts ausführbar machen
chmod +x start-local.sh start-prod.sh

# Production starten
sudo ./start-prod.sh
```

### 6. Logs prüfen

```bash
# Alle Services
docker compose logs -f

# Einzelner Service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f admin
docker compose logs -f haproxy
```

### 7. Automatische Zertifikat-Erneuerung

```bash
# Cronjob für Let's Encrypt Renewal
sudo crontab -e

# Folgende Zeile hinzufügen:
0 3 * * * certbot renew --post-hook "cat /etc/letsencrypt/live/dbp-music-hub.de/fullchain.pem /etc/letsencrypt/live/dbp-music-hub.de/privkey.pem > /etc/letsencrypt/live/dbp-music-hub.de/combined.pem && docker compose -f /opt/dbp-music-hub/docker-compose.yml -f /opt/dbp-music-hub/docker-compose.prod.yml restart haproxy"
```

---

## Updates deployen

```bash
cd /opt/dbp-music-hub

# Code aktualisieren
git pull

# Container neu bauen und starten
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Logs prüfen
docker compose logs -f
```

---

## Backup

```bash
# Datenbank Backup
docker compose exec postgres pg_dump -U medusa medusa > backup-$(date +%Y%m%d).sql

# Uploads Backup
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/

# Redis Backup (optional)
docker compose exec redis redis-cli SAVE
docker cp $(docker compose ps -q redis):/data/dump.rdb redis-backup-$(date +%Y%m%d).rdb
```

---

## Troubleshooting

### Service läuft nicht
```bash
docker compose ps
docker compose logs <service-name>
```

### SSL-Fehler
```bash
# Zertifikat prüfen
sudo ls -la /etc/letsencrypt/live/dbp-music-hub.de/
sudo cat /etc/letsencrypt/live/dbp-music-hub.de/combined.pem
```

### E-Mail-Versand funktioniert nicht
```bash
# SMTP-Verbindung testen
docker compose exec backend node -e "
const nodemailer = require('nodemailer');
const transport = nodemailer.createTransport({
  host: 'mail.dbp-music-hub.de',
  port: 465,
  secure: true,
  auth: { user: 'noreply@dbp-music-hub.de', pass: 'xxx' }
});
transport.verify().then(console.log).catch(console.error);
"
```

### Datenbank zurücksetzen
```bash
docker compose down -v
docker compose up -d
docker compose exec backend yarn migrate:custom
```
