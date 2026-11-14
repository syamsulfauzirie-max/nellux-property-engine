
export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          NELLUX PROPERTY
        </h1>
        <p className="mt-2 text-slate-500">
          Property Search Engine & Management System
        </p>
      </header>

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-sm text-slate-500">Total Properti</p>
          <h2 className="mt-2 text-3xl font-bold">0</h2>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-sm text-slate-500">Properti Dijual</p>
          <h2 className="mt-2 text-3xl font-bold">0</h2>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-sm text-slate-500">Properti Disewakan</p>
          <h2 className="mt-2 text-3xl font-bold">0</h2>
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">
          Pencarian Properti
        </h2>

        <input
          className="mb-4 w-full rounded-lg border p-3"
          placeholder="Cari lokasi, nama properti..."
        />

        <div className="grid gap-4 md:grid-cols-2">
          <select className="rounded-lg border p-3">
            <option>Semua Jenis Properti</option>
            <option>Rumah</option>
            <option>Tanah</option>
            <option>Ruko</option>
            <option>Gudang</option>
            <option>Apartemen</option>
            <option>Villa</option>
          </select>

          <select className="rounded-lg border p-3">
            <option>Semua Transaksi</option>
            <option>Jual</option>
            <option>Sewa</option>
          </select>
        </div>

        <button className="mt-5 rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white">
          Cari Properti
        </button>
      </section>

      <footer className="mt-10 text-center text-sm text-slate-400">
        Nellux Property © 2026
      </footer>
    </main>
  );
}
