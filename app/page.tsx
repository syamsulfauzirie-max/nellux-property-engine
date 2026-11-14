
"use client";

import { useState } from "react";

type Result = {
  title: string;
  url: string;
  snippet: string;
  source?: string;
  owner_status?: string;
  price?: number | null;
  price_status?: string;
};

export default function Home() {
  const [location, setLocation] = useState("");
  const [type, setType] = useState("properti");
  const [transaction, setTransaction] = useState("jual atau sewa");
  const [budget, setBudget] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function searchProperty() {
    if (!location.trim()) {
      setError("Masukkan lokasi properti terlebih dahulu.");
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const params = new URLSearchParams({
        location, type, transaction, budget,
      });

      const response = await fetch("/api/search?" + params.toString());
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Pencarian gagal.");

      setResults(data.results || []);
      if (!data.results?.length) {
        setError("Belum ditemukan hasil. Coba kata kunci lain.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  function formatPrice(price?: number | null) {
    if (price == null || !Number.isFinite(price)) return "Harga belum ditemukan";
    return new Intl.NumberFormat("id-ID", {
      style: "currency", currency: "IDR", maximumFractionDigits: 0,
    }).format(price);
  }

  return (
    <main className="min-h-screen bg-[#f4f6fa] text-slate-900">
      <header className="bg-[#101b35] text-white">
        <div className="mx-auto max-w-5xl px-5 pb-10 pt-8 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d7b66b] text-lg font-black text-[#101b35]">N</div>
            <div>
              <p className="text-xs font-semibold tracking-[0.22em] text-[#d7b66b]">NELLUX PROPERTY</p>
              <p className="mt-1 text-xs text-slate-300">PROPERTY SEARCH ENGINE</p>
            </div>
          </div>
          <div className="mt-8">
            <p className="text-sm font-medium text-[#e5c982]">Temukan peluang properti</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">Cari properti lebih mudah.</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
              Jelajahi iklan properti dari berbagai sumber publik dalam satu pencarian.
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pb-12 sm:px-8">
        <section className="-mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg sm:-mt-7 sm:p-7">
          <h2 className="text-lg font-bold sm:text-xl">Mulai pencarian</h2>
          <p className="mb-5 mt-1 text-sm text-slate-500">Atur lokasi, jenis properti, dan anggaran Anda.</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold">Lokasi properti</span>
              <input className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-base outline-none focus:border-[#b8944e] focus:ring-4 focus:ring-[#d7b66b]/20"
                placeholder="Contoh: Kopo, Bandung" value={location}
                onChange={e => setLocation(e.target.value)} />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Jenis properti</span>
              <select className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-base"
                value={type} onChange={e => setType(e.target.value)}>
                <option value="properti">Semua jenis properti</option>
                <option value="rumah">Rumah</option>
                <option value="tanah">Tanah</option>
                <option value="ruko">Ruko</option>
                <option value="gudang">Gudang</option>
                <option value="apartemen">Apartemen</option>
                <option value="kantor">Kantor</option>
                <option value="villa">Villa</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Jenis transaksi</span>
              <select className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-base"
                value={transaction} onChange={e => setTransaction(e.target.value)}>
                <option value="jual atau sewa">Jual atau sewa</option>
                <option value="dijual">Dijual</option>
                <option value="disewakan">Disewakan</option>
              </select>
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold">Anggaran maksimal <span className="font-normal text-slate-400">(opsional)</span></span>
              <input className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-base outline-none focus:border-[#b8944e] focus:ring-4 focus:ring-[#d7b66b]/20"
                placeholder="Contoh: Rp400 juta" value={budget}
                onChange={e => setBudget(e.target.value)} />
            </label>
          </div>

          <button onClick={searchProperty} disabled={loading}
            className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#101b35] px-5 py-4 font-bold text-white shadow-md disabled:opacity-60 sm:w-auto sm:min-w-48">
            {loading ? "Sedang mencari..." : "Cari properti →"}
          </button>
        </section>

        <section className="mt-8 sm:mt-10">
          <div className="mb-4 flex items-end justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold sm:text-2xl">Hasil pencarian</h2>
              <p className="mt-1 text-sm text-slate-500">Iklan dari sumber publik.</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 ring-1 ring-slate-200">{results.length} hasil</span>
          </div>

          {error && <div className="rounded-xl border bg-white p-4 text-sm text-slate-600">{error}</div>}

          {loading && <div className="rounded-xl border bg-white p-6 text-center text-sm text-slate-500">Sedang mencari iklan properti. Mohon tunggu...</div>}

          {!loading && results.length > 0 && (
            <div className="grid gap-4">
              {results.map((item, index) => (
                <article key={item.url || index} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{item.source || "Sumber tidak diketahui"}</span>
                    <span className="rounded-full bg-[#fbf5e8] px-3 py-1 text-xs font-semibold text-[#806127]">{item.owner_status || "Belum diketahui"}</span>
                  </div>
                  <h3 className="mt-3 text-base font-bold leading-snug sm:text-lg">{item.title}</h3>
                  <p className="mt-2 text-lg font-bold text-[#176b4b]">{formatPrice(item.price)}</p>
                  {item.price_status && <p className="mt-1 text-xs text-slate-400">Status harga: {item.price_status}</p>}
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.snippet}</p>
                  <a href={item.url} target="_blank" rel="noopener noreferrer"
                    className="mt-4 inline-flex min-h-11 items-center font-semibold text-[#234b91]">
                    Buka sumber iklan ↗
                  </a>
                </article>
              ))}
            </div>
          )}

          {!loading && results.length === 0 && !error && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-5 py-10 text-center">
              <p className="text-3xl">⌕</p>
              <p className="mt-3 font-semibold text-slate-700">Belum ada hasil pencarian</p>
              <p className="mt-1 text-sm text-slate-500">Masukkan lokasi dan tekan tombol Cari properti.</p>
            </div>
          )}
        </section>

        <p className="mt-8 text-center text-xs leading-5 text-slate-400">
          Hasil berasal dari konten publik yang terindeks. Indikasi owner bukan verifikasi identitas pemilik.
          Harga dan ketersediaan perlu dikonfirmasi kepada pemasang iklan.
        </p>
        <footer className="mt-5 text-center text-xs text-slate-400">Nellux Property © 2026</footer>
      </div>
    </main>
  );
}
