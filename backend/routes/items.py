from math import radians, cos, sin, asin, sqrt

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import db, Item, ItemImage, User

items_bp = Blueprint("items", __name__, url_prefix="/api/items")

VALID_CATEGORIES = [
    "electronics", "phones", "computers", "cameras",
    "fashion", "home", "sports", "books", "games", "other",
]
VALID_CONDITIONS = ["new", "like_new", "good", "fair"]


# ---------------------------------------------------------------------------
# GET /api/items - browse all active listings (with optional filters)
# ---------------------------------------------------------------------------
@items_bp.route("", methods=["GET"])
def list_items():
    query = Item.query.filter_by(status="active")

    # Optional filters
    category = request.args.get("category")
    if category and category in VALID_CATEGORIES:
        query = query.filter_by(category=category)

    condition = request.args.get("condition")
    if condition and condition in VALID_CONDITIONS:
        query = query.filter_by(condition=condition)

    # Search by title
    search = request.args.get("search")
    if search:
        query = query.filter(Item.title.ilike(f"%{search}%"))

    # Pagination
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    per_page = min(per_page, 50)  # cap at 50

    pagination = query.order_by(Item.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        "items": [item.to_dict() for item in pagination.items],
        "total": pagination.total,
        "page": page,
        "pages": pagination.pages,
    }), 200


# ---------------------------------------------------------------------------
# GET /api/items/my - get current user's listings
# IMPORTANT: This must come BEFORE /<item_id> or Flask treats "my" as an ID
# ---------------------------------------------------------------------------
@items_bp.route("/my", methods=["GET"])
@jwt_required()
def my_items():
    user_id = get_jwt_identity()
    items = Item.query.filter_by(user_id=user_id).order_by(
        Item.created_at.desc()
    ).all()

    return jsonify({"items": [item.to_dict() for item in items]}), 200


# ---------------------------------------------------------------------------
# GET /api/items/nearby - find items within a radius
# IMPORTANT: Must come BEFORE /<item_id>
# ---------------------------------------------------------------------------
@items_bp.route("/nearby", methods=["GET"])
def nearby_items():
    lat = request.args.get("lat", type=float)
    lng = request.args.get("lng", type=float)
    radius = request.args.get("radius", 20.0, type=float)

    if lat is None or lng is None:
        return jsonify({"error": "lat and lng parameters are required"}), 400

    radius = min(radius, 100.0)

    items = (
        Item.query
        .join(User, Item.user_id == User.id)
        .filter(
            Item.status == "active",
            User.latitude.isnot(None),
            User.longitude.isnot(None),
        )
        .all()
    )

    nearby = []
    for item in items:
        distance = haversine(lat, lng, item.owner.latitude, item.owner.longitude)
        if distance <= radius:
            item_data = item.to_dict()
            item_data["distance_km"] = round(distance, 1)
            nearby.append(item_data)

    nearby.sort(key=lambda x: x["distance_km"])

    return jsonify({
        "items": nearby,
        "total": len(nearby),
        "radius_km": radius,
        "your_location": {"lat": lat, "lng": lng},
    }), 200


# ---------------------------------------------------------------------------
# GET /api/items/<id> - get single item details
# ---------------------------------------------------------------------------
@items_bp.route("/<item_id>", methods=["GET"])
def get_item(item_id):
    item = Item.query.get(item_id)
    if not item:
        return jsonify({"error": "Item not found"}), 404

    return jsonify({"item": item.to_dict()}), 200


# ---------------------------------------------------------------------------
# POST /api/items - create a new listing
# ---------------------------------------------------------------------------
@items_bp.route("", methods=["POST"])
@jwt_required()
def create_item():
    user_id = get_jwt_identity()
    data = request.get_json()

    # Validate
    if not data.get("title"):
        return jsonify({"error": "Title is required"}), 400

    if data.get("category") not in VALID_CATEGORIES:
        return jsonify({
            "error": f"Category must be one of: {', '.join(VALID_CATEGORIES)}"
        }), 400

    if data.get("condition") not in VALID_CONDITIONS:
        return jsonify({
            "error": f"Condition must be one of: {', '.join(VALID_CONDITIONS)}"
        }), 400

    item = Item(
        user_id=user_id,
        title=data["title"],
        description=data.get("description", ""),
        category=data["category"],
        condition=data["condition"],
        estimated_value=data.get("estimated_value", 0.0),
    )
    db.session.add(item)

    # Add image URLs if provided
    for i, url in enumerate(data.get("image_urls", [])):
        image = ItemImage(item_id=item.id, image_url=url, sort_order=i)
        db.session.add(image)

    db.session.commit()
    return jsonify({"item": item.to_dict()}), 201


