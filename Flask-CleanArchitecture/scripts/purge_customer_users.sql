-- Xóa toàn bộ tài khoản user loại khách hàng (user_type = customer).
-- Giữ nguyên admin / sales / warehouse / marketing / …
-- Xử lý FK: product_reviews.user_id → NULL, order_status_history, addresses, customer_profiles rồi users.
-- user_roles tự CASCADE khi xóa user (theo migration).

BEGIN;

UPDATE public.product_reviews pr
SET user_id = NULL
FROM public.users u
WHERE pr.user_id = u.id AND u.user_type = 'customer';

DELETE FROM public.order_status_history h
USING public.users u
WHERE h.changed_by_user_id = u.id AND u.user_type = 'customer';

DELETE FROM public.addresses a
USING public.customer_profiles cp, public.users u
WHERE a.customer_id = cp.id AND cp.user_id = u.id AND u.user_type = 'customer';

DELETE FROM public.customer_profiles cp
USING public.users u
WHERE cp.user_id = u.id AND u.user_type = 'customer';

DELETE FROM public.users
WHERE user_type = 'customer';

COMMIT;
