
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
  "butuh kos",
  "butuh tempat tinggal",
  "cari rumah",
  "cari tanah",
  "cari ruko",
  "cari kontrakan",
  "cari kos",
  "cari tempat tinggal",
  "mencari rumah",
  "mencari tanah",
  "mencari properti",
  "mencari kontrakan",
  "sedang mencari",
  "lagi cari rumah",
  "ada yang punya rumah",
  "ada rekomendasi rumah",
  "minta rekomendasi rumah",
  "minta info rumah",
  "siapa tahu ada rumah",
  "sedang membutuhkan rumah",
  "rumah untuk keluarga",
  "looking for a house",
  "looking for property",
  "looking for rental"
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
  "butuh rumah untuk dibeli",
  "mencari rumah second",
  "mencari rumah cash",
  "mencari rumah kpr",
  "looking to buy",
  "want to buy"
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
  "cari kos",
  "rumah bulanan",
  "sewa bulanan",
  "sewa tahunan",
  "rumah kontrakan",
  "looking to rent",
  "want to rent"
];

const STRONG_DEMAND_PHRASES = [
  ...BUY_PHRASES,
  ...RENT_PHRASES,
  "saya sedang mencari rumah",
  "saya mencari rumah",
  "saya butuh rumah",
  "saya butuh tanah",
  "saya butuh ruko",
  "ada yang punya rumah untuk saya",
  "mohon info rumah",
  "tolong carikan rumah"
];

const OFFER_PHRASES = [
  "saya jual rumah",
  "kami jual rumah",
  "rumah dijual",
  "tanah dijual",
  "ruko dijual",
  "dijual cepat",
  "disewakan rumah",
  "rumah disewakan",
  "tanah disewakan",
  "ruko disewakan",
  "open listing",
  "open titip jual",
  "titip jual rumah",
  "hubungi saya untuk membeli",
  "marketing properti",
  "agen properti",
  "iklan properti",
  "property for sale",
  "house for sale"
];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSource(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();

    if (host.includes("threads.net")) return "Threads";
    if (host.includes("facebook.com")) return "Facebook";
    if (host.includes("instagram.com")) return "Instagram";
    if (host.includes("youtube.com")) return "YouTube";

    return "Google / Web";
  } catch {
    return "Web / Forum";
  }
}

function detectLocation(text: string, fallback: string) {
  const adminMatch = text.match(
    /\b(kecamatan|kec\.?|kelurahan|kel\.?|desa|kabupaten|kab\.?|kota)\s+([a-z][a-z\s-]{1,40}?)(?=\s+(?:dengan|dan|untuk|budget|anggaran|harga|luas)|[,.;!?]|$)/i
  );

  if (adminMatch) {
    return `${adminMatch[1]} ${adminMatch[2]}`.trim();
  }

  const generalMatch = text.match(
    /\b(?:di|area|wilayah|sekitar|daerah|dekat)\s+([a-z][a-z\s-]{2,35}?)(?=\s+(?:dengan|dan|untuk|budget|anggaran|harga|luas)|[,.;!?]|$)/i
  );

  return generalMatch?.[1]?.trim() || fallback;
}

