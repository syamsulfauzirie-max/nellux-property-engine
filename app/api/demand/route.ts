
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type SearchResult = {
  title?: string;
  url?: string;
  content?: string;
  published_date?: string;
};

function getSource(url: string) {
  if (url.includes("threads.net")) return "Threads";
  if (url.includes("facebook.com")) return "Facebook";
  if (url.includes("instagram.com")) return "Instagram";
  return "Google / Web";
}

function extractLead(item: SearchResult, searchLocation: string) {
  const text = `${item.title || ""} ${item.content || ""}`;
  const lower = text.toLowerCase();

  const propertyTypes = [
    ["rumah", ["rumah", "hunian"]],
    ["tanah", ["tanah", "lahan", "kavling"]],
    ["ruko", ["ruko", "rumah toko"]],
    ["gudang", ["gudang", "warehouse"]],
    ["apartemen", ["apartemen", "apartment"]],
    ["kantor", ["kantor", "office"]],
    ["villa", ["villa", "vila"]]
  ] as const;

  const propertyType =
    propertyTypes.find(([, words]) =>
      words.some(word => lower.includes(word))
    )?.[0] || "Belum diketahui";

  const rentWords = ["sewa", "kontrak", "disewakan", "menyewa", "tenant"];
  const buyWords = ["beli", "membeli", "butuh rumah", "cari rumah", "mencari rumah"];

  const isRent = rentWords.some(word => lower.includes(word));
  const isBuy = buyWords.some(word => lower.includes(word));

  const transaction =
    isRent && !isBuy ? "Sewa" :
    isBuy && !isRent ? "Beli" :
    isRent && isBuy ? "Beli / Sewa" :
    "Belum diketahui";

  const leadType =
    transaction === "Sewa" ? "Tenant" :
    transaction === "Beli" ? "Buyer" :
    "Belum terklasifikasi";

  const budgetMatch = text.match(
    /(?:rp\.?\s*)?\d+(?:[.,]\d+)?\s*(?:miliar|m|juta|jt|ribu|rb)\b/i
  );

  const budgetText = budgetMatch?.[0] || "Belum disebutkan";

  const locationMatch = text.match(
    /(?:di|area|wilayah|sekitar|daerah)\s+([a-z][a-z\s-]{2,35})/i
  );

  const detectedLocation = locationMatch?.[1]
    ?.trim()
    .split(/[,.!?;]/)[0]
    .slice(0, 45);

  const location = detectedLocation || "Belum disebutkan";

  const signals: string[] = [];
  let score = 0;

  if (
    ["butuh", "cari", "mencari", "sedang mencari", "looking for"]
      .some(word => lower.includes(word))
  ) {
    score += 30;
    signals.push("Ada indikasi kebutuhan properti");
  }

  if (transaction !== "Belum diketahui") {
    score += 20;
    signals.push("Tujuan transaksi terdeteksi");
  }

  if (location !== "Belum disebutkan") {
    score += 15;
    signals.push("Lokasi terdeteksi");
  }

  if (budgetText !== "Belum disebutkan") {
    score += 15;
    signals.push("Budget terdeteksi");
  }

  if (propertyType !== "Belum diketahui") {
    score += 10;
    signals.push("Jenis properti terdeteksi");
  }

  if (item.published_date) {
    score += 10;
    signals.push("Tanggal posting tersedia");
  }

  const scoreLabel =
    score >= 75 ? "Prioritas Tinggi" :
    score >= 45 ? "Prioritas Sedang" :
    "Prioritas Rendah";

  return {
    title: item.title || "Kebutuhan properti",
    url: item.url || "",
    snippet: item.content || "",
    source: getSource(item.url || ""),
    published_date: item.published_date || null,

    lead_type: leadType,
    transaction,
    property_type: propertyType,
    location,
    search_location: searchLocation,
    budget: budgetText,

    score,
    score_label: scoreLabel,
    signals,
    intent_match: "Indikasi membutuhkan properti"
  };
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  const location = params.get("location") || "";
  const type = params.get("type") || "properti";
  const transaction = params.get("transaction") || "beli atau sewa";
  const budget = params.get("budget") || "";

  if (!location.trim()) {
    return NextResponse.json(
      { error: "Lokasi harus diisi." },
      { status: 400 }
    );
  }

  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "TAVILY_API_KEY belum dipasang." },
      { status: 500 }
    );
  }

  const base = `${type} ${location} ${transaction} ${budget}`;

  const queries = [
    `${base} ("butuh rumah" OR "cari rumah" OR "mencari rumah") site:threads.net`,
    `${base} ("butuh" OR "cari" OR "mencari") site:facebook.com`,
    `${base} ("butuh" OR "cari" OR "mencari") site:instagram.com`,
    `${base} ("mencari rumah" OR "butuh tanah" OR "cari ruko")`
  ];

  try {
    const batches = await Promise.all(
      queries.map(async query => {
        const response = await fetch(
          "https://api.tavily.com/search",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              api_key: apiKey,
              query,
              search_depth: "basic",
              max_results: 10,
              include_answer: false
            }),
            cache: "no-store"
          }
        );

        if (!response.ok) return [];

        const data = await response.json();
        return (data.results || []) as SearchResult[];
      })
    );

    const unique = new Map<string, SearchResult>();

    for (const item of batches.flat()) {
      if (!item.url) continue;

      try {
        const url = new URL(item.url);

        if (!["http:", "https:"].includes(url.protocol)) continue;

        const key = url.origin + url.pathname;

        if (!unique.has(key)) unique.set(key, item);
      } catch {
        continue;
      }
    }

    const results = Array.from(unique.values())
      .filter(item => {
        const text = `${item.title || ""} ${item.content || ""}`.toLowerCase();

        return [
          "butuh rumah", "butuh tanah", "butuh ruko",
          "butuh kontrakan", "cari rumah", "cari tanah",
          "cari ruko", "cari kontrakan", "mencari rumah",
          "mencari tanah", "mencari properti",
          "sedang mencari", "looking for a house"
        ].some(word => text.includes(word));
      })
      .map(item => extractLead(item, location))
      .sort((a, b) => b.score - a.score);

    return NextResponse.json({
      success: true,
      query: base,
      result_count: results.length,
      results
    });

  } catch {
    return NextResponse.json(
      { error: "Mesin pencari gagal dihubungi." },
      { status: 500 }
    );
  }
}
