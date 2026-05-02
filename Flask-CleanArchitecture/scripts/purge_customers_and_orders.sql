-- Xóa toàn bộ đơn hàng và dữ liệu khách hàng (profile, địa chỉ, wishlist, prefs thông báo).
-- Không xóa: users (tài khoản đăng nhập), catalog, tồn kho, RBAC.
-- Thứ tự: orders (CASCADE order_items, payments, order_status_history) → addresses → customer_profiles (CASCADE wishlist_items, notification_preferences).

BEGIN;

DELETE FROM public.orders;
DELETE FROM public.addresses;
DELETE FROM public.customer_profiles;

COMMIT;