# ---------------------------------------------------------------------------
# PUT /api/items/<id> - update your listing
# ---------------------------------------------------------------------------
@items_bp.route("/<item_id>", methods=["PUT"])
@jwt_required()
def update_item(item_id):
    user_id = get_jwt_identity()
    item = Item.query.get(item_id)

    if not item:
        return jsonify({"error": "Item not found"}), 404

    if item.user_id != user_id:
        return jsonify({"error": "You can only edit your own items"}), 403

    data = request.get_json()

    if "title" in data:
        item.title = data["title"]
    if "description" in data:
        item.description = data["description"]
    if "category" in data and data["category"] in VALID_CATEGORIES:
        item.category = data["category"]
    if "condition" in data and data["condition"] in VALID_CONDITIONS:
        item.condition = data["condition"]
    if "estimated_value" in data:
        item.estimated_value = data["estimated_value"]

    db.session.commit()
    return jsonify({"item": item.to_dict()}), 200


# ---------------------------------------------------------------------------
# DELETE /api/items/<id> - remove your listing
# ---------------------------------------------------------------------------
@items_bp.route("/<item_id>", methods=["DELETE"])
@jwt_required()
def delete_item(item_id):
    user_id = get_jwt_identity()
    item = Item.query.get(item_id)

    if not item:
        return jsonify({"error": "Item not found"}), 404

    if item.user_id != user_id:
        return jsonify({"error": "You can only delete your own items"}), 403

    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Item deleted"}), 200


# ---------------------------------------------------------------------------
# Haversine formula - calculates distance between two GPS coordinates in km
# ---------------------------------------------------------------------------
def haversine(lat1, lon1, lat2, lon2):
    """Calculate the distance in km between two points on Earth."""
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 6371 * 2 * asin(sqrt(a))  # 6371 = Earth's radius in km


# ---------------------------------------------------------------------------
# PUT /api/auth/location - update user's GPS coordinates
# ---------------------------------------------------------------------------
@items_bp.route("/update-location", methods=["PUT"])
@jwt_required()
def update_location():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json()

    if not data.get("latitude") or not data.get("longitude"):
        return jsonify({"error": "latitude and longitude are required"}), 400

    user.latitude = data["latitude"]
    user.longitude = data["longitude"]

    # Optionally update location name too
    if data.get("location"):
        user.location = data["location"]

    db.session.commit()
    return jsonify({"user": user.to_dict()}), 200


# ---------------------------------------------------------------------------
# POST /api/items/<id>/images - upload images for an item (max 4)
# ---------------------------------------------------------------------------
@items_bp.route("/<item_id>/images", methods=["POST"])
@jwt_required()
def upload_images(item_id):
    user_id = get_jwt_identity()
    item = Item.query.get(item_id)

    if not item:
        return jsonify({"error": "Item not found"}), 404

    if item.user_id != user_id:
        return jsonify({"error": "You can only upload images to your own items"}), 403

    # Check how many images this item already has
    existing_count = ItemImage.query.filter_by(item_id=item_id).count()

    if "images" not in request.files:
        return jsonify({"error": "No images provided"}), 400

    files = request.files.getlist("images")

    if existing_count + len(files) > 4:
        remaining = 4 - existing_count
        return jsonify({
            "error": f"Maximum 4 images per item. You can upload {remaining} more."
        }), 400

    from services.image import allowed_file, check_image_safety, upload_image

    uploaded_urls = []
    for i, file in enumerate(files):
        if not file.filename:
            continue

        # Check file extension
        if not allowed_file(file.filename):
            return jsonify({
                "error": f"File '{file.filename}' is not allowed. Use: png, jpg, jpeg, webp"
            }), 400

        # Read file data
        file_data = file.read()

        # Safety check
        is_safe, message = check_image_safety(file_data)
        if not is_safe:
            return jsonify({"error": f"Image rejected: {message}"}), 400

        # Upload with auto-resize
        try:
            image_url = upload_image(file_data, file.filename)
        except Exception as e:
            return jsonify({"error": f"Upload failed: {str(e)}"}), 500

        # Save to database
        image = ItemImage(
            item_id=item_id,
            image_url=image_url,
            sort_order=existing_count + i,
        )
        db.session.add(image)
        uploaded_urls.append(image_url)

    db.session.commit()

    return jsonify({
        "message": f"{len(uploaded_urls)} image(s) uploaded successfully",
        "images": uploaded_urls,
        "total_images": existing_count + len(uploaded_urls),
    }), 201
