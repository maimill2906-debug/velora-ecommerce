from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload

from infrastructure.models.orders_models import (
    AddressModel,
    OrderItemModel,
    OrderModel,
    OrderStatusHistoryModel,
    PaymentModel,
)


class OrdersRepository:
    def __init__(self, session: Session):
        self.session = session

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

    def get_payment_for_order(self, order_id: uuid.UUID) -> PaymentModel | None:
        return (
            self.session.execute(
                select(PaymentModel)
                .where(PaymentModel.order_id == order_id)
                .order_by(PaymentModel.created_at.desc())
                .limit(1)
            )
            .scalar_one_or_none()
        )

    def update_payment_status(
        self,
        payment: PaymentModel,
        *,
        status: str,
        method: str | None = None,
    ) -> PaymentModel:
        from domain.models.enums import PaymentMethod, PaymentStatus
        payment.status = PaymentStatus(status)
        if method:
            payment.method = PaymentMethod(method)
        if PaymentStatus(status) == PaymentStatus.paid:
            payment.paid_at = datetime.now(timezone.utc)
        self.session.flush()
        return payment

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
                .options(joinedload(OrderModel.items))
                .order_by(OrderModel.created_at.desc())
                .limit(limit)
                .offset(offset)
            )
            .unique()
            .scalars()
            .all()
        )

    def list_expired_pending_payment_orders(self, minutes: int = 15) -> list[OrderModel]:
        """Đơn hàng đã đặt, chưa thanh toán, quá `minutes` phút kể từ placed_at."""
        from domain.models.enums import OrderStatus, PaymentStatus
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=minutes)
        return (
            self.session.execute(
                select(OrderModel)
                .join(PaymentModel, PaymentModel.order_id == OrderModel.id)
                .where(
                    OrderModel.status == OrderStatus.placed,
                    PaymentModel.status == PaymentStatus.pending,
                    OrderModel.placed_at < cutoff,
                )
                .options(joinedload(OrderModel.items))
            )
            .unique()
            .scalars()
            .all()
        )

    # status history
    def add_status_history(
        self,
        *,
        order_id: uuid.UUID,
        status: str,
        note: str | None = None,
        changed_by_user_id: uuid.UUID | None = None,
    ) -> OrderStatusHistoryModel:
        row = OrderStatusHistoryModel(
            order_id=order_id,
            status=status,
            note=note,
            changed_by_user_id=changed_by_user_id,
        )
        self.session.add(row)
        self.session.flush()
        return row

    def list_status_history(self, order_id: uuid.UUID) -> list[OrderStatusHistoryModel]:
        return (
            self.session.execute(
                select(OrderStatusHistoryModel)
                .where(OrderStatusHistoryModel.order_id == order_id)
                .order_by(OrderStatusHistoryModel.created_at.asc())
            )
            .scalars()
            .all()
        )

