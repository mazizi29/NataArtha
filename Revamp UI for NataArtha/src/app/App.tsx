import { useState, useMemo, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  LayoutDashboard, History, Plus, Wallet, Bell,
  Search, X, Trash2, Edit3, CircleUser,
  TrendingUp, TrendingDown, ChevronRight,
  Receipt, Menu, ArrowUpRight, ArrowDownRight,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types & Constants
// ─────────────────────────────────────────────────────────────────────────────

type View    = "dashboard" | "history";
type TxType  = "income" | "expense";

interface Transaction {
  id: string; type: TxType; amount: number;
  category: string; note: string; date: string;
}

const PHI = 1.618;

const INCOME_CATS  = ["Gaji","Bonus","Freelance","Investasi","Usaha","Tabungan","Sewa","Dividen","Hadiah","Pengembalian","Lainnya"];
const EXPENSE_CATS = ["Makanan","Minuman","Jajan","Transportasi","Hiburan","Kesehatan","Belanja","Tagihan","Pendidikan","Asuransi","Pinjaman","Lainnya"];

const CAT_ICON: Record<string, string> = {
  Gaji:"💼", Bonus:"🎯", Freelance:"💻", Investasi:"📈", Usaha:"🏢",
  Tabungan:"🏦", Sewa:"🏠", Dividen:"💎", Hadiah:"🎁", Pengembalian:"↩️",
  Makanan:"🍽️", Minuman:"☕", Jajan:"🍡", Transportasi:"🚗", Hiburan:"🎬",
  Kesehatan:"💊", Belanja:"🛍️", Tagihan:"📱", Pendidikan:"📚",
  Asuransi:"🛡️", Pinjaman:"🤝", Lainnya:"📦",
};

const formatRp  = (n: number) => "Rp " + n.toLocaleString("id-ID");
const shortRp   = (n: number) => {
  if (n >= 1_000_000) return "Rp " + (n / 1_000_000).toFixed(1).replace(".0","") + "jt";
  if (n >= 1_000)     return "Rp " + (n / 1_000).toFixed(0) + "rb";
  return "Rp " + n;
};

// ─────────────────────────────────────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_TXS: Transaction[] = [
  { id:"1",  type:"income",  amount:8500000,  category:"Gaji",         note:"Gaji bulan Juli 2026",       date:"2026-07-01" },
  { id:"2",  type:"expense", amount:850000,   category:"Makanan",      note:"Belanja groceries mingguan",  date:"2026-07-02" },
  { id:"3",  type:"expense", amount:250000,   category:"Transportasi", note:"Bensin & parkir",             date:"2026-07-03" },
  { id:"4",  type:"income",  amount:1200000,  category:"Freelance",    note:"Proyek website klien baru",   date:"2026-07-03" },
  { id:"5",  type:"expense", amount:320000,   category:"Hiburan",      note:"Bioskop & dinner",            date:"2026-07-04" },
  { id:"6",  type:"expense", amount:150000,   category:"Minuman",      note:"Kopi & snack kantor",         date:"2026-07-04" },
  { id:"7",  type:"expense", amount:500000,   category:"Tagihan",      note:"Listrik & air bulan ini",     date:"2026-07-05" },
  { id:"8",  type:"income",  amount:750000,   category:"Bonus",        note:"Bonus performa Q2",           date:"2026-07-05" },
  { id:"9",  type:"expense", amount:1200000,  category:"Belanja",      note:"Pakaian kerja baru",          date:"2026-07-04" },
  { id:"10", type:"expense", amount:180000,   category:"Kesehatan",    note:"Vitamin & suplemen",          date:"2026-07-03" },
  { id:"11", type:"income",  amount:2000000,  category:"Investasi",    note:"Dividen reksa dana",          date:"2026-06-30" },
  { id:"12", type:"expense", amount:420000,   category:"Makanan",      note:"Makan keluarga akhir pekan",  date:"2026-06-29" },
];

const CHART_DATA = [
  { label:"28 Jun", income:0,       expense:420000  },
  { label:"29 Jun", income:0,       expense:180000  },
  { label:"30 Jun", income:2000000, expense:650000  },
  { label:"1 Jul",  income:8500000, expense:320000  },
  { label:"2 Jul",  income:0,       expense:850000  },
  { label:"3 Jul",  income:1200000, expense:430000  },
  { label:"4 Jul",  income:0,       expense:1970000 },
  { label:"5 Jul",  income:750000,  expense:500000  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens (inline, mirroring theme.css values for component use)
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  bg:        "#080B14",
  card:      "#0E1420",
  surface:   "#131C2B",
  border:    "rgba(255,255,255,0.06)",
  borderGold:"rgba(201,168,76,0.18)",
  gold:      "#C9A84C",
  goldLight: "#E8C96A",
  teal:      "#2DD4AE",
  red:       "#FF6B6B",
  fg:        "#EDF0F7",
  muted:     "#8B95A9",
  sidebar:   "#060910",
};

// ─────────────────────────────────────────────────────────────────────────────
// useBreakpoint — detect viewport width on client
// ─────────────────────────────────────────────────────────────────────────────
function useBreakpoint() {
  const [w, setW] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1024
  );
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return { isMobile: w < 768, isTablet: w >= 768 && w < 1024, isDesktop: w >= 1024 };
}

