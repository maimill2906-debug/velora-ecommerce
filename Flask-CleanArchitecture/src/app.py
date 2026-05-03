import os
import threading
import time
from flask import Flask, jsonify, send_file
# from api.routes import register_routes
from api.swagger import spec
from api.middleware import middleware
from api.responses import success_response
from infrastructure.databases import init_db
from config import Config
from flasgger import Swagger
from config import SwaggerConfig
from flask_swagger_ui import get_swaggerui_blueprint
from flask_cors import CORS
from api.routes import register_routes


def create_app():
    app = Flask(__name__)
    Swagger(app)
    CORS(app)
    # NOTE: Mock modules were removed. We'll register real blueprints after
    # domain analysis and schema design.
    # register_routes(app)
     # Thêm Swagger UI blueprint
    SWAGGER_URL = '/docs'
    API_URL = '/swagger.json'
    swaggerui_blueprint = get_swaggerui_blueprint(
        SWAGGER_URL,
        API_URL,
        config={'app_name': "Todo API"}
    )
    app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)

    try:
        init_db(app)
    except Exception as e:
        print(f"Error initializing database: {e}")

    # Seed dữ liệu mặc định (idempotent)
    try:
        with app.app_context():
            from infrastructure.databases.session import session_scope
            from infrastructure.seeds.inventory_locations_seed import seed_inventory_locations
            with session_scope() as session:
                seed_inventory_locations(session)
    except Exception as e:
        print(f"[seed] Lỗi seed inventory locations: {e}")

    register_routes(app)

    # Register middleware
    middleware(app)

    # Register routes
    with app.test_request_context():
        for rule in app.url_map.iter_rules():
            # Thêm các endpoint khác nếu cần
            if rule.endpoint.startswith(('todo.', 'course.', 'user.', 'auth.', 'health.', 'admin_rbac.', 'catalog.', 'orders.', 'customers.', 'inventory.', 'marketing.')):
                view_func = app.view_functions[rule.endpoint]
                print(f"Adding path: {rule.rule} -> {view_func}")
                spec.path(view=view_func)
            
    @app.route("/swagger.json")
    def swagger_json():
        return jsonify(spec.to_dict())

    @app.get("/health")
    def health():
        return jsonify({"status": "ok"}), 200

    @app.get("/momo/fake")
    def momo_fake():
        html_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "momo_fake.html")
        return send_file(html_path)

    _start_auto_cancel_worker(app)

    return app


def _start_auto_cancel_worker(app: Flask) -> None:
    """Background thread: cứ 60 giây quét và hủy đơn pending payment quá 15 phút."""
    def worker():
        time.sleep(30)  # chờ server khởi động xong
        while True:
            try:
                with app.app_context():
                    from infrastructure.databases.session import session_scope
                    from infrastructure.repositories.orders_repository import OrdersRepository
                    from infrastructure.repositories.rbac_repository import RbacRepository
                    from infrastructure.repositories.inventory_repository import InventoryRepository
                    from services.orders_service import OrdersService
                    with session_scope() as session:
                        svc = OrdersService(
                            OrdersRepository(session),
                            RbacRepository(session),
                            inventory_repo=InventoryRepository(session),
                        )
                        count = svc.cancel_expired_pending_orders(minutes=15)
                        if count:
                            print(f"[auto-cancel] Đã hủy {count} đơn quá hạn thanh toán")
            except Exception as e:
                print(f"[auto-cancel] Lỗi: {e}")
            time.sleep(60)

    t = threading.Thread(target=worker, daemon=True)
    t.start()
# Run the application

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=9999, debug=True, use_reloader=False)