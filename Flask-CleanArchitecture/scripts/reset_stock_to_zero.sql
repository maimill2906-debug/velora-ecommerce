-- Đặt tồn kho tất cả variant tại mọi kho về 0 (on-hand + reserved).
-- Lịch sử giao dịch (stock_transactions) không bị xóa — chỉ số tồn hiện tại.
UPDATE public.stock_items
SET qty_on_hand = 0,
    qty_reserved = 0;
