
"use client";

import { useState } from "react";

type Lead = {
  title: string;
  url: string;
  snippet: string;
  source: string;
  published_date?: string | null;
  lead_type: string;
  transaction: string;
  property_type: string;
  location: string;
  search_location: string;
  budget: string;
  score: number;
  score_label: string;
  signals: string[];
};

export default function DemandPage() {
  const [location, setLocation] = useState("Bandung Raya");
  const [type, setType] = useState("rumah");
  const [transaction, setTransaction] = useState("beli atau sewa");
  const [budget, setBudget] = useState("");
  const [results, setResults] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function searchDemand() {
    setLoading(true);
    setError("");
    setResults([]);

    try {
      const params = new URLSearchParams({
        location,
        type,
        transaction,
        budget
      });

      const response = await fetch("/api/demand?" + params);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Pencarian gagal.");
      }

      setResults(data.results || []);

      if (!data.results?.length) {
        setError("Belum ditemukan prospek. Coba lokasi atau jenis properti lain.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pencarian gagal.");
    } finally {
      setLoading(false);
    }
  }

  function scoreColor(score: number) {
    if (score >= 75) return "bg-green-100 text-green-800";
    if (score >= 45) return "bg-amber-100 text-amber-800";
    return "bg-slate-100 text-slate-700";
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-[#101b35] p-6 text-white md:p-8">
        <a href="/" className="text-sm text-amber-300">
          ← Property Search
        </a>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
          NELLUX PROPERTY
        </p>

        <h1 className="mt-2 text-3xl font-black md:text-4xl">
          Demand Intelligence
        </h1>

        <p className="mt-2 text-sm text-slate-300">
          Temukan dan prioritaskan calon buyer dan tenant properti.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {["Threads", "Facebook", "Instagram", "Google / Web"].map(s => (
            <span key={s} className="rounded-full border border-white/30 px-3 py-2 text-xs">
              {s}
            </span>
          ))}
        </div>
      </header>

      <section className="mx-auto max-w-5xl p-4 md:p-6">
        <div className="rounded-2xl bg-white p-5 shadow-sm md:p-6">
          <h2 className="text-xl font-bold">
            Cari calon buyer dan tenant
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-bold">
              Lokasi pencarian
              <input
                className="mt-2 w-full rounded-xl border p-3 font-normal"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Contoh: Bandung, Kopo, Soreang"
              />
            </label>

            <label className="text-sm font-bold">
              Jenis properti
              <select
                className="mt-2 w-full rounded-xl border bg-white p-3 font-normal"
                value={type}
                onChange={e => setType(e.target.value)}
              >
                {["properti", "rumah", "tanah", "ruko", "gudang", "apartemen", "kantor", "villa"].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </label>

            <label className="text-sm font-bold">
              Kebutuhan transaksi
              <select
                className="mt-2 w-full rounded-xl border bg-white p-3 font-normal"
                value={transaction}
                onChange={e => setTransaction(e.target.value)}
              >
                <option value="beli atau sewa">Beli atau sewa</option>
                <option value="beli">Membeli</option>
                <option value="sewa">Menyewa</option>
              </select>
            </label>

            <label className="text-sm font-bold">
              Budget maksimal
              <input
                className="mt-2 w-full rounded-xl border p-3 font-normal"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder="Contoh: Rp500 juta"
              />
            </label>
          </div>

          <button
            onClick={searchDemand}
            disabled={loading || !location.trim()}
            className="mt-6 w-full rounded-xl bg-[#101b35] p-4 font-bold text-white disabled:opacity-50"
          >
            {loading ? "Sedang menganalisis prospek..." : "Cari Prospek →"}
          </button>
        </div>

        <div className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-black">Database Prospek</h2>
              <p className="text-sm text-slate-500">
                {results.length} hasil ditemukan
              </p>
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-white p-4 text-sm text-slate-700">
              {error}
            </p>
          )}

          <div className="mt-4 grid gap-4">
            {results.map((lead, i) => (
              <article
                key={lead.url || i}
                className="rounded-2xl bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-bold text-blue-700">
                    {lead.source}
                  </span>

                  <span className={`rounded-full px-3 py-2 text-xs font-bold ${scoreColor(lead.score)}`}>
                    {lead.score}/100 · {lead.score_label}
                  </span>
                </div>

                <h3 className="mt-3 font-bold">{lead.title}</h3>

                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                  {[
                    ["Kategori", lead.lead_type],
                    ["Transaksi", lead.transaction],
                    ["Properti", lead.property_type],
                    ["Lokasi", lead.location],
                    ["Budget", lead.budget],
                    ["Tanggal", lead.published_date || "Tidak tersedia"]
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="mt-1 break-words text-sm font-bold">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <p className="text-xs font-bold text-slate-500">
                    INDIKATOR PROSPEK
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {lead.signals?.map((signal, index) => (
                      <span key={index} className="rounded-full bg-blue-50 px-3 py-2 text-xs text-blue-800">
                        {signal}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                  {lead.snippet}
                </p>

                <a
                  href={lead.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block rounded-lg bg-[#101b35] px-4 py-3 text-sm font-bold text-white"
                >
                  Buka Postingan Asli ↗
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
