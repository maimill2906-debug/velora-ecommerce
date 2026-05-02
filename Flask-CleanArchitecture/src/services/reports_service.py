from __future__ import annotations

from datetime import UTC, datetime

from infrastructure.repositories.reports_repository import ReportsRepository

# Khớp enum sales_channel trong DB → key biểu đồ frontend
_DB_CHANNEL_TO_CHART = {
    "online": "website",
    "pos": "store",
    "shopee": "shopee",
    "lazada": "lazada",
    "tiktok_shop": "tiktok",
    "unassigned": "unassigned",
}

CHANNEL_LABELS_VI = {
    "online": "Website",
    "pos": "Cửa hàng (POS)",
    "shopee": "Shopee",
    "lazada": "Lazada",
    "tiktok_shop": "TikTok Shop",
    "unassigned": "Chưa gán kênh",
}

CANONICAL_DB_CHANNELS = ("online", "pos", "shopee", "lazada", "tiktok_shop", "unassigned")


class ReportsService:
    def __init__(self, repo: ReportsRepository):
        self.repo = repo

    def _month_keys(self, months_back: int = 6) -> list[tuple[str, str]]:
        """(YYYY-MM, short label T1..T12) — cùng logic 6 tháng với dashboard cũ."""
        now = datetime.now(UTC)
        month_short = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"]
        out: list[tuple[str, str]] = []
        for i in range(months_back - 1, -1, -1):
            mi = now.month - i
            yi = now.year
            while mi <= 0:
                mi += 12
                yi -= 1
            key = f"{yi}-{mi:02d}"
            out.append((key, month_short[mi - 1]))
        return out

    def dashboard_summary(self, *, months_back: int = 6) -> dict:
        monthly_rows = self.repo.monthly_revenue_by_channel(months_back=months_back)
        month_specs = self._month_keys(months_back)

        # bucket[ym][chart_key] = revenue
        bucket: dict[str, dict[str, int]] = {k: {ck: 0 for ck in _DB_CHANNEL_TO_CHART.values()} for k, _ in month_specs}
        for row in monthly_rows:
            ym = row["ym"]
            ch = row["channel"] or "unassigned"
            ck = _DB_CHANNEL_TO_CHART.get(ch, "unassigned")
            rev = int(row["revenue"] or 0)
            if ym not in bucket:
                continue
            bucket[ym][ck] = bucket[ym].get(ck, 0) + rev

        months_chart = []
        for ym, label in month_specs:
            b = bucket.get(ym, {})
            months_chart.append(
                {
                    "key": ym,
                    "name": label,
                    "website": b.get("website", 0),
                    "store": b.get("store", 0),
                    "shopee": b.get("shopee", 0),
                    "lazada": b.get("lazada", 0),
                    "tiktok": b.get("tiktok", 0),
                    "unassigned": b.get("unassigned", 0),
                }
            )

        # Kênh cố định — không có đơn hoặc chưa map sales_channel_id ⇒ 0 / chỉ unassigned có phần
        totals_raw = self.repo.channel_totals_all_time()
        rev_by_db = {r["channel"]: int(r["revenue"] or 0) for r in totals_raw}
        cnt_by_db = {r["channel"]: int(r["order_count"] or 0) for r in totals_raw}

        channels = []
        total_rev = 0
        for db_ch in CANONICAL_DB_CHANNELS:
            r = rev_by_db.get(db_ch, 0)
            c = cnt_by_db.get(db_ch, 0)
            total_rev += r
            channels.append(
                {
                    "code": db_ch,
                    "chart_key": _DB_CHANNEL_TO_CHART[db_ch],
                    "name": CHANNEL_LABELS_VI[db_ch],
                    "revenue": r,
                    "orders": c,
                }
            )
        for ch in channels:
            ch["percent"] = round((ch["revenue"] / total_rev) * 100, 1) if total_rev > 0 else 0.0

        pie_chart = [{"name": ch["name"], "value": ch["percent"], "code": ch["code"]} for ch in channels]

        now = datetime.now(UTC)
        quarter = (now.month - 1) // 3 + 1
        year = now.year
        cur_q = self.repo.quarter_metrics(year=year, quarter=quarter)
        pq_q = quarter - 1 if quarter > 1 else 4
        pq_y = year if quarter > 1 else year - 1
        prev_q = self.repo.quarter_metrics(year=pq_y, quarter=pq_q)

        def pct_delta(cur: int, prev: int) -> float | None:
            if prev <= 0:
                return None if cur == 0 else 100.0
            return round(((cur - prev) / prev) * 100, 1)

        rev_cur = int(cur_q["revenue"] or 0)
        rev_prev = int(prev_q["revenue"] or 0)
        oc_cur = int(cur_q["order_count"] or 0)
        oc_prev = int(prev_q["order_count"] or 0)
        ret_cur = int(cur_q["returned_count"] or 0)

        avg_cur = round(rev_cur / oc_cur) if oc_cur > 0 else 0
        oc_prev_nc = int(prev_q["order_count"] or 0)
        avg_prev = round(rev_prev / oc_prev_nc) if oc_prev_nc > 0 else 0

        return_rate = round((ret_cur / oc_cur) * 100, 2) if oc_cur > 0 else 0.0

        cust = self.repo.customer_snapshot()
        profiles = int(cust["profiles_count"] or 0)
        buyers = int(cust["buyers_count"] or 0)
        repeat = int(cust["repeat_buyers"] or 0)
        new_m = int(cust["new_this_month"] or 0)
        retention = round((repeat / buyers) * 100, 1) if buyers > 0 else 0.0
        rev_buyers = int(cust["revenue_from_buyers"] or 0)
        ltv = round(rev_buyers / buyers) if buyers > 0 else 0

        top_products = self.repo.top_products(limit=10)

        return {
            "generated_at": now.isoformat(),
            "quarter": {"year": year, "quarter": quarter, "label": f"Q{quarter}/{year}"},
            "quarter_metrics": {
                "revenue": rev_cur,
                "order_count": oc_cur,
                "avg_order_value": avg_cur,
                "return_rate_pct": return_rate,
                "revenue_change_pct": pct_delta(rev_cur, rev_prev),
                "orders_change_pct": pct_delta(oc_cur, oc_prev),
                "avg_order_change_pct": pct_delta(avg_cur, avg_prev),
            },
            "months_chart": months_chart,
            "channels": channels,
            "pie_chart": pie_chart,
            "top_products": top_products,
            "customers": {
                "profiles_count": profiles,
                "new_this_month": new_m,
                "buyers_count": buyers,
                "repeat_buyers": repeat,
                "retention_pct": retention,
                "ltv_avg_revenue_per_buyer": ltv,
            },
        }
