import uuid
from datetime import datetime

from sqlalchemy import String, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    client: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contact: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship("User", back_populates="projects")
    model: Mapped["Model | None"] = relationship(
        "Model", back_populates="project", uselist=False, cascade="all, delete-orphan"
    )
    calc_params: Mapped["CalcParams | None"] = relationship(
        "CalcParams", back_populates="project", uselist=False, cascade="all, delete-orphan"
    )
    calc_result: Mapped["CalcResult | None"] = relationship(
        "CalcResult", back_populates="project", uselist=False, cascade="all, delete-orphan"
    )
    ai_text: Mapped["AiText | None"] = relationship(
        "AiText", back_populates="project", uselist=False, cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Project {self.name}>"


from app.models.user import User  # noqa: E402, F401
from app.models.model3d import Model  # noqa: E402, F401
from app.models.calc_params import CalcParams  # noqa: E402, F401
from app.models.calc_result import CalcResult  # noqa: E402, F401
from app.models.ai_text import AiText  # noqa: E402, F401
