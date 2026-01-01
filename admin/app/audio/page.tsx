"use client";

import { useEffect, useMemo, useState } from "react";
import { adminApiUrl } from "../_lib/api";

type AudioItem = {
  id: number;
  original_name: string;
  filename: string;
  mime_type: string;
  size: number;
  created_at: string;
};

export default function AudioPage() {
  const [items, setItems] = useState<AudioItem[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const url = useMemo(() => adminApiUrl("/audio"), []);

  async function refresh() {
    setError(null);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      setError(`Laden fehlgeschlagen (${res.status})`);
      return;
    }
    const data: { items: AudioItem[] } = await res.json();
    setItems(Array.isArray(data.items) ? data.items : []);
  }

  async function upload() {
    if (!file) return;

    setIsBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("file", file);

      const res = await fetch(url, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        setError(`Upload fehlgeschlagen (${res.status})`);
        return;
      }

      setFile(null);
      await refresh();
    } finally {
      setIsBusy(false);
    }
  }

  useEffect(() => {
    refresh().catch((e) => setError(String(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Audio-Dateien</h1>
        <p className="text-sm text-foreground/70">
          Upload und Verwaltung (Listing + Upload).
        </p>
      </div>

      <div className="flex flex-col gap-2 rounded border border-foreground/10 p-4 sm:flex-row sm:items-center">
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
        <button
          className="h-10 rounded bg-foreground px-4 text-sm font-medium text-background disabled:opacity-60"
          onClick={() => upload()}
          disabled={isBusy || !file}
          type="button"
        >
          Upload
        </button>
      </div>

      {error ? (
        <div className="rounded border border-foreground/15 bg-foreground/5 p-3 text-sm">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded border border-foreground/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-foreground/5">
            <tr>
              <th className="px-3 py-2 font-medium">ID</th>
              <th className="px-3 py-2 font-medium">Datei</th>
              <th className="px-3 py-2 font-medium">Typ</th>
              <th className="px-3 py-2 font-medium">Größe</th>
              <th className="px-3 py-2 font-medium">Erstellt</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-foreground/70" colSpan={5}>
                  Keine Audio-Dateien.
                </td>
              </tr>
            ) : (
              items.map((a) => (
                <tr key={a.id} className="border-t border-foreground/10">
                  <td className="px-3 py-2">{a.id}</td>
                  <td className="px-3 py-2">{a.original_name}</td>
                  <td className="px-3 py-2">{a.mime_type}</td>
                  <td className="px-3 py-2">{a.size}</td>
                  <td className="px-3 py-2">{a.created_at}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
