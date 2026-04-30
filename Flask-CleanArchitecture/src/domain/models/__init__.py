"""
Domain models will be defined here after analysis.

Current state: mock/demo models were removed to prepare for real schema design.
"""

from .enums import (  # noqa: F401
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
    UserStatus,
    UserType,
)
from .rbac import Function, Role, RoleFunction, User, UserRole  # noqa: F401
from .catalog import (  # noqa: F401
    Category,
    Product,
    ProductImage,
    ProductVariant,
    ProductTag,
    ProductTagLink,
    ProductReview,
)
from .channels import SalesChannel, ChannelSyncState  # noqa: F401
from .orders import Address, Order, OrderItem, Payment  # noqa: F401
from .promotions import Voucher  # noqa: F401
from .inventory import InventoryLocation, StockItem, StockTransaction, StockTxnType  # noqa: F401
from .customers import CustomerProfile, WishlistItem, NotificationPreference, Gender  # noqa: F401
from .marketing import (  # noqa: F401
    MarketingCampaign,
    MarketingCampaignStatus,
    MarketingChannel,
    CampaignMetricSnapshot,
    SocialPost,
)