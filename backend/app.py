import os

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate

from sqlalchemy import text

from models import db
from extensions import limiter
from routes.auth import auth_bp
from routes.items import items_bp
from routes.offers import offers_bp
from routes.matches import matches_bp
from routes.reviews import reviews_bp


def create_app(config_name=None):
    """Application factory pattern."""
    app = Flask(__name__)

    # Load config
    if config_name == "production":
        app.config.from_object("config.ProductionConfig")
    else:
        app.config.from_object("config.DevelopmentConfig")

    # Initialize extensions
    db.init_app(app)

    # CORS — comma-separated list of allowed origins from env, e.g.
    #   CORS_ORIGINS=https://swaphoot.com,https://www.swaphoot.com
    # Defaults to localhost dev servers so unconfigured local runs still work.
    cors_origins_env = os.getenv(
        "CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
    )
    cors_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]
    CORS(app, resources={r"/api/*": {"origins": cors_origins}}, supports_credentials=True)

    JWTManager(app)
    Migrate(app, db)
    limiter.init_app(app)

    # Register route blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(items_bp)
    app.register_blueprint(offers_bp)
    app.register_blueprint(matches_bp)
    app.register_blueprint(reviews_bp)

    # Health check endpoint
    @app.route("/api/health")
    def health():
        return {"status": "ok", "message": "SwapHoot API is running"}

    # Create tables on first run (dev only).
    # TODO: once Flask-Migrate baseline is generated and `flask db upgrade`
    # is part of the deploy flow, remove `db.create_all()` so Alembic owns
    # the schema exclusively.
    with app.app_context():
        db.create_all()
        # `_ensure_user_columns` uses SQLite-only PRAGMA syntax and is only
        # needed when an old SQLite dev DB predates a model change. Skip it
        # on any other backend (Postgres in prod and on Supabase-backed dev).
        if db.engine.url.get_backend_name() == "sqlite":
            _ensure_user_columns()

    return app


def _ensure_user_columns():
    """
    Add any new `users` columns that the model has but the existing SQLite
    database doesn't. Avoids forcing dev users to recreate their DB when
    we introduce new profile fields.

    NOTE: Only safe for *adding* nullable / defaulted columns. PK or column
    *type* changes need a fresh DB (delete swapmart_dev.db and restart).
    """
    expected = {
        "country": "VARCHAR(100) DEFAULT ''",
        "city": "VARCHAR(100) DEFAULT ''",
        "street": "VARCHAR(255) DEFAULT ''",
        "postal_code": "VARCHAR(20) DEFAULT ''",
        "whatsapp": "VARCHAR(30) DEFAULT ''",
        "email_notifications": "BOOLEAN DEFAULT 1",
        "offer_notified_pending": "BOOLEAN DEFAULT 0",
        "password_reset_token_hash": "VARCHAR(64)",
        "password_reset_expires_at": "DATETIME",
        "terms_accepted_at": "DATETIME",
    }
    with db.engine.connect() as conn:
        existing = {
            row[1] for row in conn.execute(text("PRAGMA table_info(users)"))
        }
        for col, ddl in expected.items():
            if col not in existing:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} {ddl}"))
        conn.commit()


if __name__ == "__main__":
    env = os.getenv("FLASK_ENV", "development")
    app = create_app(config_name=env)
    app.run(debug=True, port=5000)
