# FES Auction Platform

A full-stack auction platform with timed listings, anti-sniping protection, admin tooling, member messaging, and profile management.

## Features

- **FastAPI backend** with JWT authentication, SQLite persistence, image upload endpoints, and REST resources for auctions, bids, messaging, subscriptions, transport quotes, and financing applications.
- **React + Vite frontend** styled to mirror the FES classified ads experience with responsive listing cards, gallery viewers, dashboards, and email opt-in flows.
- **Auction tooling** including anti-sniping extensions, location metadata, multi-photo galleries, category badges, and admin listing management with gallery uploads.
- **Member profiles** with avatar uploads, bios, location and phone fields, and editable account cards.
- **Secure messaging** inbox with conversation filtering and auction context, plus one-click subscription capture.
- **Logistics and lending workflows** covering transport quote requests, financing applications, and a curated partner directory for inspections.
- **Marketing site** mirroring the Forestry Equipment Sales aesthetic with About, Services, Financing, and Contact pages plus responsive CTA forms.

## Project structure

```
backend/
  app/
    main.py         # FastAPI app entry-point
    models.py       # SQLAlchemy models
    schemas.py      # Pydantic schemas
    routers/        # Auth, user, auction, and messaging routes
  requirements.txt  # Python dependencies
frontend/
  src/              # React application source
  package.json      # Frontend dependencies and scripts
```

## Getting started

### Backend

1. Create a virtual environment and install dependencies:

   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. Launch the API:

   ```bash
   uvicorn app.main:app --reload
   ```

   The service listens on `http://localhost:8000`.

### Frontend

1. Install dependencies:

   ```bash
   cd frontend
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

   Vite serves the application at `http://localhost:5173` by default.

### Working with Git branches

All application code lives on the `work` branch. If you clone the repository and only see the README, switch to that branch:

```bash
git fetch --all
git checkout work
```

To publish local commits to GitHub after configuring your credentials, push the branch to the `origin` remote:

```bash
git push -u origin work
```

You only need to include the `-u` flag the first time you push; afterwards, `git push` is sufficient.

### Authentication quickstart

- Register an administrator by setting `is_admin` to `true` in the registration payload. The API only allows this while no other admins exist, ensuring a single bootstrap admin account.
- Use the `/auth/login` endpoint to obtain a bearer token. The frontend automates this via the sign-in form.

### Environment configuration

The backend currently uses SQLite for simplicity and stores its database as `auction.db` in the project root. Update `backend/app/database.py` to point to another database engine if needed. For production, set a secure `SECRET_KEY` in `backend/app/auth.py` or load it from an environment variable.

### API overview

| Endpoint | Method | Description |
| --- | --- | --- |
| `/auth/register` | POST | Register a new account (optionally bootstrap the first admin) |
| `/auth/login` | POST | Obtain a JWT access token |
| `/users/me` | GET/PUT | View or update the authenticated profile |
| `/media/avatar` | POST | Upload a profile avatar (authenticated) |
| `/media/auction` | POST | Upload auction listing photos (admin) |
| `/subscriptions` | POST/GET | Join the email list (POST) or view subscribers (admin GET) |
| `/auctions` | GET/POST | List auctions or create a listing (admin only) |
| `/auctions/{id}` | GET/PUT/DELETE | Fetch, edit, or remove an auction (admin only for write operations) |
| `/auctions/{id}/bids` | POST | Place a bid with anti-sniping protection |
| `/messages` | GET/POST | Retrieve or send private messages |
| `/catalog/categories` | GET | Browse the heavy equipment categories seeded into the marketplace |
| `/catalog/support-programs` | GET | Discover trusted logistics, financing, and inspection partners |
| `/services/transport/quotes` | GET/POST | Admin view (GET) and create (POST) transport quote requests |
| `/services/financing/applications` | GET/POST | Admin view (GET) and create (POST) financing applications |
| `/contact` | GET/POST | Submit a support inquiry (POST) or review incoming requests (admin GET) |

Refer to the OpenAPI docs exposed at `http://localhost:8000/docs` when the backend is running for full schema details.
