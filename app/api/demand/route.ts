const rentIntent =
  /\b(sewa|menyewa|kontrakan|kontrak|kos|kost|indekos)\b/i.test(lower)
  && demandSignals.length > 0;

const buyIntent =
  /\b(beli|membeli|pembelian|dibeli|kpr|cash|tunai|cicilan)\b/i.test(lower)
  && demandSignals.length > 0;

const transaction =
  rentIntent && !buyIntent ? "Sewa" :
  buyIntent && !rentIntent ? "Beli" :
  rentIntent && buyIntent ? "Beli / Sewa" :
  "Belum diketahui";

const leadType =
  transaction === "Sewa" ? "Tenant" :
  transaction === "Beli" ? "Buyer" :
  "Belum terklasifikasi";
