from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import or_

from models import db, Item, Offer, Match, User
from services.notification import send_match_email, send_offer_email
from extensions import limiter, current_user_id

offers_bp = Blueprint("offers", __name__, url_prefix="/api/offers")


# ---------------------------------------------------------------------------
# POST /api/offers - send an offer to trade
# Body: { offered_item_id, target_item_id, message? }
# offered_item_id and target_item_id are PUBLIC IDs (UUIDs from item.to_dict)
# ---------------------------------------------------------------------------
@offers_bp.route("", methods=["POST"])
@jwt_required()
def create_offer():
    user_id = current_user_id()
    data = request.get_json()

    # Validate required fields
    if not data.get("offered_item_id") or not data.get("target_item_id"):
        return jsonify({
            "error": "offered_item_id and target_item_id are required"
        }), 400

    # Resolve public IDs to internal int PKs
    offered_item = Item.query.filter_by(public_id=data["offered_item_id"]).first()
    target_item = Item.query.filter_by(public_id=data["target_item_id"]).first()

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

    # Check for duplicate offer (uses internal int FKs)
    existing = Offer.query.filter_by(
        offered_item_id=offered_item.id,
        target_item_id=target_item.id,
        status="pending",
    ).first()

    if existing:
        return jsonify({"error": "You already have a pending offer for this trade"}), 409

    offer = Offer(
        offered_item_id=offered_item.id,
        target_item_id=target_item.id,
        offerer_id=user_id,
        message=data.get("message", ""),
    )
    db.session.add(offer)
    db.session.commit()

    # Send offer notification email (first-unread only)
    try:
        target_owner = User.query.get(target_item.user_id)
        if (
            target_owner
            and target_owner.email_notifications
            and not target_owner.offer_notified_pending
        ):
            send_offer_email(
                target_user=target_owner,
                offerer=User.query.get(user_id),
                target_item=target_item,
                offered_item=offered_item,
                message=offer.message,
            )
            target_owner.offer_notified_pending = True
            db.session.commit()
    except Exception as e:
        print(f"Offer notification email failed: {e}")

    return jsonify({"offer": offer.to_dict()}), 201


# ---------------------------------------------------------------------------
# GET /api/offers/incoming - offers on YOUR items (what you swipe through)
# Includes both 'pending' (fresh) and 'held' offers so user can revisit them.
# ---------------------------------------------------------------------------
@offers_bp.route("/incoming", methods=["GET"])
@jwt_required()
def incoming_offers():
    user_id = current_user_id()

    # Reset the "already notified" flag so the next new offer triggers an email
    user = User.query.get(user_id)
    if user and user.offer_notified_pending:
        user.offer_notified_pending = False
        db.session.commit()

    # Fresh offers first, then held ones
    offers = (
        Offer.query
        .join(Item, Offer.target_item_id == Item.id)
        .filter(Item.user_id == user_id, Offer.status.in_(["pending", "held"]))
        .order_by(Offer.status.desc(), Offer.created_at.desc())
        .all()
    )

    return jsonify({"offers": [offer.to_dict() for offer in offers]}), 200


# ---------------------------------------------------------------------------
# GET /api/offers/count - count FRESH pending incoming offers (for badge)
# Held offers are intentionally excluded - user already reviewed them.
# ---------------------------------------------------------------------------
@offers_bp.route("/count", methods=["GET"])
@limiter.exempt
@jwt_required()
def offer_count():
    user_id = current_user_id()

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
    user_id = current_user_id()

    offers = (
        Offer.query
        .filter_by(offerer_id=user_id)
        .order_by(Offer.created_at.desc())
        .all()
    )

    return jsonify({"offers": [offer.to_dict() for offer in offers]}), 200


# ---------------------------------------------------------------------------
# POST /api/offers/<int:offer_id>/accept - swipe right! creates a match
# ---------------------------------------------------------------------------
@offers_bp.route("/<int:offer_id>/accept", methods=["POST"])
@jwt_required()
def accept_offer(offer_id):
    user_id = current_user_id()
    offer = Offer.query.get(offer_id)

    if not offer:
        return jsonify({"error": "Offer not found"}), 404

    # Only the owner of the target item can accept
    target_item = Item.query.get(offer.target_item_id)
    if target_item.user_id != user_id:
        return jsonify({"error": "Only the item owner can accept offers"}), 403

    if offer.status not in ("pending", "held"):
        return jsonify({"error": "This offer is no longer pending"}), 400

    # Both items must still be available (offered item may have been
    # matched elsewhere since this offer was created)
    offered_item = Item.query.get(offer.offered_item_id)
    if target_item.status != "active":
        return jsonify({"error": "Your item is no longer available for swap"}), 400
    if offered_item.status != "active":
        return jsonify({"error": "The offered item is no longer available"}), 400

    # Accept the offer
    offer.status = "accepted"

    # Mark both items as pending swap
    target_item.status = "pending"
    offered_item.status = "pending"

    # Reject all other open (pending or held) offers that involve EITHER item,
    # as either the target or the offered side. This prevents the same item
    # from being matched more than once.
    involved_ids = {offer.target_item_id, offer.offered_item_id}
    other_offers = Offer.query.filter(
        Offer.id != offer.id,
        Offer.status.in_(("pending", "held")),
        or_(
            Offer.target_item_id.in_(involved_ids),
            Offer.offered_item_id.in_(involved_ids),
        ),
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
# POST /api/offers/<int:offer_id>/reject - swipe left
# ---------------------------------------------------------------------------
@offers_bp.route("/<int:offer_id>/reject", methods=["POST"])
@jwt_required()
def reject_offer(offer_id):
    user_id = current_user_id()
    offer = Offer.query.get(offer_id)

    if not offer:
        return jsonify({"error": "Offer not found"}), 404

    target_item = Item.query.get(offer.target_item_id)
    if target_item.user_id != user_id:
        return jsonify({"error": "Only the item owner can reject offers"}), 403

    if offer.status not in ("pending", "held"):
        return jsonify({"error": "This offer is no longer pending"}), 400

    offer.status = "rejected"
    db.session.commit()

    return jsonify({"offer": offer.to_dict()}), 200


# ---------------------------------------------------------------------------
# POST /api/offers/<int:offer_id>/hold - mark an offer as "held" (save for later)
# The offer stays visible in incoming offers but is excluded from the
# unread-badge count. Auto-rejected when the target item is matched elsewhere.
# ---------------------------------------------------------------------------
@offers_bp.route("/<int:offer_id>/hold", methods=["POST"])
@jwt_required()
def hold_offer(offer_id):
    user_id = current_user_id()
    offer = Offer.query.get(offer_id)

    if not offer:
        return jsonify({"error": "Offer not found"}), 404

    target_item = Item.query.get(offer.target_item_id)
    if target_item.user_id != user_id:
        return jsonify({"error": "Only the item owner can hold offers"}), 403

    if offer.status not in ("pending", "held"):
        return jsonify({"error": "Only open offers can be held"}), 400

    offer.status = "held"
    db.session.commit()

    return jsonify({"offer": offer.to_dict()}), 200
