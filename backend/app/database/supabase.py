from supabase import Client, create_client

from app.core.config import settings


def get_supabase() -> Client:
    if not settings.supabase_url:
        raise RuntimeError(
            "SUPABASE_URL is missing from backend/.env"
        )

    if not settings.supabase_service_role_key:
        raise RuntimeError(
            "SUPABASE_SERVICE_ROLE_KEY is missing from backend/.env"
        )

    return create_client(
        settings.supabase_url,
        settings.supabase_service_role_key,
    )
