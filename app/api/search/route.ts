
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  const location = (params.get("location") || "").trim();
  const type = params.get("type") || "properti";
  const transaction = params.get("transaction") || "jual atau sewa";
  const budget = params.get("budget") || "";

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

  const query = [
    type,
    transaction,
    location,
    budget ? "harga maksimal " + budget : "",
    "iklan properti Indonesia harga listing"
  ].filter(Boolean).join(" ");

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
          max_results: 10
        }),
        cache: "no-store"
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Layanan pencarian bermasalah." },
        { status: 502 }
      );
    }

    const data = await response.json();

    const results = (data.results || []).map((item: any) => ({
      title: item.title,
      url: item.url,
      snippet: item.content
    }));

    return NextResponse.json({
      query,
      results
    });

  } catch {
    return NextResponse.json(
      { error: "Gagal menghubungi mesin pencari." },
      { status: 500 }
    );
  }
}
