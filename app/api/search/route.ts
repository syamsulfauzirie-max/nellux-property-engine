
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type TavilyResult = {
  title?: string;
  url?: string;
  content?: string;
};

function classifySource(url: string) {
  const value = url.toLowerCase();

  if (value.includes("facebook.com")) return "Facebook";
  if (value.includes("instagram.com")) return "Instagram";
  if (value.includes("tiktok.com")) return "TikTok";
  if (
    value.includes("youtube.com") ||
    value.includes("youtu.be")
  ) return "YouTube";

  if (
    /rumah123|99\.co|lamudi|rumah\.com|olx\.co\.id/.test(value)
  ) return "Portal properti";

  return "Web / situs lainnya";
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
    "butuh uang",
    "jual cepat"
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
    return "Indikasi owner (perlu verifikasi)";
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
  const transaction =
    (params.get("transaction") || "jual atau sewa").trim();
  const budget = (params.get("budget") || "").trim();

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
    budget ? "harga maksimal " + budget : ""
  ].filter(Boolean).join(" ");

  const queries = [
    base + " properti dijual disewakan iklan listing",

    base +
      ' "owner langsung" OR "pemilik langsung" OR "jual sendiri" OR "tanpa perantara"',

    base +
      " site:facebook.com (jual OR dijual OR disewakan) properti",

    base +
      " site:instagram.com (jual OR dijual OR disewakan) properti",

    base + " site:tiktok.com properti dijual disewakan",

    base + " site:youtube.com rumah tanah properti dijual",

    base +
      " site:rumah123.com OR site:99.co OR site:rumah.com OR site:olx.co.id",

    base + " developer agen properti listing"
  ];

  try {
    const responses = await Promise.all(
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
              max_results: 8,
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

    for (const item of responses.flat()) {
      if (!item.url) continue;

      const key = item.url
        .split("?")[0]
        .replace(/\/$/, "")
        .toLowerCase();

      if (!unique.has(key)) {
        unique.set(key, item);
      }
    }

    const results = Array.from(unique.values()).map(item => {
      const combined =
        (item.title || "") + " " + (item.content || "");

      return {
        title: item.title || "Iklan properti",
        url: item.url,
        snippet: item.content || "",
        source: classifySource(item.url || ""),
        owner_status: ownerClue(combined)
      };
    });

    return NextResponse.json({
      query: base,
      search_batches: queries.length,
      result_count: results.length,
      note:
        "Hasil media sosial bergantung pada konten publik yang terindeks mesin pencari. Status owner adalah petunjuk otomatis, bukan verifikasi identitas.",
      results
    });

  } catch {
    return NextResponse.json(
      {
        error:
          "Gagal menghubungi mesin pencari. Coba lagi beberapa saat."
      },
      { status: 500 }
    );
  }
}
