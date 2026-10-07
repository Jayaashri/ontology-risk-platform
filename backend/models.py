from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)

    filename = Column(String, nullable=False)

    provider = Column(
        String,
        nullable=False,
        default="mock"
    )

    ttl = Column(Text)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    risks = relationship(
        "Risk",
        back_populates="analysis",
        cascade="all, delete-orphan"
    )


class Risk(Base):
    __tablename__ = "risks"

    id = Column(Integer, primary_key=True, index=True)

    analysis_id = Column(
        Integer,
        ForeignKey("analyses.id"),
        nullable=False
    )

    risk_type = Column(String)

    risk_identifier = Column(String)

    description = Column(Text)

    severity = Column(Float)

    analysis = relationship(
        "Analysis",
        back_populates="risks"
    )