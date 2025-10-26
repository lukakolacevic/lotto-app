# Environment Variables Setup

## Backend (functions/)

Kreirajte datoteku `functions/.env` s sljedećim sadržajem:

```env
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://loto-api
PUBLIC_URL=https://your-app.web.app
```

## Frontend (frontend/)

Kreirajte datoteku `frontend/.env` s sljedećim sadržajem:

```env
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your-spa-client-id
VITE_AUTH0_AUDIENCE=https://loto-api
VITE_API_BASE=/api
```

## Lokalni razvoj

Za lokalni razvoj koristite:

```env
# frontend/.env
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your-spa-client-id
VITE_AUTH0_AUDIENCE=https://loto-api
VITE_API_BASE=http://localhost:5001/your-project/us-central1/api
```

**VAŽNO:** Nikad nemojte commitati .env datoteke u git!

