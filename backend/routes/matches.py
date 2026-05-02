from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from models import Match
from extensions import current_user_id

matches_bp = Blueprint("matches", __name__, url_prefix="/api/matches")


# ---------------------------------------------------------------------------
# GET /api/matches - get all your matches
# ---------------------------------------------------------------------------
@matches_bp.route("", methods=["GET"])
@jwt_required()
def my_matches():
    user_id = current_user_id()

    matches = (
        Match.query
        .filter(
            (Match.user_a_id == user_id) | (Match.user_b_id == user_id)
        )
        .order_by(Match.matched_at.desc())
        .all()
    )

    return jsonify({"matches": [m.to_dict() for m in matches]}), 200
