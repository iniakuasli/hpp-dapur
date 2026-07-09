import React, { useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Plus, Trash2, ChefHat, Package, Calculator, LayoutDashboard, Percent, X, TrendingUp, AlertTriangle, FileText, Printer, Download, Store } from "lucide-react";

const rupiah = (n) =>
  "Rp" + Math.round(n || 0).toLocaleString("id-ID");

const UNITS = ["gr", "kg", "ml", "l", "pcs", "sdt", "sdm", "ikat", "butir"];

const MENU_KATEGORI = ["Makanan", "Minuman", "Snack", "Dessert"];

const COLORS = ["#14140f", "#beff50", "#6e6e64", "#30302a", "#919183"];

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

const unitToGram = { gr: 1, kg: 1000, ml: 1, l: 1000, pcs: 1, sdt: 5, sdm: 15, ikat: 1, butir: 1 };

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
    margin: { "Dine-in": 45, "Online": 55, "Katering": 35 },
  },
];

const defaultChannels = [
  { nama: "Dine-in", fee: 0, aktif: true },
  { nama: "Online", fee: 20, aktif: true },
  { nama: "Katering", fee: 0, aktif: true },
];

function useHitungBahanCost(bahan, unit, qtyGram) {
  const hargaPerSatuanDasar =
    bahan.satuan === "kg" || bahan.satuan === "l"
      ? bahan.harga / 1000
      : bahan.harga;
  return hargaPerSatuanDasar * qtyGram;
}

