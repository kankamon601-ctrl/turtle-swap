"""
Shared Flask extensions — imported by both app.py and route modules
to avoid circular imports.
"""
from flask import abort, jsonify, make_response
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_jwt_extended import get_jwt_identity

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["1000 per hour", "200 per minute"],
    storage_uri="memory://",
)


def current_user_id():
    """
    Return the authenticated user's int PK from the JWT.
    JWT subject is stored as a string (RFC 7519); cast back here.

    If the token's subject isn't a valid int (e.g. a stale UUID-format
    token from before the int-PK migration), abort with 401 so the
    frontend redirects to /login instead of crashing with a 500.
    """
    raw = get_jwt_identity()
    try:
        return int(raw)
    except (TypeError, ValueError):
        abort(make_response(
            jsonify({"error": "Session expired. Please sign in again."}),
            401,
        ))
