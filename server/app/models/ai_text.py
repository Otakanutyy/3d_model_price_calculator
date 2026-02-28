import uuid
from datetime import datetime

from sqlalchemy import Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class AiText(Base):
    __tablename__ = "ai_texts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False, unique=True
    )
    # Legacy single-language fields (kept for backward compat)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    commercial_text: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Bilingual fields
    description_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    description_ru: Mapped[str | None] = mapped_column(Text, nullable=True)
    commercial_text_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    commercial_text_ru: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    project: Mapped["Project"] = relationship("Project", back_populates="ai_text")

    def __repr__(self) -> str:
        return f"<AiText project={self.project_id}>"


from app.models.project import Project  # noqa: E402, F401
