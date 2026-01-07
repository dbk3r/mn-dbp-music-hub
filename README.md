# Music Hub - Digital Audio Store

Eine vollständige E-Commerce-Plattform für den Verkauf von digitalen Audio-Dateien mit Lizenzmodellen, PayPal-Integration und umfassendem Admin-Panel.

## 🎯 Features

### Store Frontend
- **Audio-Suche und -Vorschau**: Durchsuchbare Bibliothek mit Waveform-Visualisierung
- **Lizenzmodell-System**: Verschiedene Lizenztypen (Basic, Extended, etc.) mit individuellen Preisen
- **Warenkorb & Checkout**: PayPal-Integration für sichere Zahlungen
- **Benutzerverwaltung**: Registrierung, Login, Account-Verwaltung
- **Download-Portal**: "My Orders" mit direktem Zugriff auf gekaufte Audio-Dateien

### Admin Panel
- **Audio-Verwaltung**: Upload, Metadaten-Bearbeitung, automatische Waveform-Analyse
- **Produkt-Management**: Produkte mit mehreren Lizenzmodellen verknüpfen
- **Bestellübersicht**: Alle Bestellungen mit Status und Details
- **Kategorien & Tags**: Flexible Kategorisierung für bessere Auffindbarkeit
- **Lizenzmodelle**: Konfigurierbare Lizenztypen mit individuellen Preisen
- **Benutzerverwaltung**: Rollen, Berechtigungen, Benutzerstatus

### Technische Features
- **Custom JWT Authentication**: Eigenes Authentifizierungssystem unabhängig von Medusa
- **File Storage**: Upload-System für Audio-Dateien und Cover-Bilder
- **Variant Files**: Mehrere Dateien pro Lizenzmodell (WAV, MP3, etc.)
- **HAProxy**: Reverse Proxy für Frontend, Admin und Backend-API
- **Docker Compose**: Vollständig containerisierte Entwicklungsumgebung

## 🏗️ Architektur

```
┌─────────────────────────────────────────────────────────┐
│                       HAProxy                            │
│  Port 3000: Frontend, Admin Panel, Backend Proxy        │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Frontend   │  │ Admin Panel  │  │   Backend    │
│   Next.js    │  │   Next.js    │  │  Medusa v2   │
│   Port 3001  │  │   Port 3002  │  │   Port 9000  │
└──────────────┘  └──────────────┘  └──────────────┘
                                           │
                                           ▼
                                    ┌──────────────┐
                                    │  PostgreSQL  │
                                    │   Port 5432  │
                                    └──────────────┘
```

## 📦 Tech Stack

### Backend
- **Medusa v2**: E-Commerce-Framework
- **PostgreSQL**: Datenbank
- **TypeORM**: ORM mit Custom Models
- **JWT**: Token-basierte Authentifizierung
- **Node.js**: Runtime

### Frontend (Store)
- **Next.js** (Pages Router): Framework
- **React**: UI Library
- **Tailwind CSS v4**: Styling
- **WaveSurfer.js**: Audio-Visualisierung

### Admin Panel
- **Next.js** (App Router): Framework
- **React**: UI Library
- **Tailwind CSS**: Styling
- **TypeScript**: Type Safety

### Infrastructure
- **Docker & Docker Compose**: Containerisierung
- **HAProxy**: Load Balancing & Routing
- **Nginx**: (optional) Static File Serving

## 🚀 Setup & Installation

### Voraussetzungen
- Docker & Docker Compose
- Node.js 18+ (für lokale Entwicklung)
- PostgreSQL Client (optional, für DB-Management)

### Installation

1. **Repository klonen**
```bash
git clone <repository-url>
cd mn-dbp-music-hub
```

2. **Environment Variables konfigurieren**

