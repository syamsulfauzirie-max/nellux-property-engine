
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

      if (!response.ok) {
        throw new Error(data.error || "Pencarian gagal.");
      }

      setResults(data.results || []);

      if (!data.results?.length) {
        setError("Belum ditemukan hasil. Coba kata kunci atau lokasi lain.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  function formatPrice(price?: number | null) {
    if (price == null || !Number.isFinite(price)) {
      return "Harga belum ditemukan";
    }

    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(price);
  }

  return (
    <main className="min-h-screen bg-[#f3f6fb] text-[#101b35]">
      <header className="relative overflow-hidden bg-[#101b35] text-white">
        <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-[#d7b66b]/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-7 sm:px-8 sm:pb-20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#d7b66b]/60 bg-[#d7b66b] text-2xl font-black text-[#101b35]">
                ⌂
              </div>
              <div>
                <p className="text-sm font-extrabold tracking-[0.2em]">
                  NELLUX PROPERTY
                </p>
                <p className="mt-1 text-[10px] tracking-[0.18em] text-slate-300">
                  PROPERTY SEARCH ENGINE
                </p>
              </div>
            </div>

            <span className="rounded-full border border-[#d7b66b] px-3 py-2 text-xs font-bold text-[#f2ce7d]">
              ⌕ Live Search
            </span>
          </div>

          <div className="mt-10 max-w-2xl">
            <p className="text-sm font-semibold text-[#e6c578]">
              Temukan peluang properti
            </p>
            <h1 className="mt-2 text-4xl font-black leading-[1.08] sm:text-5xl">
              Cari Properti
              <br />
              <span className="text-[#e6bd65]">Lebih Mudah</span>
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300 sm:text-base">
              Temukan iklan properti dari berbagai sumber publik dalam satu pencarian.
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 h-2 w-full bg-gradient-to-r from-[#d7b66b] via-[#f4d88f] to-transparent" />
      </header>

      <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-8">
        <section className="relative -mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/10 sm:-mt-10 sm:p-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e5b957] text-2xl text-white">
              ⌕
            </div>
            <div>
              <h2 className="text-xl font-extrabold">Mulai Pencarian</h2>
              <p className="text-sm text-slate-500">
                Atur lokasi, jenis properti, dan anggaran Anda.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-sm font-bold">
                Lokasi properti
              </span>
              <input
                className="w-full rounded-2xl border border-slate-300 px-4 py-3.5 text-base outline-none focus:border-[#c69b43] focus:ring-4 focus:ring-amber-100"
                placeholder="Contoh: Kopo, Bandung"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </label>

            <label>
              <span className="mb-1.5 block text-sm font-bold">
                Jenis properti
              </span>
              <select
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-base"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
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

            <label>
              <span className="mb-1.5 block text-sm font-bold">
                Jenis transaksi
              </span>
              <select
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-base"
                value={transaction}
                onChange={(e) => setTransaction(e.target.value)}
              >
                <option value="jual atau sewa">Jual atau sewa</option>
                <option value="dijual">Dijual</option>
                <option value="disewakan">Disewakan</option>
              </select>
            </label>

            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-sm font-bold">
                Anggaran maksimal{" "}
                <span className="font-normal text-slate-400">(opsional)</span>
              </span>
              <input
                className="w-full rounded-2xl border border-slate-300 px-4 py-3.5 text-base outline-none focus:border-[#c69b43] focus:ring-4 focus:ring-amber-100"
                placeholder="Contoh: Rp400 juta"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </label>
          </div>

          <button
            onClick={searchProperty}
            disabled={loading}
            className="mt-5 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border-2 border-[#e5b957] bg-[#101b35] px-5 py-4 text-base font-extrabold text-white shadow-lg transition hover:bg-[#1b2c50] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Sedang mencari..." : "⌕  Cari Properti →"}
          </button>
        </section>

        <section className="mt-9">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold">Hasil Pencarian</h2>
              <p className="mt-1 text-sm text-slate-500">
                Iklan dari sumber publik.
              </p>
            </div>
            <span className="rounded-full border border-[#f0d18b] bg-[#fff6e3] px-4 py-2 text-sm font-bold">
              {results.length} hasil ditemukan
            </span>
          </div>

          {error && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              {error}
            </div>
          )}

          {loading && (
            <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
              Sedang mencari iklan properti. Mohon tunggu...
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="grid gap-4">
              {results.map((item, index) => (
                <article
                  key={item.url || index}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                >
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                      {item.source || "Sumber tidak diketahui"}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        item.owner_status === "Indikasi owner"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {item.owner_status || "Belum diketahui"}
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-extrabold leading-snug">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xl font-black text-green-800">
                    {formatPrice(item.price)}
                  </p>

                  {item.price_status && (
                    <p className="mt-1 text-xs text-slate-400">
                      {item.price_status}
                    </p>
                  )}

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {item.snippet}
                  </p>

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex min-h-11 items-center font-bold text-blue-800 hover:underline"
                  >
                    Buka sumber iklan ↗
                  </a>
                </article>
              ))}
            </div>
          )}

          {!loading && results.length === 0 && !error && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
              <p className="text-4xl text-[#c69b43]">⌕</p>
              <p className="mt-3 font-bold">Belum ada hasil pencarian</p>
              <p className="mt-1 text-sm text-slate-500">
                Masukkan lokasi dan tekan tombol Cari Properti.
              </p>
            </div>
          )}
        </section>

        <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4 text-xs leading-5 text-slate-600">
          Hasil berasal dari konten publik yang terindeks. Indikasi owner bukan verifikasi identitas pemilik. Harga dan ketersediaan perlu dikonfirmasi kepada pemasang iklan.
        </div>
      </div>

      <footer className="bg-[#101b35] px-4 py-6 text-center text-sm font-bold text-[#e6bd65]">
        Nellux Property © 2026
      </footer>
    </main>
  );
}
