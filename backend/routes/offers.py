from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import db, Item, Offer, Match
from services.notification import send_match_email

offers_bp = Blueprint("offers", __name__, url_prefix="/api/offers")


# ---------------------------------------------------------------------------
# POST /api/offers - send an offer to trade
# ---------------------------------------------------------------------------
@offers_bp.route("", methods=["POST"])
@jwt_required()
def create_offer():
    user_id = get_jwt_identity()
    data = request.get_json()

    # Validate required fields
    if not data.get("offered_item_id") or not data.get("target_item_id"):
        return jsonify({
            "error": "offered_item_id and target_item_id are required"
        }), 400

    # Check items exist
    offered_item = Item.query.get(data["offered_item_id"])
    target_item = Item.query.get(data["target_item_id"])

    if not offered_item or not target_item:
        return jsonify({"error": "One or both items not found"}), 404

    # You can only offer your own items
    if offered_item.user_id != user_id:
        return jsonify({"error": "You can only offer items you own"}), 403

    # Can't offer to yourself
    if target_item.user_id == user_id:
        return jsonify({"error": "You can't make an offer on your own item"}), 400

    # Target item must be active
    if target_item.status != "active":
        return jsonify({"error": "This item is no longer available"}), 400

    # Check for duplicate offer
    existing = Offer.query.filter_by(
        offered_item_id=data["offered_item_id"],
        target_item_id=data["target_item_id"],
        status="pending",
    ).first()

    if existing:
        return jsonify({"error": "You already have a pending offer for this trade"}), 409

    offer = Offer(
        offered_item_id=data["offered_item_id"],
        target_item_id=data["target_item_id"],
        offerer_id=user_id,
        message=data.get("message", ""),
    )
    db.session.add(offer)
    db.session.commit()

    return jsonify({"offer": offer.to_dict()}), 201


# ---------------------------------------------------------------------------
# GET /api/offers/incoming - offers on YOUR items (what you swipe through)
# ---------------------------------------------------------------------------
@offers_bp.route("/incoming", methods=["GET"])
@jwt_required()
def incoming_offers():
    user_id = get_jwt_identity()

    # Find all pending offers on items owned by current user
    offers = (
        Offer.query
        .join(Item, Offer.target_item_id == Item.id)
        .filter(Item.user_id == user_id, Offer.status == "pending")
        .order_by(Offer.created_at.desc())
        .all()
    )

    return jsonify({"offers": [offer.to_dict() for offer in offers]}), 200


# ---------------------------------------------------------------------------
# GET /api/offers/count - count pending incoming offers (for badge)
# ---------------------------------------------------------------------------
@offers_bp.route("/count", methods=["GET"])
@jwt_required()
def offer_count():
    user_id = get_jwt_identity()

    count = (
        Offer.query
        .join(Item, Offer.target_item_id == Item.id)
        .filter(Item.user_id == user_id, Offer.status == "pending")
        .count()
    )

    return jsonify({"count": count}), 200


# ---------------------------------------------------------------------------
# GET /api/offers/outgoing - offers YOU sent (to track their status)
# ---------------------------------------------------------------------------
@offers_bp.route("/outgoing", methods=["GET"])
@jwt_required()
def outgoing_offers():
    user_id = get_jwt_identity()

    offers = (
        Offer.query
        .filter_by(offerer_id=user_id)
        .order_by(Offer.created_at.desc())
        .all()
    )

    return jsonify({"offers": [offer.to_dict() for offer in offers]}), 200


# ---------------------------------------------------------------------------
# POST /api/offers/<id>/accept - swipe right! creates a match
# ---------------------------------------------------------------------------
@offers_bp.route("/<offer_id>/accept", methods=["POST"])
@jwt_required()
def accept_offer(offer_id):
    user_id = get_jwt_identity()
    offer = Offer.query.get(offer_id)

    if not offer:
        return jsonify({"error": "Offer not found"}), 404

    # Only the owner of the target item can accept
    target_item = Item.query.get(offer.target_item_id)
    if target_item.user_id != user_id:
        return jsonify({"error": "Only the item owner can accept offers"}), 403

    if offer.status != "pending":
        return jsonify({"error": "This offer is no longer pending"}), 400

    # Accept the offer
    offer.status = "accepted"

    # Mark both items as pending swap
    target_item.status = "pending"
    offered_item = Item.query.get(offer.offered_item_id)
    offered_item.status = "pending"

    # Reject all other pending offers on this item
    other_offers = Offer.query.filter(
        Offer.target_item_id == offer.target_item_id,
        Offer.id != offer.id,
        Offer.status == "pending",
    ).all()
    for other in other_offers:
        other.status = "rejected"

    # Create the match
    match = Match(
        offer_id=offer.id,
        user_a_id=target_item.user_id,
        user_b_id=offer.offerer_id,
    )
    db.session.add(match)
    db.session.commit()

    # Send notification emails (non-blocking, won't crash if email fails)
    try:
        send_match_email(match)
        match.notified = True
        db.session.commit()
    except Exception as e:
        print(f"Email notification failed: {e}")

    return jsonify({"match": match.to_dict()}), 201


# ---------------------------------------------------------------------------
# POST /api/offers/<id>/reject - swipe left
# ---------------------------------------------------------------------------
@offers_bp.route("/<offer_id>/reject", methods=["POST"])
@jwt_required()
def reject_offer(offer_id):
    user_id = get_jwt_identity()
    offer = Offer.query.get(offer_id)

    if not offer:
        return jsonify({"error": "Offer not found"}), 404

    target_item = Item.query.get(offer.target_item_id)
    if target_item.user_id != user_id:
        return jsonify({"error": "Only the item owner can reject offers"}), 403

    if offer.status != "pending":
        return jsonify({"error": "This offer is no longer pending"}), 400

    offer.status = "rejected"
    db.session.commit()

    return jsonify({"offer": offer.to_dict()}), 200
