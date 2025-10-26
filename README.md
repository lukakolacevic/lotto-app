# 🎱 Loto 6/45 Aplikacija

Moderna web aplikacija za upravljanje loto igrom 6/45 s Auth0 autentifikacijom i Firebase backend-om.

## 📋 Značajke

- **Autentifikacija korisnika** putem OpenID Connect (Auth0)
- **OAuth2 Client Credentials** za machine-to-machine administracijske operacije
- **Uplata listića** s validacijom podataka
- **QR kod generiranje** za svaki listić
- **Javna stranica** za pregled listića preko QR koda
- **Upravljanje kolima** (aktivacija/deaktivacija uplata)
- **Spremanje izvučenih brojeva** i prikaz pogodaka
- **Responsive dizajn** prilagođen mobilnim uređajima

## 🏗️ Tehnologije

### Frontend
- React 19
- React Router v6
- Auth0 React SDK
- Vite

### Backend
- Node.js 22
- Firebase Functions
- Express.js
- Firestore baza podataka
- Auth0 JWT verifikacija
- QRCode generiranje

## 🚀 Postavljanje projekta

### Preduvjeti

- Node.js 22 ili noviji
- Firebase CLI (`npm install -g firebase-tools`)
- Auth0 račun
- Git

### 1. Kloniranje repozitorija

```bash
git clone <your-repo-url>
cd lotto-app
```

### 2. Konfiguracija Auth0

#### a) Kreirajte Auth0 Application (za korisnike)

