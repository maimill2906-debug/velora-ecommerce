"""
SQLAlchemy ORM model registry.

Alembic's `env.py` imports `infrastructure.models` to register all models
into `Base.metadata` for autogenerate.
"""

from .rbac_models import FunctionModel, RoleFunctionModel, RoleModel, UserModel, UserRoleModel
from .customers_models import CustomerProfileModel, NotificationPreferenceModel, WishlistItemModel
from .catalog_models import (
    CategoryModel,
    ProductImageModel,
    ProductModel,
    ProductReviewModel,
    ProductTagLinkModel,
    ProductTagModel,
    ProductVariantModel,
)
from .inventory_models import InventoryLocationModel, StockItemModel, StockTransactionModel
from .channels_models import ChannelSyncStateModel, SalesChannelModel
from .marketing_models import MarketingCampaignModel, VoucherModel
from .orders_models import AddressModel, OrderItemModel, OrderModel, PaymentModel

__all__ = [
    "FunctionModel",
    "RoleModel",
    "UserModel",
    "UserRoleModel",
    "RoleFunctionModel",
    "CustomerProfileModel",
    "WishlistItemModel",
    "NotificationPreferenceModel",
    "CategoryModel",
    "ProductModel",
    "ProductImageModel",
    "ProductVariantModel",
    "ProductTagModel",
    "ProductTagLinkModel",
    "ProductReviewModel",
    "InventoryLocationModel",
    "StockItemModel",
    "StockTransactionModel",
    "SalesChannelModel",
    "ChannelSyncStateModel",
    "VoucherModel",
    "MarketingCampaignModel",
    "AddressModel",
    "OrderModel",
    "OrderItemModel",
    "PaymentModel",
]

 