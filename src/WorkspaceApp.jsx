import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Plus,
  Trash2,
  ChefHat,
  Package,
  Calculator,
  LayoutDashboard,
  Percent,
  X,
  TrendingUp,
  AlertTriangle,
  FileText,
  Printer,
  Download,
  Store,
  Upload,
  RotateCcw,
  Smartphone,
} from "lucide-react";

export const STORAGE_KEY = "dapurhitung.app.v1";

const rupiah = (n) => "Rp" + Math.round(n || 0).toLocaleString("id-ID");

const UNITS = ["gr", "kg", "ml", "l", "pcs", "sdt", "sdm", "ikat", "butir"];
const MENU_KATEGORI = ["Makanan", "Minuman", "Snack", "Dessert"];
const COLORS = ["#14140f", "#beff50", "#6e6e64", "#30302a", "#919183"];
const unitToGram = { gr: 1, kg: 1000, ml: 1, l: 1000, pcs: 1, sdt: 5, sdm: 15, ikat: 1, butir: 1 };

const initialBahan = [
  { id: "b1", nama: "Beras", satuan: "kg", harga: 13000, kategori: "Utama", tipeMenu: ["Makanan"] },
  { id: "b2", nama: "Ayam Fillet", satuan: "kg", harga: 38000, kategori: "Utama", tipeMenu: ["Makanan", "Snack"] },
  { id: "b3", nama: "Bawang Merah", satuan: "kg", harga: 32000, kategori: "Bumbu", tipeMenu: ["Makanan", "Snack"] },
  { id: "b4", nama: "Bawang Putih", satuan: "kg", harga: 28000, kategori: "Bumbu", tipeMenu: ["Makanan", "Snack"] },
  { id: "b5", nama: "Minyak Goreng", satuan: "l", harga: 17000, kategori: "Bumbu", tipeMenu: ["Makanan", "Snack"] },
  { id: "b6", nama: "Kecap Manis", satuan: "l", harga: 22000, kategori: "Bumbu", tipeMenu: ["Makanan"] },
  { id: "b7", nama: "Gula Pasir", satuan: "kg", harga: 16000, kategori: "Pemanis", tipeMenu: ["Minuman", "Dessert"] },
  { id: "b8", nama: "Teh Celup", satuan: "pcs", harga: 500, kategori: "Utama", tipeMenu: ["Minuman"] },
  { id: "b9", nama: "Es Batu", satuan: "kg", harga: 3000, kategori: "Pelengkap", tipeMenu: ["Minuman"] },
  { id: "b10", nama: "Susu Kental Manis", satuan: "l", harga: 20000, kategori: "Pemanis", tipeMenu: ["Minuman", "Dessert"] },
];

const initialMenus = [
  {
    id: "m1",
    nama: "Nasi Goreng Spesial",
    kategori: "Makanan",
    porsiPerBatch: 1,
    items: [
      { bahanId: "b1", qty: 150, unit: "gr", susut: 0 },
      { bahanId: "b2", qty: 60, unit: "gr", susut: 10 },
      { bahanId: "b3", qty: 15, unit: "gr", susut: 5 },
      { bahanId: "b4", qty: 10, unit: "gr", susut: 5 },
      { bahanId: "b5", qty: 15, unit: "ml", susut: 0 },
      { bahanId: "b6", qty: 20, unit: "ml", susut: 0 },
    ],
    margin: { "Dine-in": 45, Online: 55, Katering: 35 },
  },
];

const defaultChannels = [
  { nama: "Dine-in", fee: 0, aktif: true },
  { nama: "Online", fee: 20, aktif: true },
  { nama: "Katering", fee: 0, aktif: true },
];

const defaultOverhead = {
  biayaTetapBulanan: 3500000,
  estimasiPorsiBulanan: 1800,
  biayaTenagaKerjaBulanan: 4000000,
};

function clampNumber(value, min = 0, max = Number.POSITIVE_INFINITY) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return min;
  return Math.min(max, Math.max(min, numeric));
}

function normalizeSusut(value) {
  return clampNumber(value, 0, 99);
}

export function normalizeAppState(data = {}) {
  const bahanList = Array.isArray(data.bahanList) && data.bahanList.length
    ? data.bahanList.map((b, index) => ({
        id: b.id || `b${Date.now()}${index}`,
        nama: b.nama || "Bahan Baru",
        satuan: UNITS.includes(b.satuan) ? b.satuan : "kg",
        harga: clampNumber(b.harga),
        kategori: b.kategori || "Utama",
        tipeMenu: Array.isArray(b.tipeMenu) ? b.tipeMenu.filter((item) => MENU_KATEGORI.includes(item)) : [],
      }))
    : initialBahan;

  const menus = Array.isArray(data.menus) && data.menus.length
    ? data.menus.map((m, index) => ({
        id: m.id || `m${Date.now()}${index}`,
        nama: m.nama || "Menu Baru",
        kategori: MENU_KATEGORI.includes(m.kategori) ? m.kategori : MENU_KATEGORI[0],
        porsiPerBatch: clampNumber(m.porsiPerBatch || 1, 1),
        items: Array.isArray(m.items)
          ? m.items.map((item) => ({
              bahanId: item.bahanId || "",
              qty: clampNumber(item.qty),
              unit: UNITS.includes(item.unit) ? item.unit : "gr",
              susut: normalizeSusut(item.susut),
            }))
          : [],
        margin: typeof m.margin === "object" && m.margin !== null ? m.margin : { "Dine-in": 40, Online: 50, Katering: 30 },
      }))
    : initialMenus;

  const channels = Array.isArray(data.channels) && data.channels.length
    ? data.channels.map((c) => ({
        nama: c.nama || "Channel",
        fee: clampNumber(c.fee),
        aktif: c.aktif !== false,
      }))
    : defaultChannels;

  const overhead = {
    biayaTetapBulanan: clampNumber(data.overhead?.biayaTetapBulanan ?? defaultOverhead.biayaTetapBulanan),
    estimasiPorsiBulanan: clampNumber(data.overhead?.estimasiPorsiBulanan ?? defaultOverhead.estimasiPorsiBulanan, 1),
    biayaTenagaKerjaBulanan: clampNumber(data.overhead?.biayaTenagaKerjaBulanan ?? defaultOverhead.biayaTenagaKerjaBulanan),
  };

  const selectedMenuId = menus.some((m) => m.id === data.selectedMenuId)
    ? data.selectedMenuId
    : menus[0]?.id || "";

  return {
    bahanList,
    menus,
    channels,
    overhead,
    businessName: data.businessName || "Warung Kamu",
    selectedMenuId,
  };
}

