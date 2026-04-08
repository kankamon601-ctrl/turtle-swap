# SwapMart - Tinder-style Item Swapping Platform

A platform where users can list second-hand items and receive trade offers from other users. Think **Tinder meets marketplace** — list your stuff, browse offers, swipe right to accept a swap.

## How It Works

1. **List** your item with photos and description
2. **Browse** other listings and send trade offers
3. **Swipe** through incoming offers on your items
4. **Match** — both users get notified to arrange the swap

No payments involved. Just pure item-for-item trading.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, Flask, SQLAlchemy |
| Database | PostgreSQL (Supabase) / SQLite (dev) |
| Auth | JWT (Flask-JWT-Extended) |
| Images | Cloudinary |
| Notifications | SMTP Email |
| Frontend | React *(coming soon)* |

## Project Structure

```
swapmart/
├── backend/
│   ├── app.py              # Flask app entry point
│   ├── config.py           # Environment configuration
│   ├── models.py           # Database models (ORM)
│   ├── routes/
│   │   ├── auth.py         # Register, login, profile
│   │   ├── items.py        # CRUD for listings
│   │   ├── offers.py       # Send/accept/reject offers
│   │   └── matches.py      # View matches
│   └── services/
│       └── notification.py # Email notifications
└── frontend/               # Coming in Phase 2
```

## API Endpoints

### Auth
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Get JWT token
- `GET /api/auth/me` — Current user profile

### Items
- `GET /api/items` — Browse listings (filter by category, condition, search)
- `GET /api/items/<id>` — Item details
- `POST /api/items` — Create listing *(auth required)*
- `PUT /api/items/<id>` — Update listing *(auth required)*
- `DELETE /api/items/<id>` — Remove listing *(auth required)*
- `GET /api/items/my` — Your listings *(auth required)*

### Offers
- `POST /api/offers` — Send a trade offer *(auth required)*
- `GET /api/offers/incoming` — Offers on your items *(auth required)*
- `GET /api/offers/outgoing` — Offers you've sent *(auth required)*
- `POST /api/offers/<id>/accept` — Accept (swipe right) *(auth required)*
- `POST /api/offers/<id>/reject` — Reject (swipe left) *(auth required)*

### Matches
- `GET /api/matches` — Your matches *(auth required)*

## Getting Started

### Prerequisites
- Python 3.10+
- pip

### Installation

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/swapmart.git
cd swapmart/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your settings (SQLite works out of the box for dev)

# Run the app
python app.py
```

The API will be running at `http://localhost:5000`. Visit `/api/health` to verify.

## Roadmap

- [x] Phase 1: Backend API (models, auth, CRUD, offers, matching)
- [ ] Phase 2: React frontend with swipe UI
- [ ] Phase 3: Image upload via Cloudinary
- [ ] Phase 4: Recommendation engine (data science feature)
- [ ] Phase 5: Analytics dashboard

## License

MIT
