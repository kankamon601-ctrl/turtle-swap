import os

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_migrate import Migrate

from models import db
from routes.auth import auth_bp
from routes.items import items_bp
from routes.offers import offers_bp
from routes.matches import matches_bp
from routes.reviews import reviews_bp

# Rate limiter - shared across blueprints
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per hour", "50 per minute"],
    storage_uri="memory://",
)


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
    CORS(app)
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
        return {"status": "ok", "message": "SwapMart API is running"}

    # Create tables on first run (dev only)
    with app.app_context():
        db.create_all()

    return app


if __name__ == "__main__":
    env = os.getenv("FLASK_ENV", "development")
    app = create_app(config_name=env)
    app.run(debug=True, port=5000)
