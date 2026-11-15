const locationMatch = text.match(
  /(?:di|area|wilayah|sekitar|daerah|dekat)\s+([a-z][a-z\s-]{2,35})/i
);

const detectedLocation = locationMatch?.[1]
  ?.trim()
  .split(/[,.!?;]/)[0]
  .slice(0, 45);

const location = detectedLocation || "Belum disebutkan";
