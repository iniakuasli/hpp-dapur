import { supabase } from "./supabase";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DEFAULT_BAHAN = [
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

const DEFAULT_MENUS = [
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

const DEFAULT_CHANNELS = [
  { nama: "Dine-in", fee: 0, aktif: true },
  { nama: "Online", fee: 20, aktif: true },
  { nama: "Katering", fee: 0, aktif: true },
];

const DEFAULT_OVERHEAD = {
  biayaTetapBulanan: 3500000,
  estimasiPorsiBulanan: 1800,
  biayaTenagaKerjaBulanan: 4000000,
};

function createId(prefix = "id") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clampNumber(value, min = 0, max = Number.POSITIVE_INFINITY) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return min;
  return Math.min(max, Math.max(min, numeric));
}

function normalizeSusut(value) {
  return clampNumber(value, 0, 99);
}

function ensureCloudIds(state) {
  const bahanIdMap = new Map();
  const bahanList = state.bahanList.map((b, index) => {
    const id = UUID_REGEX.test(b.id || "") ? b.id : createId(`bahan-${index}`);
    bahanIdMap.set(b.id, id);
    return { ...b, id };
  });

  const menuIdMap = new Map();
  const menus = state.menus.map((m, index) => {
    const id = UUID_REGEX.test(m.id || "") ? m.id : createId(`menu-${index}`);
    menuIdMap.set(m.id, id);
    return {
      ...m,
      id,
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
    selectedMenuId: menuIdMap.get(state.selectedMenuId) || state.selectedMenuId || menus[0]?.id || "",
  };
}

function normalizeAppShape(data = {}) {
  const bahanList = Array.isArray(data.bahanList) && data.bahanList.length
    ? data.bahanList.map((b) => ({
        id: b.id || createId("bahan"),
        nama: b.nama || "Bahan Baru",
        satuan: b.satuan || "kg",
        harga: clampNumber(b.harga),
        kategori: b.kategori || "Utama",
        tipeMenu: Array.isArray(b.tipeMenu) ? b.tipeMenu : [],
      }))
    : DEFAULT_BAHAN;

  const menus = Array.isArray(data.menus) && data.menus.length
    ? data.menus.map((m) => ({
        id: m.id || createId("menu"),
        nama: m.nama || "Menu Baru",
        kategori: m.kategori || "Makanan",
        porsiPerBatch: clampNumber(m.porsiPerBatch || 1, 1),
        items: Array.isArray(m.items)
          ? m.items.map((item) => ({
              bahanId: item.bahanId || "",
              qty: clampNumber(item.qty),
              unit: item.unit || "gr",
              susut: normalizeSusut(item.susut),
            }))
          : [],
        margin: typeof m.margin === "object" && m.margin !== null ? m.margin : { "Dine-in": 40, Online: 50, Katering: 30 },
      }))
    : DEFAULT_MENUS;

  const channels = Array.isArray(data.channels) && data.channels.length
    ? data.channels.map((c) => ({ nama: c.nama || "Channel", fee: clampNumber(c.fee), aktif: c.aktif !== false }))
    : DEFAULT_CHANNELS;

  const overhead = {
    biayaTetapBulanan: clampNumber(data.overhead?.biayaTetapBulanan ?? DEFAULT_OVERHEAD.biayaTetapBulanan),
    estimasiPorsiBulanan: clampNumber(data.overhead?.estimasiPorsiBulanan ?? DEFAULT_OVERHEAD.estimasiPorsiBulanan, 1),
    biayaTenagaKerjaBulanan: clampNumber(data.overhead?.biayaTenagaKerjaBulanan ?? DEFAULT_OVERHEAD.biayaTenagaKerjaBulanan),
  };

  return ensureCloudIds({
    bahanList,
    menus,
    channels,
    overhead,
    businessName: data.businessName || "Usaha Saya",
    selectedMenuId: data.selectedMenuId || menus[0]?.id || "",
  });
}

async function getOrCreateBusiness(userId, businessName = "Usaha Saya") {
  const { data, error } = await supabase
    .from("businesses")
    .upsert({ user_id: userId, name: businessName }, { onConflict: "user_id" })
    .select("id, name")
    .single();

  if (error) throw error;
  return data;
}

export async function loadCloudWorkspace(userId) {
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("user_id", userId)
    .maybeSingle();

  if (businessError) throw businessError;

  if (!business) {
    const createdBusiness = await getOrCreateBusiness(userId, "Usaha Saya");
    return normalizeAppShape({ businessName: createdBusiness.name });
  }

  const businessId = business.id;
  const [channelsRes, overheadRes, ingredientsRes, menusRes] = await Promise.all([
    supabase.from("channels").select("nama, fee, aktif").eq("business_id", businessId).order("nama", { ascending: true }),
    supabase.from("overheads").select("biaya_tetap_bulanan, estimasi_porsi_bulanan, biaya_tenaga_kerja_bulanan").eq("business_id", businessId).maybeSingle(),
    supabase.from("ingredients").select("id, nama, kategori, satuan, harga, tipe_menu").eq("business_id", businessId).order("created_at", { ascending: true }),
    supabase.from("menus").select("id, nama, kategori, porsi_per_batch, margin").eq("business_id", businessId).order("created_at", { ascending: true }),
  ]);

  if (channelsRes.error) throw channelsRes.error;
  if (overheadRes.error) throw overheadRes.error;
  if (ingredientsRes.error) throw ingredientsRes.error;
  if (menusRes.error) throw menusRes.error;

  const menuIds = (menusRes.data || []).map((row) => row.id);
  const menuItemsRes = menuIds.length
    ? await supabase.from("menu_items").select("menu_id, ingredient_id, qty, unit, susut").in("menu_id", menuIds)
    : { data: [], error: null };

  if (menuItemsRes.error) throw menuItemsRes.error;

  const menuItemsByMenuId = (menuItemsRes.data || []).reduce((acc, item) => {
    acc[item.menu_id] ??= [];
    acc[item.menu_id].push({
      bahanId: item.ingredient_id,
      qty: clampNumber(item.qty),
      unit: item.unit,
      susut: normalizeSusut(item.susut),
    });
    return acc;
  }, {});

  const state = normalizeAppShape({
    businessName: business.name,
    channels: (channelsRes.data || []).map((c) => ({ nama: c.nama, fee: clampNumber(c.fee), aktif: c.aktif })),
    overhead: overheadRes.data
      ? {
          biayaTetapBulanan: clampNumber(overheadRes.data.biaya_tetap_bulanan),
          estimasiPorsiBulanan: clampNumber(overheadRes.data.estimasi_porsi_bulanan, 1),
          biayaTenagaKerjaBulanan: clampNumber(overheadRes.data.biaya_tenaga_kerja_bulanan),
        }
      : DEFAULT_OVERHEAD,
    bahanList: (ingredientsRes.data || []).map((row) => ({
      id: row.id,
      nama: row.nama,
      kategori: row.kategori,
      satuan: row.satuan,
      harga: clampNumber(row.harga),
      tipeMenu: Array.isArray(row.tipe_menu) ? row.tipe_menu : [],
    })),
    menus: (menusRes.data || []).map((row) => ({
      id: row.id,
      nama: row.nama,
      kategori: row.kategori,
      porsiPerBatch: clampNumber(row.porsi_per_batch, 1),
      items: menuItemsByMenuId[row.id] || [],
      margin: row.margin || { "Dine-in": 40, Online: 50, Katering: 30 },
    })),
  });

  return state;
}

export async function saveCloudWorkspace(userId, rawState) {
  const state = ensureCloudIds(normalizeAppShape(rawState));
  const business = await getOrCreateBusiness(userId, state.businessName || "Usaha Saya");
  const businessId = business.id;

  const { error: overheadError } = await supabase
    .from("overheads")
    .upsert({
      business_id: businessId,
      biaya_tetap_bulanan: clampNumber(state.overhead.biayaTetapBulanan),
      estimasi_porsi_bulanan: clampNumber(state.overhead.estimasiPorsiBulanan, 1),
      biaya_tenaga_kerja_bulanan: clampNumber(state.overhead.biayaTenagaKerjaBulanan),
    }, { onConflict: "business_id" });

  if (overheadError) throw overheadError;

  const currentChannelNames = state.channels.map((c) => c.nama);
  const { data: existingChannels, error: existingChannelsError } = await supabase
    .from("channels")
    .select("id, nama")
    .eq("business_id", businessId);
  if (existingChannelsError) throw existingChannelsError;

  const channelNamesToDelete = (existingChannels || [])
    .map((row) => row.nama)
    .filter((nama) => !currentChannelNames.includes(nama));
  if (channelNamesToDelete.length) {
    const { error } = await supabase
      .from("channels")
      .delete()
      .eq("business_id", businessId)
      .in("nama", channelNamesToDelete);
    if (error) throw error;
  }

  if (state.channels.length) {
    const { error } = await supabase
      .from("channels")
      .upsert(
        state.channels.map((c) => ({
          business_id: businessId,
          nama: c.nama,
          fee: clampNumber(c.fee),
          aktif: c.aktif !== false,
        })),
        { onConflict: "business_id,nama" }
      );
    if (error) throw error;
  }

  const ingredientIds = state.bahanList.map((b) => b.id);
  const { data: existingIngredients, error: existingIngredientsError } = await supabase
    .from("ingredients")
    .select("id")
    .eq("business_id", businessId);
  if (existingIngredientsError) throw existingIngredientsError;

  const ingredientIdsToDelete = (existingIngredients || [])
    .map((row) => row.id)
    .filter((id) => !ingredientIds.includes(id));
  if (ingredientIdsToDelete.length) {
    const { error } = await supabase.from("ingredients").delete().in("id", ingredientIdsToDelete);
    if (error) throw error;
  }

  if (state.bahanList.length) {
    const { error } = await supabase.from("ingredients").upsert(
      state.bahanList.map((b) => ({
        id: b.id,
        business_id: businessId,
        nama: b.nama,
        kategori: b.kategori,
        satuan: b.satuan,
        harga: clampNumber(b.harga),
        tipe_menu: Array.isArray(b.tipeMenu) ? b.tipeMenu : [],
      }))
    );
    if (error) throw error;
  }

  const menuIds = state.menus.map((m) => m.id);
  const { data: existingMenus, error: existingMenusError } = await supabase
    .from("menus")
    .select("id")
    .eq("business_id", businessId);
  if (existingMenusError) throw existingMenusError;

  const menuIdsToDelete = (existingMenus || [])
    .map((row) => row.id)
    .filter((id) => !menuIds.includes(id));
  if (menuIdsToDelete.length) {
    const { error } = await supabase.from("menus").delete().in("id", menuIdsToDelete);
    if (error) throw error;
  }

  if (state.menus.length) {
    const { error } = await supabase.from("menus").upsert(
      state.menus.map((m) => ({
        id: m.id,
        business_id: businessId,
        nama: m.nama,
        kategori: m.kategori,
        porsi_per_batch: clampNumber(m.porsiPerBatch, 1),
        margin: m.margin || { "Dine-in": 40, Online: 50, Katering: 30 },
      }))
    );
    if (error) throw error;
  }

  if ((existingMenus || []).length || state.menus.length) {
    const allRelevantMenuIds = Array.from(new Set([...(existingMenus || []).map((row) => row.id), ...menuIds]));
    if (allRelevantMenuIds.length) {
      const { error } = await supabase.from("menu_items").delete().in("menu_id", allRelevantMenuIds);
      if (error) throw error;
    }
  }

  const menuItemsPayload = state.menus.flatMap((m) =>
    (m.items || [])
      .filter((item) => ingredientIds.includes(item.bahanId))
      .map((item) => ({
        menu_id: m.id,
        ingredient_id: item.bahanId,
        qty: clampNumber(item.qty),
        unit: item.unit,
        susut: normalizeSusut(item.susut),
      }))
  );

  if (menuItemsPayload.length) {
    const { error } = await supabase.from("menu_items").insert(menuItemsPayload);
    if (error) throw error;
  }

  return state;
}
