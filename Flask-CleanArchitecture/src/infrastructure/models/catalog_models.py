from __future__ import annotations

import uuid

from sqlalchemy import (
    Boolean,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from infrastructure.databases.base import Base

from ._base import TimestampMixin, UUIDPrimaryKeyMixin


class CategoryModel(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "categories"

    code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    parent_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("categories.id"))


class ProductModel(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "products"

    sku: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    material: Mapped[str | None] = mapped_column(Text)
    care_instructions: Mapped[str | None] = mapped_column(Text)

    category_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("categories.id"))

    # "nam" / "nu" used in UI
    style_segment: Mapped[str | None] = mapped_column(String(30))

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")

    original_price: Mapped[int | None] = mapped_column(Integer)
    rating_avg: Mapped[float | None] = mapped_column(Float)
    review_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")

    images: Mapped[list["ProductImageModel"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )
    variants: Mapped[list["ProductVariantModel"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )
    tag_links: Mapped[list["ProductTagLinkModel"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )
    reviews: Mapped[list["ProductReviewModel"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )


class ProductImageModel(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "product_images"
    __table_args__ = (
        UniqueConstraint("product_id", "sort_order", name="uq_product_images_product_id_sort_order"),
    )

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    url: Mapped[str] = mapped_column(Text, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")

    product: Mapped["ProductModel"] = relationship(back_populates="images")


class ProductVariantModel(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "product_variants"
    __table_args__ = (
        UniqueConstraint("variant_sku", name="uq_product_variants_variant_sku"),
    )

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    variant_sku: Mapped[str] = mapped_column(String(64), nullable=False)
    size: Mapped[str | None] = mapped_column(String(20))
    color: Mapped[str | None] = mapped_column(String(50))
    price: Mapped[int] = mapped_column(Integer, nullable=False)

    product: Mapped["ProductModel"] = relationship(back_populates="variants")


class ProductTagModel(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "product_tags"

    code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    label: Mapped[str] = mapped_column(String(255), nullable=False)


class ProductTagLinkModel(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "product_tag_links"
    __table_args__ = (
        UniqueConstraint("product_id", "tag_id", name="uq_product_tag_links_product_id_tag_id"),
    )

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    tag_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("product_tags.id", ondelete="CASCADE"), nullable=False
    )

    product: Mapped["ProductModel"] = relationship(back_populates="tag_links")


class ProductReviewModel(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "product_reviews"

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str | None] = mapped_column(String(255))
    content: Mapped[str | None] = mapped_column(Text)

    product: Mapped["ProductModel"] = relationship(back_populates="reviews")

