import uuid
from datetime import datetime

from sqlalchemy import String, Float, Integer, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Model(Base):
    __tablename__ = "models"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False, unique=True
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    original_name: Mapped[str] = mapped_column(String(255), nullable=False)
    format: Mapped[str] = mapped_column(String(10), nullable=False)  # stl, obj, 3mf
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="queued"
    )  # queued, processing, done, error
    dim_x: Mapped[float | None] = mapped_column(Float, nullable=True)
    dim_y: Mapped[float | None] = mapped_column(Float, nullable=True)
    dim_z: Mapped[float | None] = mapped_column(Float, nullable=True)
    volume: Mapped[float | None] = mapped_column(Float, nullable=True)
    polygons: Mapped[int | None] = mapped_column(Integer, nullable=True)
    error_message: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    project: Mapped["Project"] = relationship("Project", back_populates="model")

    def __repr__(self) -> str:
        return f"<Model {self.original_name} [{self.status}]>"


from app.models.project import Project  # noqa: E402, F401
