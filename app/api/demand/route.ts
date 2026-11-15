
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

function isDemand(text: string) {
  const value = text.toLowerCase();

  const signals = [
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
    "looking for a house"
  ];

  return signals.some(word => value.includes(word));
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
    `${base} ("mencari rumah" OR "butuh tanah" OR "cari ruko")`,
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
        return data.results as SearchResult[];
      })
    );

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

    const results = Array.from(unique.values())
      .filter(item =>
        isDemand((item.title || "") + " " + (item.content || ""))
      )
      .map(item => ({
        title: item.title || "Kebutuhan properti",
        url: item.url || "",
        snippet: item.content || "",
        source: getSource(item.url || ""),
        published_date: item.published_date || null,
        intent_match: "Indikasi membutuhkan properti"
      }));

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
