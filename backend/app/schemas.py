from pydantic import BaseModel, Field


class LeadCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    phone: str = Field(min_length=10, max_length=32)
    message: str = Field(default="", max_length=4000)


class LoginRequest(BaseModel):
    password: str = Field(min_length=1, max_length=200)


class SettingsUpdate(BaseModel):
    ai_assistant_enabled: bool


class StatusUpdate(BaseModel):
    status: str = Field(pattern="^(new|in_progress|done|archived)$")
