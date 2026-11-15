
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type SearchResult = {
  title?: string;
  url?: string;
  content?: string;
  published_date?: string;
};

const DEMAND_PHRASES = [
  "butuh rumah",
  "butuh tanah",
  "butuh ruko",
  "butuh kontrakan",
  "cari rumah",
  "cari tanah",
  "cari ruko",
  "cari kontrakan",
  "mencari rumah",
  "mencari tanah",
  "mencari properti",
  "sedang mencari",
  "lagi cari rumah",
  "ada yang punya rumah",
  "ada rekomendasi rumah",
  "minta rekomendasi rumah",
  "minta info rumah",
  "siapa tahu ada rumah",
  "sedang membutuhkan rumah",
  "looking for a house",
  "looking for property"
];

const STRONG_DEMAND_PHRASES = [
  "saya sedang mencari",
  "saya mencari rumah",
  "saya mencari tanah",
  "saya butuh rumah",
  "saya butuh tanah",
  "saya butuh ruko",
  "sedang membutuhkan rumah",
  "mau membeli rumah",
  "ingin membeli rumah",
  "mau beli rumah",
  "ingin beli rumah",
  "mencari rumah untuk dibeli",
  "cari rumah untuk dibeli",
  "mau menyewa rumah",
  "ingin menyewa rumah",
  "mau sewa rumah",
  "ingin sewa rumah",
  "mencari rumah untuk disewa",
  "cari rumah untuk disewa",
  "looking to buy",
  "looking to rent"
];

const OFFER_PHRASES = [
  "saya jual rumah",
  "kami jual rumah",
  "rumah dijual",
  "tanah dijual",
  "ruko dijual",
  "disewakan rumah",
  "disewakan ruko",
  "open listing",
  "open titip jual",
  "hubungi saya untuk membeli",
  "marketing properti",
  "agen properti",
  "dijual cepat",
  "dikontrakkan",
  "iklan properti"
];

const BUY_PHRASES = [
  "mau membeli",
  "ingin membeli",
  "mau beli",
  "ingin beli",
  "akan membeli",
  "untuk dibeli",
  "cari rumah untuk dibeli",
  "mencari rumah untuk dibeli",
  "cari tanah untuk dibeli",
  "mencari tanah untuk dibeli",
  "kpr",
  "pembelian rumah",
  "looking to buy"
];

const RENT_PHRASES = [
  "mau menyewa",
  "ingin menyewa",
  "mau sewa",
  "ingin sewa",
  "akan menyewa",
  "untuk disewa",
  "cari rumah untuk disewa",
  "mencari rumah untuk disewa",
  "cari kontrakan",
  "butuh kontrakan",
  "mencari kontrakan",
  "mau ngontrak",
  "ingin ngontrak",
  "mencari kos",
  "butuh kos",
  "looking to rent"
];

function getSource(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();

    if (host.includes("threads.net")) return "Threads";
    if (host.includes("facebook.com")) return "Facebook";
    if (host.includes("instagram.com")) return "Instagram";
    if (host.includes("youtube.com")) return "YouTube";

    return "Web / Forum";
  } catch {
    return "Web / Forum";
  }
}

