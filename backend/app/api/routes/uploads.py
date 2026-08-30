from fastapi import (
    APIRouter,
    UploadFile,
    File,
    HTTPException,
)

from app.services.storage.storage_service import (
    upload_property_image,
)


router = APIRouter(
    prefix="/api/uploads",
    tags=["Uploads"],
)


ALLOWED_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}


MAX_FILE_SIZE = 5 * 1024 * 1024


@router.post("/property-image")
async def upload_property_image_endpoint(
    file: UploadFile = File(...),
):

    if file.content_type not in ALLOWED_TYPES:

        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG and WEBP images are allowed.",
        )


    file_bytes = await file.read()


    if len(file_bytes) > MAX_FILE_SIZE:

        raise HTTPException(
            status_code=400,
            detail="Image must be smaller than 5 MB.",
        )


    try:

        image_url = upload_property_image(
            file_bytes=file_bytes,
            filename=file.filename or "property-image",
            content_type=file.content_type,
        )


        return {
            "success": True,
            "url": image_url,
        }


    except Exception as error:

        print(
            "IMAGE UPLOAD ERROR:",
            repr(error),
        )


        raise HTTPException(
            status_code=500,
            detail="Unable to upload property image.",
        )
