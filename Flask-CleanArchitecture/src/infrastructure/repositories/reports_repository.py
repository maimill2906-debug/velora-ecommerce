from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.orm import Session


class ReportsRepository:
    def __init__(self, session: Session):
        self.session = session

    def monthly_revenue_by_channel(self, *, months_back: int = 6) -> list[dict]:
        """Rows: ym (YYYY-MM), channel (enum text or 'unassigned'), revenue, order_count."""
        sql = text(
            """
            SELECT
              to_char(
                date_trunc('month', timezone('UTC', COALESCE(o.placed_at, o.created_at))),
                'YYYY-MM'
              ) AS ym,
              COALESCE(sc.channel::text, 'unassigned') AS channel,
              SUM(o.total_amount)::bigint AS revenue,
              COUNT(*)::int AS order_count
            FROM orders o
            LEFT JOIN sales_channels sc ON sc.id = o.sales_channel_id
            WHERE COALESCE(o.placed_at, o.created_at) IS NOT NULL
              AND o.status NOT IN ('draft', 'cancelled')
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
        sql = text(
            """
            SELECT
              COALESCE(sc.channel::text, 'unassigned') AS channel,
              SUM(o.total_amount)::bigint AS revenue,
              COUNT(*)::int AS order_count
            FROM orders o
            LEFT JOIN sales_channels sc ON sc.id = o.sales_channel_id
            WHERE o.status NOT IN ('draft', 'cancelled')
            GROUP BY 1
            ORDER BY 2 DESC NULLS LAST
            """
        )
        rows = self.session.execute(sql).mappings().all()
        return [dict(r) for r in rows]

    def quarter_metrics(self, *, year: int, quarter: int) -> dict:
        """Q1=Jan-Mar. Revenue, order count, returned count for return rate."""
        start_month = (quarter - 1) * 3 + 1
        sql = text(
            """
            SELECT
              COALESCE(SUM(CASE WHEN o.status NOT IN ('draft', 'cancelled')
                           THEN o.total_amount END), 0)::bigint AS revenue,
              COUNT(*) FILTER (WHERE o.status NOT IN ('draft', 'cancelled'))::int AS order_count,
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
            WHERE o.status NOT IN ('draft', 'cancelled')
              AND oi.product_id IS NOT NULL
            GROUP BY oi.product_id, p.name, p.sku
            ORDER BY revenue DESC NULLS LAST
            LIMIT :lim
            """
        )
        rows = self.session.execute(sql, {"lim": limit}).mappings().all()
        return [dict(r) for r in rows]

    def customer_snapshot(self) -> dict:
        sql = text(
            """
            SELECT
              (SELECT COUNT(*)::int FROM customer_profiles) AS profiles_count,
              (SELECT COUNT(*)::int FROM customer_profiles
               WHERE created_at >= date_trunc('month', timezone('UTC', NOW()))) AS new_this_month,
              (SELECT COUNT(DISTINCT customer_id)::int FROM orders
               WHERE status NOT IN ('draft', 'cancelled') AND customer_id IS NOT NULL) AS buyers_count,
              (SELECT COUNT(*)::int FROM (
                 SELECT customer_id FROM orders
                 WHERE status NOT IN ('draft', 'cancelled') AND customer_id IS NOT NULL
                 GROUP BY customer_id HAVING COUNT(*) > 1
               ) t) AS repeat_buyers,
              (SELECT COALESCE(SUM(total_amount), 0)::bigint FROM orders
               WHERE status NOT IN ('draft', 'cancelled') AND customer_id IS NOT NULL) AS revenue_from_buyers
            """
        )
        row = self.session.execute(sql).mappings().one()
        return dict(row)
