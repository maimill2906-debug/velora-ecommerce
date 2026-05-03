from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from infrastructure.models.catalog_models import (
    CategoryModel,
    ProductImageModel,
    ProductModel,
    ProductReviewModel,
    ProductTagLinkModel,
    ProductTagModel,
    ProductVariantModel,
)


class CatalogRepository:
    def __init__(self, session: Session):
        self.session = session

    # Categories
    def list_categories(self) -> list[CategoryModel]:
        return self.session.execute(select(CategoryModel).order_by(CategoryModel.name)).scalars().all()

    def create_category(self, *, code: str, name: str, parent_id: uuid.UUID | None) -> CategoryModel:
        cat = CategoryModel(code=code, name=name, parent_id=parent_id)
        self.session.add(cat)
        self.session.flush()
        return cat

    # Products
    def list_products(self, limit: int = 50, offset: int = 0) -> list[ProductModel]:
        return (
            self.session.execute(
                select(ProductModel)
                .options(joinedload(ProductModel.images), joinedload(ProductModel.variants))
                .order_by(ProductModel.created_at.desc())
                .limit(limit)
                .offset(offset)
            )
            .unique()
            .scalars()
            .all()
        )

    def get_product(self, product_id: uuid.UUID) -> ProductModel | None:
        return self.session.get(ProductModel, product_id)

    def get_product_at_position(self, one_based_index: int) -> ProductModel | None:
        """Demo: product_id số 1 = sản phẩm cũ nhất (theo created_at tăng dần)."""
        if one_based_index < 1:
            return None
        rows = (
            self.session.execute(
                select(ProductModel)
                .order_by(ProductModel.created_at.asc())
                .limit(one_based_index)
            )
            .scalars()
            .all()
        )
        return rows[one_based_index - 1] if len(rows) >= one_based_index else None

    def list_variants(self, product_id: uuid.UUID) -> list[ProductVariantModel]:
        return (
            self.session.execute(
                select(ProductVariantModel).where(ProductVariantModel.product_id == product_id)
            )
            .scalars()
            .all()
        )

    def create_product(self, product: ProductModel) -> ProductModel:
        self.session.add(product)
        self.session.flush()
        return product

    def create_variant(self, variant: ProductVariantModel) -> ProductVariantModel:
        self.session.add(variant)
        self.session.flush()
        return variant

    # Images
    def list_images(self, product_id: uuid.UUID) -> list[ProductImageModel]:
        return (
            self.session.execute(
                select(ProductImageModel)
                .where(ProductImageModel.product_id == product_id)
                .order_by(ProductImageModel.sort_order.asc())
            )
            .scalars()
            .all()
        )

    def add_image(self, img: ProductImageModel) -> ProductImageModel:
        self.session.add(img)
        self.session.flush()
        return img

    # Tags
    def list_tags(self, limit: int = 200, offset: int = 0) -> list[ProductTagModel]:
        return (
            self.session.execute(
                select(ProductTagModel).order_by(ProductTagModel.code).limit(limit).offset(offset)
            )
            .scalars()
            .all()
        )

    def get_tag(self, tag_id: uuid.UUID) -> ProductTagModel | None:
        return self.session.get(ProductTagModel, tag_id)

    def get_tag_by_code(self, code: str) -> ProductTagModel | None:
        return self.session.execute(
            select(ProductTagModel).where(ProductTagModel.code == code)
        ).scalar_one_or_none()

    def create_tag(self, tag: ProductTagModel) -> ProductTagModel:
        self.session.add(tag)
        self.session.flush()
        return tag

    def list_product_tag_links(self, product_id: uuid.UUID) -> list[ProductTagLinkModel]:
        return (
            self.session.execute(
                select(ProductTagLinkModel).where(ProductTagLinkModel.product_id == product_id)
            )
            .scalars()
            .all()
        )

    def assign_tag(self, link: ProductTagLinkModel) -> ProductTagLinkModel:
        self.session.add(link)
        self.session.flush()
        return link

    def unassign_tag(self, *, product_id: uuid.UUID, tag_id: uuid.UUID) -> int:
        link = self.session.execute(
            select(ProductTagLinkModel)
            .where(ProductTagLinkModel.product_id == product_id)
            .where(ProductTagLinkModel.tag_id == tag_id)
        ).scalar_one_or_none()
        if not link:
            return 0
        self.session.delete(link)
        return 1

    # Reviews
    def list_reviews(self, product_id: uuid.UUID, limit: int = 50, offset: int = 0) -> list[ProductReviewModel]:
        return (
            self.session.execute(
                select(ProductReviewModel)
                .where(ProductReviewModel.product_id == product_id)
                .order_by(ProductReviewModel.id.desc())
                .limit(limit)
                .offset(offset)
            )
            .scalars()
            .all()
        )

    def create_review(self, r: ProductReviewModel) -> ProductReviewModel:
        self.session.add(r)
        self.session.flush()
        return r

    def update_product_rating_stats(self, product: ProductModel, rating: int) -> ProductModel:
        count = int(product.review_count or 0)
        avg = float(product.rating_avg or 0.0)
        new_count = count + 1
        new_avg = (avg * count + float(rating)) / new_count if new_count > 0 else float(rating)
        product.review_count = new_count
        product.rating_avg = new_avg
        self.session.add(product)
        self.session.flush()
        return product

