from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import func

from models import db, Review, Match, User
from extensions import current_user_id

reviews_bp = Blueprint("reviews", __name__, url_prefix="/api/reviews")


# ---------------------------------------------------------------------------
# POST /api/reviews - leave a review after a swap
# ---------------------------------------------------------------------------
@reviews_bp.route("", methods=["POST"])
@jwt_required()
def create_review():
    user_id = current_user_id()
    data = request.get_json()

    # Validate required fields
    if not data.get("match_id"):
        return jsonify({"error": "match_id is required"}), 400

    rating = data.get("rating")
    if not rating or rating not in [1, 2, 3, 4, 5]:
        return jsonify({"error": "Rating must be between 1 and 5"}), 400

    # Check the match exists
    match = Match.query.get(data["match_id"])
    if not match:
        return jsonify({"error": "Match not found"}), 404

    # Reviewer must be part of this match
    if user_id not in [match.user_a_id, match.user_b_id]:
        return jsonify({"error": "You are not part of this match"}), 403

    # Determine who is being reviewed (the other person)
    reviewed_id = (
        match.user_b_id if user_id == match.user_a_id else match.user_a_id
    )

    # Check if already reviewed this match
    existing = Review.query.filter_by(
        match_id=data["match_id"], reviewer_id=user_id
    ).first()

    if existing:
        return jsonify({"error": "You already reviewed this swap"}), 409

    review = Review(
        match_id=data["match_id"],
        reviewer_id=user_id,
        reviewed_id=reviewed_id,
        rating=rating,
        comment=data.get("comment", ""),
    )
    db.session.add(review)
    db.session.commit()

    return jsonify({"review": review.to_dict()}), 201


# ---------------------------------------------------------------------------
# GET /api/reviews/user/<int:user_id> - get all reviews for a user
# ---------------------------------------------------------------------------
@reviews_bp.route("/user/<int:user_id>", methods=["GET"])
def get_user_reviews(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    reviews = (
        Review.query
        .filter_by(reviewed_id=user_id)
        .order_by(Review.created_at.desc())
        .all()
    )

    # Calculate average rating
    avg_result = (
        db.session.query(func.avg(Review.rating))
        .filter_by(reviewed_id=user_id)
        .scalar()
    )
    avg_rating = round(float(avg_result), 1) if avg_result else 0

    return jsonify({
        "reviews": [r.to_dict() for r in reviews],
        "total_reviews": len(reviews),
        "average_rating": avg_rating,
        "user": user.to_dict(),
    }), 200


# ---------------------------------------------------------------------------
# GET /api/reviews/my - get reviews about me
# ---------------------------------------------------------------------------
@reviews_bp.route("/my", methods=["GET"])
@jwt_required()
def my_reviews():
    user_id = current_user_id()

    reviews = (
        Review.query
        .filter_by(reviewed_id=user_id)
        .order_by(Review.created_at.desc())
        .all()
    )

    avg_result = (
        db.session.query(func.avg(Review.rating))
        .filter_by(reviewed_id=user_id)
        .scalar()
    )
    avg_rating = round(float(avg_result), 1) if avg_result else 0

    return jsonify({
        "reviews": [r.to_dict() for r in reviews],
        "total_reviews": len(reviews),
        "average_rating": avg_rating,
    }), 200
