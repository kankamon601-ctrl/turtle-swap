import hashlib
import hmac
import re
import secrets
from datetime import datetime, timedelta, timezone

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required
from werkzeug.security import generate_password_hash, check_password_hash

from models import db, User
from services.geocoding import geocode_address, build_location_label
from services.notification import send_password_reset_email
from extensions import current_user_id

COMMON_PASSWORDS = {
    "password", "12345678", "123456789", "1234567890", "qwerty123",
    "abcdefgh", "abcd1234", "iloveyou", "password1", "admin123",
}


def _validate_password(pw):
    if len(pw) < 8:
        return "Password must be at least 8 characters"
    if not re.search(r"[a-zA-Z]", pw):
        return "Password must include at least one letter"
    if not re.search(r"[0-9]", pw):
        return "Password must include at least one number"
    if len(set(pw)) == 1:
        return "Password cannot be all the same character"
    if pw.lower() in COMMON_PASSWORDS:
        return "That password is too common — pick something less guessable"
    return None

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


ADDRESS_FIELDS = ("country", "city", "street", "postal_code")
PHONE_FIELDS = ("whatsapp",)


def _apply_address_and_phone(user, data):
    """
    Copy address + phone fields from the request payload onto the user,
    then re-geocode if any address part changed. Returns True if the
    geocoder ran (so callers can decide whether to warn on failure).
    """
    address_changed = False
    for field in ADDRESS_FIELDS:
        if field in data:
            new_val = (data.get(field) or "").strip()
            if getattr(user, field) != new_val:
                address_changed = True
            setattr(user, field, new_val)

    for field in PHONE_FIELDS:
        if field in data:
            setattr(user, field, (data.get(field) or "").strip())

    if address_changed:
        lat, lng = geocode_address(
            country=user.country,
            city=user.city,
            street=user.street,
            postal_code=user.postal_code,
        )
        user.latitude = lat
        user.longitude = lng
        user.location = build_location_label(user.city, user.country)

    return address_changed


# ---------------------------------------------------------------------------
# POST /api/auth/register
# ---------------------------------------------------------------------------
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}

    # Validate required fields
    required = ["email", "username", "password"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    pw_error = _validate_password(data["password"])
    if pw_error:
        return jsonify({"error": pw_error}), 400

    # Terms of Service must be accepted.  We check this after other validation
    # so the user sees field errors first, but it's still a hard requirement.
    if not data.get("terms_accepted"):
        return jsonify({
            "error": "You must agree to the SwapHoot Terms of Service to create an account"
        }), 400

    # Check if user already exists
    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already registered"}), 409

    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"error": "Username already taken"}), 409

    user = User(
        email=data["email"],
        username=data["username"],
        password_hash=generate_password_hash(data["password"]),
        email_notifications=bool(data.get("email_notifications", True)),
        terms_accepted_at=datetime.now(timezone.utc),
    )
    _apply_address_and_phone(user, data)

    db.session.add(user)
    db.session.commit()

    # Return token so user is logged in immediately.
    # JWT subject must be a string per RFC 7519 — cast int PK to str.
    token = create_access_token(identity=str(user.id))
    return jsonify({
        "token": token,
        "user": user.to_dict(),
        "geocoded": user.latitude is not None,
    }), 201


# ---------------------------------------------------------------------------
# POST /api/auth/login
# ---------------------------------------------------------------------------
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}

    if not data.get("email") or not data.get("password"):
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=data["email"]).first()

    if not user or not check_password_hash(user.password_hash, data["password"]):
        return jsonify({"error": "Invalid email or password"}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()}), 200


# ---------------------------------------------------------------------------
# GET /api/auth/me - get current user profile
# ---------------------------------------------------------------------------
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    user_id = current_user_id()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"user": user.to_dict()}), 200


# ---------------------------------------------------------------------------
# PUT /api/auth/profile - update address + phone
# ---------------------------------------------------------------------------
@auth_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    user_id = current_user_id()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json() or {}
    address_changed = _apply_address_and_phone(user, data)

    if "email_notifications" in data:
        user.email_notifications = bool(data["email_notifications"])

    db.session.commit()

    return jsonify({
        "user": user.to_dict(),
        "geocoded": user.latitude is not None if address_changed else None,
    }), 200


# ---------------------------------------------------------------------------
# Password reset
# ---------------------------------------------------------------------------
PASSWORD_RESET_TTL = timedelta(hours=1)
_GENERIC_FORGOT_RESPONSE = {
    "message": "If an account exists for that email, a reset link is on its way.",
}


def _hash_reset_token(raw_token):
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


# POST /api/auth/forgot-password
@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()

    # Always return the same response — don't leak which emails are registered.
    if not email:
        return jsonify(_GENERIC_FORGOT_RESPONSE), 200

    user = User.query.filter(db.func.lower(User.email) == email).first()
    if user:
        raw_token = secrets.token_urlsafe(32)
        user.password_reset_token_hash = _hash_reset_token(raw_token)
        user.password_reset_expires_at = (
            datetime.now(timezone.utc) + PASSWORD_RESET_TTL
        )
        db.session.commit()

        frontend_url = current_app.config.get(
            "FRONTEND_URL", "http://localhost:3000"
        ).rstrip("/")
        reset_url = f"{frontend_url}/reset-password/{raw_token}"

        try:
            send_password_reset_email(user, reset_url)
        except Exception as e:
            # Don't fail the request if email sending hiccups — the token is
            # still valid and the user can retry. Log for ops.
            print(f"Failed to send password reset email: {e}")

    return jsonify(_GENERIC_FORGOT_RESPONSE), 200


# POST /api/auth/reset-password
@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json() or {}
    raw_token = (data.get("token") or "").strip()
    new_password = data.get("password") or ""

    if not raw_token or not new_password:
        return jsonify({"error": "Token and new password are required"}), 400

    pw_error = _validate_password(new_password)
    if pw_error:
        return jsonify({"error": pw_error}), 400

    token_hash = _hash_reset_token(raw_token)

    # Find any user whose stored hash matches this token. We still
    # constant-time compare below to be safe against any future change.
    user = User.query.filter_by(password_reset_token_hash=token_hash).first()

    now = datetime.now(timezone.utc)
    if (
        not user
        or not user.password_reset_token_hash
        or not user.password_reset_expires_at
        or not hmac.compare_digest(user.password_reset_token_hash, token_hash)
    ):
        return jsonify({"error": "This reset link is invalid or has already been used."}), 400

    expires_at = user.password_reset_expires_at
    # SQLite returns naive datetimes; treat them as UTC for the comparison.
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < now:
        # Clear the expired token so it can't sit around.
        user.password_reset_token_hash = None
        user.password_reset_expires_at = None
        db.session.commit()
        return jsonify({"error": "This reset link has expired. Please request a new one."}), 400

    user.password_hash = generate_password_hash(new_password)
    user.password_reset_token_hash = None
    user.password_reset_expires_at = None
    db.session.commit()

    return jsonify({"message": "Password updated. You can sign in with your new password now."}), 200
