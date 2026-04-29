import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import { toast } from "sonner";

// ============================================================
// SHARED COMPONENTS (copy từ file chính hoặc import)
// ============================================================
const Badge = ({ label, color = "gray" }: { label: string; color?: string }) => (
  <span style={{
    display: "inline-block", padding: "2px 8px", fontSize: 11, fontWeight: 600,
    background: color === "green" ? "#e6f4ea" : color === "red" ? "#fce8e6" : color === "yellow" ? "#fef9e7" : color === "blue" ? "#e8f0fe" : "#f5f5f5",
    color: color === "green" ? "#1a7a3c" : color === "red" ? "#c0392b" : color === "yellow" ? "#b7770d" : color === "blue" ? "#1a56db" : "#333",
    letterSpacing: 0.5,
  }}>{label}</span>
);

const Btn = ({ children, variant = "primary", onClick, style = {} }: any) => (
  <button onClick={onClick} style={{
    padding: "8px 16px", border: variant === "primary" ? "none" : "1px solid #ddd",
    background: variant === "primary" ? "#000" : "#fff",
    color: variant === "primary" ? "#fff" : "#000",
    fontSize: 13, fontWeight: 500, cursor: "pointer", borderRadius: 0,
    letterSpacing: 0.3, ...style,
  }}>{children}</button>
);

const StatCard = ({ label, value, sub, icon }: any) => (
  <div style={{ border: "1px solid #eee", padding: "20px 24px", background: "#fff" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div style={{ fontSize: 11, letterSpacing: 1.5, color: "#888", fontWeight: 600, marginBottom: 8 }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -1 }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>{sub}</div>}
      </div>
      <div style={{ fontSize: 24, opacity: 0.15 }}>{icon}</div>
    </div>
  </div>
);

// ============================================================
// TAB: CHIẾN DỊCH MARKETING (real)
// ============================================================
type Campaign = { id: string; code: string; name: string; channel: string; status: string };

const CHANNELS = [
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "google", label: "Google" },
  { value: "shopee", label: "Shopee" },
  { value: "lazada", label: "Lazada" },
  { value: "other", label: "Khác" },
];

const CAMPAIGN_STATUSES = [
  { value: "draft", label: "Nháp", color: "gray" },
  { value: "active", label: "Đang chạy", color: "green" },
  { value: "paused", label: "Tạm dừng", color: "yellow" },
  { value: "ended", label: "Đã kết thúc", color: "gray" },
];

