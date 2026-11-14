
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type TavilyResult = {
  title?: string;
  url?: string;
  content?: string;
};

function classifySource(url: string) {
  const host = new URL(url).hostname.toLowerCase();

  if (host.includes("facebook.com")) return "Facebook";
  if (host.includes("instagram.com")) return "Instagram";
  if (host.includes("tiktok.com")) return "TikTok";
  if (host.includes("threads.net")) return "Threads";
  if (host.includes("youtube.com") || host.includes("youtu.be")) return "YouTube";

  if (/rumah123|99\.co|lamudi|rumah\.com|olx\.co\.id|dotproperty/.test(host)) {
    return "Portal properti";
  }

  return "Web lainnya";
}

function isLikelySearchPage(item: TavilyResult) {
  const text = ((item.title || "") + " " + (item.content || "")).toLowerCase();

  const blocked = [
    "pencarian ditemukan",
    "search results",
    "hasil pencarian",
    "market insight",
    "simpan pencarian",
    "pasang iklan properti",
    "filter hasil",
    "urutkan berdasarkan"
  ];

  if (blocked.some(term => text.includes(term))) return true;

  try {
    const url = new URL(item.url || "");
    const path = url.pathname.toLowerCase().replace(/\/$/, "");

    if (!path) return true;

    const generic = [
      "search",
      "search-results",
      "properties",
      "houses-for-sale",
      "house-for-sale",
      "rumah-dijual",
      "for-sale",
      "for-rent"
    ];

    const parts = path.split("/").filter(Boolean);

    if (parts.length <= 2 && parts.some(part => generic.includes(part))) {
      return true;
    }

    return false;
  } catch {
    return true;
  }
}

function parseMoney(text: string): number | null {
  const value = text.toLowerCase();

  const patterns = [
    /(?:rp\.?\s*)?([0-9][0-9.,]*)\s*(miliar|milyar|juta|jt|ribu|rb)\b/gi,
    /rp\.?\s*([0-9][0-9.,]*)/gi
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(value);
    if (!match) continue;

    const raw = match[1].replace(/,/g, "");
    const number = Number(raw);

    if (!Number.isFinite(number)) continue;

    const unit = (match[2] || "").toLowerCase();

    if (["miliar", "milyar"].includes(unit)) return number * 1_000_000_000;
    if (["juta", "jt"].includes(unit)) return number * 1_000_000;
    if (["ribu", "rb"].includes(unit)) return number * 1_000;

    if (!unit && number >= 100_000) return number;
  }

  return null;
}

function ownerClue(text: string) {
  const value = text.toLowerCase();

  const ownerTerms = [
    "owner langsung",
    "pemilik langsung",
    "jual sendiri",
    "langsung pemilik",
    "tanpa perantara",
    "tangan pertama",
    "jual dari owner",
    "pemilik rumah"
  ];

  const agentTerms = [
    "agen properti",
    "property agent",
    "marketing properti",
    "broker",
    "agency",
    "kantor agen"
  ];

  if (ownerTerms.some(term => value.includes(term))) {
    return "Indikasi owner";
  }

  if (agentTerms.some(term => value.includes(term))) {
    return "Indikasi agen";
  }

  return "Belum diketahui";
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  const location = (params.get("location") || "").trim();
  const type = (params.get("type") || "properti").trim();
  const transaction = (params.get("transaction") || "jual atau sewa").trim();
  const budgetText = (params.get("budget") || "").trim();

  if (!location) {
    return NextResponse.json(
      { error: "Masukkan lokasi properti." },
      { status: 400 }
    );
  }

  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "API Key belum terpasang." },
      { status: 500 }
    );
  }

  const base = [
    type,
    transaction,
    location,
    budgetText ? "harga maksimal " + budgetText : ""
  ].filter(Boolean).join(" ");

  const queries = [
    base + ' (jual OR dijual OR disewakan) (rumah OR tanah OR ruko) (owner OR pemilik OR langsung)',

    base + ' site:facebook.com (jual OR dijual OR disewakan) properti',

    base + ' site:instagram.com (jual OR dijual OR disewakan) properti',

    base + ' site:tiktok.com properti dijual disewakan',

    base + ' site:threads.net properti dijual disewakan',

    base + ' site:youtube.com properti dijual disewakan',

    base + ' site:rumah123.com OR site:99.co OR site:rumah.com OR site:olx.co.id OR site:dotproperty.id'
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
        return (data.results || []) as TavilyResult[];
      })
    );

    const unique = new Map<string, TavilyResult>();

    for (const item of batches.flat()) {
      if (!item.url) continue;

      try {
        const url = new URL(item.url);

        if (!["http:", "https:"].includes(url.protocol)) continue;

        const key = url.origin + url.pathname.replace(/\/$/, "");

        if (!unique.has(key)) unique.set(key, item);
      } catch {
        continue;
      }
    }

    const budget = budgetText ? parseMoney(budgetText) : null;

    const results = Array.from(unique.values())
      .filter(item => !isLikelySearchPage(item))
      .map(item => {
        const combined = (item.title || "") + " " + (item.content || "");
        const price = parseMoney(combined);

        return {
          title: item.title || "Iklan properti",
          url: item.url || "",
          snippet: item.content || "",
          source: classifySource(item.url || ""),
          owner_status: ownerClue(combined),
          price,
          price_status: price === null
            ? "Harga belum ditemukan"
            : "Harga ditemukan"
        };
      })
      .filter(item => {
        if (budget === null || item.price === null) return true;
        return item.price <= budget;
      })
      .sort((a, b) => {
        const rank = (value: string) =>
          value === "Indikasi owner" ? 0 :
          value === "Belum diketahui" ? 1 : 2;

        return rank(a.owner_status) - rank(b.owner_status);
      });

    return NextResponse.json({
      query: base,
      search_batches: queries.length,
      result_count: results.length,
      note: "Hasil hanya berasal dari konten publik yang terindeks. Indikasi owner bukan verifikasi identitas.",
      results
    });

  } catch {
    return NextResponse.json(
      { error: "Gagal menghubungi mesin pencari. Coba lagi." },
      { status: 500 }
    );
  }
}
