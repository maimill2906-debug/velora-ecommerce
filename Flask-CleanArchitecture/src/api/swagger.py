from apispec import APISpec
from apispec.ext.marshmallow import MarshmallowPlugin
from apispec_webframeworks.flask import FlaskPlugin
from api.schemas.auth import (
    LoginRequestSchema,
    LoginResponseSchema,
    RegisterRequestSchema,
    RegisterResponseSchema,
)

spec = APISpec(
    title="VELORA API",
    version="1.0.0",
    openapi_version="3.0.2",
    plugins=[FlaskPlugin(), MarshmallowPlugin()],
)

spec.components.schema("LoginRequest", schema=LoginRequestSchema)
spec.components.schema("LoginResponse", schema=LoginResponseSchema)
spec.components.schema("RegisterRequest", schema=RegisterRequestSchema)
spec.components.schema("RegisterResponse", schema=RegisterResponseSchema)
