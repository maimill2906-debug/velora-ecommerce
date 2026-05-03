# Constants

# Define any constants used throughout the application here. 
# For example, you might define API version, error messages, or configuration keys.

API_VERSION = "v1"
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100

# Add more constants as needed for your application.


class FunctionCodes:
    # RBAC / Admin
    RBAC_MANAGE = "RBAC_MANAGE"

    # Catalog
    CATALOG_CATEGORY_CREATE = "CATALOG_CATEGORY_CREATE"
    CATALOG_PRODUCT_CREATE = "CATALOG_PRODUCT_CREATE"
    CATALOG_VARIANT_CREATE = "CATALOG_VARIANT_CREATE"
    CATALOG_IMAGE_ADD = "CATALOG_IMAGE_ADD"
    CATALOG_TAG_CREATE = "CATALOG_TAG_CREATE"
    CATALOG_TAG_ASSIGN = "CATALOG_TAG_ASSIGN"

    # Orders
    ORDER_CREATE = "ORDER_CREATE"
    ORDER_READ = "ORDER_READ"
    ORDER_UPDATE_STATUS = "ORDER_UPDATE_STATUS"

    # Customers
    CUSTOMER_READ = "CUSTOMER_READ"
    CUSTOMER_UPDATE = "CUSTOMER_UPDATE"

    # Inventory / Warehouse
    INVENTORY_READ = "INVENTORY_READ"
    INVENTORY_WRITE = "INVENTORY_WRITE"

    # Marketing
    MARKETING_READ = "MARKETING_READ"
    MARKETING_WRITE = "MARKETING_WRITE"

    # Sale: granular order management
    ORDER_VIEW_ALL = "order.view_all"
    ORDER_CONFIRM = "order.confirm"
    ORDER_PACK = "order.pack"
    ORDER_CANCEL = "order.cancel"
    ORDER_CREATE_ONLINE = "order.create_online"

    # Sale: page / chat management
    PAGE_VIEW_MESSAGES = "page.view_messages"
    PAGE_REPLY_MESSAGES = "page.reply_messages"
    PAGE_CREATE_ORDER = "page.create_order"