// ─────────────────────────────────────────────────────────────────────────────
// StatCard
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({
  label, value, trend, trendUp, accent, icon: Icon,
}: {
  label: string; value: string;
  trend?: string; trendUp?: boolean; accent?: boolean;
  icon?: React.ElementType;
}) {
  return (
    <div
      className="rounded-xl flex flex-col gap-2 transition-all duration-200 hover:scale-[1.01]"
      style={{
        padding: "clamp(14px, 3vw, 20px)",
        background: accent
          ? `linear-gradient(135deg, rgba(201,168,76,0.13) 0%, rgba(201,168,76,0.04) 100%)`
          : C.card,
        border: `1px solid ${accent ? C.borderGold : C.border}`,
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="font-semibold uppercase tracking-widest text-muted-foreground"
          style={{ fontSize: "clamp(10px, 1.5vw, 12px)" }}
        >
          {label}
        </span>
        {Icon && (
          <div
            className="rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              width: 30, height: 30,
              background: accent ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.05)",
            }}
          >
            <Icon size={14} style={{ color: accent ? C.gold : C.muted }} />
          </div>
        )}
      </div>
      <span
        className="leading-none"
        style={{
          fontSize: "clamp(17px, 2.8vw, 24px)",
          fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace",
          color: accent ? C.gold : C.fg,
        }}
      >
        {value}
      </span>
      {trend && (
        <span
          className="flex items-center gap-1 font-semibold w-fit rounded-full px-2 py-0.5"
          style={{
            fontSize: "clamp(10px, 1.4vw, 12px)",
            color: trendUp ? C.teal : C.red,
            background: trendUp ? "rgba(45,212,174,0.1)" : "rgba(255,107,107,0.1)",
          }}
        >
          {trendUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {trend}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TxRow
// ─────────────────────────────────────────────────────────────────────────────
function TxRow({
  tx, onDelete, onEdit, alwaysShowActions,
}: {
  tx: Transaction;
  onDelete: (id: string) => void;
  onEdit: (tx: Transaction) => void;
  alwaysShowActions?: boolean;
}) {
  const isIncome = tx.type === "income";
  return (
    <div
      className="flex items-center rounded-xl border border-transparent hover:border-border hover:bg-accent/30 group transition-all duration-150"
      style={{ gap: "clamp(10px, 2.5vw, 16px)", padding: "clamp(10px, 2vw, 14px) clamp(10px, 2.5vw, 16px)" }}
    >
      {/* Category icon */}
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-xl"
        style={{
          width: "clamp(34px, 6vw, 42px)",
          height: "clamp(34px, 6vw, 42px)",
          fontSize: "clamp(14px, 2.5vw, 18px)",
          background: isIncome ? "rgba(45,212,174,0.12)" : "rgba(255,107,107,0.10)",
        }}
      >
        {CAT_ICON[tx.category] ?? "📦"}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className="font-medium text-foreground truncate"
          style={{ fontSize: "clamp(12px, 2vw, 14px)" }}
        >
          {tx.category}
        </p>
        <p
          className="text-muted-foreground truncate mt-0.5"
          style={{ fontSize: "clamp(10px, 1.6vw, 12px)" }}
        >
          {tx.note}
        </p>
      </div>

      {/* Amount + date */}
      <div className="text-right flex-shrink-0">
        <p
          className="font-semibold"
          style={{
            fontSize: "clamp(11px, 1.8vw, 13px)",
            fontFamily: "'JetBrains Mono', monospace",
            color: isIncome ? C.teal : C.red,
          }}
        >
          {isIncome ? "+" : "−"}{shortRp(tx.amount)}
        </p>
        <p
          className="text-muted-foreground mt-0.5"
          style={{ fontSize: "clamp(9px, 1.4vw, 11px)" }}
        >
          {new Date(tx.date).toLocaleDateString("id-ID", { day:"numeric", month:"short" })}
        </p>
      </div>

      {/* Actions */}
      <div
        className={`flex items-center gap-1 flex-shrink-0 ${alwaysShowActions ? "flex" : "hidden group-hover:flex"}`}
      >
        <button
          onClick={() => onEdit(tx)}
          className="rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-accent transition-all"
          style={{ width: "clamp(26px, 4vw, 30px)", height: "clamp(26px, 4vw, 30px)" }}
        >
          <Edit3 size={12} />
        </button>
        <button
          onClick={() => onDelete(tx.id)}
          className="rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
          style={{ width: "clamp(26px, 4vw, 30px)", height: "clamp(26px, 4vw, 30px)" }}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Chart tooltip
// ─────────────────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl border"
      style={{
        background: C.surface,
        borderColor: C.borderGold,
        padding: "10px 14px",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "11px",
      }}
    >
      <p style={{ color: C.muted, marginBottom: "6px" }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color, fontWeight: 600 }}>
          {p.name === "income" ? "Masuk" : "Keluar"}: {shortRp(p.value)}
        </p>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Add/Edit Transaction Panel
// ─────────────────────────────────────────────────────────────────────────────
function AddPanel({
  onClose, onSave, editTx, isMobile,
}: {
  onClose: () => void;
  onSave: (tx: Transaction) => void;
  editTx: Transaction | null;
  isMobile: boolean;
}) {
  const [type, setType]         = useState<TxType>(editTx?.type ?? "expense");
  const [amount, setAmount]     = useState(editTx ? String(editTx.amount) : "");
  const [category, setCategory] = useState(editTx?.category ?? "");
  const [note, setNote]         = useState(editTx?.note ?? "");
  const [date, setDate]         = useState(editTx?.date ?? new Date().toISOString().split("T")[0]);
  const [error, setError]       = useState("");

  const cats = type === "income" ? INCOME_CATS : EXPENSE_CATS;

  const handleSave = () => {
    const num = parseInt(amount.replace(/\D/g, ""), 10);
    if (!num || num <= 0)  { setError("Masukkan jumlah yang valid"); return; }
    if (!category)         { setError("Pilih kategori terlebih dahulu"); return; }
    onSave({ id: editTx?.id ?? Date.now().toString(), type, amount: num, category, note, date });
    onClose();
  };

  const displayAmount = amount
    ? parseInt(amount.replace(/\D/g, ""), 10).toLocaleString("id-ID")
    : "";

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center"
      style={{
        alignItems: isMobile ? "flex-end" : "center",
        background: "rgba(8,11,20,0.82)",
        backdropFilter: "blur(10px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full overflow-hidden overflow-y-auto"
        style={{
          maxWidth: isMobile ? "100%" : "490px",
          maxHeight: isMobile ? "93dvh" : "90vh",
          background: C.card,
          border: `1px solid ${C.borderGold}`,
          borderRadius: isMobile ? "20px 20px 0 0" : "20px",
        }}
      >
        {/* Drag handle (mobile) */}
        {isMobile && (
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
          </div>
        )}

        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{ padding: "clamp(14px,3vw,22px) clamp(16px,4vw,24px) clamp(10px,2vw,16px)" }}
        >
          <h2
            style={{
              fontSize: "clamp(16px, 3vw, 20px)",
              fontWeight: 700,
              color: C.fg,
            }}
          >
            {editTx ? "Edit Transaksi" : "Tambah Transaksi"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
            style={{ width: 32, height: 32 }}
          >
            <X size={15} />
          </button>
        </div>

        <div style={{ padding: "0 clamp(16px,4vw,24px)" }}>

          {/* Type toggle */}
          <div className="rounded-xl p-1 mb-4" style={{ background: C.surface }}>
            <div className="flex">
              {(["expense","income"] as TxType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setType(t); setCategory(""); setError(""); }}
                  className="flex-1 rounded-lg font-medium transition-all duration-200"
                  style={{
                    padding: "clamp(8px,1.8vw,11px) 0",
                    fontSize: "clamp(12px,2vw,14px)",
                    ...(type === t ? {
                      background: t === "income" ? "rgba(45,212,174,0.15)" : "rgba(255,107,107,0.12)",
                      color: t === "income" ? C.teal : C.red,
                    } : { color: C.muted }),
                  }}
                >
                  {t === "expense" ? "Pengeluaran" : "Pemasukan"}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <label
            className="font-semibold uppercase tracking-widest text-muted-foreground block mb-1.5"
            style={{ fontSize: "clamp(10px,1.5vw,12px)" }}
          >
            Jumlah
          </label>
          <div
            className="flex items-center gap-2 rounded-xl border mb-4 transition-all focus-within:border-primary/50"
            style={{
              background: C.surface,
              borderColor: "rgba(255,255,255,0.08)",
              padding: "clamp(10px,2vw,14px) clamp(12px,2.5vw,16px)",
            }}
          >
            <span style={{ fontSize: "clamp(12px,2vw,14px)", color: C.muted, fontWeight: 500 }}>Rp</span>
            <input
              type="text"
              inputMode="numeric"
              value={displayAmount}
              onChange={(e) => { setAmount(e.target.value.replace(/\D/g,"")); setError(""); }}
              placeholder="0"
              className="flex-1 bg-transparent outline-none font-semibold placeholder-muted-foreground/40"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "clamp(16px,3vw,20px)",
                color: C.fg,
              }}
            />
          </div>

          {/* Category */}
          <label
            className="font-semibold uppercase tracking-widest text-muted-foreground block mb-1.5"
            style={{ fontSize: "clamp(10px,1.5vw,12px)" }}
          >
            Kategori
          </label>
          <div
            className="grid gap-1.5 mb-4"
            style={{ gridTemplateColumns: `repeat(${isMobile ? 4 : 4}, 1fr)` }}
          >
            {cats.map((c) => (
              <button
                key={c}
                onClick={() => { setCategory(c); setError(""); }}
                className="flex flex-col items-center rounded-xl border transition-all duration-150"
                style={{
                  padding: "clamp(6px,1.5vw,10px) 4px",
                  gap: "clamp(3px,0.5vw,5px)",
                  ...(category === c ? {
                    background: "rgba(201,168,76,0.12)",
                    borderColor: "rgba(201,168,76,0.4)",
                    color: C.gold,
                  } : {
                    background: C.surface,
                    borderColor: C.border,
                    color: C.muted,
                  }),
                }}
              >
                <span style={{ fontSize: "clamp(14px,2.5vw,18px)" }}>{CAT_ICON[c]}</span>
                <span
                  className="truncate w-full text-center leading-tight"
                  style={{ fontSize: "clamp(8px,1.4vw,10px)", fontWeight: 500 }}
                >
                  {c}
                </span>
              </button>
            ))}
          </div>

          {/* Date & Note */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label:"Tanggal", el:
                <input
                  type="date" value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border outline-none transition-all focus:border-primary/50"
                  style={{
                    background: C.surface, borderColor: "rgba(255,255,255,0.08)",
                    color: C.fg, colorScheme:"dark",
                    padding: "clamp(8px,1.8vw,11px) clamp(10px,2vw,14px)",
                    fontSize: "clamp(11px,2vw,13px)",
                  }}
                />
              },
              { label:"Catatan", el:
                <input
                  type="text" value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Opsional..."
                  className="w-full rounded-xl border outline-none transition-all focus:border-primary/50 placeholder-muted-foreground/40"
                  style={{
                    background: C.surface, borderColor: "rgba(255,255,255,0.08)",
                    color: C.fg,
                    padding: "clamp(8px,1.8vw,11px) clamp(10px,2vw,14px)",
                    fontSize: "clamp(11px,2vw,13px)",
                  }}
                />
              },
            ].map(({ label, el }) => (
              <div key={label}>
                <label
                  className="font-medium uppercase tracking-widest text-muted-foreground block mb-1.5"
                  style={{ fontSize: "clamp(9px,1.5vw,11px)" }}
                >
                  {label}
                </label>
                {el}
              </div>
            ))}
          </div>

          {error && (
            <p className="text-destructive mb-3" style={{ fontSize: "clamp(10px,1.8vw,12px)" }}>
              {error}
            </p>
          )}
        </div>

        {/* Save button */}
        <div style={{ padding: "4px clamp(16px,4vw,24px) clamp(16px,4vw,24px)" }}>
          <button
            onClick={handleSave}
            className="w-full rounded-xl font-semibold transition-all duration-200 hover:opacity-90 active:scale-[0.99]"
            style={{
              padding: "clamp(12px,2.5vw,15px)",
              fontSize: "clamp(13px,2.2vw,15px)",
              background: `linear-gradient(135deg, ${C.gold} 0%, ${C.goldLight} 100%)`,
              color: "#080B14",
            }}
          >
            {editTx ? "Simpan Perubahan" : "Tambah Transaksi"}
          </button>
        </div>

        {/* Safe area spacer for mobile */}
        {isMobile && <div style={{ height: "env(safe-area-inset-bottom, 16px)", minHeight: 8 }} />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  const [view,        setView]        = useState<View>("dashboard");
  const [txs,         setTxs]         = useState<Transaction[]>(INITIAL_TXS);
  const [showAdd,     setShowAdd]     = useState(false);
  const [editTx,      setEditTx]      = useState<Transaction | null>(null);
  const [search,      setSearch]      = useState("");
  const [filterType,  setFilterType]  = useState<TxType | "all">("all");
  const [drawerOpen,  setDrawerOpen]  = useState(false);

  const totalIncome  = useMemo(() => txs.filter(t => t.type==="income").reduce((s,t) => s+t.amount, 0), [txs]);
  const totalExpense = useMemo(() => txs.filter(t => t.type==="expense").reduce((s,t) => s+t.amount, 0), [txs]);
  const balance      = totalIncome - totalExpense;
  const savingsRate  = totalIncome > 0 ? Math.round(((totalIncome-totalExpense)/totalIncome)*100) : 0;

  const recentTxs  = useMemo(() =>
    [...txs].sort((a,b) => new Date(b.date).getTime()-new Date(a.date).getTime()).slice(0,6),
    [txs]
  );
  const filteredTxs = useMemo(() => {
    let list = [...txs].sort((a,b) => new Date(b.date).getTime()-new Date(a.date).getTime());
    if (filterType !== "all") list = list.filter(t => t.type===filterType);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => t.category.toLowerCase().includes(q) || t.note.toLowerCase().includes(q));
    }
    return list;
  }, [txs, filterType, search]);

  const expenseByCategory = useMemo(() => {
    const map: Record<string,number> = {};
    txs.filter(t=>t.type==="expense").forEach(t => { map[t.category]=(map[t.category]??0)+t.amount; });
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,5);
  }, [txs]);

  const handleSave   = (tx: Transaction) => {
    setTxs(prev => prev.find(t=>t.id===tx.id) ? prev.map(t=>t.id===tx.id?tx:t) : [tx,...prev]);
    setEditTx(null);
  };
  const handleDelete = (id: string) => setTxs(prev => prev.filter(t=>t.id!==id));
  const handleEdit   = (tx: Transaction) => { setEditTx(tx); setShowAdd(true); };
  const handleAddNew = () => { setEditTx(null); setShowAdd(true); };

  // ── Sidebar width ──────────────────────────────────────────────────────────
  const sidebarW = isDesktop ? 240 : isTablet ? 60 : 0;

  const navItems = [
    { id:"dashboard" as View, icon: LayoutDashboard, label:"Dashboard" },
    { id:"history"   as View, icon: History,         label:"Riwayat"   },
  ];

  // ── Chart height (responsive) ──────────────────────────────────────────────
  const chartH = isMobile ? 160 : 210;

  // ── Type scale helpers ─────────────────────────────────────────────────────
  // clamp(mobile-min, fluid-vw, desktop-max)
  const TS = {
    pageTitle:   "clamp(18px, 3.5vw, 26px)",   // top-bar page title
    sectionHead: "clamp(14px, 2.2vw, 17px)",   // card/section headings
    bodyBase:    "clamp(13px, 1.8vw, 15px)",   // normal body copy
    bodySmall:   "clamp(11px, 1.5vw, 13px)",   // secondary / meta text
    label:       "clamp(10px, 1.3vw, 12px)",   // uppercase labels & captions
    balance:     "clamp(28px, 5vw, 52px)",     // hero balance number
    statValue:   "clamp(16px, 2.8vw, 24px)",   // stat card values
    monoBase:    "clamp(12px, 1.8vw, 14px)",   // mono amounts in rows
  };

  return (
    <div
      className="flex h-screen bg-background overflow-hidden"
      style={{ fontFamily:"'DM Sans', sans-serif" }}
    >

      {/* ── Desktop / Tablet Sidebar ────────────────────────────────────── */}
      {!isMobile && (
        <aside
          className="flex-shrink-0 flex flex-col border-r h-full"
          style={{
            width: sidebarW,
            background: C.sidebar,
            borderColor: "rgba(255,255,255,0.04)",
            transition: "width 300ms ease",
          }}
        >
          {/* Brand */}
          <div
            className="flex items-center border-b"
            style={{
              padding: isDesktop ? "24px 16px" : "20px 0",
              justifyContent: isTablet ? "center" : undefined,
              borderColor: "rgba(255,255,255,0.04)",
              gap: 12,
            }}
          >
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-xl"
              style={{
                width: 36, height: 36,
                background: `linear-gradient(135deg, ${C.gold} 0%, ${C.goldLight} 100%)`,
              }}
            >
              <Wallet size={17} style={{ color: "#080B14" }} />
            </div>
            {isDesktop && (
              <div>
                <p style={{ fontSize:15, fontWeight:700, color:C.fg }}>
                  NataArtha
                </p>
                <p style={{ fontSize:12, color:C.muted }}>Keuangan Pribadi</p>
              </div>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 flex flex-col gap-1" style={{ padding: isDesktop ? "16px 10px" : "16px 8px" }}>
            {navItems.map(({ id, icon:Icon, label }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                title={label}
                className="flex items-center rounded-xl transition-all duration-150"
                style={{
                  gap: isDesktop ? 10 : 0,
                  padding: isDesktop ? "10px 12px" : "10px 0",
                  justifyContent: isTablet ? "center" : undefined,
                  fontSize: 14,
                  fontWeight: 500,
                  ...(view===id ? {
                    background:"rgba(201,168,76,0.12)",
                    color: C.gold,
                  } : {
                    color: C.muted,
                  }),
                }}
              >
                <Icon size={16} />
                {isDesktop && <span>{label}</span>}
                {isDesktop && view===id && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background:C.gold }} />
                )}
              </button>
            ))}
          </nav>

          {/* User chip */}
          <div
            style={{
              margin: isDesktop ? "0 10px 20px" : "0 8px 20px",
              padding: isDesktop ? "10px 12px" : "10px",
              borderRadius: 12,
              border:`1px solid ${C.border}`,
              background: C.card,
              display:"flex",
              alignItems:"center",
              justifyContent: isTablet ? "center" : undefined,
              gap: isDesktop ? 10 : 0,
            }}
          >
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-lg"
              style={{ width:30, height:30, background:"rgba(201,168,76,0.15)" }}
            >
              <CircleUser size={16} style={{ color:C.gold }} />
            </div>
            {isDesktop && (
              <div className="min-w-0">
                <p style={{ fontSize:13, fontWeight:600, color:C.fg }}>Mazizi</p>
                <p style={{ fontSize:11, color:C.muted }}>Akun Utama</p>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Mobile drawer overlay */}
      {isMobile && drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ background:"rgba(8,11,20,0.7)", backdropFilter:"blur(4px)" }}
            onClick={() => setDrawerOpen(false)}
          />
          <aside
            className="fixed inset-y-0 left-0 z-50 flex flex-col border-r"
            style={{ width:220, background:C.sidebar, borderColor:"rgba(255,255,255,0.05)" }}
          >
            <div
              className="flex items-center justify-between border-b"
              style={{ padding:"20px 16px", borderColor:"rgba(255,255,255,0.05)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center rounded-xl"
                  style={{ width:34, height:34, background:`linear-gradient(135deg, ${C.gold}, ${C.goldLight})` }}
                >
                  <Wallet size={15} style={{ color:"#080B14" }} />
                </div>
                <div>
                  <p style={{ fontFamily:"'DM Sans', sans-serif", fontSize:14, fontWeight:600, color:C.fg }}>NataArtha</p>
                  <p style={{ fontSize:10, color:C.muted }}>Keuangan Pribadi</p>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-muted-foreground"
                style={{ padding:4 }}
              >
                <X size={16} />
              </button>
            </div>
            <nav className="flex-1 flex flex-col gap-1 p-3">
              {navItems.map(({ id, icon:Icon, label }) => (
                <button
                  key={id}
                  onClick={() => { setView(id); setDrawerOpen(false); }}
                  className="flex items-center gap-3 rounded-xl transition-all duration-150"
                  style={{
                    padding:"11px 12px",
                    fontSize:14,
                    fontWeight:500,
                    ...(view===id
                      ? { background:"rgba(201,168,76,0.12)", color:C.gold }
                      : { color:C.muted }),
                  }}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </nav>
            <div style={{ padding:"0 12px 32px" }}>
              <div
                className="flex items-center gap-3 rounded-xl border"
                style={{ padding:"10px 12px", borderColor:C.border, background:C.card }}
              >
                <div className="flex items-center justify-center rounded-lg" style={{ width:30, height:30, background:"rgba(201,168,76,0.15)" }}>
                  <CircleUser size={15} style={{ color:C.gold }} />
                </div>
                <div>
                  <p style={{ fontSize:12, fontWeight:500, color:C.fg }}>Mazizi</p>
                  <p style={{ fontSize:10, color:C.muted }}>Akun Utama</p>
                </div>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* ── Main column ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header
          className="flex items-center flex-shrink-0 border-b"
          style={{
            padding: isMobile ? "12px 16px" : "14px 24px",
            borderColor:"rgba(255,255,255,0.05)",
            background: C.bg,
            gap: 12,
          }}
        >
          {/* Hamburger on mobile */}
          {isMobile && (
            <button
              onClick={() => setDrawerOpen(true)}
              className="rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all flex-shrink-0"
              style={{ width:34, height:34 }}
            >
              <Menu size={16} />
            </button>
          )}

          {/* Logo on mobile (centered feel) */}
          {isMobile && (
            <div className="flex items-center gap-2 flex-1">
              <div
                className="flex items-center justify-center rounded-lg"
                style={{ width:28, height:28, background:`linear-gradient(135deg, ${C.gold}, ${C.goldLight})` }}
              >
                <Wallet size={13} style={{ color:"#080B14" }} />
              </div>
              <span style={{ fontFamily:"'DM Sans', sans-serif", fontSize:16, fontWeight:600, color:C.fg }}>
                NataArtha
              </span>
            </div>
          )}

          {/* Greeting on desktop/tablet */}
          {!isMobile && (
            <div className="flex-1">
              <p style={{ fontSize:TS.label, color:C.muted, letterSpacing:"0.08em", textTransform:"uppercase" }}>
                {new Date().toLocaleDateString("id-ID", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}
              </p>
              <h1
                style={{
                  fontSize: TS.pageTitle,
                  color: C.fg,
                  fontWeight: 700,
                  marginTop: 3,
                  letterSpacing: "-0.01em",
                }}
              >
                {view==="dashboard" ? "Selamat datang, Mazizi" : "Riwayat Transaksi"}
              </h1>
            </div>
          )}

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              className="relative rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
              style={{ width:34, height:34 }}
            >
              <Bell size={15} />
              <span
                className="absolute rounded-full"
                style={{ top:8, right:8, width:6, height:6, background:C.gold }}
              />
            </button>
            {!isMobile && (
              <button
                onClick={handleAddNew}
                className="flex items-center rounded-xl font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{
                  gap: 8,
                  padding: "10px 20px",
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "0.01em",
                  background:`linear-gradient(135deg, ${C.gold} 0%, ${C.goldLight} 100%)`,
                  color:"#080B14",
                  boxShadow:`0 4px 16px rgba(201,168,76,0.25)`,
                }}
              >
                <Plus size={15} />
                Tambah Transaksi
              </button>
            )}
          </div>
        </header>

        {/* ── Page content ──────────────────────────────────────────────── */}
        <main
          className="flex-1 overflow-y-auto"
          style={{ paddingBottom: isMobile ? 80 : 0 }}
        >

          {/* ═══════════════════════════════════════════════════════════
              DASHBOARD VIEW
          ═══════════════════════════════════════════════════════════ */}
          {view === "dashboard" && (
            <div style={{ padding: isMobile ? "16px 16px" : "24px 24px", display:"flex", flexDirection:"column", gap: isMobile ? 14 : 20 }}>

              {/* ── Balance hero ─────────────────────────────────────── */}
              <div
                className="relative overflow-hidden"
                style={{
                  borderRadius: 20,
                  background:"linear-gradient(135deg, #0F1B2D 0%, #0A1525 50%, #0D1626 100%)",
                  border:`1px solid ${C.borderGold}`,
                }}
              >
                {/* Radial glow decorations */}
                <div className="absolute pointer-events-none" style={{
                  top:-60, right:-60, width:220, height:220,
                  borderRadius:"50%",
                  background:"radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)",
                }} />
                <div className="absolute pointer-events-none" style={{
                  bottom:-80, left:-40, width:180, height:180,
                  borderRadius:"50%",
                  background:"radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)",
                }} />
                {/* Gold hairline */}
                <div style={{
                  position:"absolute", top:0, left:0, right:0, height:1,
                  background:"linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent)",
                }} />

                <div style={{ padding: isMobile ? "20px 20px 18px" : "28px 32px 24px", position:"relative" }}>
                  {/* Top row: balance + ring */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p
                        className="font-semibold uppercase tracking-widest"
                        style={{ fontSize: TS.label, color:C.muted, marginBottom: isMobile ? 8 : 12 }}
                      >
                        Total Saldo
                      </p>
                      <p
                        style={{
                          fontFamily:"'JetBrains Mono', monospace",
                          fontSize: TS.balance,
                          fontWeight: 700,
                          color: balance >= 0 ? C.fg : C.red,
                          lineHeight: 1,
                        }}
                      >
                        {formatRp(Math.abs(balance))}
                      </p>
                      <p style={{ fontSize: TS.bodySmall, color:C.muted, marginTop: isMobile ? 6 : 10 }}>
                        {balance>=0 ? "Saldo positif" : "Saldo negatif"} · Juli 2026
                      </p>
                    </div>

                    {/* Savings ring */}
                    <svg
                      style={{ flexShrink:0 }}
                      width={isMobile ? 72 : 90}
                      height={isMobile ? 72 : 90}
                      viewBox="0 0 90 90"
                    >
                      <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
                      <circle
                        cx="45" cy="45" r="38" fill="none"
                        stroke="url(#goldG)" strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${2*Math.PI*38}`}
                        strokeDashoffset={`${2*Math.PI*38*(1-Math.min(savingsRate,100)/100)}`}
                        transform="rotate(-90 45 45)"
                        style={{ transition:"stroke-dashoffset 1.2s ease" }}
                      />
                      <defs>
                        <linearGradient id="goldG" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={C.gold} />
                          <stop offset="100%" stopColor={C.goldLight} />
                        </linearGradient>
                      </defs>
                      <text x="45" y="41" textAnchor="middle" fill={C.fg}
                        fontSize={isMobile ? 14 : 16} fontWeight="700"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {savingsRate}%
                      </text>
                      <text x="45" y="54" textAnchor="middle" fill={C.muted} fontSize={isMobile ? 7 : 8}>
                        tabungan
                      </text>
                    </svg>
                  </div>

                  {/* Bottom strip: income / expense */}
                  <div
                    className="grid grid-cols-2"
                    style={{
                      marginTop: isMobile ? 16 : 22,
                      paddingTop: isMobile ? 14 : 18,
                      borderTop:`1px solid rgba(255,255,255,0.07)`,
                      gap: isMobile ? 0 : 0,
                    }}
                  >
                    {[
                      { label:"Pemasukan", amount:totalIncome, color:C.teal, icon: ArrowUpRight },
                      { label:"Pengeluaran", amount:totalExpense, color:C.red, icon: ArrowDownRight },
                    ].map(({ label, amount, color, icon:Icon }) => (
                      <div key={label} className="flex items-center gap-3">
                        <div
                          className="flex items-center justify-center rounded-lg flex-shrink-0"
                          style={{
                            width: isMobile ? 28 : 34,
                            height: isMobile ? 28 : 34,
                            background: color === C.teal ? "rgba(45,212,174,0.12)" : "rgba(255,107,107,0.1)",
                          }}
                        >
                          <Icon size={isMobile ? 13 : 15} style={{ color }} />
                        </div>
                        <div>
                          <p style={{ fontSize: TS.label, color:C.muted }}>{label}</p>
                          <p style={{ fontSize: isMobile ? "14px" : "17px", fontFamily:"'JetBrains Mono', monospace", fontWeight:600, color }}>
                            {shortRp(amount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Stats row ────────────────────────────────────────── */}
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr" }}
              >
                <StatCard label="Pemasukan" value={shortRp(totalIncome)} trend="+12.4%" trendUp={true} icon={ArrowUpRight} />
                <StatCard label="Pengeluaran" value={shortRp(totalExpense)} trend="+3.1%" trendUp={false} icon={ArrowDownRight} />
                <div className={isMobile ? "col-span-2" : ""}>
                  <StatCard label="Rasio Tabungan" value={`${savingsRate}%`} trend={`target: 30%`} trendUp={savingsRate>=30} accent icon={TrendingUp} />
                </div>
              </div>

              {/* ── Chart + Breakdown — golden ratio split on desktop ── */}
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: isDesktop ? `${PHI}fr 1fr` : "1fr",
                }}
              >
                {/* Cash flow area chart */}
                <div
                  className="rounded-2xl border"
                  style={{ background:C.card, borderColor:C.border, padding: isMobile ? "16px 14px" : "20px" }}
                >
                  <div className="flex items-center justify-between" style={{ marginBottom: isMobile ? 12 : 16 }}>
                    <div>
                      <h3 style={{ fontSize:TS.sectionHead, fontWeight:700, color:C.fg }}>Arus Kas</h3>
                      <p style={{ fontSize:TS.bodySmall, color:C.muted, marginTop:2 }}>8 hari terakhir</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {[{ color:C.teal, label:"Masuk" },{ color:C.red, label:"Keluar" }].map(({ color, label }) => (
                        <span
                          key={label}
                          className="flex items-center gap-1.5"
                          style={{ fontSize: TS.bodySmall, color:C.muted }}
                        >
                          <span style={{ display:"inline-block", width:10, height:2, borderRadius:1, background:color }} />
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={chartH}>
                    <AreaChart data={CHART_DATA} margin={{ top:4, right:4, left: isMobile ? -28 : -16, bottom:0 }}>
                      <defs>
                        <linearGradient id="iG" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={C.teal} stopOpacity={0.22} />
                          <stop offset="100%" stopColor={C.teal} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="eG" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={C.red} stopOpacity={0.18} />
                          <stop offset="100%" stopColor={C.red} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis
                        dataKey="label"
                        tick={{ fill:C.muted, fontSize: isMobile ? 9 : 10 }}
                        axisLine={false} tickLine={false}
                        interval={isMobile ? 1 : 0}
                      />
                      <YAxis
                        tick={{ fill:C.muted, fontSize: isMobile ? 9 : 10 }}
                        axisLine={false} tickLine={false}
                        tickFormatter={(v) => v>=1000000 ? `${v/1000000}jt` : v>=1000 ? `${v/1000}rb` : "0"}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke:"rgba(201,168,76,0.2)", strokeWidth:1 }} />
                      <Area type="monotone" dataKey="income" stroke={C.teal} strokeWidth={2} fill="url(#iG)" />
                      <Area type="monotone" dataKey="expense" stroke={C.red}  strokeWidth={2} fill="url(#eG)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Expense category breakdown */}
                <div
                  className="rounded-2xl border"
                  style={{ background:C.card, borderColor:C.border, padding: isMobile ? "16px 14px" : "20px" }}
                >
                  <div style={{ marginBottom: isMobile ? 12 : 16 }}>
                    <h3 style={{ fontSize:TS.sectionHead, fontWeight:700, color:C.fg }}>Pengeluaran Terbesar</h3>
                    <p style={{ fontSize:TS.bodySmall, color:C.muted, marginTop:2 }}>Berdasarkan kategori</p>
                  </div>
                  <div className="flex flex-col" style={{ gap: isMobile ? 10 : 14 }}>
                    {expenseByCategory.map(([cat, amt], i) => {
                      const pct = Math.round((amt/totalExpense)*100);
                      const barColor = i===0
                        ? `linear-gradient(90deg, ${C.red}, #FF8E8E)`
                        : i===1
                        ? `linear-gradient(90deg, ${C.gold}, ${C.goldLight})`
                        : `linear-gradient(90deg, #6B9FFF, #93BEFF)`;
                      return (
                        <div key={cat}>
                          <div className="flex items-center gap-2" style={{ marginBottom:6 }}>
                            <span style={{ fontSize: isMobile ? 13 : 15 }}>{CAT_ICON[cat]}</span>
                            <span style={{ fontSize:TS.bodyBase, fontWeight:500, color:C.fg, flex:1 }}>{cat}</span>
                            <span style={{ fontSize:TS.monoBase, fontWeight:600, fontFamily:"'JetBrains Mono', monospace", color:C.fg }}>
                              {shortRp(amt)}
                            </span>
                            <span style={{ fontSize:TS.label, color:C.muted, minWidth:28, textAlign:"right" }}>
                              {pct}%
                            </span>
                          </div>
                          <div style={{ height: isMobile ? 4 : 5, borderRadius:99, background:"rgba(255,255,255,0.06)", overflow:"hidden" }}>
                            <div style={{ height:"100%", width:`${pct}%`, borderRadius:99, background:barColor, transition:"width 0.8s ease" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ── Recent transactions ───────────────────────────────── */}
              <div
                className="rounded-2xl border"
                style={{ background:C.card, borderColor:C.border }}
              >
                <div
                  className="flex items-center justify-between border-b"
                  style={{
                    padding: isMobile ? "14px 16px" : "16px 20px",
                    borderColor:"rgba(255,255,255,0.05)",
                  }}
                >
                  <div>
                    <h3 style={{ fontSize:TS.sectionHead, fontWeight:700, color:C.fg }}>Transaksi Terbaru</h3>
                    <p style={{ fontSize:TS.bodySmall, color:C.muted, marginTop:2 }}>{txs.length} total transaksi</p>
                  </div>
                  <button
                    onClick={() => setView("history")}
                    className="flex items-center gap-1 font-medium hover:opacity-80 transition-opacity"
                    style={{ fontSize:TS.bodySmall, color:C.gold }}
                  >
                    Lihat semua
                    <ChevronRight size={12} />
                  </button>
                </div>
                <div style={{ padding: isMobile ? "8px 8px" : "10px 10px" }}>
                  {recentTxs.map(tx => (
                    <TxRow
                      key={tx.id} tx={tx}
                      onDelete={handleDelete} onEdit={handleEdit}
                      alwaysShowActions={isMobile}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              HISTORY VIEW
          ═══════════════════════════════════════════════════════════ */}
          {view === "history" && (
            <div style={{ padding: isMobile ? "16px 16px" : "24px 24px", display:"flex", flexDirection:"column", gap: isMobile ? 12 : 16 }}>

              {/* Page heading (mobile only — desktop uses header) */}
              {isMobile && (
                <h1 style={{ fontSize:TS.pageTitle, fontWeight:700, color:C.fg }}>
                  Riwayat Transaksi
                </h1>
              )}

              {/* Filters */}
              <div style={{ display:"flex", flexDirection: isMobile ? "column" : "row", gap:10 }}>
                {/* Search */}
                <div
                  className="flex items-center gap-2 flex-1 border transition-all focus-within:border-primary/40"
                  style={{
                    borderRadius:14,
                    padding: isMobile ? "10px 14px" : "10px 16px",
                    background:C.card,
                    borderColor:C.border,
                  }}
                >
                  <Search size={14} style={{ color:C.muted, flexShrink:0 }} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari kategori atau catatan..."
                    className="flex-1 bg-transparent outline-none placeholder-muted-foreground/50"
                    style={{ fontSize:TS.bodyBase, color:C.fg }}
                  />
                  {search && (
                    <button onClick={() => setSearch("")} style={{ color:C.muted }}>
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Type filter pill group */}
                <div
                  className="flex"
                  style={{
                    borderRadius:14,
                    padding:4,
                    background:C.card,
                    border:`1px solid ${C.border}`,
                    flexShrink:0,
                  }}
                >
                  {(["all","income","expense"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilterType(f)}
                      className="rounded-xl font-medium transition-all"
                      style={{
                        padding: isMobile ? "8px 14px" : "7px 16px",
                        fontSize: isMobile ? "clamp(11px,2vw,13px)" : TS.bodySmall,
                        flex: isMobile ? 1 : undefined,
                        ...(filterType===f ? {
                          background: f==="income" ? "rgba(45,212,174,0.15)" : f==="expense" ? "rgba(255,107,107,0.12)" : "rgba(201,168,76,0.12)",
                          color: f==="income" ? C.teal : f==="expense" ? C.red : C.gold,
                        } : { color:C.muted }),
                      }}
                    >
                      {f==="all" ? "Semua" : f==="income" ? "Pemasukan" : "Pengeluaran"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary strip */}
              <div className="flex items-center gap-3" style={{ fontSize:TS.bodySmall, color:C.muted }}>
                <span>{filteredTxs.length} transaksi</span>
                <span style={{ width:3, height:3, borderRadius:"50%", background:C.muted, display:"inline-block" }} />
                <span style={{ color:C.teal }}>
                  +{shortRp(filteredTxs.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0))}
                </span>
                <span style={{ width:3, height:3, borderRadius:"50%", background:C.muted, display:"inline-block" }} />
                <span style={{ color:C.red }}>
                  −{shortRp(filteredTxs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0))}
                </span>
              </div>

              {/* List */}
              <div
                className="rounded-2xl border"
                style={{ background:C.card, borderColor:C.border }}
              >
                {filteredTxs.length===0 ? (
                  <div className="flex flex-col items-center justify-center" style={{ padding:"60px 20px" }}>
                    <Receipt size={30} style={{ color:`${C.muted}55`, marginBottom:12 }} />
                    <p style={{ fontSize:TS.bodyBase, color:C.muted }}>Tidak ada transaksi ditemukan</p>
                  </div>
                ) : (
                  <div style={{ padding: isMobile ? "8px" : "10px" }}>
                    {filteredTxs.map(tx => (
                      <TxRow
                        key={tx.id} tx={tx}
                        onDelete={handleDelete} onEdit={handleEdit}
                        alwaysShowActions={isMobile}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* ── Mobile bottom nav ─────────────────────────────────────────── */}
        {isMobile && (
          <nav
            className="flex-shrink-0 flex items-center border-t"
            style={{
              height:64,
              background: C.sidebar,
              borderColor:"rgba(255,255,255,0.06)",
              paddingBottom:"env(safe-area-inset-bottom, 0px)",
            }}
          >
            {navItems.map(({ id, icon:Icon, label }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className="flex-1 flex flex-col items-center justify-center gap-1 transition-all"
                style={{ height:"100%" }}
              >
                <Icon size={20} style={{ color: view===id ? C.gold : C.muted }} />
                <span
                  style={{
                    fontSize:10,
                    fontWeight: view===id ? 600 : 400,
                    color: view===id ? C.gold : C.muted,
                    letterSpacing:"0.02em",
                  }}
                >
                  {label}
                </span>
                {view===id && (
                  <div style={{ position:"absolute", bottom:0, width:24, height:2, borderRadius:1, background:C.gold }} />
                )}
              </button>
            ))}

            {/* FAB center add button */}
            <button
              onClick={handleAddNew}
              className="flex-1 flex flex-col items-center justify-center gap-1 relative"
              style={{ height:"100%" }}
            >
              <div
                className="flex items-center justify-center rounded-2xl"
                style={{
                  width:44, height:44,
                  background:`linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
                  marginTop:-20,
                  boxShadow:"0 4px 20px rgba(201,168,76,0.35)",
                }}
              >
                <Plus size={20} style={{ color:"#080B14" }} />
              </div>
              <span style={{ fontSize:10, color:C.muted }}>Tambah</span>
            </button>
          </nav>
        )}
      </div>

      {/* ── Add/Edit Modal ─────────────────────────────────────────────── */}
      {showAdd && (
        <AddPanel
          onClose={() => { setShowAdd(false); setEditTx(null); }}
          onSave={handleSave}
          editTx={editTx}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}
