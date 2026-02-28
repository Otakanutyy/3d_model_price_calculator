import uuid

from sqlalchemy import String, Float, Boolean, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class CalcParams(Base):
    __tablename__ = "calc_params"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False, unique=True
    )

    # Technology
    technology: Mapped[str] = mapped_column(String(50), default="FDM")

    # Material
    material_density: Mapped[float] = mapped_column(Float, default=1.24)  # g/cm³
    material_price: Mapped[float] = mapped_column(Float, default=25.0)  # per kg
    waste_factor: Mapped[float] = mapped_column(Float, default=1.1)  # 1.1 = 10% waste

    # Print parameters
    infill: Mapped[float] = mapped_column(Float, default=20.0)  # %
    support_percent: Mapped[float] = mapped_column(Float, default=10.0)  # %
    print_time_h: Mapped[float] = mapped_column(Float, default=1.0)
    post_process_time_h: Mapped[float] = mapped_column(Float, default=0.5)
    modeling_time_h: Mapped[float] = mapped_column(Float, default=0.0)

    # Economics
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    is_batch: Mapped[bool] = mapped_column(Boolean, default=False)
    markup: Mapped[float] = mapped_column(Float, default=1.5)  # multiplier
    reject_rate: Mapped[float] = mapped_column(Float, default=0.05)  # 5%
    tax_rate: Mapped[float] = mapped_column(Float, default=0.20)  # 20%
    depreciation_rate: Mapped[float] = mapped_column(Float, default=2.0)  # per hour
    energy_rate: Mapped[float] = mapped_column(Float, default=0.15)  # per hour
    hourly_rate: Mapped[float] = mapped_column(Float, default=30.0)  # labor cost per hour

    # Display
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    language: Mapped[str] = mapped_column(String(10), default="en")

    project: Mapped["Project"] = relationship("Project", back_populates="calc_params")

    def __repr__(self) -> str:
        return f"<CalcParams project={self.project_id}>"


from app.models.project import Project  # noqa: E402, F401
