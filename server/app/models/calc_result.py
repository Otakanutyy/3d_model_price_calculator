import uuid
from datetime import datetime

from sqlalchemy import Float, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class CalcResult(Base):
    __tablename__ = "calc_results"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False, unique=True
    )

    weight: Mapped[float] = mapped_column(Float, default=0.0)
    material_cost: Mapped[float] = mapped_column(Float, default=0.0)
    energy_cost: Mapped[float] = mapped_column(Float, default=0.0)
    depreciation: Mapped[float] = mapped_column(Float, default=0.0)
    prep_cost: Mapped[float] = mapped_column(Float, default=0.0)
    reject_cost: Mapped[float] = mapped_column(Float, default=0.0)
    unit_cost: Mapped[float] = mapped_column(Float, default=0.0)
    profit: Mapped[float] = mapped_column(Float, default=0.0)
    tax: Mapped[float] = mapped_column(Float, default=0.0)
    price_per_unit: Mapped[float] = mapped_column(Float, default=0.0)
    total_price: Mapped[float] = mapped_column(Float, default=0.0)

    calculated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    project: Mapped["Project"] = relationship("Project", back_populates="calc_result")

    def __repr__(self) -> str:
        return f"<CalcResult project={self.project_id} total={self.total_price}>"


from app.models.project import Project  # noqa: E402, F401
