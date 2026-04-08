from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash

from models import db, User

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


# ---------------------------------------------------------------------------
# POST /api/auth/register - stricter rate limit applied in app.py
# ---------------------------------------------------------------------------
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    # Validate required fields
    required = ["email", "username", "password"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    # Check if user already exists
    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already registered"}), 409

    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"error": "Username already taken"}), 409

    # Create user
    user = User(
        email=data["email"],
        username=data["username"],
        password_hash=generate_password_hash(data["password"]),
        location=data.get("location", ""),
        latitude=data.get("latitude"),
        longitude=data.get("longitude"),
    )
    db.session.add(user)
    db.session.commit()

    # Return token so user is logged in immediately
    token = create_access_token(identity=user.id)
    return jsonify({"token": token, "user": user.to_dict()}), 201


# ---------------------------------------------------------------------------
# POST /api/auth/login
# ---------------------------------------------------------------------------
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data.get("email") or not data.get("password"):
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=data["email"]).first()

    if not user or not check_password_hash(user.password_hash, data["password"]):
        return jsonify({"error": "Invalid email or password"}), 401

    token = create_access_token(identity=user.id)
    return jsonify({"token": token, "user": user.to_dict()}), 200


# ---------------------------------------------------------------------------
# GET /api/auth/me - get current user profile
# ---------------------------------------------------------------------------
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"user": user.to_dict()}), 200
