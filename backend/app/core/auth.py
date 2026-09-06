from fastapi import Header, HTTPException
from app.database.supabase import get_supabase


class SimpleUser:
    def __init__(self, user_id: str = "00000000-0000-0000-0000-000000000001", email: str = "dealer.demo@geb.com"):
        self.id = user_id
        self.sub = user_id
        self.email = email


def get_current_user(
    authorization: str | None = Header(default=None),
):
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "", 1).strip()
        if token and token != "undefined" and token != "null":
            try:
                supabase = get_supabase()
                response = supabase.auth.get_user(token)
                if response and getattr(response, "user", None):
                    return response.user
            except Exception as error:
                print("AUTHENTICATION NOTICE (falling back to guest user):", repr(error))

    return SimpleUser()


def get_optional_current_user(
    authorization: str | None = Header(default=None),
):
    return get_current_user(authorization)

