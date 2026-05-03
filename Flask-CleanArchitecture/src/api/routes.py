from api.controllers.auth_controller import bp as auth_bp
from api.controllers.admin_rbac_controller import bp as admin_rbac_bp
from api.controllers.admin_users_controller import bp as admin_users_bp
from api.controllers.catalog_controller import bp as catalog_bp
from api.controllers.customers_controller import bp as customers_bp
from api.controllers.inventory_controller import bp as inventory_bp
from api.controllers.marketing_controller import bp as marketing_bp
from api.controllers.orders_controller import bp as orders_bp
from api.controllers.reports_controller import bp as reports_bp
from api.controllers.shopee_webhook_controller import bp as shopee_webhook_bp
from api.controllers.page_controller import bp as page_bp


def register_routes(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_rbac_bp)
    app.register_blueprint(admin_users_bp)
    app.register_blueprint(catalog_bp)
    app.register_blueprint(customers_bp)
    app.register_blueprint(inventory_bp)
    app.register_blueprint(marketing_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(shopee_webhook_bp)
    app.register_blueprint(page_bp)