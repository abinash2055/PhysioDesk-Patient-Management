from pydantic import BaseModel, EmailStr
from app.models.user import UserRole

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: UserRole

class CurrentUserResponse(BaseModel):
    id: int
    email: EmailStr
    role: UserRole