function analyzeLead(
  item: SearchResult,
  searchLocation: string
) {
  const text = `${item.title || ""} ${item.content || ""}`;
  const lower = text.toLowerCase();

  const demandSignals = DEMAND_PHRASES.filter(
    phrase => lower.includes(phrase)
  );

  const strongDemand = STRONG_DEMAND_PHRASES.some(
    phrase => lower.includes(phrase)
  );

  const offerSignals = OFFER_PHRASES.filter(
    phrase => lower.includes(phrase)
  );

  // Iklan penjual tidak otomatis dianggap sebagai calon buyer/tenant.
  const isDemand =
    demandSignals.length > 0 &&
    (offerSignals.length === 0 || strongDemand);

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

  // Kata budget/anggaran tidak digunakan untuk menentukan transaksi.
  const buyIntent = BUY_PHRASES.some(
    phrase => lower.includes(phrase)
  );

  const rentIntent = RENT_PHRASES.some(
    phrase => lower.includes(phrase)
  );

  const transaction =
    buyIntent && rentIntent ? "Beli / Sewa" :
    buyIntent ? "Beli" :
    rentIntent ? "Sewa" :
    "Belum diketahui";

  const leadType =
    transaction === "Sewa" ? "Tenant" :
    transaction === "Beli" ? "Buyer" :
    transaction === "Beli / Sewa" ? "Buyer / Tenant" :
    "Belum terklasifikasi";

  const budgetMatch = text.match(
    /(?:rp\.?\s*)?\d+(?:[.,]\d+)?\s*(?:miliar|juta|jt|ribu|rb|m)\b/i
  );

  const budgetText = budgetMatch?.[0] || "Belum disebutkan";

  // Mengenali tingkatan wilayah administratif.
  const adminMatch = text.match(
    /\b(kecamatan|kec\.?|kelurahan|kel\.?|desa|kabupaten|kab\.?|kota)\s+([a-z][a-z\s-]{1,40}?)(?=\s+(?:dengan|dan|untuk|budget|anggaran|harga)|[,.;!?]|$)/i
  );

  const generalMatch = text.match(
    /\b(?:di|area|wilayah|sekitar|daerah|dekat)\s+([a-z][a-z\s-]{2,35}?)(?=\s+(?:dengan|dan|untuk|budget|anggaran|harga)|[,.;!?]|$)/i
  );

  const detectedLocation = adminMatch
    ? `${adminMatch[1]} ${adminMatch[2]}`.trim()
    : generalMatch?.[1]?.trim();

  const location =
    detectedLocation || searchLocation || "Belum disebutkan";

  const signals: string[] = [];
  let score = 0;

  if (isDemand) {
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

  if (!isDemand) {
    score = 0;
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
    intent_match: isDemand
      ? "Indikasi kebutuhan properti"
      : "Perlu verifikasi"
  };
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  const location = params.get("location") || "";
  const type = params.get("type") || "properti";
  const transaction = (
    params.get("transaction") || "beli atau sewa"
  ).toLowerCase();

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

  const base = [
    type,
    location,
    transaction,
    budget
  ].filter(Boolean).join(" ");

  const buyQuery = [
    '"mau beli rumah"',
    '"ingin membeli rumah"',
    '"mencari rumah untuk dibeli"',
    '"butuh rumah untuk dibeli"',
    '"cari tanah untuk dibeli"'
  ];

  const rentQuery = [
    '"mau sewa rumah"',
    '"ingin menyewa rumah"',
    '"mencari rumah untuk disewa"',
    '"butuh kontrakan"',
    '"mencari kos"'
  ];

  const genericQuery = [
    '"butuh rumah"',
    '"cari rumah"',
    '"mencari properti"',
    '"ada rekomendasi rumah"',
    '"minta info rumah"'
  ];

  const intentQueries =
    transaction === "beli"
      ? buyQuery
      : transaction === "sewa"
      ? rentQuery
      : [...buyQuery, ...rentQuery, ...genericQuery];

  const queries = [
    ...intentQueries.map(term => `${base} ${term}`),

    `${base} kebutuhan properti calon pembeli`,
    `${base} kebutuhan kontrakan calon penyewa`,

    `${base} site:threads.net`,
    `${base} site:facebook.com`,
    `${base} site:instagram.com`,

    `${base} kebutuhan properti forum komunitas`
  ];

  try {
    const batches = await Promise.all(
      queries.map(async query => {
        try {
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
        } catch {
          return [];
        }
      })
    );

    // Menghapus URL duplikat.
    const unique = new Map<string, SearchResult>();

    for (const item of batches.flat()) {
      if (!item.url) continue;

      try {
        const url = new URL(item.url);

        if (!["http:", "https:"].includes(url.protocol)) {
          continue;
        }

        const key = url.origin + url.pathname;

        if (!unique.has(key)) {
          unique.set(key, item);
        }
      } catch {
        continue;
      }
    }

    const analyzed = Array.from(unique.values()).map(
      item => analyzeLead(item, location)
    );

    // Hanya tampilkan indikasi kebutuhan properti.
    const results = analyzed
      .filter(lead => {
        if (lead.score <= 0) return false;

        if (transaction === "beli") {
          return lead.transaction === "Beli";
        }

        if (transaction === "sewa") {
          return lead.transaction === "Sewa";
        }

        return true;
      })
      .sort((a, b) => b.score - a.score);

    return NextResponse.json({
      success: true,
      query: base,
      result_count: results.length,
      sources_searched: [
        "Web",
        "Threads",
        "Facebook",
        "Instagram",
        "Forum"
      ],
      note:
        "Hasil merupakan indikasi kebutuhan berdasarkan konten publik dan perlu diverifikasi.",
      results
    });

  } catch {
    return NextResponse.json(
      { error: "Mesin pencari gagal dihubungi." },
      { status: 500 }
    );
  }
}
