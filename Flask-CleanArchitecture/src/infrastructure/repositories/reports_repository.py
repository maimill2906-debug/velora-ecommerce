from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.orm import Session


class ReportsRepository:
    def __init__(self, session: Session):
        self.session = session

    def monthly_revenue_by_channel(self, *, months_back: int = 6) -> list[dict]:
        """Rows: ym (YYYY-MM), channel, revenue, order_count — chỉ tính đơn đã giao (delivered)."""
        sql = text(
            """
            SELECT
              to_char(
                date_trunc('month', timezone('UTC', COALESCE(o.placed_at, o.created_at))),
                'YYYY-MM'
              ) AS ym,
              CASE
                WHEN sc.channel IS NOT NULL THEN sc.channel::text
                WHEN o.code ~ '^SP[0-9]{8,}$' THEN 'shopee'
                ELSE 'unassigned'
              END AS channel,
              SUM(o.total_amount)::bigint AS revenue,
              COUNT(*)::int AS order_count
            FROM orders o
            LEFT JOIN sales_channels sc ON sc.id = o.sales_channel_id
            WHERE COALESCE(o.placed_at, o.created_at) IS NOT NULL
              AND o.status = 'delivered'
              AND timezone('UTC', COALESCE(o.placed_at, o.created_at))
                  >= date_trunc('month', timezone('UTC', NOW()))
                     - (CAST(:months AS varchar) || ' months')::interval
            GROUP BY 1, 2
            ORDER BY 1, 2
            """
        )
        rows = self.session.execute(sql, {"months": str(int(months_back))}).mappings().all()
        return [dict(r) for r in rows]

    def channel_totals_all_time(self) -> list[dict]:
        """Chỉ tính đơn đã giao (delivered)."""
        sql = text(
            """
            SELECT
              CASE
                WHEN sc.channel IS NOT NULL THEN sc.channel::text
                WHEN o.code ~ '^SP[0-9]{8,}$' THEN 'shopee'
                ELSE 'unassigned'
              END AS channel,
              SUM(o.total_amount)::bigint AS revenue,
              COUNT(*)::int AS order_count
            FROM orders o
            LEFT JOIN sales_channels sc ON sc.id = o.sales_channel_id
            WHERE o.status = 'delivered'
            GROUP BY 1
            ORDER BY 2 DESC NULLS LAST
            """
        )
        rows = self.session.execute(sql).mappings().all()
        return [dict(r) for r in rows]

    def quarter_metrics(self, *, year: int, quarter: int) -> dict:
        """Q1=Jan-Mar. Revenue và order_count chỉ tính đơn delivered."""
        start_month = (quarter - 1) * 3 + 1
        sql = text(
            """
            SELECT
              COALESCE(SUM(CASE WHEN o.status = 'delivered'
                           THEN o.total_amount END), 0)::bigint AS revenue,
              COUNT(*) FILTER (WHERE o.status = 'delivered')::int AS order_count,
              COUNT(*) FILTER (WHERE o.status = 'returned')::int AS returned_count
            FROM orders o
            WHERE COALESCE(o.placed_at, o.created_at) IS NOT NULL
              AND EXTRACT(YEAR FROM timezone('UTC', COALESCE(o.placed_at, o.created_at)))::int = :y
              AND EXTRACT(MONTH FROM timezone('UTC', COALESCE(o.placed_at, o.created_at)))::int
                  BETWEEN :m0 AND :m1
            """
        )
        m0 = start_month
        m1 = start_month + 2
        row = self.session.execute(sql, {"y": year, "m0": m0, "m1": m1}).mappings().one()
        return dict(row)

    def top_products(self, *, limit: int = 10) -> list[dict]:
        """Chỉ tính sản phẩm từ đơn đã giao (delivered)."""
        sql = text(
            """
            SELECT
              oi.product_id::text AS product_id,
              p.name AS name,
              p.sku AS sku,
              SUM(oi.quantity)::bigint AS qty_sold,
              SUM(oi.line_total)::bigint AS revenue
            FROM order_items oi
            INNER JOIN orders o ON o.id = oi.order_id
            INNER JOIN products p ON p.id = oi.product_id
            WHERE o.status = 'delivered'
              AND oi.product_id IS NOT NULL
            GROUP BY oi.product_id, p.name, p.sku
            ORDER BY revenue DESC NULLS LAST
            LIMIT :lim
            """
        )
        rows = self.session.execute(sql, {"lim": limit}).mappings().all()
        return [dict(r) for r in rows]

    def customer_behavior(self) -> dict:
        """Phân tích hành vi khách hàng cho marketing: RFM cơ bản, phân khúc, sản phẩm yêu thích."""
        rfm_sql = text(
            """
            SELECT
              cp.id::text            AS customer_id,
              cp.full_name,
              cp.email,
              cp.phone,
              COUNT(o.id)::int                                          AS order_count,
              COALESCE(SUM(o.total_amount), 0)::bigint                  AS total_spent,
              COALESCE(AVG(o.total_amount), 0)::bigint                  AS avg_order_value,
              MAX(o.placed_at)                                           AS last_order_at,
              EXTRACT(DAY FROM NOW() - MAX(o.placed_at))::int           AS recency_days
            FROM customer_profiles cp
            LEFT JOIN orders o
              ON o.customer_id = cp.id
              AND o.status = 'delivered'
            GROUP BY cp.id, cp.full_name, cp.email, cp.phone
            ORDER BY total_spent DESC NULLS LAST
            LIMIT 200
            """
        )
        rfm_rows = self.session.execute(rfm_sql).mappings().all()

        segment_sql = text(
            """
            SELECT
              CASE
                WHEN order_count = 0                          THEN 'Chưa mua'
                WHEN order_count = 1 AND recency_days <= 30   THEN 'Mới mua lần đầu'
                WHEN order_count >= 2 AND recency_days <= 60  THEN 'Khách trung thành'
                WHEN recency_days > 90                        THEN 'Có nguy cơ rời bỏ'
                ELSE 'Mua thỉnh thoảng'
              END AS segment,
              COUNT(*)::int AS count
            FROM (
              SELECT
                cp.id,
                COUNT(o.id)                                        AS order_count,
                EXTRACT(DAY FROM NOW() - MAX(o.placed_at))::int    AS recency_days
              FROM customer_profiles cp
              LEFT JOIN orders o ON o.customer_id = cp.id AND o.status = 'delivered'
              GROUP BY cp.id
            ) t
            GROUP BY segment
            ORDER BY count DESC
            """
        )
        segment_rows = self.session.execute(segment_sql).mappings().all()

        top_products_sql = text(
            """
            SELECT
              p.name,
              p.sku,
              COUNT(DISTINCT o.customer_id)::int AS buyer_count,
              SUM(oi.quantity)::bigint            AS qty_sold
            FROM order_items oi
            JOIN orders o  ON o.id  = oi.order_id  AND o.status = 'delivered'
            JOIN products p ON p.id = oi.product_id
            WHERE oi.product_id IS NOT NULL
            GROUP BY p.id, p.name, p.sku
            ORDER BY buyer_count DESC NULLS LAST
            LIMIT 10
            """
        )
        top_product_rows = self.session.execute(top_products_sql).mappings().all()

        return {
            "customers": [dict(r) for r in rfm_rows],
            "segments":  [dict(r) for r in segment_rows],
            "top_products_by_buyers": [dict(r) for r in top_product_rows],
        }

    def customer_snapshot(self) -> dict:
        """Buyers và revenue chỉ tính từ đơn đã giao (delivered)."""
        sql = text(
            """
            SELECT
              (SELECT COUNT(*)::int FROM customer_profiles) AS profiles_count,
              (SELECT COUNT(*)::int FROM customer_profiles
               WHERE created_at >= date_trunc('month', timezone('UTC', NOW()))) AS new_this_month,
              (SELECT COUNT(DISTINCT customer_id)::int FROM orders
               WHERE status = 'delivered' AND customer_id IS NOT NULL) AS buyers_count,
              (SELECT COUNT(*)::int FROM (
                 SELECT customer_id FROM orders
                 WHERE status = 'delivered' AND customer_id IS NOT NULL
                 GROUP BY customer_id HAVING COUNT(*) > 1
               ) t) AS repeat_buyers,
              (SELECT COALESCE(SUM(total_amount), 0)::bigint FROM orders
               WHERE status = 'delivered' AND customer_id IS NOT NULL) AS revenue_from_buyers
            """
        )
        row = self.session.execute(sql).mappings().one()
        return dict(row)
