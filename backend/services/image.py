import io
from PIL import Image

import cloudinary
import cloudinary.uploader
from flask import current_app

# Maximum image dimensions and file size
MAX_WIDTH = 800
MAX_HEIGHT = 800
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
MAX_IMAGES_PER_ITEM = 4
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}


def init_cloudinary():
    """Initialize Cloudinary with config from Flask app."""
    config = current_app.config
    cloudinary.config(
        cloud_name=config.get("CLOUDINARY_CLOUD_NAME"),
        api_key=config.get("CLOUDINARY_API_KEY"),
        api_secret=config.get("CLOUDINARY_API_SECRET"),
    )


def allowed_file(filename):
    """Check if file extension is allowed."""
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    )


def resize_image(file_data):
    """Resize image to max dimensions while keeping aspect ratio.

    Returns the resized image as bytes in JPEG format.
    """
    image = Image.open(io.BytesIO(file_data))

    # Convert RGBA/P to RGB (JPEG doesn't support transparency)
    if image.mode in ("RGBA", "P"):
        image = image.convert("RGB")

    # Only resize if larger than max dimensions
    if image.width > MAX_WIDTH or image.height > MAX_HEIGHT:
        image.thumbnail((MAX_WIDTH, MAX_HEIGHT), Image.LANCZOS)

    # Save to bytes buffer
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=85, optimize=True)
    buffer.seek(0)
    return buffer


def upload_image(file_data, filename):
    """Upload image to Cloudinary with auto-resize.

    Returns the image URL or raises an error.
    """
    init_cloudinary()

    # Resize locally first to save bandwidth
    resized = resize_image(file_data)

    # Upload to Cloudinary with moderation
    # The 'upload' method returns image info including the URL
    result = cloudinary.uploader.upload(
        resized,
        folder="swapmart/items",
        resource_type="image",
        # Cloudinary auto-moderation (detects inappropriate content)
        # Requires enabling the add-on in Cloudinary dashboard (free tier available)
        # moderation="aws_rek",  # uncomment when add-on is enabled
        transformation=[
            {"width": MAX_WIDTH, "height": MAX_HEIGHT, "crop": "limit"},
            {"quality": "auto", "fetch_format": "auto"},
        ],
    )

    return result["secure_url"]


def check_image_safety(file_data):
    """Basic image safety check using file analysis.

    For production, enable Cloudinary's moderation add-on or
    use a dedicated API like Sightengine.

    This basic check verifies:
    - File is actually an image (not a renamed executable)
    - File size is within limits
    - File dimensions are reasonable
    """
    # Check file size
    if len(file_data) > MAX_FILE_SIZE:
        return False, "Image exceeds 5MB size limit"

    # Verify it's actually an image
    try:
        image = Image.open(io.BytesIO(file_data))
        image.verify()
    except Exception:
        return False, "File is not a valid image"

    # Check dimensions aren't absurdly large (could be an attack)
    image = Image.open(io.BytesIO(file_data))
    if image.width > 10000 or image.height > 10000:
        return False, "Image dimensions too large"

    return True, "OK"
