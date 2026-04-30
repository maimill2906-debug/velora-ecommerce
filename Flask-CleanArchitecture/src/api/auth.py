from __future__ import annotations

from functools import wraps
from typing import Callable, TypeVar

from flask import g, request

from infrastructure.databases.session import session_scope
from infrastructure.repositories.rbac_repository import RbacRepository
from services.auth_service import AuthService

F = TypeVar("F", bound=Callable[..., object])


def get_bearer_token() -> str | None:
    auth = request.headers.get("Authorization") or ""
    if not auth.startswith("Bearer "):
        return None
    return auth.removeprefix("Bearer ").strip() or None


def require_auth(fn: F) -> F:
    @wraps(fn)
    def wrapper(*args, **kwargs):
        token = get_bearer_token()
        if not token:
            return {"message": "missing_token"}, 401
        try:
            user_id = AuthService.decode_jwt(token)
        except Exception:
            return {"message": "invalid_token"}, 401
        g.user_id = user_id
        return fn(*args, **kwargs)

    return wrapper  # type: ignore[return-value]


def require_function(function_code: str):
    def decorator(fn: F) -> F:
        @wraps(fn)
        def wrapper(*args, **kwargs):
            if not getattr(g, "user_id", None):
                # allow stacking even if require_auth wasn't added
                token = get_bearer_token()
                if not token:
                    return {"message": "missing_token"}, 401
                try:
                    g.user_id = AuthService.decode_jwt(token)
                except Exception:
                    return {"message": "invalid_token"}, 401

            with session_scope() as session:
                ok = RbacRepository(session).user_has_function(g.user_id, function_code)
            if not ok:
                return {"message": "forbidden"}, 403
            return fn(*args, **kwargs)

        return wrapper  # type: ignore[return-value]

    return decorator

