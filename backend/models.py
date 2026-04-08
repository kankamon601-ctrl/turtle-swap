import uuid
from datetime import datetime, timezone

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def generate_uuid():
    return str(uuid.uuid4())


# ---------------------------------------------------------------------------
# USERS
# ---------------------------------------------------------------------------
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    email = db.Column(db.String(255), unique=True, nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    avatar_url = db.Column(db.String(500), default="")
    location = db.Column(db.String(255), default="")
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    items = db.relationship("Item", backref="owner", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "username": self.username,
            "avatar_url": self.avatar_url,
            "location": self.location,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "created_at": self.created_at.isoformat(),
        }


# ---------------------------------------------------------------------------
# ITEMS
# ---------------------------------------------------------------------------
class Item(db.Model):
    __tablename__ = "items"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(
        db.String(36), db.ForeignKey("users.id"), nullable=False
    )
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, default="")
    category = db.Column(db.String(100), nullable=False)
    condition = db.Column(db.String(50), nullable=False)  # new, like_new, good, fair
    estimated_value = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(20), default="active")  # active, pending, swapped
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    images = db.relationship(
        "ItemImage", backref="item", lazy="dynamic", cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "condition": self.condition,
            "estimated_value": self.estimated_value,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
            "images": [img.to_dict() for img in self.images],
            "owner": self.owner.to_dict() if self.owner else None,
        }


# ---------------------------------------------------------------------------
# ITEM IMAGES
# ---------------------------------------------------------------------------
class ItemImage(db.Model):
    __tablename__ = "item_images"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    item_id = db.Column(
        db.String(36), db.ForeignKey("items.id"), nullable=False
    )
    image_url = db.Column(db.String(500), nullable=False)
    sort_order = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            "id": self.id,
            "image_url": self.image_url,
            "sort_order": self.sort_order,
        }


# ---------------------------------------------------------------------------
# OFFERS
# ---------------------------------------------------------------------------
class Offer(db.Model):
    __tablename__ = "offers"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    offered_item_id = db.Column(
        db.String(36), db.ForeignKey("items.id"), nullable=False
    )
    target_item_id = db.Column(
        db.String(36), db.ForeignKey("items.id"), nullable=False
    )
    offerer_id = db.Column(
        db.String(36), db.ForeignKey("users.id"), nullable=False
    )
    status = db.Column(db.String(20), default="pending")  # pending, accepted, rejected
    message = db.Column(db.Text, default="")
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    offered_item = db.relationship("Item", foreign_keys=[offered_item_id])
    target_item = db.relationship("Item", foreign_keys=[target_item_id])
    offerer = db.relationship("User", foreign_keys=[offerer_id])

    def to_dict(self):
        return {
            "id": self.id,
            "offered_item": self.offered_item.to_dict(),
            "target_item": self.target_item.to_dict(),
            "offerer": self.offerer.to_dict(),
            "status": self.status,
            "message": self.message,
            "created_at": self.created_at.isoformat(),
        }


# ---------------------------------------------------------------------------
# MATCHES
# ---------------------------------------------------------------------------
class Match(db.Model):
    __tablename__ = "matches"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    offer_id = db.Column(
        db.String(36), db.ForeignKey("offers.id"), nullable=False
    )
    user_a_id = db.Column(
        db.String(36), db.ForeignKey("users.id"), nullable=False
    )
    user_b_id = db.Column(
        db.String(36), db.ForeignKey("users.id"), nullable=False
    )
    notified = db.Column(db.Boolean, default=False)
    matched_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    offer = db.relationship("Offer")
    user_a = db.relationship("User", foreign_keys=[user_a_id])
    user_b = db.relationship("User", foreign_keys=[user_b_id])

    def to_dict(self):
        return {
            "id": self.id,
            "offer": self.offer.to_dict(),
            "user_a": self.user_a.to_dict(),
            "user_b": self.user_b.to_dict(),
            "notified": self.notified,
            "matched_at": self.matched_at.isoformat(),
        }


# ---------------------------------------------------------------------------
# REVIEWS
# ---------------------------------------------------------------------------
class Review(db.Model):
    __tablename__ = "reviews"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    match_id = db.Column(
        db.String(36), db.ForeignKey("matches.id"), nullable=False
    )
    reviewer_id = db.Column(
        db.String(36), db.ForeignKey("users.id"), nullable=False
    )
    reviewed_id = db.Column(
        db.String(36), db.ForeignKey("users.id"), nullable=False
    )
    rating = db.Column(db.Integer, nullable=False)  # 1 to 5
    comment = db.Column(db.Text, default="")
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    match = db.relationship("Match")
    reviewer = db.relationship("User", foreign_keys=[reviewer_id])
    reviewed = db.relationship("User", foreign_keys=[reviewed_id])

    def to_dict(self):
        return {
            "id": self.id,
            "match_id": self.match_id,
            "reviewer": self.reviewer.to_dict(),
            "reviewed_id": self.reviewed_id,
            "rating": self.rating,
            "comment": self.comment,
            "created_at": self.created_at.isoformat(),
        }
