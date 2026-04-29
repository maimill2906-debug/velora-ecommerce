import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import { toast } from "sonner";
import { getSupabaseClient, getSupabaseConfig } from "@/lib/supabaseClient";

// ============================================================
// SHARED COMPONENTS
// ============================================================

const VeloraAdminSidebar = ({ activePage, onNavigate }) => {
  const menuGroups = [
    {
      label: "TỔNG QUAN",
      items: [
        { id: "dashboard", icon: "⬛", label: "Dashboard" },
        { id: "reports", icon: "📊", label: "Báo cáo & Thống kê" },
      ],
    },
    {
      label: "BÁN HÀNG",
      items: [
        { id: "orders", icon: "📦", label: "Quản lý đơn hàng" },
        { id: "pos", icon: "🖥", label: "POS Bán hàng" },
        { id: "customers", icon: "👥", label: "Quản lý khách hàng" },
      ],
    },
    {
      label: "SẢN PHẨM & KHO",
      items: [
        { id: "products", icon: "👗", label: "Quản lý sản phẩm" },
        { id: "warehouse", icon: "🏭", label: "Quản lý kho" },
        { id: "import", icon: "📥", label: "Nhập kho" },
        { id: "suppliers", icon: "🏢", label: "Nhà cung cấp" },
      ],
    },
    {
      label: "VẬN CHUYỂN",
      items: [
        { id: "shipping", icon: "🚚", label: "Quản lý vận chuyển" },
      ],
    },
    {
      label: "ĐA KÊNH",
      items: [
        { id: "marketplace", icon: "🔗", label: "Kết nối sàn TMĐT" },
        { id: "sync", icon: "🔄", label: "Đồng bộ kênh" },
        { id: "sync-logs", icon: "📋", label: "Lịch sử đồng bộ" },
      ],
    },
  ];

  return (
    <aside style={{
      width: 240, minHeight: "100vh", background: "#000", color: "#fff",
      display: "flex", flexDirection: "column", flexShrink: 0,
    }}>
      <div style={{ padding: "28px 24px 24px", borderBottom: "1px solid #222" }}>
        <div style={{ fontFamily: "'Georgia', serif", fontSize: 20, letterSpacing: 4, fontWeight: 700 }}>VELORA</div>
        <div style={{ fontSize: 9, letterSpacing: 3, color: "#666", marginTop: 2 }}>ADMIN PANEL</div>
      </div>
      <nav style={{ flex: 1, padding: "16px 0", overflowY: "auto" }}>
        {menuGroups.map(group => (
          <div key={group.label}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: "#555", padding: "12px 24px 6px", fontWeight: 600 }}>
              {group.label}
            </div>
            {group.items.map(item => (
              <button key={item.id} onClick={() => onNavigate(item.id)} style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "9px 24px", border: "none", background: activePage === item.id ? "#111" : "transparent",
                color: activePage === item.id ? "#fff" : "#888", cursor: "pointer", fontSize: 13,
                textAlign: "left", borderLeft: activePage === item.id ? "2px solid #fff" : "2px solid transparent",
                transition: "all 0.15s",
              }}>
                <span style={{ fontSize: 12 }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
};

const PageHeader = ({ title, subtitle, actions }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
    <div>
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>{title}</h1>
      {subtitle && <p style={{ margin: "4px 0 0", color: "#888", fontSize: 13 }}>{subtitle}</p>}
    </div>
    {actions && <div style={{ display: "flex", gap: 8 }}>{actions}</div>}
  </div>
);

const Btn = ({ children, variant = "primary", onClick, style = {} }) => (
  <button onClick={onClick} style={{
    padding: "8px 16px", border: variant === "primary" ? "none" : "1px solid #ddd",
    background: variant === "primary" ? "#000" : "#fff",
    color: variant === "primary" ? "#fff" : "#000",
    fontSize: 13, fontWeight: 500, cursor: "pointer", borderRadius: 0,
    letterSpacing: 0.3, ...style,
  }}>{children}</button>
);

const Badge = ({ label, color = "#000" }) => (
  <span style={{
    display: "inline-block", padding: "2px 8px", fontSize: 11, fontWeight: 600,
    background: color === "green" ? "#e6f4ea" : color === "red" ? "#fce8e6" : color === "yellow" ? "#fef9e7" : "#f5f5f5",
    color: color === "green" ? "#1a7a3c" : color === "red" ? "#c0392b" : color === "yellow" ? "#b7770d" : "#333",
    letterSpacing: 0.5,
  }}>{label}</span>
);

const Table = ({ headers, rows }) => (
  <div style={{ border: "1px solid #eee", overflowX: "auto" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr style={{ borderBottom: "2px solid #000" }}>
          {headers.map((h, i) => (
            <th key={i} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, fontSize: 11, letterSpacing: 1, whiteSpace: "nowrap" }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} style={{ borderBottom: "1px solid #f0f0f0", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
            {row.map((cell, j) => (
              <td key={j} style={{ padding: "10px 14px", verticalAlign: "middle" }}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const StatCard = ({ label, value, sub, icon }) => (
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
// PAGE 1: QUẢN LÝ SẢN PHẨM
// ============================================================
type AdminCategory = { id: string; code: string; name: string };
type AdminProduct = {
  id: string;
  sku: string;
  name: string;
  category_id: string | null;
  style_segment: string | null;
  is_active: boolean;
  original_price: number | null;
  rating_avg: number | null;
  review_count: number;
  variants: Array<{ id: string; variant_sku: string; size: string | null; color: string | null; price: number }>;
  images: Array<{ id: string; url: string; sort_order: number }>;
};

const fmtVnd = (n: number | null | undefined) => `${Number(n || 0).toLocaleString("vi-VN")}₫`;

const ProductManagementPage = () => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState<AdminProduct | null>(null);
  const [addingVariant, setAddingVariant] = useState(false);
  const [addingImage, setAddingImage] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [variantForm, setVariantForm] = useState({ size: "M", color: "Đen", price: "" });
  const [imageForm, setImageForm] = useState({ url: "", sort_order: "0" });
  const [form, setForm] = useState({
    sku: "",
    name: "",
    description: "",
    category_id: "",
    style_segment: "",
    original_price: "",
    variant_size: "M",
    variant_color: "Đen",
    variant_price: "",
    image_url: "",
  });

  const reload = () => {
    setLoading(true);
    Promise.all([
      apiFetch<AdminProduct[]>("/catalog/products?limit=500"),
      apiFetch<AdminCategory[]>("/catalog/categories"),
    ])
      .then(([p, c]) => {
        setProducts(p || []);
        setCategories(c || []);
      })
      .catch(() => {
        setProducts([]);
        setCategories([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
  }, []);

  const openDetail = (p: AdminProduct) => {
    setDetail(p);
    setVariantForm({ size: "M", color: "Đen", price: "" });
    setImageForm({ url: "", sort_order: "0" });
    setImageFile(null);
  };

  const uploadImageToStorage = async () => {
    if (!detail) return;
    if (!imageFile) {
      toast.error("Vui lòng chọn file ảnh");
      return;
    }
    setUploadingImage(true);
    try {
      const cfg = getSupabaseConfig();
      const supabase = getSupabaseClient();
      const safeName = String(imageFile.name || "image").replace(/[^a-zA-Z0-9._-]+/g, "_");
      const path = `products/${detail.id}/${Date.now()}-${safeName}`;

      const { error } = await supabase.storage
        .from(cfg.bucket)
        .upload(path, imageFile, { upsert: false, contentType: imageFile.type || "image/*" });
      if (error) throw new Error(error.message || "upload_failed");

      const pub = supabase.storage.from(cfg.bucket).getPublicUrl(path);
      const publicUrl = pub?.data?.publicUrl || "";
      if (!publicUrl) throw new Error("upload_failed");

      setImageForm((f) => ({ ...f, url: publicUrl }));
      toast.success("Đã upload ảnh");
    } catch (e: any) {
      const msg = e?.message || "Upload ảnh thất bại";
      if (msg === "supabase_not_configured") {
        toast.error("Chưa cấu hình Supabase Storage (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)");
      } else {
        toast.error(msg);
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const addVariant = async () => {
    if (!detail) return;
    const price = Number(variantForm.price || 0);
    if (!variantForm.size.trim() || !variantForm.color.trim() || !price) {
      toast.error("Vui lòng nhập size/màu/giá");
      return;
    }
    setAddingVariant(true);
    try {
      await apiFetch(`/catalog/products/${detail.id}/variants`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          variant_sku: `${detail.sku}-${variantForm.size}-${variantForm.color}`,
          size: variantForm.size.trim(),
          color: variantForm.color.trim(),
          price,
        }),
      });
      toast.success("Đã thêm biến thể");
      setVariantForm({ size: "M", color: "Đen", price: "" });
      reload();
    } catch (e: any) {
      toast.error(`Không thêm được biến thể: ${e?.message || ""}`);
    } finally {
      setAddingVariant(false);
    }
  };

  const addImage = async () => {
    if (!detail) return;
    if (!imageForm.url.trim()) {
      toast.error("Vui lòng nhập URL ảnh");
      return;
    }
    setAddingImage(true);
    try {
      await apiFetch(`/catalog/products/${detail.id}/images`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          url: imageForm.url.trim(),
          sort_order: Number(imageForm.sort_order || 0),
        }),
      });
      toast.success("Đã thêm ảnh");
      setImageForm({ url: "", sort_order: "0" });
      reload();
    } catch (e: any) {
      toast.error(`Không thêm được ảnh: ${e?.message || ""}`);
    } finally {
      setAddingImage(false);
    }
  };

  const catNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of categories) m.set(c.id, c.name);
    return m;
  }, [categories]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.sku.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCat && p.category_id !== filterCat) return false;
      if (filterStatus === "active" && !p.is_active) return false;
      if (filterStatus === "inactive" && p.is_active) return false;
      return true;
    });
  }, [products, search, filterCat, filterStatus]);

  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.is_active).length;
    const noVariant = products.filter((p) => (p.variants || []).length === 0).length;
    const noImage = products.filter((p) => (p.images || []).length === 0).length;
    return { total, active, noVariant, noImage };
  }, [products]);

  const submit = async () => {
    if (!form.sku.trim() || !form.name.trim()) {
      toast.error("Vui lòng nhập SKU và tên sản phẩm");
      return;
    }
    setSubmitting(true);
    try {
      const payload: any = {
        sku: form.sku.trim(),
        name: form.name.trim(),
        description: form.description || undefined,
        category_id: form.category_id || undefined,
        style_segment: form.style_segment || undefined,
        original_price: form.original_price ? Number(form.original_price) : undefined,
      };
      const created = await apiFetch<{ id: string }>("/catalog/products", {
        method: "POST",
        auth: true,
        body: JSON.stringify(payload),
      });

      const variantPrice = Number(form.variant_price || form.original_price || 0);
      if (variantPrice > 0) {
        await apiFetch(`/catalog/products/${created.id}/variants`, {
          method: "POST",
          auth: true,
          body: JSON.stringify({
            variant_sku: `${form.sku.trim()}-${form.variant_size}-${form.variant_color}`,
            size: form.variant_size,
            color: form.variant_color,
            price: variantPrice,
          }),
        });
      }
      if (form.image_url.trim()) {
        await apiFetch(`/catalog/products/${created.id}/images`, {
          method: "POST",
          auth: true,
          body: JSON.stringify({ url: form.image_url.trim(), sort_order: 0 }),
        });
      }
      toast.success("Đã thêm sản phẩm");
      setShowForm(false);
      setForm({ sku: "", name: "", description: "", category_id: "", style_segment: "", original_price: "", variant_size: "M", variant_color: "Đen", variant_price: "", image_url: "" });
      reload();
    } catch (e: any) {
      toast.error(`Không tạo được sản phẩm: ${e?.message || ""}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Quản lý Sản phẩm" subtitle="Quản lý toàn bộ danh mục sản phẩm VELORA"
        actions={[
          <Btn key="reload" variant="secondary" onClick={reload}>↻ Tải lại</Btn>,
          <Btn key="add" onClick={() => setShowForm((v) => !v)}>+ Thêm sản phẩm</Btn>,
        ]} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <StatCard label="TỔNG SẢN PHẨM" value={String(stats.total)} sub={`${categories.length} danh mục`} icon="👗" />
        <StatCard label="ĐANG BÁN" value={String(stats.active)} sub={stats.total ? `${Math.round((stats.active / stats.total) * 100)}% danh mục` : "—"} icon="✅" />
        <StatCard label="THIẾU BIẾN THỂ" value={String(stats.noVariant)} sub="Chưa có size/color" icon="⚠️" />
        <StatCard label="THIẾU ẢNH" value={String(stats.noImage)} sub="Cần bổ sung" icon="🖼️" />
      </div>

      {showForm && (
        <div style={{ border: "1px solid #ddd", padding: 20, marginBottom: 20, background: "#fafafa" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>THÊM SẢN PHẨM</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <input placeholder="SKU *" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} style={inputStyle} />
            <input placeholder="Tên sản phẩm *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={inputStyle} />
            <select value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))} style={inputStyle}>
              <option value="">— Chọn danh mục —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={form.style_segment} onChange={(e) => setForm((f) => ({ ...f, style_segment: e.target.value }))} style={inputStyle}>
              <option value="">— Phân khúc —</option>
              <option value="nam">Nam</option>
              <option value="nu">Nữ</option>
              <option value="unisex">Unisex</option>
            </select>
            <input placeholder="Giá gốc (VND)" type="number" value={form.original_price} onChange={(e) => setForm((f) => ({ ...f, original_price: e.target.value }))} style={inputStyle} />
            <input placeholder="URL ảnh" value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} style={inputStyle} />
            <input placeholder="Size (S/M/L)" value={form.variant_size} onChange={(e) => setForm((f) => ({ ...f, variant_size: e.target.value }))} style={inputStyle} />
            <input placeholder="Màu" value={form.variant_color} onChange={(e) => setForm((f) => ({ ...f, variant_color: e.target.value }))} style={inputStyle} />
            <input placeholder="Giá biến thể (VND)" type="number" value={form.variant_price} onChange={(e) => setForm((f) => ({ ...f, variant_price: e.target.value }))} style={inputStyle} />
          </div>
          <textarea placeholder="Mô tả" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, width: "100%", marginTop: 12, resize: "vertical" }} />
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <Btn variant="secondary" onClick={() => setShowForm(false)}>Huỷ</Btn>
            <Btn onClick={submit}>{submitting ? "Đang lưu..." : "Lưu"}</Btn>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <input placeholder="Tìm kiếm theo tên hoặc SKU..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, padding: "8px 12px", border: "1px solid #ddd", fontSize: 13 }} />
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} style={{ padding: "8px 12px", border: "1px solid #ddd", fontSize: 13 }}>
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: "8px 12px", border: "1px solid #ddd", fontSize: 13 }}>
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang bán</option>
          <option value="inactive">Tạm ngừng</option>
        </select>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Đang tải dữ liệu...</div>
      ) : (
        <Table
          headers={["SKU", "TÊN SẢN PHẨM", "DANH MỤC", "BIẾN THỂ", "GIÁ BÁN", "ĐÁNH GIÁ", "TRẠNG THÁI", ""]}
          rows={filtered.map((p) => {
            const sizes = Array.from(new Set((p.variants || []).map((v) => v.size).filter(Boolean))) as string[];
            const prices = (p.variants || []).map((v) => v.price).filter((x) => typeof x === "number");
            const minPrice = prices.length ? Math.min(...prices) : (p.original_price || 0);
            const maxPrice = prices.length ? Math.max(...prices) : (p.original_price || 0);
            const priceText = minPrice === maxPrice ? fmtVnd(minPrice) : `${fmtVnd(minPrice)} – ${fmtVnd(maxPrice)}`;
            return [
              p.sku,
              p.name,
              p.category_id ? (catNameById.get(p.category_id) || "—") : "—",
              sizes.length ? sizes.join(", ") : `${p.variants?.length || 0} biến thể`,
              priceText,
              p.review_count > 0 ? `${(p.rating_avg || 0).toFixed(1)} ★ (${p.review_count})` : "—",
              p.is_active ? <Badge label="Đang bán" color="green" /> : <Badge label="Tạm ngừng" color="yellow" />,
              <Btn variant="secondary" onClick={() => openDetail(p)} style={{ padding: "6px 10px" }}>Chi tiết</Btn>,
            ];
          })}
        />
      )}
      {!loading && !filtered.length && (
        <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Không có sản phẩm phù hợp.</div>
      )}

      {detail && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            padding: 40,
            zIndex: 9999,
            overflow: "auto",
          }}
          onClick={() => setDetail(null)}
        >
          <div
            style={{
              width: "min(980px, 96vw)",
              background: "#fff",
              borderRadius: 0,
              border: "1px solid #eee",
              padding: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, color: "#888", letterSpacing: 1.2, fontWeight: 700 }}>CHI TIẾT SẢN PHẨM</div>
                <div style={{ fontSize: 18, fontWeight: 800, marginTop: 6 }}>{detail.name}</div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                  {detail.sku} · {detail.category_id ? (catNameById.get(detail.category_id) || "—") : "—"}
                </div>
              </div>
              <Btn variant="secondary" onClick={() => setDetail(null)}>Đóng</Btn>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 18 }}>
              <div style={{ border: "1px solid #eee", padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, marginBottom: 10 }}>ẢNH SẢN PHẨM</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {(detail.images || []).length ? (detail.images || []).slice(0, 9).map((img) => (
                    <div key={img.id} style={{ border: "1px solid #eee", background: "#fafafa", aspectRatio: "1/1", overflow: "hidden" }}>
                      <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </div>
                  )) : (
                    <div style={{ gridColumn: "1 / -1", color: "#999" }}>Chưa có ảnh</div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <input
                    placeholder="URL ảnh (public)"
                    value={imageForm.url}
                    onChange={(e) => setImageForm((f) => ({ ...f, url: e.target.value }))}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <input
                    placeholder="sort"
                    type="number"
                    value={imageForm.sort_order}
                    onChange={(e) => setImageForm((f) => ({ ...f, sort_order: e.target.value }))}
                    style={{ ...inputStyle, width: 90 }}
                  />
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile((e.target as HTMLInputElement).files?.[0] || null)}
                    style={{ ...inputStyle, flex: 1, padding: "6px 10px" }}
                  />
                  <Btn variant="secondary" onClick={uploadImageToStorage} style={{ whiteSpace: "nowrap" }}>
                    {uploadingImage ? "Đang upload..." : "Upload"}
                  </Btn>
                </div>
                <div style={{ marginTop: 10 }}>
                  <Btn onClick={addImage} style={{ width: "100%" }}>{addingImage ? "Đang thêm..." : "Thêm ảnh"}</Btn>
                </div>
              </div>

              <div style={{ border: "1px solid #eee", padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, marginBottom: 10 }}>BIẾN THỂ (SIZE / MÀU)</div>
                <div style={{ maxHeight: 240, overflow: "auto", border: "1px solid #f1f1f1" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #eee" }}>
                        <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, letterSpacing: 1 }}>SIZE</th>
                        <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, letterSpacing: 1 }}>MÀU</th>
                        <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, letterSpacing: 1 }}>GIÁ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(detail.variants || []).length ? (detail.variants || []).map((v) => (
                        <tr key={v.id} style={{ borderBottom: "1px solid #f6f6f6" }}>
                          <td style={{ padding: "8px 10px" }}>{v.size || "—"}</td>
                          <td style={{ padding: "8px 10px" }}>{v.color || "—"}</td>
                          <td style={{ padding: "8px 10px", fontWeight: 800 }}>{fmtVnd(v.price)}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={3} style={{ padding: "10px", color: "#999" }}>Chưa có biến thể</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
                  <input
                    placeholder="Size"
                    value={variantForm.size}
                    onChange={(e) => setVariantForm((f) => ({ ...f, size: e.target.value }))}
                    style={inputStyle}
                  />
                  <input
                    placeholder="Màu"
                    value={variantForm.color}
                    onChange={(e) => setVariantForm((f) => ({ ...f, color: e.target.value }))}
                    style={inputStyle}
                  />
                  <input
                    placeholder="Giá (VND)"
                    type="number"
                    value={variantForm.price}
                    onChange={(e) => setVariantForm((f) => ({ ...f, price: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
                <div style={{ marginTop: 10 }}>
                  <Btn onClick={addVariant} style={{ width: "100%" }}>{addingVariant ? "Đang thêm..." : "Thêm biến thể"}</Btn>
                </div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 10 }}>
                  SKU biến thể tự tạo: <b>{detail.sku}-SIZE-MÀU</b>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const inputStyle: any = { padding: "8px 12px", border: "1px solid #ddd", fontSize: 13 };

// ============================================================
// PAGE 2: NHẬP KHO
// ============================================================
const ImportStockPage = () => {
  const [step, setStep] = useState(1);
  const history = [
    ["NK001", "15/04/2026", "NCC Dệt may Hà Nội", 8, "12.400.000₫", <Badge label="Hoàn thành" color="green" />],
    ["NK002", "10/04/2026", "NCC Thời trang Miền Nam", 5, "7.800.000₫", <Badge label="Hoàn thành" color="green" />],
    ["NK003", "05/04/2026", "NCC Vải Đà Lạt", 12, "18.200.000₫", <Badge label="Hoàn thành" color="green" />],
    ["NK004", "27/04/2026", "NCC Dệt may Hà Nội", 6, "9.600.000₫", <Badge label="Đang xử lý" color="yellow" />],
  ];
  return (
    <div>
      <PageHeader title="Nhập Kho" subtitle="Tạo phiếu nhập hàng từ nhà cung cấp"
        actions={[<Btn key="new">+ Tạo phiếu nhập mới</Btn>]} />

      {/* Form nhập kho */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>
        <div style={{ border: "1px solid #eee", padding: 24 }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>THÔNG TIN PHIẾU NHẬP</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "Nhà cung cấp *", type: "select", opts: ["Chọn nhà cung cấp", "NCC Dệt may Hà Nội", "NCC Thời trang Miền Nam"] },
              { label: "Ngày nhập *", type: "date" },
              { label: "Số hoá đơn NCC", type: "text", placeholder: "VD: INV-2026-001" },
              { label: "Ghi chú", type: "textarea", placeholder: "Ghi chú thêm..." },
            ].map((f, i) => (
              <div key={i}>
                <label style={{ fontSize: 11, letterSpacing: 1, fontWeight: 600, display: "block", marginBottom: 6 }}>{f.label}</label>
                {f.type === "select" ? (
                  <select style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", fontSize: 13 }}>
                    {f.opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea placeholder={f.placeholder} rows={3} style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", fontSize: 13, resize: "none", boxSizing: "border-box" }} />
                ) : (
                  <input type={f.type} placeholder={f.placeholder} style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", fontSize: 13, boxSizing: "border-box" }} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ border: "1px solid #eee", padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>CHI TIẾT SẢN PHẨM NHẬP</h3>
            <Btn>+ Thêm dòng</Btn>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #000" }}>
                {["Sản phẩm", "Biến thể", "SL", "Đơn giá", "Thành tiền"].map(h => (
                  <th key={h} style={{ padding: "8px 6px", textAlign: "left", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Áo sơ mi trắng", "M / Trắng", "50", "90.000₫", "4.500.000₫"],
                ["Quần tây đen", "30 / Đen", "30", "130.000₫", "3.900.000₫"],
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  {row.map((c, j) => (
                    <td key={j} style={{ padding: "8px 6px" }}>
                      {j < 2 ? <input defaultValue={c} style={{ width: "100%", border: "1px solid #eee", padding: "4px 6px", fontSize: 12 }} /> : c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ textAlign: "right", marginTop: 16, padding: "12px 0", borderTop: "1px solid #eee" }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Tổng cộng: 8.400.000₫</span>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
            <Btn variant="secondary">Lưu nháp</Btn>
            <Btn>Xác nhận nhập kho</Btn>
          </div>
        </div>
      </div>

      <h3 style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1, marginBottom: 14 }}>LỊCH SỬ NHẬP KHO</h3>
      <Table
        headers={["MÃ PHIẾU", "NGÀY NHẬP", "NHÀ CUNG CẤP", "SỐ SP", "TỔNG TIỀN", "TRẠNG THÁI", "THAO TÁC"]}
        rows={history.map(r => [...r, <button style={{ fontSize: 12, padding: "3px 8px", border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>Xem</button>])}
      />
    </div>
  );
};

// ============================================================
// PAGE 3: NHÀ CUNG CẤP
// ============================================================
const SuppliersPage = () => {
  const suppliers = [
    ["NCC001", "Dệt may Hà Nội", "Nguyễn Văn A", "0901234567", "Hà Nội", 15, "124.000.000₫", <Badge label="Đang hợp tác" color="green" />],
    ["NCC002", "Thời trang Miền Nam", "Trần Thị B", "0907654321", "TP.HCM", 8, "78.500.000₫", <Badge label="Đang hợp tác" color="green" />],
    ["NCC003", "Vải Đà Lạt", "Lê Văn C", "0912345678", "Đà Lạt", 5, "42.200.000₫", <Badge label="Đang hợp tác" color="green" />],
    ["NCC004", "Phụ kiện Bình Dương", "Phạm D", "0898765432", "Bình Dương", 2, "11.600.000₫", <Badge label="Tạm dừng" color="yellow" />],
  ];
  return (
    <div>
      <PageHeader title="Quản lý Nhà Cung Cấp" subtitle="Danh sách và thông tin nhà cung cấp"
        actions={[<Btn key="add">+ Thêm nhà cung cấp</Btn>]} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
        <StatCard label="TỔNG NCC" value="12" sub="4 đang hoạt động" icon="🏢" />
        <StatCard label="ĐƠN NHẬP THÁNG NÀY" value="8" sub="vs 6 tháng trước" icon="📦" />
        <StatCard label="TỔNG GIÁ TRỊ NHẬP" value="256M₫" sub="YTD 2026" icon="💰" />
      </div>
      <div style={{ marginBottom: 16 }}>
        <input placeholder="Tìm nhà cung cấp..." style={{ padding: "8px 12px", border: "1px solid #ddd", fontSize: 13, width: 300 }} />
      </div>
      <Table
        headers={["MÃ NCC", "TÊN NCC", "LIÊN HỆ", "SĐT", "ĐỊA CHỈ", "ĐƠN NHẬP", "TỔNG MUA", "TRẠNG THÁI", "THAO TÁC"]}
        rows={suppliers.map(r => [...r, (
          <div style={{ display: "flex", gap: 6 }}>
            <button style={{ fontSize: 12, padding: "3px 8px", border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>Sửa</button>
            <button style={{ fontSize: 12, padding: "3px 8px", border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>Xem</button>
          </div>
        )])}
      />
    </div>
  );
};

// ============================================================
// PAGE 4: VẬN CHUYỂN
// ============================================================
const ShippingPage = () => {
  const shipments = [
    ["VC001", "DH2026042701", "Nguyễn Lan Anh", "Giao Hàng Nhanh", "2026-04-27", <Badge label="Đang giao" color="yellow" />, "GHN123456789"],
    ["VC002", "DH2026042602", "Trần Minh Khoa", "Giao Hàng Tiết Kiệm", "2026-04-26", <Badge label="Đã giao" color="green" />, "GHTK987654321"],
    ["VC003", "DH2026042503", "Lê Thị Thu", "J&T Express", "2026-04-25", <Badge label="Đã giao" color="green" />, "JT556677889"],
    ["VC004", "DH2026042704", "Phạm Quốc Bảo", "Giao Hàng Nhanh", "2026-04-27", <Badge label="Chờ lấy hàng" color="yellow" />, "GHN000111222"],
    ["VC005", "DH2026042405", "Hồ Thanh Vân", "ViettelPost", "2026-04-24", <Badge label="Hoàn hàng" color="red" />, "VP334455667"],
  ];
  return (
    <div>
      <PageHeader title="Quản lý Vận Chuyển" subtitle="Theo dõi và quản lý đơn vị vận chuyển" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <StatCard label="ĐANG GIAO" value="34" sub="Cần theo dõi" icon="🚚" />
        <StatCard label="ĐÃ GIAO HÔM NAY" value="18" sub="98% đúng hẹn" icon="✅" />
        <StatCard label="CHỜ LẤY HÀNG" value="12" sub="Cần đóng gói" icon="📦" />
        <StatCard label="HOÀN HÀNG" value="3" sub="Cần xử lý" icon="↩️" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { name: "Giao Hàng Nhanh", orders: 18, rate: "98%", color: "#e8f5e9" },
          { name: "GHTK", orders: 12, rate: "96%", color: "#e3f2fd" },
          { name: "J&T Express", orders: 8, rate: "94%", color: "#fce4ec" },
          { name: "ViettelPost", orders: 5, rate: "92%", color: "#fff8e1" },
        ].map(c => (
          <div key={c.name} style={{ padding: 16, border: "1px solid #eee", background: c.color }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{c.name}</div>
            <div style={{ fontSize: 12, color: "#666" }}>{c.orders} đơn · Đúng hẹn {c.rate}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <input placeholder="Tìm mã vận đơn, đơn hàng..." style={{ flex: 1, padding: "8px 12px", border: "1px solid #ddd", fontSize: 13 }} />
        <select style={{ padding: "8px 12px", border: "1px solid #ddd", fontSize: 13 }}>
          <option>Tất cả đơn vị</option><option>GHN</option><option>GHTK</option><option>J&T</option>
        </select>
        <select style={{ padding: "8px 12px", border: "1px solid #ddd", fontSize: 13 }}>
          <option>Tất cả trạng thái</option><option>Đang giao</option><option>Đã giao</option><option>Hoàn hàng</option>
        </select>
      </div>

      <Table
        headers={["MÃ VC", "ĐƠN HÀNG", "KHÁCH HÀNG", "ĐƠN VỊ VẬN CHUYỂN", "NGÀY GỬI", "TRẠNG THÁI", "MÃ VẬN ĐƠN", "THAO TÁC"]}
        rows={shipments.map(r => [...r, <button style={{ fontSize: 12, padding: "3px 8px", border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>Theo dõi</button>])}
      />
    </div>
  );
};

// ============================================================
// PAGE 5: BÁO CÁO & THỐNG KÊ
// ============================================================
const ReportsPage = () => {
  const [period, setPeriod] = useState("month");
  const months = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
  const revenue = [42, 58, 51, 67, 73, 89, 76, 94, 88, 102, 95, 118];
  const maxRev = Math.max(...revenue);

  return (
    <div>
      <PageHeader title="Báo cáo & Thống kê" subtitle="Tổng quan hoạt động kinh doanh VELORA"
        actions={[
          <select key="p" value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: "8px 12px", border: "1px solid #ddd", fontSize: 13 }}>
            <option value="week">Tuần này</option>
            <option value="month">Tháng này</option>
            <option value="quarter">Quý này</option>
            <option value="year">Năm 2026</option>
          </select>,
          <Btn key="ex" variant="secondary">Xuất báo cáo</Btn>
        ]} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <StatCard label="DOANH THU" value="118M₫" sub="▲ 24% vs tháng trước" icon="💰" />
        <StatCard label="ĐƠN HÀNG" value="1,248" sub="▲ 18% vs tháng trước" icon="📦" />
        <StatCard label="KHÁCH MỚI" value="312" sub="▲ 8% vs tháng trước" icon="👥" />
        <StatCard label="TỈ LỆ HOÀN HÀNG" value="2.4%" sub="▼ 0.3% vs tháng trước" icon="↩️" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Revenue Chart */}
        <div style={{ border: "1px solid #eee", padding: 24 }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>DOANH THU THEO THÁNG (Triệu ₫)</h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 160 }}>
            {months.map((m, i) => (
              <div key={m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ width: "100%", background: i === 11 ? "#000" : "#e0e0e0", height: `${(revenue[i] / maxRev) * 140}px`, transition: "height 0.3s" }} />
                <div style={{ fontSize: 9, color: "#aaa" }}>{m}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Channel Breakdown */}
        <div style={{ border: "1px solid #eee", padding: 24 }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>DOANH THU THEO KÊNH</h3>
          {[
            { channel: "Website VELORA", percent: 42, amount: "49.6M₫", color: "#000" },
            { channel: "Shopee", percent: 28, amount: "33.0M₫", color: "#f57d30" },
            { channel: "Lazada", percent: 18, amount: "21.2M₫", color: "#0f146b" },
            { channel: "POS (Cửa hàng)", percent: 12, amount: "14.2M₫", color: "#888" },
          ].map(c => (
            <div key={c.channel} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
                <span>{c.channel}</span>
                <span style={{ fontWeight: 700 }}>{c.amount} ({c.percent}%)</span>
              </div>
              <div style={{ height: 6, background: "#f5f5f5", borderRadius: 0 }}>
                <div style={{ height: "100%", width: `${c.percent}%`, background: c.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Top Products */}
        <div style={{ border: "1px solid #eee", padding: 24 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>SẢN PHẨM BÁN CHẠY</h3>
          {[
            ["Áo sơ mi trắng cổ bẻ", "324 cái", "145.8M₫"],
            ["Quần tây đen slim fit", "218 cái", "141.7M₫"],
            ["Đầm midi floral", "186 cái", "165.5M₫"],
            ["Áo khoác bomber", "142 cái", "170.4M₫"],
            ["Chân váy denim", "138 cái", "58.0M₫"],
          ].map((p, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f5f5f5", fontSize: 13 }}>
              <span style={{ color: "#888", width: 20 }}>{i + 1}</span>
              <span style={{ flex: 1 }}>{p[0]}</span>
              <span style={{ color: "#888", fontSize: 12 }}>{p[1]}</span>
              <span style={{ fontWeight: 600, marginLeft: 16 }}>{p[2]}</span>
            </div>
          ))}
        </div>

        {/* Inventory Report */}
        <div style={{ border: "1px solid #eee", padding: 24 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>BÁO CÁO TỒN KHO</h3>
          {[
            ["Tổng SKU", "248", ""],
            ["Tổng số lượng tồn", "4,820", ""],
            ["Giá trị tồn kho", "2.17 Tỷ₫", ""],
            ["SP sắp hết hàng", "18 SKU", "yellow"],
            ["SP hết hàng", "20 SKU", "red"],
            ["Vòng quay tồn kho", "8.2 lần/năm", "green"],
          ].map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f5f5f5", fontSize: 13 }}>
              <span style={{ color: "#666" }}>{r[0]}</span>
              {r[2] ? <Badge label={r[1]} color={r[2]} /> : <span style={{ fontWeight: 600 }}>{r[1]}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// PAGE 6: QUẢN LÝ ĐƠN HÀNG ADMIN
// ============================================================
type AdminOrder = {
  id: string;
  code: string;
  status: string;
  customer_id: string | null;
  subtotal_amount: number;
  discount_amount: number;
  shipping_fee: number;
  total_amount: number;
  placed_at: string | null;
  created_at: string | null;
};

const ORDER_STATUSES: Array<{ value: string; label: string; color: "green" | "red" | "yellow" | "default" }> = [
  { value: "placed", label: "Đã đặt", color: "yellow" },
  { value: "confirmed", label: "Đã xác nhận", color: "yellow" },
  { value: "packed", label: "Đã đóng gói", color: "yellow" },
  { value: "shipped", label: "Đang giao", color: "yellow" },
  { value: "delivered", label: "Đã giao", color: "green" },
  { value: "cancelled", label: "Đã huỷ", color: "red" },
  { value: "returned", label: "Hoàn hàng", color: "red" },
];

const orderStatusBadge = (s: string) => {
  const found = ORDER_STATUSES.find((x) => x.value === s);
  return <Badge label={found?.label || s} color={found?.color || "default"} />;
};

const OrdersAdminPage = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const reload = () => {
    setLoading(true);
    apiFetch<AdminOrder[]>("/orders?limit=200", { auth: true })
      .then((rows) => setOrders(rows || []))
      .catch((e) => {
        if (e?.message === "forbidden") {
          toast.error("Bạn không có quyền xem đơn hàng (cần ORDER_READ)");
        } else if (e?.message !== "missing_token" && e?.message !== "invalid_token") {
          toast.error(`Lỗi tải đơn hàng: ${e?.message || ""}`);
        }
        setOrders([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    for (const s of ORDER_STATUSES) c[s.value] = 0;
    for (const o of orders) c[o.status] = (c[o.status] || 0) + 1;
    return c;
  }, [orders]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (tab !== "all" && o.status !== tab) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!o.code.toLowerCase().includes(q) && !(o.customer_id || "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [orders, tab, search]);

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter((o) => (o.placed_at || o.created_at || "").startsWith(todayKey));
  const todayRevenue = todayOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const pendingCount = orders.filter((o) => o.status === "placed").length;
  const returnedCount = orders.filter((o) => o.status === "returned").length;

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await apiFetch(`/orders/${orderId}/status`, {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success("Đã cập nhật trạng thái");
      setOrders((arr) => arr.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    } catch (e: any) {
      if (e?.message === "forbidden") {
        toast.error("Bạn không có quyền cập nhật trạng thái");
      } else {
        toast.error(`Lỗi: ${e?.message || ""}`);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const fmtTime = (iso: string | null) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return `${d.toLocaleDateString("vi-VN")} ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
    } catch {
      return iso;
    }
  };

  const tabs: Array<[string, string]> = [
    ["all", `Tất cả (${counts.all || 0})`],
    ...ORDER_STATUSES.map((s) => [s.value, `${s.label} (${counts[s.value] || 0})`] as [string, string]),
  ];

  return (
    <div>
      <PageHeader title="Quản lý Đơn Hàng" subtitle="Đơn hàng từ website VELORA"
        actions={[<Btn key="reload" variant="secondary" onClick={reload}>↻ Tải lại</Btn>]} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard label="ĐƠN HÔM NAY" value={String(todayOrders.length)} sub={`Tổng ${orders.length} đơn`} icon="📦" />
        <StatCard label="CHỜ XỬ LÝ" value={String(pendingCount)} sub="status = placed" icon="⏳" />
        <StatCard label="DOANH THU HÔM NAY" value={fmtVnd(todayRevenue)} sub={`${todayOrders.length} đơn`} icon="💰" />
        <StatCard label="HOÀN HÀNG" value={String(returnedCount)} sub="Cần xử lý" icon="↩️" />
      </div>
      <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "2px solid #000", overflowX: "auto" }}>
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: "10px 16px", border: "none", background: "none", cursor: "pointer", whiteSpace: "nowrap",
            fontWeight: tab === id ? 700 : 400, fontSize: 12,
            borderBottom: tab === id ? "2px solid #000" : "2px solid transparent", marginBottom: -2,
          }}>{label}</button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm mã đơn, mã khách..." style={{ flex: 1, padding: "8px 12px", border: "1px solid #ddd", fontSize: 13 }} />
      </div>
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Đang tải đơn hàng...</div>
      ) : !filtered.length ? (
        <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Không có đơn hàng phù hợp.</div>
      ) : (
        <Table
          headers={["MÃ ĐƠN", "THỜI GIAN", "KHÁCH (ID)", "TỔNG TIỀN", "PHÍ SHIP", "TRẠNG THÁI", "CẬP NHẬT"]}
          rows={filtered.map((o) => [
            <span style={{ fontFamily: "monospace" }}>{o.code}</span>,
            fmtTime(o.placed_at || o.created_at),
            o.customer_id ? `${o.customer_id.slice(0, 8)}…` : "—",
            <strong>{fmtVnd(o.total_amount)}</strong>,
            fmtVnd(o.shipping_fee),
            orderStatusBadge(o.status),
            (
              <select
                value={o.status}
                disabled={updatingId === o.id}
                onChange={(e) => updateStatus(o.id, e.target.value)}
                style={{ padding: "4px 6px", border: "1px solid #ddd", fontSize: 12 }}
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            ),
          ])}
        />
      )}
    </div>
  );
};