Backend `.env` erstellen:
```bash
# backend/.env
DATABASE_URL=postgres://postgres:postgres@postgres:5432/medusa
JWT_SECRET=your-secret-key-here
BACKEND_SERVICE_KEY=your-service-key-here
ADMIN_CORS=http://localhost:3000
STORE_CORS=http://localhost:3000
```

Frontend `.env.local` erstellen:
```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Admin `.env.local` erstellen:
```bash
# admin/.env.local
NEXT_PUBLIC_BASE_PATH=/dbp-admin
```

3. **Container starten**
```bash
docker compose up --build
```

4. **Zugriff**
- Store Frontend: http://localhost:3000
- Admin Panel: http://localhost:3000/dbp-admin
- Backend API: http://localhost:3000/api (intern Port 9000)

### Standard-Admin-Zugang
Nach dem ersten Start Admin-User erstellen:
```bash
docker compose exec backend node -e "
  const { AppDataSource } = require('./dist/datasource/data-source');
  const { User } = require('./dist/models/user');
  const bcrypt = require('bcrypt');
  
  AppDataSource.initialize().then(async () => {
    const userRepo = AppDataSource.getRepository(User);
    const admin = userRepo.create({
      email: 'admin@example.com',
      passwordHash: await bcrypt.hash('admin123', 10),
      firstName: 'Admin',
      lastName: 'User',
      isActive: true,
      roles: [{ id: 1, name: 'admin', permissions: [] }]
    });
    await userRepo.save(admin);
    console.log('Admin user created');
    process.exit(0);
  });
