import uuid

from app.database.supabase import get_supabase


BUCKET_NAME = "property-images"


def upload_property_image(
    file_bytes: bytes,
    filename: str,
    content_type: str,
) -> str:

    supabase = get_supabase()

    extension = ""

    if "." in filename:
        extension = "." + filename.rsplit(".", 1)[1].lower()

    file_path = (
        f"properties/{uuid.uuid4()}{extension}"
    )

    supabase.storage.from_(
        BUCKET_NAME
    ).upload(
        file_path,
        file_bytes,
        {
            "content-type": content_type,
            "upsert": "false",
        },
    )

    public_url = (
        supabase.storage
        .from_(BUCKET_NAME)
        .get_public_url(file_path)
    )

    return public_url