const CampaignsTab = () => {
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState({ code: "", name: "", channel: "facebook", status: "draft" });

  const reload = () => {
    setLoading(true);
    apiFetch<Campaign[]>("/marketing/campaigns?limit=200", { auth: true })
      .then((rows) => setItems(rows || []))
      .catch((e) => {
        if (e?.message === "forbidden") toast.error("Cần quyền MARKETING_READ để xem");
        setItems([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, []);

  const submit = async () => {
    if (!form.code || !form.name) { toast.error("Vui lòng nhập mã và tên"); return; }
    setSubmitting(true);
    try {
      await apiFetch("/marketing/campaigns", { method: "POST", auth: true, body: JSON.stringify(form) });
      toast.success("Đã tạo chiến dịch");
      setShowForm(false);
      setForm({ code: "", name: "", channel: "facebook", status: "draft" });
      reload();
    } catch (e: any) {
      toast.error(`Lỗi: ${e?.message || ""}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = items.filter((c) => {
    if (statusFilter && c.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.code.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>CHIẾN DỊCH MARKETING</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="secondary" onClick={reload}>↻ Tải lại</Btn>
          <Btn onClick={() => setShowForm((v) => !v)}>+ Tạo chiến dịch</Btn>
        </div>
      </div>

      {showForm && (
        <div style={{ border: "1px solid #ddd", padding: 16, marginBottom: 16, background: "#fafafa" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            <input placeholder="Mã *" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} style={{ padding: "8px 12px", border: "1px solid #ddd", fontSize: 13 }} />
            <input placeholder="Tên *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={{ padding: "8px 12px", border: "1px solid #ddd", fontSize: 13 }} />
            <select value={form.channel} onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))} style={{ padding: "8px 12px", border: "1px solid #ddd", fontSize: 13 }}>
              {CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} style={{ padding: "8px 12px", border: "1px solid #ddd", fontSize: 13 }}>
              {CAMPAIGN_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <Btn variant="secondary" onClick={() => setShowForm(false)}>Huỷ</Btn>
            <Btn onClick={submit}>{submitting ? "Đang lưu..." : "Lưu"}</Btn>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm chiến dịch..." style={{ flex: 1, padding: "8px 12px", border: "1px solid #ddd", fontSize: 13 }} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: "8px 12px", border: "1px solid #ddd", fontSize: 13 }}>
          <option value="">Tất cả trạng thái</option>
          {CAMPAIGN_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Chưa có chiến dịch.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((c) => {
            const st = CAMPAIGN_STATUSES.find((x) => x.value === c.status);
            const ch = CHANNELS.find((x) => x.value === c.channel);
            return (
              <div key={c.id} style={{ border: "1px solid #eee", padding: 20, background: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</span>
                      <Badge label={st?.label || c.status} color={st?.color || "gray"} />
                      <Badge label={ch?.label || c.channel} color="blue" />
                    </div>
                    <div style={{ fontSize: 12, color: "#888" }}>Mã: <code style={{ background: "#f5f5f5", padding: "0 4px" }}>{c.code}</code></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================
// TAB: VOUCHER & KHUYẾN MÃI (real)
// ============================================================
type Voucher = {
  id: string;
  code: string;
  name: string;
  discount_amount: number | null;
  discount_percent: number | null;
  max_uses: number | null;
};

const VouchersTab = () => {
  const [items, setItems] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", discount_type: "amount", discount_value: "", max_uses: "" });

  const reload = () => {
    setLoading(true);
    apiFetch<Voucher[]>("/marketing/vouchers?limit=200", { auth: true })
      .then((rows) => setItems(rows || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, []);

  const submit = async () => {
    if (!form.code || !form.name || !form.discount_value) { toast.error("Vui lòng nhập đủ"); return; }
    const payload: any = {
      code: form.code,
      name: form.name,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
    };
    if (form.discount_type === "amount") payload.discount_amount = Number(form.discount_value);
    else payload.discount_percent = Number(form.discount_value);
    setSubmitting(true);
    try {
      await apiFetch("/marketing/vouchers", { method: "POST", auth: true, body: JSON.stringify(payload) });
      toast.success("Đã tạo voucher");
      setShowForm(false);
      setForm({ code: "", name: "", discount_type: "amount", discount_value: "", max_uses: "" });
      reload();
    } catch (e: any) {
      toast.error(`Lỗi: ${e?.message || ""}`);
    } finally {
      setSubmitting(false);
    }
  };

  const fmtVoucher = (v: Voucher) => {
    if (v.discount_percent) return `Giảm ${v.discount_percent}%`;
    if (v.discount_amount) return `Giảm ${v.discount_amount.toLocaleString("vi-VN")}₫`;
    return "—";
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>VOUCHER & KHUYẾN MÃI</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="secondary" onClick={reload}>↻ Tải lại</Btn>
          <Btn onClick={() => setShowForm((v) => !v)}>+ Tạo voucher</Btn>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard label="TỔNG VOUCHER" value={String(items.length)} sub="Đang trong hệ thống" icon="🎫" />
        <StatCard label="VOUCHER GIẢM %" value={String(items.filter(v => v.discount_percent).length)} sub="Theo phần trăm" icon="📉" />
        <StatCard label="VOUCHER GIẢM ₫" value={String(items.filter(v => v.discount_amount).length)} sub="Theo số tiền" icon="💰" />
      </div>

      {showForm && (
        <div style={{ border: "1px solid #ddd", padding: 16, marginBottom: 16, background: "#fafafa" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            <input placeholder="Mã voucher *" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} style={{ padding: "8px 12px", border: "1px solid #ddd", fontSize: 13 }} />
            <input placeholder="Tên *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={{ padding: "8px 12px", border: "1px solid #ddd", fontSize: 13 }} />
            <select value={form.discount_type} onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value }))} style={{ padding: "8px 12px", border: "1px solid #ddd", fontSize: 13 }}>
              <option value="amount">Giảm số tiền (₫)</option>
              <option value="percent">Giảm phần trăm (%)</option>
            </select>
            <input placeholder={form.discount_type === "amount" ? "Số tiền (VD: 50000)" : "% (VD: 10)"} type="number" value={form.discount_value} onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))} style={{ padding: "8px 12px", border: "1px solid #ddd", fontSize: 13 }} />
            <input placeholder="Giới hạn lượt dùng" type="number" value={form.max_uses} onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))} style={{ padding: "8px 12px", border: "1px solid #ddd", fontSize: 13 }} />
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <Btn variant="secondary" onClick={() => setShowForm(false)}>Huỷ</Btn>
            <Btn onClick={submit}>{submitting ? "Đang lưu..." : "Lưu"}</Btn>
          </div>
        </div>
      )}

      <div style={{ border: "1px solid #eee", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #000" }}>
              {["MÃ VOUCHER", "TÊN", "MỨC GIẢM", "GIỚI HẠN"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, fontSize: 11, letterSpacing: 1 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4} style={{ padding: 40, textAlign: "center", color: "#888" }}>Đang tải...</td></tr>}
            {!loading && items.length === 0 && <tr><td colSpan={4} style={{ padding: 40, textAlign: "center", color: "#888" }}>Chưa có voucher.</td></tr>}
            {!loading && items.map((v, i) => (
              <tr key={v.id} style={{ borderBottom: "1px solid #f0f0f0", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                <td style={{ padding: "10px 14px" }}>
                  <code style={{ background: "#f5f5f5", padding: "2px 6px", fontSize: 12, fontWeight: 700 }}>{v.code}</code>
                </td>
                <td style={{ padding: "10px 14px" }}>{v.name}</td>
                <td style={{ padding: "10px 14px", fontWeight: 600 }}>{fmtVoucher(v)}</td>
                <td style={{ padding: "10px 14px" }}>{v.max_uses || "∞"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================================
// TAB: EMAIL & SMS MARKETING
// ============================================================
const EmailSMSTab = () => {
  const [activeChannel, setActiveChannel] = useState<"email" | "sms">("email");

  const emails = [
    ["Chào mừng khách mới", "Tự động", "1,284 gửi", "42.3%", "18.6%", <Badge label="Đang hoạt động" color="green" />],
    ["Flash Sale Tháng 5", "Một lần", "8,200 gửi", "38.7%", "12.4%", <Badge label="Đã gửi" color="gray" />],
    ["Nhắc nhở giỏ hàng bỏ quên", "Tự động", "420 gửi", "51.2%", "28.9%", <Badge label="Đang hoạt động" color="green" />],
    ["Chúc mừng sinh nhật VIP", "Tự động", "84 gửi", "72.4%", "35.1%", <Badge label="Đang hoạt động" color="green" />],
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 0, border: "1px solid #ddd" }}>
          {(["email", "sms"] as const).map(ch => (
            <button key={ch} onClick={() => setActiveChannel(ch)} style={{
              padding: "8px 20px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: activeChannel === ch ? "#000" : "#fff",
              color: activeChannel === ch ? "#fff" : "#000",
            }}>{ch === "email" ? "📧 Email" : "📱 SMS"}</button>
          ))}
        </div>
        <Btn>+ Tạo chiến dịch {activeChannel === "email" ? "Email" : "SMS"}</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard label="TỈ LỆ MỞ TB" value="43.2%" sub="Benchmark: 35%" icon="📬" />
        <StatCard label="TỈ LỆ CLICK TB" value="18.4%" sub="Benchmark: 12%" icon="👆" />
        <StatCard label="TỔNG GỬI THÁNG NÀY" value="12,840" sub="Email + SMS" icon="📤" />
        <StatCard label="DOANH THU TỪ EMAIL" value="28.4M₫" sub="Tháng 4/2026" icon="💰" />
      </div>

      <div style={{ border: "1px solid #eee", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #000" }}>
              {["TÊN CHIẾN DỊCH", "LOẠI", "ĐÃ GỬI", "TỈ LỆ MỞ", "TỈ LỆ CLICK", "TRẠNG THÁI", "THAO TÁC"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, fontSize: 11, letterSpacing: 1 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {emails.map((row, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f0f0f0", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                {row.map((cell, j) => (
                  <td key={j} style={{ padding: "10px 14px", verticalAlign: "middle" }}>{cell}</td>
                ))}
                <td style={{ padding: "10px 14px" }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button style={{ fontSize: 11, padding: "3px 7px", border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>Xem</button>
                    <button style={{ fontSize: 11, padding: "3px 7px", border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>Sửa</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================================
// TAB: SOCIAL MEDIA
// ============================================================
const SocialMediaTab = () => {
  const posts = [
    { platform: "Instagram", icon: "📸", content: "Summer Collection 2026 — New arrivals mỗi tuần", date: "27/04 08:00", likes: "1,284", comments: "84", reach: "18,400", status: "green", statusLabel: "Đã đăng" },
    { platform: "Facebook", icon: "👥", content: "Flash Sale 50% — Chỉ hôm nay! Mua ngay trước khi hết 🔥", date: "27/04 10:00", likes: "842", comments: "120", reach: "24,600", status: "green", statusLabel: "Đã đăng" },
    { platform: "TikTok", icon: "🎵", content: "VELORA OOTD — Cô nàng văn phòng style tối giản 🖤", date: "28/04 18:00", likes: "-", comments: "-", reach: "-", status: "blue", statusLabel: "Đã lên lịch" },
    { platform: "Instagram", icon: "📸", content: "Mother's Day Gift Guide — Tặng mẹ yêu 💐", date: "08/05 09:00", likes: "-", comments: "-", reach: "-", status: "blue", statusLabel: "Đã lên lịch" },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>LỊCH ĐĂNG SOCIAL MEDIA</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="secondary">📅 Xem lịch</Btn>
          <Btn>+ Tạo bài đăng</Btn>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard label="LƯỢT TIẾP CẬN THÁNG NÀY" value="248K" sub="▲ 18% vs tháng trước" icon="👁" />
        <StatCard label="TỔNG LƯỢT TƯƠNG TÁC" value="12,840" sub="Like + Comment + Share" icon="❤️" />
        <StatCard label="BÀI SẮP ĐĂNG" value="6" sub="Trong 7 ngày tới" icon="📅" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {posts.map((p, i) => (
          <div key={i} style={{ border: "1px solid #eee", padding: 18, background: "#fff", display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{ fontSize: 28, flexShrink: 0 }}>{p.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{p.platform}</span>
                  <span style={{ color: "#aaa", fontSize: 12, marginLeft: 8 }}>• {p.date}</span>
                </div>
                <Badge label={p.statusLabel} color={p.status} />
              </div>
              <div style={{ fontSize: 13, color: "#444", marginBottom: 10 }}>"{p.content}"</div>
              <div style={{ display: "flex", gap: 20, fontSize: 12, color: "#888" }}>
                <span>❤️ {p.likes}</span>
                <span>💬 {p.comments}</span>
                <span>👁 {p.reach}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button style={{ fontSize: 11, padding: "3px 7px", border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>Sửa</button>
              <button style={{ fontSize: 11, padding: "3px 7px", border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>Xem</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// TAB: PHÂN TÍCH & BÁO CÁO MARKETING
// ============================================================
const MarketingAnalyticsTab = () => {
  const channels = [
    { name: "Organic (SEO)", visits: "18,400", conversion: "3.2%", revenue: "42.6M₫", cac: "0₫", color: "#000" },
    { name: "Email Marketing", visits: "12,840", conversion: "4.8%", revenue: "28.4M₫", cac: "2.400₫", color: "#1a56db" },
    { name: "Facebook Ads", visits: "24,600", conversion: "2.1%", revenue: "38.2M₫", cac: "18.500₫", color: "#3b5998" },
    { name: "Instagram Ads", visits: "18,200", conversion: "2.8%", revenue: "31.4M₫", cac: "14.200₫", color: "#e1306c" },
    { name: "Google Ads", visits: "14,800", conversion: "3.6%", revenue: "24.8M₫", cac: "22.000₫", color: "#4285f4" },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>PHÂN TÍCH HIỆU QUẢ MARKETING</h3>
        <select style={{ padding: "8px 12px", border: "1px solid #ddd", fontSize: 13 }}>
          <option>Tháng 4/2026</option><option>Quý 1/2026</option><option>Năm 2026</option>
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard label="TỔNG CHI PHÍ MARKETING" value="28.5M₫" sub="12% tổng doanh thu" icon="💸" />
        <StatCard label="TỔNG DOANH THU TỪ MKT" value="165M₫" sub="ROI: 479%" icon="📈" />
        <StatCard label="CHI PHÍ MỖI KHÁCH MỚI" value="91.3K₫" sub="CAC trung bình" icon="👤" />
        <StatCard label="ROAS TRUNG BÌNH" value="5.8x" sub="Return on Ad Spend" icon="🎯" />
      </div>

      <div style={{ border: "1px solid #eee", padding: 24, marginBottom: 20 }}>
        <h4 style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>HIỆU QUẢ THEO KÊNH</h4>
        <div style={{ border: "1px solid #eee", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #000" }}>
                {["KÊNH", "LƯỢT TRUY CẬP", "TỈ LỆ CHUYỂN ĐỔI", "DOANH THU", "CHI PHÍ MỖI KH", "HIỆU QUẢ"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, fontSize: 11, letterSpacing: 1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {channels.map((c, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f0f0f0", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 10, height: 10, background: c.color, borderRadius: "50%" }} />
                      {c.name}
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px" }}>{c.visits}</td>
                  <td style={{ padding: "10px 14px", fontWeight: 600 }}>{c.conversion}</td>
                  <td style={{ padding: "10px 14px", fontWeight: 700 }}>{c.revenue}</td>
                  <td style={{ padding: "10px 14px", color: c.cac === "0₫" ? "#1a7a3c" : "#333" }}>{c.cac}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ height: 6, background: "#f5f5f5", width: 100 }}>
                      <div style={{ height: "100%", width: `${parseFloat(c.conversion) / 5 * 100}%`, background: c.color }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN: MARKETING PAGE
// ============================================================
export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState("campaigns");
  const [overview, setOverview] = useState({ campaigns: 0, activeCampaigns: 0, vouchers: 0 });

  useEffect(() => {
    Promise.all([
      apiFetch<any[]>("/marketing/campaigns?limit=200", { auth: true }).catch(() => []),
      apiFetch<any[]>("/marketing/vouchers?limit=200", { auth: true }).catch(() => []),
    ]).then(([cs, vs]) => {
      setOverview({
        campaigns: (cs || []).length,
        activeCampaigns: (cs || []).filter((c: any) => c.status === "active").length,
        vouchers: (vs || []).length,
      });
    });
  }, []);

  const tabs = [
    { id: "campaigns", label: "📣 Chiến dịch" },
    { id: "vouchers", label: "🎫 Voucher" },
  ];

  const tabContent: Record<string, JSX.Element> = {
    campaigns: <CampaignsTab />,
    vouchers: <VouchersTab />,
  };

  return (
    <div style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", background: "#f9f9f9", minHeight: "100vh", padding: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>Marketing</h1>
          <p style={{ margin: "4px 0 0", color: "#888", fontSize: 13 }}>Quản lý chiến dịch và voucher VELORA</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
        <StatCard label="CHIẾN DỊCH" value={String(overview.campaigns)} sub={`${overview.activeCampaigns} đang chạy`} icon="📣" />
        <StatCard label="VOUCHER" value={String(overview.vouchers)} sub="Trong hệ thống" icon="🎫" />
        <StatCard label="ROI" value="—" sub="Sẽ có khi tích hợp tracking" icon="📈" />
      </div>

      <div style={{ borderBottom: "2px solid #000", marginBottom: 24, display: "flex" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: "10px 20px", border: "none", background: "none", cursor: "pointer",
            fontWeight: activeTab === t.id ? 700 : 400, fontSize: 13,
            borderBottom: activeTab === t.id ? "2px solid #000" : "2px solid transparent",
            marginBottom: -2, whiteSpace: "nowrap",
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ background: "#fff", border: "1px solid #eee", padding: 24 }}>
        {tabContent[activeTab]}
      </div>
    </div>
  );
}