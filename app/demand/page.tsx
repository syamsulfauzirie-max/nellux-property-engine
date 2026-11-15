
"use client";

import { useState } from "react";

type Lead = {
  title: string;
  url: string;
  snippet: string;
  source: string;
  budget?: number | null;
  intent_match: string;
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
        location, type, transaction, budget
      });

      const response = await fetch("/api/demand?" + params);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setResults(data.results || []);

      if (!data.results?.length) {
        setError("Belum ditemukan prospek. Coba lokasi lain.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pencarian gagal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-[#101b35] p-8 text-white">
        <a href="/" className="text-sm text-amber-300">
          ← Property Search
        </a>
        <h1 className="mt-6 text-3xl font-black">
          Demand Search Engine
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          Temukan orang yang sedang membutuhkan properti.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {["Threads", "Facebook", "Instagram", "Google"].map(s => (
            <span key={s} className="rounded-full border border-white/30 px-3 py-2 text-xs">
              {s}
            </span>
          ))}
        </div>
      </header>

      <section className="mx-auto max-w-4xl p-5">
        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-xl font-bold">
            Cari calon buyer dan tenant
          </h2>

          <label className="mt-5 block text-sm font-bold">
            Lokasi
            <input
              className="mt-2 w-full rounded-xl border p-3"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Contoh: Kopo Bandung"
            />
          </label>

          <label className="mt-4 block text-sm font-bold">
            Jenis properti
            <select
              className="mt-2 w-full rounded-xl border bg-white p-3"
              value={type}
              onChange={e => setType(e.target.value)}
            >
              {["properti","rumah","tanah","ruko","gudang","apartemen","kantor","villa"].map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </label>

          <label className="mt-4 block text-sm font-bold">
            Kebutuhan
            <select
              className="mt-2 w-full rounded-xl border bg-white p-3"
              value={transaction}
              onChange={e => setTransaction(e.target.value)}
            >
              <option value="beli atau sewa">Beli atau sewa</option>
              <option value="beli">Membeli</option>
              <option value="sewa">Menyewa</option>
            </select>
          </label>

          <label className="mt-4 block text-sm font-bold">
            Budget maksimal
            <input
              className="mt-2 w-full rounded-xl border p-3"
              value={budget}
              onChange={e => setBudget(e.target.value)}
              placeholder="Contoh: Rp500 juta"
            />
          </label>

          <button
            onClick={searchDemand}
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-[#101b35] p-4 font-bold text-white disabled:opacity-50"
          >
            {loading ? "Sedang mencari..." : "Cari Prospek →"}
          </button>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-black">
            Hasil Pencarian: {results.length}
          </h2>

          {error && (
            <p className="mt-4 rounded-xl bg-white p-4 text-sm">
              {error}
            </p>
          )}

          {results.map((lead, i) => (
            <article key={lead.url || i}
              className="mt-4 rounded-xl bg-white p-5 shadow-sm">
              <span className="text-xs font-bold text-green-700">
                {lead.source}
              </span>
              <h3 className="mt-2 font-bold">{lead.title}</h3>
              <p className="mt-2 text-sm text-slate-600">
                {lead.snippet}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                {lead.intent_match}
              </p>
              <a
                href={lead.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block font-bold text-blue-700"
              >
                Lihat postingan asli ↗
              </a>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
