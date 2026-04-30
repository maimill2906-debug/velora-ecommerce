from __future__ import annotations

import uuid

from infrastructure.models.catalog_models import (
    ProductImageModel,
    ProductModel,
    ProductReviewModel,
    ProductTagLinkModel,
    ProductTagModel,
    ProductVariantModel,
)
from infrastructure.repositories.catalog_repository import CatalogRepository


class CatalogService:
    def __init__(self, repo: CatalogRepository):
        self.repo = repo

    def list_categories(self):
        return self.repo.list_categories()

    def create_category(self, *, code: str, name: str, parent_id: str | None):
        pid = uuid.UUID(parent_id) if parent_id else None
        return self.repo.create_category(code=code, name=name, parent_id=pid)

    def list_products(self, *, limit: int = 50, offset: int = 0):
        return self.repo.list_products(limit=limit, offset=offset)

    def get_product_detail(self, product_id: str):
        pid = uuid.UUID(product_id)
        p = self.repo.get_product(pid)
        if not p:
            raise ValueError("product_not_found")
        variants = self.repo.list_variants(pid)
        images = self.repo.list_images(pid)
        tag_links = self.repo.list_product_tag_links(pid)
        tags = []
        for link in tag_links:
            t = self.repo.get_tag(link.tag_id)
            if t:
                tags.append(t)
        return p, variants, images, tags

    def create_product(self, payload: dict) -> ProductModel:
        product = ProductModel(
            sku=payload["sku"],
            name=payload["name"],
            description=payload.get("description"),
            material=payload.get("material"),
            care_instructions=payload.get("care_instructions"),
            category_id=uuid.UUID(payload["category_id"]) if payload.get("category_id") else None,
            style_segment=payload.get("style_segment"),
            original_price=payload.get("original_price"),
            rating_avg=payload.get("rating_avg"),
            review_count=payload.get("review_count", 0),
        )
        return self.repo.create_product(product)

    def add_variant(self, product_id: str, payload: dict) -> ProductVariantModel:
        pid = uuid.UUID(product_id)
        if not self.repo.get_product(pid):
            raise ValueError("product_not_found")
        variant = ProductVariantModel(
            product_id=pid,
            variant_sku=payload["variant_sku"],
            size=payload.get("size"),
            color=payload.get("color"),
            price=payload["price"],
        )
        return self.repo.create_variant(variant)

    # Images
    def list_images(self, product_id: str):
        pid = uuid.UUID(product_id)
        if not self.repo.get_product(pid):
            raise ValueError("product_not_found")
        return self.repo.list_images(pid)

    def add_image(self, product_id: str, payload: dict) -> ProductImageModel:
        pid = uuid.UUID(product_id)
        if not self.repo.get_product(pid):
            raise ValueError("product_not_found")
        url = payload.get("url")
        if not url:
            raise ValueError("url_required")
        sort_order = int(payload.get("sort_order", 0))
        return self.repo.add_image(ProductImageModel(product_id=pid, url=url, sort_order=sort_order))

    # Tags
    def list_tags(self, *, limit: int = 200, offset: int = 0):
        return self.repo.list_tags(limit=limit, offset=offset)

    def create_tag(self, payload: dict) -> ProductTagModel:
        code = payload.get("code")
        label = payload.get("label")
        if not code or not label:
            raise ValueError("code_and_label_required")
        if self.repo.get_tag_by_code(code):
            raise ValueError("tag_code_exists")
        return self.repo.create_tag(ProductTagModel(code=code, label=label))

    def assign_tag(self, product_id: str, tag_id: str) -> ProductTagLinkModel:
        pid = uuid.UUID(product_id)
        tid = uuid.UUID(tag_id)
        if not self.repo.get_product(pid):
            raise ValueError("product_not_found")
        if not self.repo.get_tag(tid):
            raise ValueError("tag_not_found")
        return self.repo.assign_tag(ProductTagLinkModel(product_id=pid, tag_id=tid))

    def unassign_tag(self, product_id: str, tag_id: str) -> int:
        pid = uuid.UUID(product_id)
        tid = uuid.UUID(tag_id)
        if not self.repo.get_product(pid):
            raise ValueError("product_not_found")
        return self.repo.unassign_tag(product_id=pid, tag_id=tid)

    # Reviews
    def list_reviews(self, product_id: str, *, limit: int = 50, offset: int = 0):
        pid = uuid.UUID(product_id)
        if not self.repo.get_product(pid):
            raise ValueError("product_not_found")
        return self.repo.list_reviews(pid, limit=limit, offset=offset)

    def create_review(self, *, product_id: str, user_id: str | None, payload: dict) -> ProductReviewModel:
        pid = uuid.UUID(product_id)
        p = self.repo.get_product(pid)
        if not p:
            raise ValueError("product_not_found")
        rating = payload.get("rating")
        if rating is None:
            raise ValueError("rating_required")
        rating = int(rating)
        if rating < 1 or rating > 5:
            raise ValueError("rating_out_of_range")
        uid = uuid.UUID(user_id) if user_id else None
        review = self.repo.create_review(
            ProductReviewModel(
                product_id=pid,
                user_id=uid,
                rating=rating,
                title=payload.get("title"),
                content=payload.get("content"),
            )
        )
        self.repo.update_product_rating_stats(p, rating)
        return review