export function loadAppState() {
  if (typeof window === "undefined") {
    return normalizeAppState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return normalizeAppState();
    const parsed = JSON.parse(raw);
    return normalizeAppState(parsed);
  } catch {
    return normalizeAppState();
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function createCloudId(fallbackPrefix = "id") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${fallbackPrefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function ensureCloudFriendlyState(state) {
  const bahanIdMap = new Map();
  const bahanList = state.bahanList.map((b, index) => {
    const nextId = UUID_REGEX.test(b.id || "") ? b.id : createCloudId(`bahan-${index}`);
    bahanIdMap.set(b.id, nextId);
    return { ...b, id: nextId };
  });

  const menuIdMap = new Map();
  const menus = state.menus.map((m, index) => {
    const nextMenuId = UUID_REGEX.test(m.id || "") ? m.id : createCloudId(`menu-${index}`);
    menuIdMap.set(m.id, nextMenuId);
    return {
      ...m,
      id: nextMenuId,
      items: (m.items || []).map((item) => ({
        ...item,
        bahanId: bahanIdMap.get(item.bahanId) || item.bahanId,
      })),
    };
  });

  return {
    ...state,
    bahanList,
    menus,
    selectedMenuId: menuIdMap.get(state.selectedMenuId) || state.selectedMenuId,
  };
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function WorkspaceApp({
  initialState: providedInitialState,
  storageMode = "local",
  onPersist,
  modeNotice,
  userLabel,
  onSignOut,
  syncStatus = "idle",
}) {
  const [initialState] = useState(() => {
    const baseState = normalizeAppState(providedInitialState ?? loadAppState());
    return storageMode === "cloud" ? ensureCloudFriendlyState(baseState) : baseState;
  });
  const fileInputRef = useRef(null);

  const [tab, setTab] = useState("bahan");
  const [bahanList, setBahanList] = useState(initialState.bahanList);
  const [menus, setMenus] = useState(initialState.menus);
  const [channels, setChannels] = useState(initialState.channels);
  const [overhead, setOverhead] = useState(initialState.overhead);
  const [selectedMenuId, setSelectedMenuId] = useState(initialState.selectedMenuId);
  const [showAddBahan, setShowAddBahan] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [businessName, setBusinessName] = useState(initialState.businessName);
  const currentAppState = useMemo(() => ({
    bahanList,
    menus,
    channels,
    overhead,
    businessName,
    selectedMenuId,
  }), [bahanList, menus, channels, overhead, businessName, selectedMenuId]);
  const skipFirstCloudPersistRef = useRef(true);

  useEffect(() => {
    if (storageMode !== "local" || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(currentAppState));
  }, [storageMode, currentAppState]);

  useEffect(() => {
    if (storageMode !== "cloud" || !onPersist) return;
    if (skipFirstCloudPersistRef.current) {
      skipFirstCloudPersistRef.current = false;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      onPersist(currentAppState);
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [storageMode, onPersist, currentAppState]);

  useEffect(() => {
    if (!menus.length) {
      if (selectedMenuId !== "") setSelectedMenuId("");
      return;
    }

    if (!menus.some((m) => m.id === selectedMenuId)) {
      setSelectedMenuId(menus[0].id);
    }
  }, [menus, selectedMenuId]);

  const overheadPerPorsi = useMemo(() => {
    const porsi = clampNumber(overhead.estimasiPorsiBulanan, 1);
    return (clampNumber(overhead.biayaTetapBulanan) + clampNumber(overhead.biayaTenagaKerjaBulanan)) / porsi;
  }, [overhead]);

  const bahanMap = useMemo(() => {
    const map = {};
    bahanList.forEach((b) => {
      map[b.id] = b;
    });
    return map;
  }, [bahanList]);

  function hitungHPP(menu) {
    let biayaBahan = 0;
    const breakdown = [];

    menu.items.forEach((it) => {
      const bahan = bahanMap[it.bahanId];
      if (!bahan) return;

      const gramFaktor = unitToGram[it.unit] || 1;
      const qty = clampNumber(it.qty);
      const qtyGram = qty * gramFaktor;
      const susut = normalizeSusut(it.susut);
      const qtyEfektif = qtyGram / (1 - susut / 100);
      const hargaPerGram = bahan.satuan === "kg" || bahan.satuan === "l"
        ? clampNumber(bahan.harga) / 1000
        : clampNumber(bahan.harga);
      const cost = hargaPerGram * qtyEfektif;

      biayaBahan += cost;
      breakdown.push({ nama: bahan.nama, cost });
    });

    const perPorsi = biayaBahan / clampNumber(menu.porsiPerBatch || 1, 1);
    const hpp = perPorsi + overheadPerPorsi;
    return { biayaBahan: perPorsi, overhead: overheadPerPorsi, hpp, breakdown };
  }

  function hargaJual(hpp, marginPct, feePct) {
    const denom = 1 - clampNumber(marginPct) / 100 - clampNumber(feePct) / 100;
    if (denom <= 0) return null;
    return hpp / denom;
  }

  function addBahan(data) {
    setBahanList((prev) => [...prev, { id: storageMode === "cloud" ? createCloudId("bahan") : `b${Date.now()}`, ...data }]);
    setShowAddBahan(false);
  }

  function removeBahan(id) {
    setBahanList((prev) => prev.filter((b) => b.id !== id));
  }

  function addMenu(nama, kategori) {
    const id = storageMode === "cloud" ? createCloudId("menu") : `m${Date.now()}`;
    setMenus((prev) => [
      ...prev,
      { id, nama, kategori, porsiPerBatch: 1, items: [], margin: { "Dine-in": 40, Online: 50, Katering: 30 } },
    ]);
    setSelectedMenuId(id);
    setShowAddMenu(false);
  }

  function removeMenu(id) {
    setMenus((prev) => {
      const nextMenus = prev.filter((m) => m.id !== id);
      if (selectedMenuId === id) {
        setSelectedMenuId(nextMenus[0]?.id || "");
      }
      return nextMenus;
    });
  }

  function updateMenu(id, patch) {
    setMenus((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  function addItemToMenu(menuId, bahanId) {
    setMenus((prev) =>
      prev.map((m) =>
        m.id === menuId
          ? { ...m, items: [...m.items, { bahanId, qty: 10, unit: "gr", susut: 0 }] }
          : m
      )
    );
  }

  function updateItem(menuId, idx, patch) {
    setMenus((prev) =>
      prev.map((m) => {
        if (m.id !== menuId) return m;
        const items = [...m.items];
        items[idx] = { ...items[idx], ...patch };
        return { ...m, items };
      })
    );
  }

  function removeItem(menuId, idx) {
    setMenus((prev) =>
      prev.map((m) => {
        if (m.id !== menuId) return m;
        return { ...m, items: m.items.filter((_, i) => i !== idx) };
      })
    );
  }

  function exportBackup() {
    downloadJson(`dapurhitung-backup-${new Date().toISOString().slice(0, 10)}.json`, {
      bahanList,
      menus,
      channels,
      overhead,
      businessName,
      selectedMenuId,
    });
  }

  function importBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const restored = normalizeAppState(parsed);
        setBahanList(restored.bahanList);
        setMenus(restored.menus);
        setChannels(restored.channels);
        setOverhead(restored.overhead);
        setBusinessName(restored.businessName);
        setSelectedMenuId(restored.selectedMenuId);
        window.alert("Backup berhasil diimpor.");
      } catch {
        window.alert("File backup tidak valid.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  function resetSemuaData() {
    const confirmed = window.confirm("Reset semua data ke contoh bawaan? Data lokal saat ini akan diganti.");
    if (!confirmed) return;

    const defaults = storageMode === "cloud"
      ? ensureCloudFriendlyState(normalizeAppState())
      : normalizeAppState();
    setBahanList(defaults.bahanList);
    setMenus(defaults.menus);
    setChannels(defaults.channels);
    setOverhead(defaults.overhead);
    setBusinessName(defaults.businessName);
    setSelectedMenuId(defaults.selectedMenuId);
    setTab("bahan");
  }

  const selectedMenu = menus.find((m) => m.id === selectedMenuId);

  const navItems = [
    { key: "bahan", label: "Bahan Baku", icon: Package },
    { key: "resep", label: "Resep / Menu", icon: ChefHat },
    { key: "overhead", label: "Biaya Operasional", icon: Calculator },
    { key: "dashboard", label: "Dashboard HPP", icon: LayoutDashboard },
    { key: "sop", label: "SOP Resep", icon: FileText },
    { key: "laporan", label: "Laporan", icon: Download },
  ];

  const syncStatusLabel = {
    idle: storageMode === "cloud" ? "Terhubung ke cloud" : "Tersimpan di perangkat",
    saving: "Menyimpan perubahan…",
    saved: "Semua perubahan tersimpan",
    error: "Gagal sinkron, coba lagi",
  }[syncStatus] || "Siap";

  const defaultModeNotice = storageMode === "cloud"
    ? "Data akun ini tersimpan di cloud melalui login user. Kamu bisa masuk dari device lain dengan email atau Google dan melihat data yang sama."
    : "Data tersimpan otomatis di perangkat ini. Setelah di-deploy sebagai PWA, user bisa buka dari browser lalu “Add to Home Screen” agar terasa seperti app.";

  return (
    <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui", background: "#ffffff", minHeight: "100vh", color: "#14140f" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        html { -webkit-text-size-adjust: 100%; }
        body { margin: 0; }
        .disp { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; font-weight: 600; letter-spacing: -0.03em; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: #d2d2c8; border-radius: 4px; }
        input[type=number]::-webkit-inner-spin-button { opacity: 1; }
        .table-scroll, .nav-scroll { overflow-x: auto; }
        .nav-scroll { padding-bottom: 2px; }
        .nav-row { display: flex; gap: 6px; background: #30302a; padding: 4px; border-radius: 9999px; min-width: max-content; }
        .summary-card { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .data-tools { display: grid; grid-template-columns: 1.4fr 1fr; gap: 16px; margin-bottom: 20px; }
        .resep-grid, .overhead-grid, .sop-grid { display: grid; gap: 20px; }
        .resep-grid { grid-template-columns: 220px 1fr; }
        .overhead-grid { grid-template-columns: 1fr 1fr; }
        .sop-grid { grid-template-columns: 260px 1fr; }

        @media (max-width: 920px) {
          .data-tools,
          .resep-grid,
          .overhead-grid,
          .sop-grid,
          .summary-card {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 680px) {
          header.app-header { padding: 18px 16px; }
          main.app-main { padding: 18px 16px; }
          .card-pad { padding: 18px !important; border-radius: 20px !important; }
          .report-shell { padding: 22px 18px !important; }
          .print-card { width: 100% !important; }
        }

        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; top: 0; left: 0; width: 100%; margin: 0; padding: 0; }
          .no-print { display: none !important; }
        }
      `}</style>

      <header className="app-header" style={{ background: "#14140f", color: "#ffffff", padding: "20px 28px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="disp" style={{ fontSize: 24, letterSpacing: "-0.01em" }}>
              Dapur<span style={{ color: "#beff50" }}>Hitung</span>
            </div>
            <div style={{ fontSize: 12.5, color: "#b9b9b7", marginTop: 2 }}>
              Aplikasi HPP &amp; Harga Jual — siap dipasang di Android dan iPhone
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <div className="nav-scroll">
              <div className="nav-row">
                {navItems.map((n) => {
                  const Icon = n.icon;
                  const active = tab === n.key;
                  return (
                    <button
                      key={n.key}
                      type="button"
                      onClick={() => setTab(n.key)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "9px 16px",
                        borderRadius: 9999,
                        border: "none",
                        cursor: "pointer",
                        background: active ? "#beff50" : "transparent",
                        color: active ? "#14140f" : "#f5f5eb",
                        fontWeight: 500,
                        fontSize: 13.5,
                        transition: "all .15s",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Icon size={15} /> {n.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {(userLabel || onSignOut) && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {userLabel && (
                  <div style={{ fontSize: 12.5, color: "#b9b9b7" }}>
                    Masuk sebagai <strong style={{ color: "#ffffff" }}>{userLabel}</strong>
                  </div>
                )}
                {onSignOut && (
                  <button
                    type="button"
                    onClick={onSignOut}
                    style={{
                      border: "1px solid #4a4a43",
                      background: "transparent",
                      color: "#ffffff",
                      padding: "9px 14px",
                      borderRadius: 9999,
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    Logout
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="app-main" style={{ maxWidth: 1200, margin: "0 auto", padding: "28px" }}>
        <div className="data-tools no-print">
          <Card>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "#f5f5eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Smartphone size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {storageMode === "cloud" ? "Mode akun user" : "Mode aplikasi gratis"}
                </div>
                <div style={{ fontSize: 13, color: "#6e6e64", lineHeight: 1.6 }}>
                  {modeNotice || defaultModeNotice}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 12.5, color: syncStatus === "error" ? "#b42318" : "#6e6e64", fontWeight: 500 }}>
                {syncStatusLabel}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", justifyContent: "flex-start" }}>
                <PrimaryButton icon={Download} label="Backup JSON" onClick={exportBackup} />
                <PrimaryButton icon={Upload} label="Import Backup" onClick={() => fileInputRef.current?.click()} style={{ background: "#14140f", color: "#ffffff" }} />
                <PrimaryButton icon={RotateCcw} label="Reset Data" onClick={resetSemuaData} style={{ background: "#f5f5eb", color: "#14140f" }} />
                <input ref={fileInputRef} type="file" accept="application/json" onChange={importBackup} style={{ display: "none" }} />
              </div>
            </div>
          </Card>
        </div>

        {tab === "bahan" && (
          <BahanTab
            bahanList={bahanList}
            onAdd={() => setShowAddBahan(true)}
            onRemove={removeBahan}
            onUpdate={(id, patch) =>
              setBahanList((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)))
            }
          />
        )}

        {tab === "resep" && (
          <ResepTab
            menus={menus}
            bahanList={bahanList}
            bahanMap={bahanMap}
            selectedMenu={selectedMenu}
            selectedMenuId={selectedMenuId}
            setSelectedMenuId={setSelectedMenuId}
            onAddMenu={() => setShowAddMenu(true)}
            onRemoveMenu={removeMenu}
            updateMenu={updateMenu}
            addItemToMenu={addItemToMenu}
            updateItem={updateItem}
            removeItem={removeItem}
            hitungHPP={hitungHPP}
          />
        )}

        {tab === "overhead" && (
          <OverheadTab
            overhead={overhead}
            setOverhead={setOverhead}
            overheadPerPorsi={overheadPerPorsi}
            channels={channels}
            setChannels={setChannels}
          />
        )}

        {tab === "dashboard" && (
          <DashboardTab menus={menus} channels={channels} hitungHPP={hitungHPP} hargaJual={hargaJual} updateMenu={updateMenu} />
        )}

        {tab === "sop" && (
          <SopResepTab
            menus={menus}
            bahanMap={bahanMap}
            hitungHPP={hitungHPP}
            businessName={businessName}
            setBusinessName={setBusinessName}
          />
        )}

        {tab === "laporan" && (
          <LaporanTab
            menus={menus}
            channels={channels}
            hitungHPP={hitungHPP}
            hargaJual={hargaJual}
            businessName={businessName}
            setBusinessName={setBusinessName}
          />
        )}
      </main>

      {showAddBahan && <AddBahanModal onClose={() => setShowAddBahan(false)} onSave={addBahan} />}
      {showAddMenu && <AddMenuModal onClose={() => setShowAddMenu(false)} onSave={addMenu} />}
    </div>
  );
}

function BahanTab({ bahanList, onAdd, onRemove, onUpdate }) {
  return (
    <div>
      <SectionHeader
        title="Master Bahan Baku"
        subtitle="Semua bahan yang dipakai di resep kamu, lengkap dengan harga terbaru."
        action={<PrimaryButton icon={Plus} label="Tambah Bahan" onClick={onAdd} />}
      />
      <Card>
        <div className="table-scroll">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 860 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#6e6e64", fontSize: 12.5, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                <th style={th}>Nama Bahan</th>
                <th style={th}>Kategori</th>
                <th style={th}>Berlaku Untuk</th>
                <th style={th}>Satuan Beli</th>
                <th style={th}>Harga Beli</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {bahanList.map((b) => (
                <tr key={b.id} style={{ borderTop: "1px solid #d2d2c8" }}>
                  <td style={td}>
                    <input value={b.nama} onChange={(e) => onUpdate(b.id, { nama: e.target.value })} style={inputInline} />
                  </td>
                  <td style={td}>
                    <input value={b.kategori} onChange={(e) => onUpdate(b.id, { kategori: e.target.value })} style={{ ...inputInline, width: 100 }} />
                  </td>
                  <td style={{ ...td, minWidth: 220 }}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {MENU_KATEGORI.map((k) => {
                        const active = (b.tipeMenu || []).includes(k);
                        return (
                          <button
                            key={k}
                            type="button"
                            onClick={() => {
                              const current = b.tipeMenu || [];
                              const next = active ? current.filter((x) => x !== k) : [...current, k];
                              onUpdate(b.id, { tipeMenu: next });
                            }}
                            style={{
                              fontSize: 11,
                              padding: "3px 9px",
                              borderRadius: 9999,
                              cursor: "pointer",
                              border: active ? "1px solid #14140f" : "1px solid #d2d2c8",
                              background: active ? "#beff50" : "transparent",
                              color: "#14140f",
                              fontWeight: 500,
                            }}
                          >
                            {k}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td style={td}>
                    <select value={b.satuan} onChange={(e) => onUpdate(b.id, { satuan: e.target.value })} style={{ ...inputInline, width: 80 }}>
                      {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </td>
                  <td style={td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ color: "#6e6e64" }}>Rp</span>
                      <input
                        type="number"
                        min={0}
                        value={b.harga}
                        onChange={(e) => onUpdate(b.id, { harga: clampNumber(e.target.value) })}
                        style={{ ...inputInline, width: 110 }}
                      />
                      <span style={{ color: "#6e6e64", fontSize: 12.5 }}>/{b.satuan}</span>
                    </div>
                  </td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <button type="button" onClick={() => onRemove(b.id)} style={iconBtn}><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {bahanList.length === 0 && <EmptyState text="Belum ada bahan baku. Tambahkan bahan pertama kamu." />}
      </Card>
    </div>
  );
}

function ResepTab({ menus, bahanList, bahanMap, selectedMenu, selectedMenuId, setSelectedMenuId, onAddMenu, onRemoveMenu, updateMenu, addItemToMenu, updateItem, removeItem, hitungHPP }) {
  const [pickBahan, setPickBahan] = useState("");
  const [searchBahan, setSearchBahan] = useState("");
  const result = selectedMenu ? hitungHPP(selectedMenu) : null;

  const filteredBahan = selectedMenu
    ? bahanList.filter((b) => {
        const cocokKategori = (b.tipeMenu || []).includes(selectedMenu.kategori);
        const cocokSearch = b.nama.toLowerCase().includes(searchBahan.toLowerCase());
        return cocokKategori && cocokSearch;
      })
    : [];

  return (
    <div>
      <SectionHeader
        title="Resep / Menu"
        subtitle="Susun takaran bahan tiap menu. Biaya bahan per porsi terhitung otomatis."
        action={<PrimaryButton icon={Plus} label="Tambah Menu" onClick={onAddMenu} />}
      />
      <div className="resep-grid">
        <Card style={{ padding: 8 }}>
          {menus.map((m) => (
            <div
              key={m.id}
              onClick={() => setSelectedMenuId(m.id)}
              style={{
                padding: "10px 12px",
                borderRadius: 18,
                cursor: "pointer",
                marginBottom: 4,
                background: selectedMenuId === m.id ? "#14140f" : "transparent",
                color: selectedMenuId === m.id ? "#ffffff" : "#14140f",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 500, fontSize: 13.5 }}>{m.nama}</div>
                <div style={{ fontSize: 11.5, opacity: 0.65 }}>{m.kategori}</div>
              </div>
              {selectedMenuId === m.id && (
                <button type="button" onClick={(e) => { e.stopPropagation(); onRemoveMenu(m.id); }} style={{ ...iconBtn, color: "#ffffff" }}>
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
          {menus.length === 0 && <div style={{ fontSize: 13, color: "#6e6e64", padding: 8 }}>Belum ada menu.</div>}
        </Card>

        {selectedMenu ? (
          <div>
            <Card>
              <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
                <Field label="Nama Menu">
                  <input value={selectedMenu.nama} onChange={(e) => updateMenu(selectedMenu.id, { nama: e.target.value })} style={inputBox} />
                </Field>
                <Field label="Kategori Menu">
                  <select
                    value={selectedMenu.kategori}
                    onChange={(e) => updateMenu(selectedMenu.id, { kategori: e.target.value })}
                    style={{ ...inputBox, width: 150 }}
                  >
                    {MENU_KATEGORI.map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                </Field>
                <Field label="Porsi per Batch">
                  <input
                    type="number"
                    min={1}
                    value={selectedMenu.porsiPerBatch}
                    onChange={(e) => updateMenu(selectedMenu.id, { porsiPerBatch: clampNumber(e.target.value, 1) })}
                    style={{ ...inputBox, width: 100 }}
                  />
                </Field>
              </div>

              <div className="table-scroll">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, minWidth: 700 }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: "#6e6e64", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      <th style={th}>Bahan</th>
                      <th style={th}>Qty</th>
                      <th style={th}>Satuan</th>
                      <th style={th}>Susut %</th>
                      <th style={th}>Biaya</th>
                      <th style={th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMenu.items.map((it, idx) => {
                      const bahan = bahanMap[it.bahanId];
                      const gramFaktor = unitToGram[it.unit] || 1;
                      const qty = clampNumber(it.qty);
                      const susut = normalizeSusut(it.susut);
                      const qtyEfektif = (qty * gramFaktor) / (1 - susut / 100);
                      const hargaPerGram = bahan
                        ? (bahan.satuan === "kg" || bahan.satuan === "l" ? clampNumber(bahan.harga) / 1000 : clampNumber(bahan.harga))
                        : 0;
                      const cost = hargaPerGram * qtyEfektif;

                      return (
                        <tr key={idx} style={{ borderTop: "1px solid #d2d2c8" }}>
                          <td style={td}>{bahan ? bahan.nama : "—"}</td>
                          <td style={td}>
                            <input
                              type="number"
                              min={0}
                              value={it.qty}
                              onChange={(e) => updateItem(selectedMenu.id, idx, { qty: clampNumber(e.target.value) })}
                              style={{ ...inputInline, width: 80 }}
                            />
                          </td>
                          <td style={td}>
                            <select value={it.unit} onChange={(e) => updateItem(selectedMenu.id, idx, { unit: e.target.value })} style={{ ...inputInline, width: 80 }}>
                              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                            </select>
                          </td>
                          <td style={td}>
                            <input
                              type="number"
                              min={0}
                              max={99}
                              value={it.susut}
                              onChange={(e) => updateItem(selectedMenu.id, idx, { susut: normalizeSusut(e.target.value) })}
                              style={{ ...inputInline, width: 65 }}
                            />
                          </td>
                          <td style={{ ...td, fontWeight: 500 }}>{rupiah(cost)}</td>
                          <td style={{ ...td, textAlign: "right" }}>
                            <button type="button" onClick={() => removeItem(selectedMenu.id, idx)} style={iconBtn}><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 9999, background: "#beff50", color: "#14140f" }}>
                    Menampilkan bahan untuk: {selectedMenu.kategori}
                  </span>
                  <span style={{ fontSize: 12, color: "#6e6e64" }}>{filteredBahan.length} bahan cocok</span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <input
                    placeholder="Cari nama bahan…"
                    value={searchBahan}
                    onChange={(e) => setSearchBahan(e.target.value)}
                    style={{ ...inputBox, flex: 1, minWidth: 180 }}
                  />
                  <select value={pickBahan} onChange={(e) => setPickBahan(e.target.value)} style={{ ...inputBox, flex: 1, minWidth: 220 }}>
                    <option value="">Pilih bahan untuk ditambahkan…</option>
                    {filteredBahan.map((b) => <option key={b.id} value={b.id}>{b.nama}</option>)}
                  </select>
                  <PrimaryButton
                    icon={Plus}
                    label="Tambah ke Resep"
                    onClick={() => {
                      if (pickBahan) {
                        addItemToMenu(selectedMenu.id, pickBahan);
                        setPickBahan("");
                      }
                    }}
                  />
                </div>
                {filteredBahan.length === 0 && (
                  <div style={{ fontSize: 12.5, color: "#6e6e64", marginTop: 8 }}>
                    Tidak ada bahan bertipe "{selectedMenu.kategori}". Tambahkan atau tandai bahan yang relevan di tab Bahan Baku.
                  </div>
                )}
              </div>
            </Card>

            {result && (
              <Card style={{ marginTop: 16, background: "#14140f", color: "#ffffff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#b9b9b7" }}>Biaya Bahan / Porsi</div>
                    <div className="disp" style={{ fontSize: 22 }}>{rupiah(result.biayaBahan)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#b9b9b7" }}>Alokasi Overhead / Porsi</div>
                    <div className="disp" style={{ fontSize: 22 }}>{rupiah(result.overhead)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#beff50" }}>HPP / Porsi</div>
                    <div className="disp" style={{ fontSize: 26, color: "#beff50" }}>{rupiah(result.hpp)}</div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        ) : (
          <Card><EmptyState text="Pilih atau tambahkan menu untuk mulai menyusun resep." /></Card>
        )}
      </div>
    </div>
  );
}

function OverheadTab({ overhead, setOverhead, overheadPerPorsi, channels, setChannels }) {
  return (
    <div>
      <SectionHeader title="Biaya Operasional" subtitle="Biaya tetap & tenaga kerja dialokasikan rata ke estimasi porsi bulanan." />
      <div className="overhead-grid">
        <Card>
          <h3 style={h3style}>Biaya Bulanan</h3>
          <Field label="Biaya Tetap (sewa, listrik, gas, penyusutan alat)">
            <MoneyInput value={overhead.biayaTetapBulanan} onChange={(v) => setOverhead((o) => ({ ...o, biayaTetapBulanan: v }))} />
          </Field>
          <Field label="Biaya Tenaga Kerja">
            <MoneyInput value={overhead.biayaTenagaKerjaBulanan} onChange={(v) => setOverhead((o) => ({ ...o, biayaTenagaKerjaBulanan: v }))} />
          </Field>
          <Field label="Estimasi Total Porsi Terjual / Bulan">
            <input
              type="number"
              min={1}
              value={overhead.estimasiPorsiBulanan}
              onChange={(e) => setOverhead((o) => ({ ...o, estimasiPorsiBulanan: clampNumber(e.target.value, 1) }))}
              style={inputBox}
            />
          </Field>
          <div style={{ marginTop: 16, padding: 16, background: "#f5f5eb", borderRadius: 18 }}>
            <div style={{ fontSize: 12, color: "#6e6e64" }}>Overhead teralokasi per porsi</div>
            <div className="disp" style={{ fontSize: 22, color: "#14140f" }}>{rupiah(overheadPerPorsi)}</div>
          </div>
        </Card>

        <Card>
          <h3 style={h3style}>Channel Penjualan</h3>
          <div style={{ fontSize: 13, color: "#6e6e64", marginBottom: 12 }}>
            Aktifkan channel yang ingin dihitung, lalu isi fee/komisi tiap channel.
          </div>
          {channels.map((c, idx) => (
            <div key={c.nama} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 0", borderTop: idx > 0 ? "1px solid #d2d2c8" : "none", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={c.aktif}
                  onChange={(e) => setChannels((prev) => prev.map((p, i) => (i === idx ? { ...p, aktif: e.target.checked } : p)))}
                />
                <div style={{ fontWeight: 500, fontSize: 14 }}>{c.nama}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="number"
                  min={0}
                  value={c.fee}
                  onChange={(e) => {
                    const v = clampNumber(e.target.value);
                    setChannels((prev) => prev.map((p, i) => (i === idx ? { ...p, fee: v } : p)));
                  }}
                  style={{ ...inputInline, width: 68 }}
                />
                <Percent size={13} color="#6e6e64" />
                <span style={{ fontSize: 12, color: "#6e6e64" }}>fee platform</span>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function DashboardTab({ menus, channels, hitungHPP, hargaJual, updateMenu }) {
  const activeChannels = channels.filter((c) => c.aktif);
  const rows = menus.map((m) => {
    const r = hitungHPP(m);
    const perChannel = activeChannels.map((c) => {
      const margin = m.margin?.[c.nama] ?? 40;
      const hj = hargaJual(r.hpp, margin, c.fee);
      return { channel: c.nama, margin, fee: c.fee, harga: hj };
    });
    return { menu: m, hpp: r.hpp, breakdown: r.breakdown, perChannel };
  });

  const chartData = rows.map((r) => ({ nama: r.menu.nama, HPP: Math.round(r.hpp) }));
  const [expanded, setExpanded] = useState(null);

  return (
    <div>
      <SectionHeader title="Dashboard HPP & Harga Jual" subtitle="Ringkasan semua menu, HPP, dan rekomendasi harga jual per channel." />

      <Card style={{ marginBottom: 20 }}>
        <h3 style={h3style}>Perbandingan HPP Antar Menu</h3>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d2d2c8" />
              <XAxis dataKey="nama" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v / 1000}rb`} />
              <Tooltip formatter={(v) => rupiah(v)} />
              <Bar dataKey="HPP" fill="#beff50" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card style={{ padding: 0 }}>
        <div className="table-scroll">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, minWidth: 760 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#6e6e64", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                <th style={th}>Menu</th>
                <th style={th}>HPP / Porsi</th>
                {activeChannels.map((c) => (
                  <th style={th} key={c.nama}>{c.nama} <span style={{ opacity: 0.6 }}>(margin %)</span></th>
                ))}
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <React.Fragment key={r.menu.id}>
                  <tr style={{ borderTop: "1px solid #d2d2c8" }}>
                    <td style={{ ...td, fontWeight: 500 }}>{r.menu.nama}</td>
                    <td style={{ ...td, fontWeight: 500, color: "#14140f" }}>{rupiah(r.hpp)}</td>
                    {r.perChannel.map((pc) => (
                      <td style={td} key={pc.channel}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span>{pc.harga ? rupiah(pc.harga) : "—"}</span>
                          <input
                            type="number"
                            min={0}
                            value={pc.margin}
                            onChange={(e) => {
                              const v = clampNumber(e.target.value);
                              updateMenu(r.menu.id, { margin: { ...r.menu.margin, [pc.channel]: v } });
                            }}
                            style={{ ...inputInline, width: 52, fontSize: 12 }}
                          />
                        </div>
                      </td>
                    ))}
                    <td style={{ ...td, textAlign: "right" }}>
                      <button type="button" onClick={() => setExpanded(expanded === r.menu.id ? null : r.menu.id)} style={iconBtn}>
                        {expanded === r.menu.id ? <X size={14} /> : <TrendingUp size={14} />}
                      </button>
                    </td>
                  </tr>
                  {expanded === r.menu.id && (
                    <tr>
                      <td colSpan={3 + r.perChannel.length} style={{ padding: "0 16px 16px" }}>
                        <div style={{ background: "#f5f5eb", borderRadius: 18, padding: 16, display: "flex", gap: 24, flexWrap: "wrap" }}>
                          <div style={{ width: 160, height: 160 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={r.breakdown} dataKey="cost" nameKey="nama" innerRadius={30} outerRadius={60} paddingAngle={2}>
                                  {r.breakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(v) => rupiah(v)} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div style={{ flex: 1, minWidth: 220 }}>
                            <div style={{ fontSize: 12, color: "#6e6e64", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                              Komposisi Biaya Bahan
                            </div>
                            {r.breakdown.map((b, i) => (
                              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0", gap: 10 }}>
                                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ width: 8, height: 8, borderRadius: 4, background: COLORS[i % COLORS.length], display: "inline-block" }} />
                                  {b.nama}
                                </span>
                                <span style={{ fontWeight: 500 }}>{rupiah(b.cost)}</span>
                              </div>
                            ))}
                          </div>
                          {r.perChannel.some((pc) => !pc.harga) && (
                            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#14140f", fontSize: 12.5, width: "100%" }}>
                              <AlertTriangle size={14} /> Margin + fee terlalu tinggi untuk salah satu channel, harga jual tidak bisa dihitung.
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <EmptyState text="Belum ada menu untuk ditampilkan." />}
      </Card>
    </div>
  );
}

function SopResepTab({ menus, bahanMap, hitungHPP, businessName, setBusinessName }) {
  const [selectedId, setSelectedId] = useState(menus[0]?.id || "");

  useEffect(() => {
    if (!menus.length) {
      setSelectedId("");
      return;
    }
    if (!menus.some((m) => m.id === selectedId)) {
      setSelectedId(menus[0].id);
    }
  }, [menus, selectedId]);

  const menu = menus.find((m) => m.id === selectedId);
  const result = menu ? hitungHPP(menu) : null;
  const today = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div>
      <SectionHeader
        title="SOP Resep"
        subtitle="Kartu resep standar per menu, format struk — bisa dicetak untuk ditempel di dapur atau arsip SOP."
      />

      <div className="sop-grid">
        <div className="no-print">
          <Card>
            <Field label="Nama Usaha (tampil di cetakan)">
              <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} style={inputBox} />
            </Field>
            <Field label="Pilih Menu">
              <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} style={inputBox}>
                <option value="">— Pilih menu —</option>
                {menus.map((m) => <option key={m.id} value={m.id}>{m.nama}</option>)}
              </select>
            </Field>
            <PrimaryButton
              icon={Printer}
              label="Cetak SOP Resep"
              onClick={() => window.print()}
              style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
            />
          </Card>
        </div>

        <div>
          {!menu || !result ? (
            <Card><EmptyState text="Pilih menu di sebelah kiri untuk menampilkan SOP resepnya." /></Card>
          ) : (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div
                id="print-area"
                className="print-card"
                style={{
                  width: 340,
                  background: "#ffffff",
                  border: "1px solid #d2d2c8",
                  borderRadius: 4,
                  padding: "24px 20px",
                  fontFamily: "'Courier New', monospace",
                  color: "#14140f",
                  fontSize: 13,
                }}
              >
                <div style={{ textAlign: "center", marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, textTransform: "uppercase" }}>{businessName}</div>
                  <div style={{ fontSize: 11, marginTop: 2 }}>SOP RESEP STANDAR</div>
                </div>
                <div style={{ borderTop: "1px dashed #14140f", margin: "8px 0" }} />
                <RowLabel label="Menu" value={<span style={{ fontWeight: 700 }}>{menu.nama}</span>} />
                <RowLabel label="Kategori" value={menu.kategori} />
                <RowLabel label="Porsi/Batch" value={menu.porsiPerBatch} />
                <RowLabel label="Dicetak" value={today} />
                <div style={{ borderTop: "1px dashed #14140f", margin: "8px 0" }} />
                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>DAFTAR BAHAN &amp; TAKARAN</div>
                {menu.items.map((it, idx) => {
                  const bahan = bahanMap[it.bahanId];
                  return (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "2px 0", gap: 12 }}>
                      <span>{bahan ? bahan.nama : "—"}</span>
                      <span>
                        {clampNumber(it.qty)}{it.unit}
                        {normalizeSusut(it.susut) > 0 ? ` (susut ${normalizeSusut(it.susut)}%)` : ""}
                      </span>
                    </div>
                  );
                })}
                <div style={{ borderTop: "1px dashed #14140f", margin: "8px 0" }} />
                <RowLabel label="Biaya Bahan/Porsi" value={rupiah(result.biayaBahan)} />
                <RowLabel label="Overhead/Porsi" value={rupiah(result.overhead)} />
                <div style={{ borderTop: "1px dashed #14140f", margin: "8px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700 }}>
                  <span>HPP/PORSI</span>
                  <span>{rupiah(result.hpp)}</span>
                </div>
                <div style={{ borderTop: "1px dashed #14140f", margin: "10px 0" }} />
                <div style={{ fontSize: 10.5, textAlign: "center", color: "#6e6e64" }}>
                  Ikuti takaran ini persis untuk menjaga konsistensi rasa &amp; biaya.
                  <br />Dicetak dari DapurHitung
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LaporanTab({ menus, channels, hitungHPP, hargaJual, businessName, setBusinessName }) {
  const today = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
  const activeChannels = channels.filter((c) => c.aktif);

  const rows = menus.map((m) => {
    const r = hitungHPP(m);
    const perChannel = activeChannels.map((c) => {
      const margin = m.margin?.[c.nama] ?? 40;
      const hj = hargaJual(r.hpp, margin, c.fee);
      return { channel: c.nama, harga: hj };
    });
    return { menu: m, hpp: r.hpp, perChannel };
  });

  const rataRataHpp = rows.length ? rows.reduce((a, r) => a + r.hpp, 0) / rows.length : 0;
  const termurah = rows.length ? rows.reduce((a, b) => (a.hpp < b.hpp ? a : b)) : null;
  const termahal = rows.length ? rows.reduce((a, b) => (a.hpp > b.hpp ? a : b)) : null;

  return (
    <div>
      <SectionHeader title="Laporan" subtitle="Laporan HPP & harga jual siap cetak — bukan sekadar tangkapan layar aplikasi." />

      <div className="no-print" style={{ marginBottom: 16 }}>
        <Card>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
            <Field label="Nama Usaha (tampil di laporan)">
              <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} style={{ ...inputBox, width: 260 }} />
            </Field>
            <PrimaryButton icon={Download} label="Unduh / Cetak PDF" onClick={() => window.print()} />
          </div>
          <div style={{ fontSize: 12, color: "#6e6e64", marginTop: 10 }}>
            Tombol di atas membuka dialog print browser — pilih "Save as PDF" di bagian tujuan printer untuk menyimpan sebagai file PDF.
          </div>
        </Card>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          id="print-area"
          className="report-shell"
          style={{
            width: 720,
            maxWidth: "100%",
            background: "#ffffff",
            border: "1px solid #d2d2c8",
            borderRadius: 4,
            padding: "40px 48px",
            fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
            color: "#14140f",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #14140f", paddingBottom: 16, marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "#beff50", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Store size={18} color="#14140f" />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{businessName}</div>
                <div style={{ fontSize: 11.5, color: "#6e6e64" }}>Laporan HPP & Harga Jual</div>
              </div>
            </div>
            <div style={{ textAlign: "right", fontSize: 11.5, color: "#6e6e64" }}>
              <div>Tanggal Cetak</div>
              <div style={{ fontWeight: 600, color: "#14140f" }}>{today}</div>
            </div>
          </div>

          <div className="summary-card" style={{ marginBottom: 28 }}>
            <SummaryBox label="Total Menu" value={rows.length} />
            <SummaryBox label="Rata-rata HPP" value={rupiah(rataRataHpp)} />
            <SummaryBox label="HPP Tertinggi" value={termahal ? rupiah(termahal.hpp) : "—"} />
          </div>

          <div className="table-scroll">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, marginBottom: 24, minWidth: 560 }}>
              <thead>
                <tr style={{ background: "#f5f5eb" }}>
                  <th style={reportTh}>Menu</th>
                  <th style={reportTh}>Kategori</th>
                  <th style={reportTh}>HPP/Porsi</th>
                  {activeChannels.map((c) => <th style={reportTh} key={c.nama}>{c.nama}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={r.menu.id} style={{ background: idx % 2 === 0 ? "#ffffff" : "#fafaf5" }}>
                    <td style={reportTd}>{r.menu.nama}</td>
                    <td style={reportTd}>{r.menu.kategori}</td>
                    <td style={{ ...reportTd, fontWeight: 700 }}>{rupiah(r.hpp)}</td>
                    {r.perChannel.map((pc) => (
                      <td style={reportTd} key={pc.channel}>{pc.harga ? rupiah(pc.harga) : "—"}</td>
                    ))}
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td style={reportTd} colSpan={3 + activeChannels.length}>Belum ada menu untuk dilaporkan.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {termurah && termahal && (
            <div style={{ fontSize: 12, color: "#6e6e64", marginBottom: 24, lineHeight: 1.6 }}>
              Menu dengan HPP terendah: <strong style={{ color: "#14140f" }}>{termurah.menu.nama}</strong> ({rupiah(termurah.hpp)}). Menu dengan HPP tertinggi: <strong style={{ color: "#14140f" }}>{termahal.menu.nama}</strong> ({rupiah(termahal.hpp)}).
            </div>
          )}

          <div style={{ borderTop: "1px solid #d2d2c8", paddingTop: 16, display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "#919183", gap: 12, flexWrap: "wrap" }}>
            <span>Dihasilkan otomatis oleh DapurHitung</span>
            <span>Halaman 1 dari 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryBox({ label, value }) {
  return (
    <div style={{ border: "1px solid #d2d2c8", borderRadius: 8, padding: "12px 14px" }}>
      <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6e6e64" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function RowLabel({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, gap: 12 }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

const reportTh = { textAlign: "left", padding: "8px 10px", borderBottom: "2px solid #14140f", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" };
const reportTd = { padding: "8px 10px", borderBottom: "1px solid #d2d2c8" };

function AddBahanModal({ onClose, onSave }) {
  const [nama, setNama] = useState("");
  const [kategori, setKategori] = useState("Utama");
  const [satuan, setSatuan] = useState("kg");
  const [harga, setHarga] = useState(0);
  const [tipeMenu, setTipeMenu] = useState([]);

  return (
    <ModalShell onClose={onClose} title="Tambah Bahan Baku">
      <Field label="Nama Bahan"><input value={nama} onChange={(e) => setNama(e.target.value)} style={inputBox} autoFocus /></Field>
      <Field label="Kategori"><input value={kategori} onChange={(e) => setKategori(e.target.value)} style={inputBox} /></Field>
      <Field label="Berlaku untuk menu bertipe">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {MENU_KATEGORI.map((k) => {
            const active = tipeMenu.includes(k);
            return (
              <button
                key={k}
                type="button"
                onClick={() => setTipeMenu((prev) => active ? prev.filter((x) => x !== k) : [...prev, k])}
                style={{
                  fontSize: 12,
                  padding: "5px 12px",
                  borderRadius: 9999,
                  cursor: "pointer",
                  border: active ? "1px solid #14140f" : "1px solid #d2d2c8",
                  background: active ? "#beff50" : "transparent",
                  color: "#14140f",
                  fontWeight: 500,
                }}
              >
                {k}
              </button>
            );
          })}
        </div>
      </Field>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Field label="Satuan Beli">
          <select value={satuan} onChange={(e) => setSatuan(e.target.value)} style={inputBox}>
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </Field>
        <Field label="Harga Beli"><MoneyInput value={harga} onChange={setHarga} /></Field>
      </div>
      <PrimaryButton
        label="Simpan Bahan"
        onClick={() => nama.trim() && onSave({ nama: nama.trim(), kategori: kategori.trim(), satuan, harga: clampNumber(harga), tipeMenu })}
        style={{ marginTop: 8, width: "100%", justifyContent: "center" }}
      />
    </ModalShell>
  );
}

function AddMenuModal({ onClose, onSave }) {
  const [nama, setNama] = useState("");
  const [kategori, setKategori] = useState(MENU_KATEGORI[0]);

  return (
    <ModalShell onClose={onClose} title="Tambah Menu Baru">
      <Field label="Nama Menu"><input value={nama} onChange={(e) => setNama(e.target.value)} style={inputBox} autoFocus /></Field>
      <Field label="Kategori">
        <select value={kategori} onChange={(e) => setKategori(e.target.value)} style={inputBox}>
          {MENU_KATEGORI.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </Field>
      <PrimaryButton label="Simpan Menu" onClick={() => nama.trim() && onSave(nama.trim(), kategori)} style={{ marginTop: 8, width: "100%", justifyContent: "center" }} />
    </ModalShell>
  );
}

function ModalShell({ onClose, title, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(43,35,32,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#ffffff", borderRadius: 28, padding: 24, width: 380, maxWidth: "100%", border: "1px solid #d2d2c8" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 10 }}>
          <h3 className="disp" style={{ fontSize: 18, margin: 0 }}>{title}</h3>
          <button type="button" onClick={onClose} style={iconBtn}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
      <div>
        <h2 className="disp" style={{ fontSize: 26, margin: 0 }}>{title}</h2>
        <p style={{ fontSize: 13.5, color: "#6e6e64", margin: "4px 0 0" }}>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div className="card-pad" style={{ background: "#ffffff", border: "1px solid #d2d2c8", borderRadius: 28, padding: 32, ...style }}>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14, flex: 1, minWidth: 140 }}>
      <label style={{ display: "block", fontSize: 12, color: "#6e6e64", marginBottom: 5, fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  );
}

function MoneyInput({ value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ color: "#6e6e64", fontSize: 13 }}>Rp</span>
      <input type="number" min={0} value={value} onChange={(e) => onChange(clampNumber(e.target.value))} style={inputBox} />
    </div>
  );
}

function PrimaryButton({ icon: Icon, label, onClick, style }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "#beff50",
        color: "#14140f",
        border: "none",
        borderRadius: 9999,
        padding: "12px 16px 12px 12px",
        fontWeight: 500,
        fontSize: 13.5,
        cursor: "pointer",
        ...style,
      }}
    >
      {Icon && <Icon size={15} />} {label}
    </button>
  );
}

function EmptyState({ text }) {
  return <div style={{ textAlign: "center", padding: "30px 0", color: "#6e6e64", fontSize: 13.5 }}>{text}</div>;
}

const th = { padding: "10px 12px" };
const td = { padding: "10px 12px" };
const iconBtn = { border: "none", background: "transparent", cursor: "pointer", color: "#6e6e64", padding: 4, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 6 };
const inputInline = { border: "1px solid #d2d2c8", borderRadius: 6, padding: "5px 8px", fontSize: 13, width: "100%", background: "#ffffff", color: "#14140f" };
const inputBox = { border: "1px solid #d2d2c8", borderRadius: 8, padding: "10px 12px", fontSize: 14, width: "100%", background: "#ffffff", color: "#000000" };
const h3style = { fontSize: 14.5, fontWeight: 600, margin: "0 0 14px", fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" };
