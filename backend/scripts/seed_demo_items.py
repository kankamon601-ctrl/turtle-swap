"""
Seed demo items for launch.

Run from the `backend` folder with the venv active and Cloudinary env vars set:
    python -m scripts.seed_demo_items

What it does:
  1. For each item in DEMO_ITEMS:
     - Looks up the owner by email; skips with WARN if not found
     - Skips if this user already has an item with the same title
     - Downloads each image URL, runs it through the same resize → Cloudinary
       upload pipeline as a normal listing, then attaches it to the item
  2. Commits per item, so a partial failure doesn't lose the rest.

Re-running is safe: existing items (by owner+title) are skipped.
"""
import sys
import time
from pathlib import Path

import requests

# Make the backend package importable when run as `python -m scripts.seed_demo_items`
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import create_app
from models import db, User, Item, ItemImage
from services.image import resize_image, upload_image
from scripts.demo_items_data import DEMO_ITEMS


DOWNLOAD_TIMEOUT = 15
DOWNLOAD_HEADERS = {
    "User-Agent": "SwapHoot-Seeder/1.0 (demo data ingest)",
}


def _download(url):
    """Fetch the image bytes from a URL. Returns bytes or None on failure."""
    try:
        resp = requests.get(url, timeout=DOWNLOAD_TIMEOUT, headers=DOWNLOAD_HEADERS)
        if resp.status_code != 200:
            return None
        if not resp.content:
            return None
        return resp.content
    except requests.RequestException:
        return None


def seed():
    app = create_app()
    with app.app_context():
        created = 0
        skipped = 0
        no_owner = 0
        image_failures = 0

        for i, row in enumerate(DEMO_ITEMS, start=1):
            owner = User.query.filter_by(email=row["owner_email"]).first()
            if not owner:
                print(f"[{i:02d}] NO_OWNER  {row['owner_email']} — run seed_demo_users first?")
                no_owner += 1
                continue

            # Skip if this owner already has an item with the same title
            existing = Item.query.filter_by(
                user_id=owner.id, title=row["title"]
            ).first()
            if existing:
                print(f"[{i:02d}] SKIP      {row['title']!r} (already exists for {owner.email})")
                skipped += 1
                continue

            # Create the item first so we have an id for image rows
            item = Item(
                user_id=owner.id,
                title=row["title"],
                description=row["description"],
                category=row["category"],
                condition=row["condition"],
                estimated_value=0.0,
                status="active",
            )
            db.session.add(item)
            db.session.flush()  # populate item.id

            # Upload each image
            uploaded_urls = []
            for url in row.get("image_urls", []):
                raw = _download(url)
                if raw is None:
                    print(f"           image download failed: {url}")
                    image_failures += 1
                    continue
                try:
                    resized = resize_image(raw)
                    cloud_url = upload_image(resized, "demo.jpg")
                    uploaded_urls.append(cloud_url)
                except Exception as e:  # noqa: BLE001 — log and continue
                    print(f"           image upload failed ({type(e).__name__}): {e}")
                    image_failures += 1

            # If no images uploaded successfully, still keep the item — just log it
            for sort_order, cloud_url in enumerate(uploaded_urls):
                db.session.add(ItemImage(
                    item_id=item.id,
                    image_url=cloud_url,
                    sort_order=sort_order,
                ))

            db.session.commit()
            created += 1
            img_count = len(uploaded_urls)
            print(f"[{i:02d}] CREATED   {row['title']!r}  owner={owner.email}  images={img_count}")

            # Be polite to Unsplash / Cloudinary — small pause between items
            time.sleep(0.3)

        print()
        print(
            f"Done.  created={created}  skipped={skipped}  "
            f"no_owner={no_owner}  image_failures={image_failures}"
        )


if __name__ == "__main__":
    seed()