"
```

## 📖 Verwendung

### Audio-Dateien hochladen

1. Im Admin Panel zu "Content → Audio-Dateien" navigieren
2. Auf "Neue Audio-Datei hochladen" klicken
3. Audio-Datei (MP3/WAV) auswählen
4. Metadaten eingeben (Titel, Künstler, Jahr, Beschreibung)
5. Optional: Cover-Bild hochladen
6. "Upload" klicken

### Produkte erstellen

Audio-Dateien werden automatisch als Produkte angelegt. Um Lizenzmodelle zuzuweisen:

1. In der Audio-Liste auf ✏️ (Bearbeiten) klicken
2. Kategorie auswählen
3. Tags markieren
4. Lizenzmodelle auswählen (z.B. Basic License, Extended License)
5. "Speichern" klicken

### Lizenzmodelle konfigurieren

1. "Content → Lizenzmodelle" öffnen
2. Neues Lizenzmodell erstellen
3. Name, Beschreibung und Preis eingeben
4. Optional: Variant-Files hochladen (verschiedene Dateiformate für dieses Lizenzmodell)

### Bestellungen verwalten

1. "Shop → Bestellungen" öffnen
2. Bestelldetails anzeigen
3. Status verfolgen (pending, completed, cancelled)

## 🔧 Entwicklung

### Backend Development

```bash
cd backend
npm install
npm run dev
```

Custom Routes befinden sich in `backend/src/api/custom/`:
- `/custom/store-orders`: Bestellungen mit enriched Download-Links
- `/custom/admin/audio/[id]`: Audio-Metadaten-Updates
- `/custom/uploads/variants/[filename]`: File-Downloads

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

Wichtige Komponenten:
- `components/StickyAudioPlayer.tsx`: Globaler Audio-Player
- `components/Waveform.tsx`: Audio-Visualisierung
- `pages/account.tsx`: My Orders mit Downloads

### Admin Development

```bash
cd admin
npm install
npm run dev
```

Seiten:
- `app/audio/page.tsx`: Audio-Verwaltung mit Icons
- `app/products/page.tsx`: Produkt-Management
- `app/orders/page.tsx`: Bestellübersicht

## 🗄️ Datenbank-Schema

### Custom Models

**AudioFile**
- id, title, artist, description, releaseYear
- filename, mimeType, size, durationMs
- waveformPeaks (JSON array)
- categoryId, tagIds, licenseModelIds
- coverFilename, coverMimeType

**User**
- id, email, passwordHash
- firstName, lastName, isActive
- roles (JSON array)

**LicenseModel**
- id, name, description
- priceCents
- files (Relation zu VariantFile)

**VariantFile**
- id, variantId, filename
- originalName, mimeType, size

## 🔐 Authentifizierung

### Custom JWT System

Das Projekt verwendet ein eigenes JWT-System parallel zu Medusa:

1. **Login**: POST `/custom/auth/login` → JWT Token
2. **Token enthält**: `userId`, `email`, `exp`
3. **Validierung**: Custom Middleware in `/custom/*` Routes
4. **User-Customer Mapping**: `userId → User.email → Customer.email → customerId`

### Routen-Struktur

- `/store/*`: Medusa's globale Auth (nicht für Custom JWT)
- `/admin/*`: Medusa's Admin Auth
- `/custom/*`: Eigene Routes ohne Medusa-Auth-Middleware

## 📁 Projekt-Struktur

```
mn-dbp-music-hub/
├── backend/              # Medusa v2 Backend
│   ├── src/
│   │   ├── api/
│   │   │   ├── admin/   # Admin API Routes
│   │   │   ├── store/   # Store API Routes
│   │   │   └── custom/  # Custom Routes (JWT Auth)
│   │   ├── models/      # TypeORM Custom Models
│   │   ├── services/    # Business Logic
│   │   └── workflows/   # Medusa Workflows
│   └── uploads/         # File Storage
│
├── frontend/            # Store Frontend (Next.js Pages)
│   ├── pages/
│   │   ├── index.tsx    # Produktsuche
│   │   ├── account.tsx  # My Orders
│   │   └── checkout.tsx # Checkout
│   ├── components/
│   └── app/
│       └── globals.css  # Tailwind v4 Styles
│
├── admin/               # Admin Panel (Next.js App)
│   ├── app/
│   │   ├── audio/       # Audio-Verwaltung
│   │   ├── products/    # Produkt-Management
│   │   ├── orders/      # Bestellübersicht
│   │   └── settings/    # Einstellungen
│   └── components/
│
├── haproxy/
│   └── haproxy.cfg      # Routing Config
│
└── docker-compose.yml   # Service Orchestration
```

## 🎨 Styling

### Tailwind CSS v4

Das Projekt verwendet die neue Tailwind v4 Syntax mit `@import`:

```css
@import "tailwindcss";

:root {
  --card-bg: #1e1e1e;
  --primary: #0070f3;
}

@layer components {
  .order-card {
    background: var(--card-bg);
  }
}
```

### Theme Variables

Zentrale CSS-Variablen in `globals.css`:
- `--background`, `--foreground`: Base Colors
- `--primary`, `--danger`, `--success`: Action Colors
- `--card-bg`, `--input-bg`: Component Colors

## 🐛 Debugging

### Backend Logs
```bash
docker compose logs backend -f
```

### Frontend Logs
```bash
docker compose logs frontend -f
```

### Admin Logs
```bash
docker compose logs admin -f
```

### Datenbank-Zugriff
```bash
docker compose exec postgres psql -U postgres -d medusa
```

## 🔄 Backup & Restore

Siehe [docs/backup.md](docs/backup.md) und [docs/restore.md](docs/restore.md) für Details.

## 📝 Changelog

### Latest Features
- ✅ Audio-Metadaten vollständig editierbar
- ✅ Icon-basierte Aktionen (➕ ✏️ 🗑️ 🔄)
- ✅ Collapsible Upload-Form (Standard: geschlossen)
- ✅ Full-Width Admin Layout
- ✅ My Orders mit Download-Links
- ✅ CSS-Variables für zentrales Theming

## 🤝 Contributing

Dieses Projekt ist für interne Verwendung. Bei Fragen oder Problemen bitte Issue erstellen.

## 📄 License

Proprietär - Alle Rechte vorbehalten.
