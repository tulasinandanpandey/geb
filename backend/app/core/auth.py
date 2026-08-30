from fastapi import Header, HTTPException
from app.database.supabase import get_supabase


def get_current_user(
    authorization: str | None = Header(default=None),
):
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authentication required.",
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header.",
        )

    token = authorization.replace(
        "Bearer ",
        "",
        1,
    ).strip()

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Authentication token is missing.",
        )

    try:
        supabase = get_supabase()

        response = supabase.auth.get_user(token)

        user = response.user

        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired authentication token.",
            )

        return user

    except HTTPException:
        raise

    except Exception as error:
        print(
            "AUTHENTICATION ERROR:",
            repr(error),
        )

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token.",
        )
