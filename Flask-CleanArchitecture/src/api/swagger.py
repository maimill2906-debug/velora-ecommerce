from apispec import APISpec
from apispec.ext.marshmallow import MarshmallowPlugin
from apispec_webframeworks.flask import FlaskPlugin
from api.schemas.auth import (
    LoginRequestSchema,
    LoginResponseSchema,
    RegisterRequestSchema,
    RegisterResponseSchema,
)
from api.schemas.todo import TodoRequestSchema, TodoResponseSchema

spec = APISpec(
    title="Todo API",
    version="1.0.0",
    openapi_version="3.0.2",
    plugins=[FlaskPlugin(), MarshmallowPlugin()],
)

# Đăng ký schema để tự động sinh model
spec.components.schema("TodoRequest", schema=TodoRequestSchema)
spec.components.schema("TodoResponse", schema=TodoResponseSchema)
spec.components.schema("LoginRequest", schema=LoginRequestSchema)
spec.components.schema("LoginResponse", schema=LoginResponseSchema)
spec.components.schema("RegisterRequest", schema=RegisterRequestSchema)
spec.components.schema("RegisterResponse", schema=RegisterResponseSchema)