1. Prijavite se na [Auth0 Dashboard](https://manage.auth0.com/)
2. Applications → Create Application
3. Odaberite "Single Page Application"
4. Postavke:
   - **Allowed Callback URLs**: `http://localhost:5000, https://your-app.web.app`
   - **Allowed Logout URLs**: `http://localhost:5000, https://your-app.web.app`
   - **Allowed Web Origins**: `http://localhost:5000, https://your-app.web.app`

#### b) Kreirajte Auth0 API

1. Applications → APIs → Create API
2. Postavke:
   - **Name**: Loto API
   - **Identifier**: `https://loto-api` (ili bilo koji URL)
   - **Signing Algorithm**: RS256

#### c) Kreirajte Machine-to-Machine Application

1. Applications → Create Application
2. Odaberite "Machine to Machine Applications"
3. Odaberite API koji ste kreirali
4. Kopirajte **Client ID** i **Client Secret**

### 3. Konfiguracija Backend-a (Functions)

```bash
cd functions
npm install
cp .env.example .env
```

Uredite `.env`:

```env
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://loto-api
PUBLIC_URL=https://your-app.web.app
```

### 4. Konfiguracija Frontend-a

```bash
cd ../frontend
npm install
cp .env.example .env
```

Uredite `.env`:

```env
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your-spa-client-id
VITE_AUTH0_AUDIENCE=https://loto-api
VITE_API_BASE=/api
```

### 5. Lokalno testiranje

#### Pokretanje emulatora:

```bash
# U root direktoriju
firebase emulators:start
```

Aplikacija će biti dostupna na `http://localhost:5000`

## 📡 API Dokumentacija

### Javne rute

#### `GET /api/status`
Dohvaća status trenutnog kola.

**Response:**
```json
{
  "hasRound": true,
  "active": true,
  "roundId": "abc123",
  "ticketCount": 42,
  "results": [5, 12, 23, 34, 41, 45] // ili null
}
```

#### `GET /api/tickets/:ticketId`
Dohvaća podatke o listiću (javna ruta za QR kodove).

**Response:**
```json
{
  "ticketId": "abc123",
  "idNumber": "123456789",
  "numbers": [5, 12, 23, 34, 41, 45],
  "roundId": "round123",
  "results": [5, 12, 23, 30, 35, 40] // ili null
}
```

### Korisničke rute (zahtijevaju Auth0 token)

#### `POST /api/tickets`
Kreira novi listić.

**Headers:**
```
Authorization: Bearer <user-token>
Content-Type: application/json
```

**Body:**
```json
{
  "idNumber": "123456789",
  "numbers": "5, 12, 23, 34, 41, 45"
}
```

**Response:** PNG slika (QR kod)

**Moguće greške:**
- `id_number_length_1_20`: Broj osobne mora biti 1-20 znakova
- `numbers_count_6_10`: Broj brojeva mora biti 6-10
- `duplicates_not_allowed`: Brojevi se ne smiju ponavljati
- `out_of_range_1_45`: Brojevi moraju biti 1-45
- `no_active_round`: Nema aktivnog kola

### Admin rute (zahtijevaju M2M token)

#### `POST /api/new-round`
Aktivira novo kolo.

**Headers:**
```
Authorization: Bearer <m2m-token>
```

**Response:** `204 No Content`

#### `POST /api/close`
Zatvara trenutno kolo.

**Headers:**
```
Authorization: Bearer <m2m-token>
```

**Response:** `204 No Content`

#### `POST /api/store-results`
Sprema izvučene brojeve.

**Headers:**
```
Authorization: Bearer <m2m-token>
Content-Type: application/json
```

**Body:**
```json
{
  "numbers": [5, 12, 23, 34, 41, 45]
}
```

**Response:** `204 No Content` ili `400 Bad Request`

## 🔐 Dohvat M2M Tokena

Za pozivanje admin ruta, prvo dohvatite token:

```bash
curl --request POST \
  --url https://your-tenant.auth0.com/oauth/token \
  --header 'content-type: application/json' \
  --data '{
    "client_id": "your-m2m-client-id",
    "client_secret": "your-m2m-client-secret",
    "audience": "https://loto-api",
    "grant_type": "client_credentials"
  }'
```

Primjer poziva admin rute:

```bash
# Aktiviraj novo kolo
curl -X POST https://your-app.web.app/api/new-round \
  -H "Authorization: Bearer <token>"

# Zatvori kolo
curl -X POST https://your-app.web.app/api/close \
  -H "Authorization: Bearer <token>"

# Spremi rezultate
curl -X POST https://your-app.web.app/api/store-results \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"numbers": [5, 12, 23, 34, 41, 45]}'
```

## 🌐 Deploy na Firebase

### 1. Inicijalizirajte Firebase projekt

```bash
firebase login
firebase use --add
```

### 2. Postavite environment varijable

```bash
firebase functions:config:set \
  auth0.domain="your-tenant.auth0.com" \
  auth0.audience="https://loto-api" \
  public.url="https://your-app.web.app"
```

### 3. Build frontend

```bash
cd frontend
npm run build
```

### 4. Deploy

```bash
cd ..
firebase deploy
```

## 👤 Kreiranje testnih korisnika

1. Auth0 Dashboard → User Management → Users
2. Create User
3. Unesite email i lozinku
4. Kopirajte credentials za testiranje

## 📝 Struktura projekta

```
lotto-app/
├── functions/          # Firebase Functions (Backend)
│   ├── src/
│   │   └── index.ts   # Express API
│   └── package.json
├── frontend/          # React aplikacija
│   ├── src/
│   │   ├── pages/    # Stranice aplikacije
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   └── package.json
├── firebase.json      # Firebase konfiguracija
├── firestore.rules    # Firestore security rules
└── README.md
```

## 🧪 Testiranje

### Testiranje user flow-a:

1. Otvorite aplikaciju
2. Kliknite "Prijava"
3. Prijavite se s testnim korisnikom
4. Aktivirajte kolo (putem M2M API-ja)
5. Uplatite listić
6. Spremite QR kod
7. Zatvorite kolo (putem M2M API-ja)
8. Dodajte rezultate (putem M2M API-ja)
9. Skenirajte QR kod i provjerite rezultate

## 🔧 Troubleshooting

### CORS greške
- Provjerite da su URL-ovi u Auth0 postavkama ispravni
- Provjerite CORS konfiguraciju u `functions/src/index.ts`

### Token validation greške
- Provjerite da su `AUTH0_DOMAIN` i `AUTH0_AUDIENCE` ispravni
- Provjerite da koristite ispravan token za rutu (user vs M2M)

### QR kod ne radi
- Provjerite da je `PUBLIC_URL` ispravan u environment varijablama
- Provjerite da je ruta `/ticket/:id` dostupna javno

## 📄 Licenca

MIT

## 👨‍💻 Autor

Vaše ime - domaća zadaća za predmet Sigurnost i privatnost podataka

