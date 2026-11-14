
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
        location,
        type,
        transaction,
        budget,
      });

      const response = await fetch(
        "/api/search?" + params.toString()
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Pencarian gagal.");
      }

      setResults(data.results || []);

      if (!data.results?.length) {
        setError("Belum ditemukan hasil. Coba kata kunci lain.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan."
      );
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
    <main className="min-h-screen bg-slate-100 p-5 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          NELLUX PROPERTY
        </h1>
        <p className="mt-2 text-slate-500">
          Live Property Search Engine
        </p>
      </header>

      <section className="rounded-xl bg-white p-5 shadow">
        <h2 className="mb-4 text-xl font-bold">
          Pencarian Properti Langsung
        </h2>

        <input
          className="mb-4 w-full rounded-lg border p-3"
          placeholder="Contoh: Kopo, Bandung"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <select
            className="rounded-lg border p-3"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="properti">Semua Jenis Properti</option>
            <option value="rumah">Rumah</option>
            <option value="tanah">Tanah</option>
            <option value="ruko">Ruko</option>
            <option value="gudang">Gudang</option>
            <option value="apartemen">Apartemen</option>
            <option value="kantor">Kantor</option>
            <option value="villa">Villa</option>
          </select>

          <select
            className="rounded-lg border p-3"
            value={transaction}
            onChange={(e) => setTransaction(e.target.value)}
          >
            <option value="jual atau sewa">Semua Transaksi</option>
            <option value="dijual">Dijual</option>
            <option value="disewakan">Disewakan</option>
          </select>
        </div>

        <input
          className="mt-4 w-full rounded-lg border p-3"
          placeholder="Anggaran maksimal, contoh Rp400 juta"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
        />

        <button
          onClick={searchProperty}
          disabled={loading}
          className="mt-5 rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Sedang mencari..." : "Cari Properti"}
        </button>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold">Hasil Pencarian</h2>
          <span className="text-sm text-slate-500">
            {results.length} hasil ditemukan
          </span>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-white p-4 text-slate-700">
            {error}
          </p>
        )}

        <div className="grid gap-4">
          {results.map((item, index) => (
            <article
              key={item.url || index}
              className="rounded-xl bg-white p-5 shadow"
            >
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {item.source || "Sumber tidak diketahui"}
                </span>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                  {item.owner_status || "Belum diketahui"}
                </span>
              </div>

              <h3 className="font-bold text-slate-900">
                {item.title}
              </h3>

              <p className="mt-2 text-lg font-bold text-green-700">
                {formatPrice(item.price)}
              </p>

              {item.price_status && (
                <p className="mt-1 text-xs text-slate-500">
                  Status harga: {item.price_status}
                </p>
              )}

              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {item.snippet}
              </p>

              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block font-semibold text-blue-700"
              >
                Buka sumber iklan →
              </a>
            </article>
          ))}
        </div>
      </section>

      <p className="mt-8 text-center text-xs text-slate-500">
        Hasil berasal dari konten publik yang terindeks.
        Indikasi owner bukan verifikasi identitas pemilik.
        Harga yang tidak ditemukan perlu dikonfirmasi.
      </p>

      <footer className="mt-6 text-center text-sm text-slate-400">
        Nellux Property © 2026
      </footer>
    </main>
  );
}
