import re
import supabase._sync.client as _supabase_client
from supabase import Client, create_client

from app.core.config import settings

# Support Supabase new key formats (sb_secret_*, sb_publishable_*) in supabase-py regex validation
_orig_match = re.match

def _patched_match(pattern, string, flags=0):
    if isinstance(string, str) and string.startswith("sb_"):
        return True
    return _orig_match(pattern, string, flags)

_supabase_client.re.match = _patched_match


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