function analyzeLead(
  item: SearchResult,
  searchLocation: string
) {
  const title = item.title || "";
  const content = item.content || "";
  const text = `${title} ${content}`;
  const lower = normalizeText(text);

  const demandSignals = DEMAND_PHRASES.filter(
    phrase => lower.includes(normalizeText(phrase))
  );

  const strongDemand = STRONG_DEMAND_PHRASES.some(
    phrase => lower.includes(normalizeText(phrase))
  );

  const offerSignals = OFFER_PHRASES.filter(
    phrase => lower.includes(normalizeText(phrase))
  );

  // Konten penawaran tanpa indikasi kuat bahwa penulis sedang mencari
  // tidak dianggap sebagai calon prospek.
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

  const buyIntent = BUY_PHRASES.some(
    phrase => lower.includes(normalizeText(phrase))
  );

  const rentIntent = RENT_PHRASES.some(
    phrase => lower.includes(normalizeText(phrase))
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
    "Perlu Verifikasi";

  const budgetMatch = text.match(
    /(?:rp\.?\s*)?\d+(?:[.,]\d+)?\s*(?:miliar|milyar|juta|jt|ribu|rb)\b|rp\.?\s*\d{1,3}(?:[.,]\d{3})+/i
  );

  const budgetText = budgetMatch?.[0] || "Belum disebutkan";

  const location = detectLocation(text, searchLocation);

  const locationFound = location !== searchLocation;

  const signals: string[] = [];
  let score = 0;

  if (isDemand) {
    score += 30;
    signals.push("Indikasi kebutuhan properti");
  }

  if (strongDemand) {
    score += 15;
    signals.push("Kalimat pencarian cukup jelas");
  }

  if (transaction !== "Belum diketahui") {
    score += 20;
    signals.push("Tujuan transaksi terdeteksi");
  } else if (isDemand) {
    signals.push("Transaksi perlu dikonfirmasi");
  }

  if (locationFound) {
    score += 15;
    signals.push("Lokasi ditemukan dalam konten");
  } else {
    signals.push("Lokasi mengikuti pencarian");
  }

  if (budgetText !== "Belum disebutkan") {
    score += 10;
    signals.push("Budget terdeteksi");
  }

  if (propertyType !== "Belum diketahui") {
    score += 5;
    signals.push("Jenis properti terdeteksi");
  }

  if (item.published_date) {
    score += 5;
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
    title: title || "Kebutuhan properti",
    url: item.url || "",
    snippet: content,
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
      : "Bukan prospek terkonfirmasi"
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

  // Hindari mengulang kata transaksi dalam setiap query dasar.
  const base = [type, location, budget]
    .filter(Boolean)
    .join(" ");

  const buyQueries = [
    '"butuh rumah untuk dibeli"',
    '"mau beli rumah"',
    '"ingin membeli rumah"',
    '"mencari rumah cash"',
    '"mencari rumah KPR"',
    '"cari tanah untuk dibeli"',
    '"sedang mencari rumah"',
    '"looking to buy a house"'
  ];

  const rentQueries = [
    '"butuh kontrakan"',
    '"cari rumah kontrakan"',
    '"mencari rumah bulanan"',
    '"butuh rumah sewa"',
    '"mencari rumah untuk disewa"',
    '"ada yang punya rumah untuk disewa"',
    '"mau ngontrak rumah"',
    '"cari kos"',
    '"looking to rent a house"'
  ];

  const generalQueries = [
    '"butuh rumah"',
    '"cari rumah"',
    '"mencari rumah"',
    '"mencari properti"',
    '"ada rekomendasi rumah"',
    '"minta info rumah"',
    '"sedang mencari tempat tinggal"'
  ];

  let intentQueries: string[];

  if (transaction === "beli") {
    intentQueries = [...buyQueries, ...generalQueries];
  } else if (transaction === "sewa") {
    intentQueries = [...rentQueries, ...generalQueries];
  } else {
    intentQueries = [
      ...buyQueries,
      ...rentQueries,
      ...generalQueries
    ];
  }

  const queries = [
    ...intentQueries.map(term => `${base} ${term}`),

    `${base} kebutuhan properti komunitas`,
    `${base} calon pembeli properti`,
    `${base} calon penyewa rumah`,

    `${base} site:threads.net`,
    `${base} site:facebook.com`,
    `${base} site:instagram.com`,

    `${base} forum diskusi properti`
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

          if (!response.ok) {
            return {
              results: [] as SearchResult[],
              failed: true
            };
          }

          const data = await response.json();

          return {
            results: (data.results || []) as SearchResult[],
            failed: false
          };
        } catch {
          return {
            results: [] as SearchResult[],
            failed: true
          };
        }
      })
    );

    const rawResults = batches.flatMap(
      batch => batch.results
    );

    // Deduplicasi berdasarkan URL.
    const unique = new Map<string, SearchResult>();

    for (const item of rawResults) {
      if (!item.url) continue;

      try {
        const url = new URL(item.url);

        if (!["http:", "https:"].includes(url.protocol)) {
          continue;
        }

        url.search = "";
        url.hash = "";

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

    const demandCandidates = analyzed.filter(
      lead => lead.score > 0
    );

    // Hasil tanpa klasifikasi transaksi tetap ditampilkan
    // agar tidak kehilangan prospek yang perlu diverifikasi.
    const results = demandCandidates.filter(lead => {
      if (transaction === "beli") {
        return (
          lead.transaction === "Beli" ||
          lead.transaction === "Belum diketahui"
        );
      }

      if (transaction === "sewa") {
        return (
          lead.transaction === "Sewa" ||
          lead.transaction === "Belum diketahui"
        );
      }

      return true;
    });

    results.sort((a, b) => b.score - a.score);

    return NextResponse.json({
      success: true,
      query: base,
      result_count: results.length,

      diagnostics: {
        queries_sent: queries.length,
        raw_results: rawResults.length,
        unique_results: unique.size,
        demand_candidates: demandCandidates.length,
        final_results: results.length,
        failed_queries: batches.filter(
          batch => batch.failed
        ).length
      },

      sources_searched: [
        "Google / Web",
        "Threads terindeks",
        "Facebook terindeks",
        "Instagram terindeks",
        "Forum"
      ],

      note:
        "Hasil adalah indikasi kebutuhan dari konten publik. Prospek yang belum menyebutkan transaksi secara jelas ditandai Perlu Verifikasi.",

      results
    });

  } catch {
    return NextResponse.json(
      { error: "Mesin pencari gagal dihubungi." },
      { status: 500 }
    );
  }
}
