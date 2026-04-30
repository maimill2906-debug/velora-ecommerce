from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload

from infrastructure.models.customers_models import CustomerProfileModel
from infrastructure.models.orders_models import AddressModel, OrderItemModel, OrderModel, PaymentModel


class OrdersRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_or_create_customer_profile(self, *, user_id: uuid.UUID, full_name: str) -> CustomerProfileModel:
        existing = self.session.execute(
            select(CustomerProfileModel).where(CustomerProfileModel.user_id == user_id)
        ).scalar_one_or_none()
        if existing:
            return existing
        profile = CustomerProfileModel(user_id=user_id, full_name=full_name)
        self.session.add(profile)
        self.session.flush()
        return profile

    def create_address(self, addr: AddressModel) -> AddressModel:
        self.session.add(addr)
        self.session.flush()
        return addr

    def create_order(self, order: OrderModel) -> OrderModel:
        self.session.add(order)
        self.session.flush()
        return order

    def add_order_item(self, item: OrderItemModel) -> OrderItemModel:
        self.session.add(item)
        self.session.flush()
        return item

    def create_payment(self, p: PaymentModel) -> PaymentModel:
        self.session.add(p)
        self.session.flush()
        return p

    def get_address(self, address_id: uuid.UUID) -> AddressModel | None:
        return self.session.get(AddressModel, address_id)

    def get_order(self, order_id: uuid.UUID) -> OrderModel | None:
        return self.session.get(OrderModel, order_id)

    def update_order(self, order: OrderModel) -> OrderModel:
        self.session.add(order)
        self.session.flush()
        return order

    def get_order_with_details(self, order_id: uuid.UUID) -> OrderModel | None:
        return (
            self.session.execute(
                select(OrderModel)
                .where(OrderModel.id == order_id)
                .options(joinedload(OrderModel.items), joinedload(OrderModel.payments))
            )
            .unique()
            .scalar_one_or_none()
        )

    def get_order_by_code_with_details(self, code: str) -> OrderModel | None:
        return (
            self.session.execute(
                select(OrderModel)
                .where(OrderModel.code == code)
                .options(joinedload(OrderModel.items), joinedload(OrderModel.payments))
            )
            .unique()
            .scalar_one_or_none()
        )

    def list_orders_for_customer(self, customer_id: uuid.UUID, limit: int = 50, offset: int = 0) -> list[OrderModel]:
        return (
            self.session.execute(
                select(OrderModel)
                .where(OrderModel.customer_id == customer_id)
                .order_by(OrderModel.created_at.desc())
                .limit(limit)
                .offset(offset)
            )
            .scalars()
            .all()
        )

    def list_orders(self, limit: int = 50, offset: int = 0) -> list[OrderModel]:
        return (
            self.session.execute(
                select(OrderModel)
                .order_by(OrderModel.created_at.desc())
                .limit(limit)
                .offset(offset)
            )
            .scalars()
            .all()
        )