// ============================================================
// PAGE 7: QUẢN LÝ KHÁCH HÀNG (CRM)
// ============================================================
type AdminUser = {
  id: string;
  user_type: string;
  status: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  created_at: string | null;
  order_count?: number;
  total_spent?: number;
  last_order_at?: string | null;
};

const CustomerCRMPage = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [sort, setSort] = useState("recent");

  const reload = () => {
    setLoading(true);
    apiFetch<AdminUser[]>("/admin/users?limit=200", { auth: true })
      .then((rows) => setUsers(rows || []))
      .catch((e) => {
        if (e?.message === "forbidden") {
          toast.error("Bạn không có quyền xem khách hàng (cần CUSTOMER_READ)");
        } else if (e?.message !== "missing_token" && e?.message !== "invalid_token") {
          toast.error(`Lỗi tải khách hàng: ${e?.message || ""}`);
        }
        setUsers([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
  }, []);

  const filtered = useMemo(() => {
    let list = users;
    if (filterType) list = list.filter((u) => u.user_type === filterType);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((u) =>
        (u.full_name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.phone || "").toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      switch (sort) {
        case "orders":
          return (b.order_count || 0) - (a.order_count || 0);
        case "spent":
          return (b.total_spent || 0) - (a.total_spent || 0);
        case "recent":
        default:
          return (b.created_at || "").localeCompare(a.created_at || "");
      }
    });
  }, [users, search, filterType, sort]);

  const totalCustomers = users.filter((u) => u.user_type === "customer").length;
  const totalEmployees = users.filter((u) => u.user_type === "employee" || u.user_type === "admin").length;
  const buyers = users.filter((u) => (u.order_count || 0) > 0).length;
  const ltv = buyers > 0 ? users.reduce((s, u) => s + (u.total_spent || 0), 0) / buyers : 0;

  const fmtDate = (iso: string | null | undefined) => {
    if (!iso) return "—";
    try { return new Date(iso).toLocaleDateString("vi-VN"); } catch { return iso; }
  };

  return (
    <div>
      <PageHeader title="Quản lý Khách Hàng" subtitle="CRM - Lịch sử và phân tích người dùng hệ thống"
        actions={[<Btn key="reload" variant="secondary" onClick={reload}>↻ Tải lại</Btn>]} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard label="TỔNG KHÁCH HÀNG" value={String(totalCustomers)} sub={`${users.length} người dùng`} icon="👥" />
        <StatCard label="KHÁCH ĐÃ MUA" value={String(buyers)} sub={totalCustomers ? `${Math.round((buyers / totalCustomers) * 100)}% tổng` : "—"} icon="🛍️" />
        <StatCard label="NHÂN VIÊN" value={String(totalEmployees)} sub="employee + admin" icon="🧑‍💼" />
        <StatCard label="LTV TRUNG BÌNH" value={fmtVnd(ltv)} sub="Trung bình/khách mua" icon="💎" />
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm tên, email, SĐT..." style={{ flex: 1, padding: "8px 12px", border: "1px solid #ddd", fontSize: 13 }} />
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ padding: "8px 12px", border: "1px solid #ddd", fontSize: 13 }}>
          <option value="">Tất cả vai trò</option>
          <option value="customer">Khách hàng</option>
          <option value="employee">Nhân viên</option>
          <option value="admin">Admin</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ padding: "8px 12px", border: "1px solid #ddd", fontSize: 13 }}>
          <option value="recent">Mới đăng ký</option>
          <option value="orders">Đơn nhiều nhất</option>
          <option value="spent">Chi tiêu nhiều nhất</option>
        </select>
      </div>
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Đang tải...</div>
      ) : !filtered.length ? (
        <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Không có người dùng phù hợp.</div>
      ) : (
        <Table
          headers={["HỌ TÊN", "EMAIL", "SĐT", "VAI TRÒ", "TỔNG ĐƠN", "TỔNG CHI TIÊU", "MUA GẦN NHẤT", "ĐĂNG KÝ"]}
          rows={filtered.map((u) => [
            u.full_name,
            u.email || "—",
            u.phone || "—",
            u.user_type === "customer" ? <Badge label="Khách hàng" color="green" />
              : u.user_type === "admin" ? <Badge label="Admin" color="yellow" />
              : <Badge label={u.user_type || "—"} color="default" />,
            u.order_count || 0,
            fmtVnd(u.total_spent || 0),
            fmtDate(u.last_order_at || null),
            fmtDate(u.created_at),
          ])}
        />
      )}
    </div>
  );
};