export default function HPPApp() {
  const [tab, setTab] = useState("bahan");
  const [bahanList, setBahanList] = useState(initialBahan);
  const [menus, setMenus] = useState(initialMenus);
  const [channels, setChannels] = useState(defaultChannels);
  const [overhead, setOverhead] = useState({
    biayaTetapBulanan: 3500000,
    estimasiPorsiBulanan: 1800,
    biayaTenagaKerjaBulanan: 4000000,
  });
  const [selectedMenuId, setSelectedMenuId] = useState("m1");
  const [showAddBahan, setShowAddBahan] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [businessName, setBusinessName] = useState("Warung Kamu");

  const overheadPerPorsi = useMemo(() => {
    const p = overhead.estimasiPorsiBulanan || 1;
    return (overhead.biayaTetapBulanan + overhead.biayaTenagaKerjaBulanan) / p;
  }, [overhead]);

  const bahanMap = useMemo(() => {
    const m = {};
    bahanList.forEach((b) => (m[b.id] = b));
    return m;
  }, [bahanList]);

  function hitungHPP(menu) {
    let biayaBahan = 0;
    const breakdown = [];
    menu.items.forEach((it) => {
      const bahan = bahanMap[it.bahanId];
      if (!bahan) return;
      const gramFaktor = unitToGram[it.unit] || 1;
      const qtyGram = it.qty * gramFaktor;
      const qtyEfektif = qtyGram / (1 - (it.susut || 0) / 100);
      const hargaPerGram =
        bahan.satuan === "kg" || bahan.satuan === "l" ? bahan.harga / 1000 : bahan.harga;
      const cost = hargaPerGram * qtyEfektif;
      biayaBahan += cost;
      breakdown.push({ nama: bahan.nama, cost });
    });
    const perPorsi = biayaBahan / (menu.porsiPerBatch || 1);
    const hpp = perPorsi + overheadPerPorsi;
    return { biayaBahan: perPorsi, overhead: overheadPerPorsi, hpp, breakdown };
  }

  function hargaJual(hpp, marginPct, feePct) {
    const denom = 1 - marginPct / 100 - feePct / 100;
    if (denom <= 0) return null;
    return hpp / denom;
  }

  function addBahan(data) {
    setBahanList((prev) => [...prev, { id: "b" + Date.now(), ...data }]);
    setShowAddBahan(false);
  }
  function removeBahan(id) {
    setBahanList((prev) => prev.filter((b) => b.id !== id));
  }
  function addMenu(nama, kategori) {
    const id = "m" + Date.now();
    setMenus((prev) => [
      ...prev,
      { id, nama, kategori, porsiPerBatch: 1, items: [], margin: { "Dine-in": 40, Online: 50, Katering: 30 } },
    ]);
    setSelectedMenuId(id);
    setShowAddMenu(false);
  }
  function removeMenu(id) {
    setMenus((prev) => prev.filter((m) => m.id !== id));
    if (selectedMenuId === id && menus.length > 1) {
      setSelectedMenuId(menus.find((m) => m.id !== id).id);
    }
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
        const items = m.items.filter((_, i) => i !== idx);
        return { ...m, items };
      })
    );
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

  return (
    <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui", background: "#ffffff", minHeight: "100vh", color: "#14140f" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap');
        .disp { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; font-weight: 500; letter-spacing: -0.03em; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: #d2d2c8; border-radius: 4px; }
        input[type=number]::-webkit-inner-spin-button { opacity: 1; }

        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; top: 0; left: 0; width: 100%; margin: 0; padding: 0; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <header style={{ background: "#14140f", color: "#ffffff", padding: "20px 28px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="disp" style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.01em" }}>
              Dapur<span style={{ color: "#beff50" }}>Hitung</span>
            </div>
            <div style={{ fontSize: 12.5, color: "#b9b9b7", marginTop: 2 }}>
              Prototipe HPP &amp; Harga Jual — Kuliner Multi-Channel
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, background: "#30302a", padding: 4, borderRadius: 9999 }}>
            {navItems.map((n) => {
              const Icon = n.icon;
              const active = tab === n.key;
              return (
                <button
                  key={n.key}
                  onClick={() => setTab(n.key)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "9px 16px", borderRadius: 9999, border: "none", cursor: "pointer",
                    background: active ? "#beff50" : "transparent",
                    color: active ? "#14140f" : "#f5f5eb",
                    fontWeight: 500, fontSize: 13.5, transition: "all .15s",
                  }}
                >
                  <Icon size={15} /> {n.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "28px" }}>
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
          <OverheadTab overhead={overhead} setOverhead={setOverhead} overheadPerPorsi={overheadPerPorsi} channels={channels} setChannels={setChannels} />
        )}

        {tab === "dashboard" && (
          <DashboardTab menus={menus} channels={channels} hitungHPP={hitungHPP} hargaJual={hargaJual} updateMenu={updateMenu} />
        )}

        {tab === "sop" && (
          <SopResepTab menus={menus} bahanMap={bahanMap} hitungHPP={hitungHPP} businessName={businessName} setBusinessName={setBusinessName} />
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

/* ---------------- BAHAN BAKU TAB ---------------- */
function BahanTab({ bahanList, onAdd, onRemove, onUpdate }) {
  return (
    <div>
      <SectionHeader
        title="Master Bahan Baku"
        subtitle="Semua bahan yang dipakai di resep kamu, lengkap dengan harga terbaru."
        action={<PrimaryButton icon={Plus} label="Tambah Bahan" onClick={onAdd} />}
      />
      <Card>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
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
                          onClick={() => {
                            const current = b.tipeMenu || [];
                            const next = active ? current.filter((x) => x !== k) : [...current, k];
                            onUpdate(b.id, { tipeMenu: next });
                          }}
                          style={{
                            fontSize: 11, padding: "3px 9px", borderRadius: 9999, cursor: "pointer",
                            border: active ? "1px solid #14140f" : "1px solid #d2d2c8",
                            background: active ? "#beff50" : "transparent",
                            color: "#14140f", fontWeight: 500,
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
                    <input type="number" value={b.harga} onChange={(e) => onUpdate(b.id, { harga: Number(e.target.value) })} style={{ ...inputInline, width: 90 }} />
                    <span style={{ color: "#6e6e64", fontSize: 12.5 }}>/{b.satuan}</span>
                  </div>
                </td>
                <td style={{ ...td, textAlign: "right" }}>
                  <button onClick={() => onRemove(b.id)} style={iconBtn}><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bahanList.length === 0 && <EmptyState text="Belum ada bahan baku. Tambahkan bahan pertama kamu." />}
      </Card>
    </div>
  );
}

/* ---------------- RESEP TAB ---------------- */
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
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20 }}>
        {/* Menu list */}
        <Card style={{ padding: 8 }}>
          {menus.map((m) => (
            <div
              key={m.id}
              onClick={() => setSelectedMenuId(m.id)}
              style={{
                padding: "10px 12px", borderRadius: 18, cursor: "pointer", marginBottom: 4,
                background: selectedMenuId === m.id ? "#14140f" : "transparent",
                color: selectedMenuId === m.id ? "#ffffff" : "#14140f",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 500, fontSize: 13.5 }}>{m.nama}</div>
                <div style={{ fontSize: 11.5, opacity: 0.65 }}>{m.kategori}</div>
              </div>
              {selectedMenuId === m.id && (
                <button onClick={(e) => { e.stopPropagation(); onRemoveMenu(m.id); }} style={{ ...iconBtn, color: "#ffffff" }}>
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
          {menus.length === 0 && <div style={{ fontSize: 13, color: "#6e6e64", padding: 8 }}>Belum ada menu.</div>}
        </Card>

        {/* Editor */}
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
                    style={{ ...inputBox, width: 140 }}
                  >
                    {MENU_KATEGORI.map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                </Field>
                <Field label="Porsi per Batch">
                  <input type="number" min={1} value={selectedMenu.porsiPerBatch} onChange={(e) => updateMenu(selectedMenu.id, { porsiPerBatch: Number(e.target.value) || 1 })} style={{ ...inputBox, width: 90 }} />
                </Field>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
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
                    const qtyEfektif = (it.qty * gramFaktor) / (1 - (it.susut || 0) / 100);
                    const hargaPerGram = bahan ? (bahan.satuan === "kg" || bahan.satuan === "l" ? bahan.harga / 1000 : bahan.harga) : 0;
                    const cost = hargaPerGram * qtyEfektif;
                    return (
                      <tr key={idx} style={{ borderTop: "1px solid #d2d2c8" }}>
                        <td style={td}>{bahan ? bahan.nama : "—"}</td>
                        <td style={td}>
                          <input type="number" value={it.qty} onChange={(e) => updateItem(selectedMenu.id, idx, { qty: Number(e.target.value) })} style={{ ...inputInline, width: 70 }} />
                        </td>
                        <td style={td}>
                          <select value={it.unit} onChange={(e) => updateItem(selectedMenu.id, idx, { unit: e.target.value })} style={{ ...inputInline, width: 75 }}>
                            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </td>
                        <td style={td}>
                          <input type="number" value={it.susut} onChange={(e) => updateItem(selectedMenu.id, idx, { susut: Number(e.target.value) })} style={{ ...inputInline, width: 55 }} />
                        </td>
                        <td style={{ ...td, fontWeight: 500 }}>{rupiah(cost)}</td>
                        <td style={{ ...td, textAlign: "right" }}>
                          <button onClick={() => removeItem(selectedMenu.id, idx)} style={iconBtn}><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div style={{ marginTop: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 9999,
                    background: "#beff50", color: "#14140f",
                  }}>
                    Menampilkan bahan untuk: {selectedMenu.kategori}
                  </span>
                  <span style={{ fontSize: 12, color: "#6e6e64" }}>
                    {filteredBahan.length} bahan cocok
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    placeholder="Cari nama bahan…"
                    value={searchBahan}
                    onChange={(e) => setSearchBahan(e.target.value)}
                    style={{ ...inputBox, flex: 1 }}
                  />
                  <select value={pickBahan} onChange={(e) => setPickBahan(e.target.value)} style={{ ...inputBox, flex: 1 }}>
                    <option value="">Pilih bahan untuk ditambahkan…</option>
                    {filteredBahan.map((b) => <option key={b.id} value={b.id}>{b.nama}</option>)}
                  </select>
                  <PrimaryButton
                    icon={Plus}
                    label="Tambah ke Resep"
                    onClick={() => { if (pickBahan) { addItemToMenu(selectedMenu.id, pickBahan); setPickBahan(""); } }}
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
                    <div className="disp" style={{ fontSize: 22, fontWeight: 500 }}>{rupiah(result.biayaBahan)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#b9b9b7" }}>Alokasi Overhead / Porsi</div>
                    <div className="disp" style={{ fontSize: 22, fontWeight: 500 }}>{rupiah(result.overhead)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#beff50" }}>HPP / Porsi</div>
                    <div className="disp" style={{ fontSize: 26, fontWeight: 500, color: "#beff50" }}>{rupiah(result.hpp)}</div>
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

/* ---------------- OVERHEAD TAB ---------------- */
function OverheadTab({ overhead, setOverhead, overheadPerPorsi, channels, setChannels }) {
  return (
    <div>
      <SectionHeader title="Biaya Operasional" subtitle="Biaya tetap & tenaga kerja dialokasikan rata ke estimasi porsi bulanan." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Card>
          <h3 style={h3style}>Biaya Bulanan</h3>
          <Field label="Biaya Tetap (sewa, listrik, gas, penyusutan alat)">
            <MoneyInput value={overhead.biayaTetapBulanan} onChange={(v) => setOverhead((o) => ({ ...o, biayaTetapBulanan: v }))} />
          </Field>
          <Field label="Biaya Tenaga Kerja">
            <MoneyInput value={overhead.biayaTenagaKerjaBulanan} onChange={(v) => setOverhead((o) => ({ ...o, biayaTenagaKerjaBulanan: v }))} />
          </Field>
          <Field label="Estimasi Total Porsi Terjual / Bulan">
            <input type="number" value={overhead.estimasiPorsiBulanan} onChange={(e) => setOverhead((o) => ({ ...o, estimasiPorsiBulanan: Number(e.target.value) || 1 }))} style={inputBox} />
          </Field>
          <div style={{ marginTop: 16, padding: 16, background: "#f5f5eb", borderRadius: 18 }}>
            <div style={{ fontSize: 12, color: "#6e6e64" }}>Overhead teralokasi per porsi</div>
            <div className="disp" style={{ fontSize: 22, fontWeight: 500, color: "#14140f" }}>{rupiah(overheadPerPorsi)}</div>
          </div>
        </Card>

        <Card>
          <h3 style={h3style}>Channel Penjualan</h3>
          <div style={{ fontSize: 13, color: "#6e6e64", marginBottom: 12 }}>
            Set fee/komisi tiap channel (misal Gofood/Grab potong sekitar 20%).
          </div>
          {channels.map((c, idx) => (
            <div key={c.nama} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderTop: idx > 0 ? "1px solid #d2d2c8" : "none" }}>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{c.nama}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="number"
                  value={c.fee}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setChannels((prev) => prev.map((p, i) => (i === idx ? { ...p, fee: v } : p)));
                  }}
                  style={{ ...inputInline, width: 60 }}
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

/* ---------------- DASHBOARD TAB ---------------- */
function DashboardTab({ menus, channels, hitungHPP, hargaJual, updateMenu }) {
  const rows = menus.map((m) => {
    const r = hitungHPP(m);
    const perChannel = channels.filter((c) => c.aktif).map((c) => {
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
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (v / 1000) + "rb"} />
              <Tooltip formatter={(v) => rupiah(v)} />
              <Bar dataKey="HPP" fill="#beff50" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card style={{ padding: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#6e6e64", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              <th style={th}>Menu</th>
              <th style={th}>HPP / Porsi</th>
              {channels.filter((c) => c.aktif).map((c) => (
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
                          value={pc.margin}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            updateMenu(r.menu.id, { margin: { ...r.menu.margin, [pc.channel]: v } });
                          }}
                          style={{ ...inputInline, width: 45, fontSize: 12 }}
                        />
                      </div>
                    </td>
                  ))}
                  <td style={{ ...td, textAlign: "right" }}>
                    <button onClick={() => setExpanded(expanded === r.menu.id ? null : r.menu.id)} style={iconBtn}>
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
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div style={{ fontSize: 12, color: "#6e6e64", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>Komposisi Biaya Bahan</div>
                          {r.breakdown.map((b, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}>
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
        {rows.length === 0 && <EmptyState text="Belum ada menu untuk ditampilkan." />}
      </Card>
    </div>
  );
}

/* ---------------- SOP RESEP TAB (format struk, bisa print) ---------------- */
function SopResepTab({ menus, bahanMap, hitungHPP, businessName, setBusinessName }) {
  const [selectedId, setSelectedId] = useState(menus[0]?.id || "");
  const menu = menus.find((m) => m.id === selectedId);
  const result = menu ? hitungHPP(menu) : null;
  const today = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div>
      <SectionHeader
        title="SOP Resep"
        subtitle="Kartu resep standar per menu, format struk — bisa dicetak untuk ditempel di dapur atau arsip SOP."
      />

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20 }}>
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
          {!menu ? (
            <Card><EmptyState text="Pilih menu di sebelah kiri untuk menampilkan SOP resepnya." /></Card>
          ) : (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div
                id="print-area"
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
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span>Menu</span>
                  <span style={{ fontWeight: 700 }}>{menu.nama}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span>Kategori</span>
                  <span>{menu.kategori}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span>Porsi/Batch</span>
                  <span>{menu.porsiPerBatch}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span>Dicetak</span>
                  <span>{today}</span>
                </div>
                <div style={{ borderTop: "1px dashed #14140f", margin: "8px 0" }} />
                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>DAFTAR BAHAN &amp; TAKARAN</div>
                {menu.items.map((it, idx) => {
                  const bahan = bahanMap[it.bahanId];
                  return (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "2px 0" }}>
                      <span>{bahan ? bahan.nama : "—"}</span>
                      <span>
                        {it.qty}{it.unit}
                        {it.susut > 0 ? ` (susut ${it.susut}%)` : ""}
                      </span>
                    </div>
                  );
                })}
                <div style={{ borderTop: "1px dashed #14140f", margin: "8px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span>Biaya Bahan/Porsi</span>
                  <span>{rupiah(result.biayaBahan)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span>Overhead/Porsi</span>
                  <span>{rupiah(result.overhead)}</span>
                </div>
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

/* ---------------- LAPORAN TAB (laporan bisnis, layak cetak A4) ---------------- */
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
      <SectionHeader
        title="Laporan"
        subtitle="Laporan HPP & harga jual siap cetak — bukan sekadar tangkapan layar aplikasi."
      />

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
          {/* Header laporan */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #14140f", paddingBottom: 16, marginBottom: 24 }}>
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

          {/* Ringkasan */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
            <div style={{ border: "1px solid #d2d2c8", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6e6e64" }}>Total Menu</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{rows.length}</div>
            </div>
            <div style={{ border: "1px solid #d2d2c8", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6e6e64" }}>Rata-rata HPP</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{rupiah(rataRataHpp)}</div>
            </div>
            <div style={{ border: "1px solid #d2d2c8", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6e6e64" }}>HPP Tertinggi</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{termahal ? rupiah(termahal.hpp) : "—"}</div>
            </div>
          </div>

          {/* Tabel utama */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, marginBottom: 24 }}>
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

          {/* Catatan */}
          {termurah && termahal && (
            <div style={{ fontSize: 12, color: "#6e6e64", marginBottom: 24, lineHeight: 1.6 }}>
              Menu dengan HPP terendah: <strong style={{ color: "#14140f" }}>{termurah.menu.nama}</strong> ({rupiah(termurah.hpp)}).{" "}
              Menu dengan HPP tertinggi: <strong style={{ color: "#14140f" }}>{termahal.menu.nama}</strong> ({rupiah(termahal.hpp)}).
            </div>
          )}

          {/* Footer */}
          <div style={{ borderTop: "1px solid #d2d2c8", paddingTop: 16, display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "#919183" }}>
            <span>Dihasilkan otomatis oleh DapurHitung</span>
            <span>Halaman 1 dari 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const reportTh = { textAlign: "left", padding: "8px 10px", borderBottom: "2px solid #14140f", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" };
const reportTd = { padding: "8px 10px", borderBottom: "1px solid #d2d2c8" };

/* ---------------- MODALS ---------------- */
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
                  fontSize: 12, padding: "5px 12px", borderRadius: 9999, cursor: "pointer",
                  border: active ? "1px solid #14140f" : "1px solid #d2d2c8",
                  background: active ? "#beff50" : "transparent", color: "#14140f", fontWeight: 500,
                }}
              >
                {k}
              </button>
            );
          })}
        </div>
      </Field>
      <div style={{ display: "flex", gap: 12 }}>
        <Field label="Satuan Beli">
          <select value={satuan} onChange={(e) => setSatuan(e.target.value)} style={inputBox}>
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </Field>
        <Field label="Harga Beli"><MoneyInput value={harga} onChange={setHarga} /></Field>
      </div>
      <PrimaryButton label="Simpan Bahan" onClick={() => nama && onSave({ nama, kategori, satuan, harga, tipeMenu })} style={{ marginTop: 8, width: "100%", justifyContent: "center" }} />
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
      <PrimaryButton label="Simpan Menu" onClick={() => nama && onSave(nama, kategori)} style={{ marginTop: 8, width: "100%", justifyContent: "center" }} />
    </ModalShell>
  );
}

function ModalShell({ onClose, title, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(43,35,32,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#ffffff", borderRadius: 28, padding: 32, width: 380, boxShadow: "none", border: "1px solid #d2d2c8" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 className="disp" style={{ fontSize: 18, fontWeight: 500, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={iconBtn}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------------- SHARED UI ---------------- */
function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
      <div>
        <h2 className="disp" style={{ fontSize: 26, fontWeight: 500, margin: 0 }}>{title}</h2>
        <p style={{ fontSize: 13.5, color: "#6e6e64", margin: "4px 0 0" }}>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ background: "#ffffff", border: "1px solid #d2d2c8", borderRadius: 28, padding: 32, ...style }}>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, color: "#6e6e64", marginBottom: 5, fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  );
}

function MoneyInput({ value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ color: "#6e6e64", fontSize: 13 }}>Rp</span>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} style={inputBox} />
    </div>
  );
}

function PrimaryButton({ icon: Icon, label, onClick, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 6, background: "#beff50", color: "#14140f",
        border: "none", borderRadius: 9999, padding: "12px 16px 12px 12px", fontWeight: 500, fontSize: 13.5, cursor: "pointer", ...style,
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
const h3style = { fontSize: 14.5, fontWeight: 500, margin: "0 0 14px", fontFamily: "'Fraunces', serif" };
