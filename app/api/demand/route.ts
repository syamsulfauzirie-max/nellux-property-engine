const adminMatch = text.match(
  /\b(kecamatan|kec\.?|kelurahan|kel\.?|desa|kabupaten|kab\.?|kota)\s+([a-z][a-z\s-]{1,40}?)(?=\s+(?:dengan|dan|untuk|budget|anggaran|harga)|[,.;!?]|$)/i
);

const generalMatch = text.match(
  /\b(?:di|area|wilayah|sekitar|daerah|dekat)\s+([a-z][a-z\s-]{2,35}?)(?=\s+(?:dengan|dan|untuk|budget|anggaran|harga)|[,.;!?]|$)/i
);

const detectedLocation = adminMatch
  ? `${adminMatch[1]} ${adminMatch[2]}`.trim()
  : generalMatch?.[1]?.trim();

const location = detectedLocation || searchLocation || "Belum disebutkan";
