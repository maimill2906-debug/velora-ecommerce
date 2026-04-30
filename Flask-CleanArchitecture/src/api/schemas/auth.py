from marshmallow import Schema, fields
from marshmallow.validate import Length

class RegisterRequestSchema(Schema):
    full_name = fields.Str(required=True, validate=Length(min=1, max=255))
    email = fields.Email(required=False, allow_none=True)
    phone = fields.Str(required=False, allow_none=True, validate=Length(min=8, max=30))
    password = fields.Str(required=True, load_only=True, validate=Length(min=6, max=128))


class RegisterResponseSchema(Schema):
    id = fields.Str(required=True)
    full_name = fields.Str(required=True)
    email = fields.Email(required=False, allow_none=True)
    phone = fields.Str(required=False, allow_none=True)


class LoginRequestSchema(Schema):
    identifier = fields.Str(required=True)  # email or phone
    password = fields.Str(required=True, load_only=True)


class LoginResponseSchema(Schema):
    token = fields.Str(required=True)
    user_type = fields.Str(required=False)


class ChangePasswordRequestSchema(Schema):
    current_password = fields.Str(required=True, load_only=True, validate=Length(min=1, max=128))
    new_password = fields.Str(required=True, load_only=True, validate=Length(min=6, max=128))