// ============================================================
// PAGE 8: KẾT NỐI SÀN TMĐT (MARKETPLACE)
// ============================================================
const MarketplacePage = () => {
  const [shopeeConnected, setShopeeConnected] = useState(true);
  const [lazadaConnected, setLazadaConnected] = useState(true);
  const [tiktokConnected, setTiktokConnected] = useState(false);

  const platforms = [
    { name: "Shopee", icon: "🛍️", color: "#f57d30", connected: shopeeConnected, toggle: () => setShopeeConnected(!shopeeConnected), shop: "VELORA Official Store", products: 156, orders: 284, revenue: "33.0M₫" },
    { name: "Lazada", icon: "📦", color: "#0f146b", connected: lazadaConnected, toggle: () => setLazadaConnected(!lazadaConnected), shop: "VELORA Fashion", products: 98, orders: 142, revenue: "21.2M₫" },
    { name: "TikTok Shop", icon: "🎵", color: "#000", connected: tiktokConnected, toggle: () => setTiktokConnected(!tiktokConnected), shop: "Chưa kết nối", products: 0, orders: 0, revenue: "-" },
  ];

  return (
    <div>
      <PageHeader title="Kết nối Sàn TMĐT" subtitle="Tích hợp và quản lý các kênh bán hàng đa nền tảng" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 32 }}>
        {platforms.map(p => (
          <div key={p.name} style={{ border: `2px solid ${p.connected ? p.color : "#eee"}`, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 28 }}>{p.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "#888" }}>{p.shop}</div>
                </div>
              </div>
              <div style={{
                width: 40, height: 22, borderRadius: 11, background: p.connected ? p.color : "#ddd",
                cursor: "pointer", position: "relative", transition: "background 0.2s",
              }} onClick={p.toggle}>
                <div style={{
                  position: "absolute", top: 2, left: p.connected ? 20 : 2, width: 18, height: 18,
                  borderRadius: "50%", background: "#fff", transition: "left 0.2s",
                }} />
              </div>
            </div>

            {p.connected ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  {[["Sản phẩm", p.products], ["Đơn hàng/tháng", p.orders], ["Doanh thu/tháng", p.revenue]].map(([label, val]) => (
                    <div key={label} style={{ textAlign: "center" }}>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{val}</div>
                      <div style={{ fontSize: 10, color: "#888" }}>{label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn variant="secondary" style={{ flex: 1, fontSize: 12 }}>Cài đặt</Btn>
                  <Btn style={{ flex: 1, fontSize: 12, background: p.color }}>Đồng bộ ngay</Btn>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ fontSize: 12, color: "#aaa", marginBottom: 12 }}>Chưa kết nối tài khoản</div>
                <Btn style={{ background: p.color }}>Kết nối {p.name}</Btn>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ border: "1px solid #eee", padding: 24, marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>CÀI ĐẶT ĐỒNG BỘ TỰ ĐỘNG</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {[
            { label: "Đồng bộ tồn kho", desc: "Tự động cập nhật số lượng tồn trên tất cả sàn", checked: true },
            { label: "Đồng bộ giá bán", desc: "Cập nhật giá khi thay đổi trên hệ thống", checked: true },
            { label: "Tự động nhận đơn", desc: "Đơn từ sàn tự động vào hệ thống", checked: true },
            { label: "Đồng bộ thông tin sản phẩm", desc: "Tên, mô tả, hình ảnh sản phẩm", checked: false },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f5f5f5" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{s.desc}</div>
              </div>
              <div style={{
                width: 36, height: 20, borderRadius: 10, background: s.checked ? "#000" : "#ddd",
                cursor: "pointer", position: "relative",
              }}>
                <div style={{
                  position: "absolute", top: 2, left: s.checked ? 18 : 2, width: 16, height: 16,
                  borderRadius: "50%", background: "#fff",
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// PAGE 9: ĐỒNG BỘ KÊNH
// ============================================================
const SyncDashboardPage = () => {
  const syncItems = [
    ["Áo sơ mi trắng cổ bẻ", "SP001", "Shopee", "42 → 42", "Giá: 450.000₫", "27/04 10:30", <Badge label="Thành công" color="green" />],
    ["Quần tây đen slim fit", "SP002", "Lazada", "15 → 15", "Giá: 650.000₫", "27/04 10:28", <Badge label="Thành công" color="green" />],
    ["Đầm midi floral", "SP003", "Shopee", "3 → 3", "Giá: 890.000₫", "27/04 10:25", <Badge label="Thành công" color="green" />],
    ["Áo khoác bomber", "SP004", "Lazada", "0 → 0", "Hết hàng", "27/04 09:00", <Badge label="Lỗi" color="red" />],
  ];
  return (
    <div>
      <PageHeader title="Đồng Bộ Kênh" subtitle="Trạng thái đồng bộ sản phẩm, giá và tồn kho"
        actions={[<Btn key="sync">🔄 Đồng bộ tất cả</Btn>]} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard label="ĐỒNG BỘ THÀNH CÔNG" value="1,024" sub="Hôm nay" icon="✅" />
        <StatCard label="ĐANG ĐỒNG BỘ" value="12" sub="Đang xử lý" icon="🔄" />
        <StatCard label="LỖI ĐỒNG BỘ" value="3" sub="Cần xử lý" icon="❌" />
        <StatCard label="LẦN ĐỒNG BỘ CUỐI" value="10:30" sub="27/04/2026" icon="🕐" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {[
          { name: "Shopee", icon: "🛍️", color: "#f57d30", status: "Hoạt động", lastSync: "10:30", products: 156, errors: 1 },
          { name: "Lazada", icon: "📦", color: "#0f146b", status: "Hoạt động", lastSync: "10:28", products: 98, errors: 2 },
        ].map(p => (
          <div key={p.name} style={{ border: "1px solid #eee", padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>{p.icon}</span>
                <span style={{ fontWeight: 700 }}>{p.name}</span>
              </div>
              <Badge label={p.status} color="green" />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#666" }}>
              <span>Đồng bộ lần cuối: {p.lastSync}</span>
              <span>{p.products} sản phẩm</span>
              {p.errors > 0 && <span style={{ color: "#c0392b" }}>{p.errors} lỗi</span>}
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <Btn variant="secondary" style={{ fontSize: 12 }}>Xem log</Btn>
              <Btn style={{ fontSize: 12, background: p.color }}>Đồng bộ ngay</Btn>
            </div>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>LỊCH SỬ ĐỒNG BỘ GẦN ĐÂY</h3>
      <Table
        headers={["SẢN PHẨM", "MÃ SP", "SÀN", "TỒN KHO", "GIÁ", "THỜI GIAN", "KẾT QUẢ"]}
        rows={syncItems}
      />
    </div>
  );
};

// ============================================================
// MAIN APP
// ============================================================
export default function VeloraAdminApp() {
  const [activePage, setActivePage] = useState("products");

  const pages = {
    products: <ProductManagementPage />,
    import: <ImportStockPage />,
    suppliers: <SuppliersPage />,
    shipping: <ShippingPage />,
    reports: <ReportsPage />,
    orders: <OrdersAdminPage />,
    customers: <CustomerCRMPage />,
    marketplace: <MarketplacePage />,
    sync: <SyncDashboardPage />,
    "sync-logs": (
      <div>
        <PageHeader title="Lịch sử Đồng Bộ" subtitle="Log chi tiết tất cả hoạt động đồng bộ" />
        <Table
          headers={["THỜI GIAN", "SÀN", "HÀNH ĐỘNG", "SỐ LƯỢNG", "THÀNH CÔNG", "LỖI", "TRẠNG THÁI"]}
          rows={[
            ["27/04 10:30", "Shopee", "Đồng bộ tồn kho", "156", "155", "1", <Badge label="Một phần" color="yellow" />],
            ["27/04 10:28", "Lazada", "Đồng bộ giá", "98", "96", "2", <Badge label="Một phần" color="yellow" />],
            ["27/04 09:00", "Shopee + Lazada", "Nhận đơn hàng", "24", "24", "0", <Badge label="Thành công" color="green" />],
            ["26/04 23:00", "Shopee + Lazada", "Đồng bộ tự động", "254", "254", "0", <Badge label="Thành công" color="green" />],
          ]}
        />
      </div>
    ),
  };

  return (
    <div style={{ display: "flex", fontFamily: "'Helvetica Neue', Arial, sans-serif", background: "#f9f9f9", minHeight: "100vh" }}>
      <VeloraAdminSidebar activePage={activePage} onNavigate={setActivePage} />
      <main style={{ flex: 1, padding: 32, overflow: "auto" }}>
        {pages[activePage] || (
          <div style={{ textAlign: "center", padding: 80, color: "#aaa" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🚧</div>
            <div>Trang đang được phát triển</div>
          </div>
        )}
      </main>
    </div>
  );
}