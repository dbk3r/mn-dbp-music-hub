"use client";

import { useEffect, useMemo, useState } from "react";
import { adminApiUrl } from "../_lib/api";

type AudioItem = {
  id: number;
  title: string;
  artist: string | null;
  description: string | null;
  release_year: number | null;
  original_name: string;
  filename: string;
  mime_type: string;
  size: number;
  duration_ms: number | null;
  waveform_peaks: number[] | null;
  category_id?: number | null;
  tag_ids?: number[] | null;
  license_model_ids?: number[] | null;
  cover_original_name?: string | null;
  cover_mime_type?: string | null;
  cover_size?: number | null;
  cover_url?: string | null;
  created_at: string;
};

type OptionItem = { id: number; name: string };
type LicenseItem = { id: number; name: string; priceCents: number };

export default function AudioPage() {
  const [items, setItems] = useState<AudioItem[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [title, setTitle] = useState<string>("");
  const [artist, setArtist] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [releaseYear, setReleaseYear] = useState<string>("");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [categories, setCategories] = useState<OptionItem[]>([]);
  const [tags, setTags] = useState<OptionItem[]>([]);
  const [licenses, setLicenses] = useState<LicenseItem[]>([]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = useMemo(
    () => items.find((i) => i.id === selectedId) ?? null,
    [items, selectedId]
  );

  const url = useMemo(() => adminApiUrl("/audio"), []);
  const categoriesUrl = useMemo(() => adminApiUrl("/categories"), []);
  const tagsUrl = useMemo(() => adminApiUrl("/tags"), []);
  const licensesUrl = useMemo(() => adminApiUrl("/license-models"), []);

  async function refresh() {
    setError(null);
    setInfo(null);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      setError(`Laden fehlgeschlagen (${res.status})`);
      return;
    }
    const data: { items: AudioItem[] } = await res.json();
    setItems(Array.isArray(data.items) ? data.items : []);
  }

  async function refreshOptions() {
    const [cRes, tRes, lRes] = await Promise.all([
      fetch(categoriesUrl, { cache: "no-store" }),
      fetch(tagsUrl, { cache: "no-store" }),
      fetch(licensesUrl, { cache: "no-store" }),
    ]);

    const cData: { items?: OptionItem[] } = await cRes.json().catch(() => ({}));
    const tData: { items?: OptionItem[] } = await tRes.json().catch(() => ({}));
    const lData: { items?: any[] } = await lRes.json().catch(() => ({}));

    setCategories(Array.isArray(cData.items) ? cData.items : []);
    setTags(Array.isArray(tData.items) ? tData.items : []);
    setLicenses(
      Array.isArray(lData.items)
        ? lData.items
            .map((x) => ({
              id: Number(x.id),
              name: String(x.name ?? ""),
              priceCents: Number(x.priceCents ?? 0),
            }))
            .filter((x) => Number.isFinite(x.id) && x.name)
        : []
    );
  }

  async function upload() {
    if (!file) return;

    setIsBusy(true);
    setError(null);
    setInfo(null);
    try {
      const form = new FormData();
      form.set("file", file);
      if (cover) form.set("cover", cover);
      form.set("title", title);
      form.set("artist", artist);
      form.set("description", description);
      form.set("release_year", releaseYear);

      const res = await fetch(url, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        setError(`Upload fehlgeschlagen (${res.status})`);
        return;
      }

      setFile(null);
      setCover(null);
      setTitle("");
      setArtist("");
      setDescription("");
      setReleaseYear("");
      await refresh();
      setInfo("Upload abgeschlossen (Produkt wird automatisch angelegt).");
    } finally {
      setIsBusy(false);
    }
  }

  async function remove(id: number) {
    setIsBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch(`${url}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setError(`Löschen fehlgeschlagen (${res.status})`);
        return;
      }
      await refresh();
    } finally {
      setIsBusy(false);
    }
  }

  async function reanalyze(id: number) {
    setIsBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch(`${url}/${id}/reanalyze`, { method: "POST" });
      if (!res.ok) {
        setError(`Re-Analyse fehlgeschlagen (${res.status})`);
        return;
      }
      await refresh();
    } finally {
      setIsBusy(false);
    }
  }

  async function ensureProduct(id: number) {
    setIsBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch(adminApiUrl("/products"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio_file_id: id }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message = typeof data?.message === "string" ? data.message : `Produkt fehlgeschlagen (${res.status})`;
        setError(message);
        return;
      }

      const created = data?.created === true;
      setInfo(created ? "Produkt angelegt." : "Produkt war bereits vorhanden.");
      await refresh();
    } finally {
      setIsBusy(false);
    }
  }

  async function saveAssignments(next: {
    category_id: number | null;
    tag_ids: number[];
    license_model_ids: number[];
  }) {
    if (!selected) return;
    setIsBusy(true);
    setError(null);
    try {
      const res = await fetch(`${url}/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) {
        setError(`Speichern fehlgeschlagen (${res.status})`);
        return;
      }
      await refresh();
    } finally {
      setIsBusy(false);
    }
  }

  function fmtDuration(ms: number | null) {
    if (!ms || ms <= 0) return "";
    const totalSeconds = Math.round(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  useEffect(() => {
    refresh().catch((e) => setError(String(e)));
    refreshOptions().catch((e) => setError(String(e)));
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

      <div className="rounded border border-foreground/10 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <div className="text-sm">Datei (mp3/wav)</div>
            <input
              type="file"
              accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,.mp3,.wav"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
          </div>
          <div className="space-y-1">
            <div className="text-sm">Coverbild (optional)</div>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
              onChange={(e) => setCover(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
          </div>
          <div className="space-y-1">
            <div className="text-sm">Titel</div>
            <input
              className="h-10 w-full rounded border border-foreground/15 bg-background px-3 text-sm outline-none focus:border-foreground/30"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titel"
            />
          </div>
          <div className="space-y-1">
            <div className="text-sm">Künstler</div>
            <input
              className="h-10 w-full rounded border border-foreground/15 bg-background px-3 text-sm outline-none focus:border-foreground/30"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Artist"
            />
          </div>
          <div className="space-y-1">
            <div className="text-sm">Erscheinungsjahr</div>
            <input
              type="number"
              min={1900}
              max={2100}
              className="h-10 w-full rounded border border-foreground/15 bg-background px-3 text-sm outline-none focus:border-foreground/30"
              value={releaseYear}
              onChange={(e) => setReleaseYear(e.target.value)}
              placeholder="z.B. 2024"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <div className="text-sm">Beschreibung</div>
            <textarea
              className="min-h-20 w-full rounded border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beschreibung"
            />
          </div>
        </div>

        <div className="mt-3">
          <button
            className="h-10 rounded bg-foreground px-4 text-sm font-medium text-background disabled:opacity-60"
            onClick={() => upload()}
            disabled={isBusy || !file || !title.trim()}
            type="button"
          >
            Upload
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded border border-foreground/15 bg-foreground/5 p-3 text-sm">
          {error}
        </div>
      ) : null}

      {info ? (
        <div className="rounded border border-foreground/15 bg-emerald-500/10 p-3 text-sm text-emerald-800">
          {info}
        </div>
      ) : null}

      <div className="overflow-hidden rounded border border-foreground/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-foreground/5">
            <tr>
              <th className="px-3 py-2 font-medium">ID</th>
              <th className="px-3 py-2 font-medium">Titel</th>
              <th className="px-3 py-2 font-medium">Künstler</th>
              <th className="px-3 py-2 font-medium">Jahr</th>
              <th className="px-3 py-2 font-medium">Dauer</th>
              <th className="px-3 py-2 font-medium">Datei</th>
              <th className="px-3 py-2 font-medium">Typ</th>
              <th className="px-3 py-2 font-medium">Größe</th>
              <th className="px-3 py-2 font-medium">Erstellt</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-foreground/70" colSpan={10}>
                  Keine Audio-Dateien.
                </td>
              </tr>
            ) : (
              items.map((a) => (
                <tr key={a.id} className="border-t border-foreground/10">
                  <td className="px-3 py-2">{a.id}</td>
                  <td className="px-3 py-2">{a.title}</td>
                  <td className="px-3 py-2">{a.artist ?? ""}</td>
                  <td className="px-3 py-2">{a.release_year ?? ""}</td>
                  <td className="px-3 py-2">{fmtDuration(a.duration_ms)}</td>
                  <td className="px-3 py-2">{a.original_name}</td>
                  <td className="px-3 py-2">{a.mime_type}</td>
                  <td className="px-3 py-2">{a.size}</td>
                  <td className="px-3 py-2">{a.created_at}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      className="rounded px-3 py-1 text-sm hover:bg-foreground/5 disabled:opacity-60"
                      onClick={() => ensureProduct(a.id)}
                      disabled={isBusy}
                      type="button"
                    >
                      Produkt anlegen
                    </button>
                    <button
                      className="rounded px-3 py-1 text-sm hover:bg-foreground/5 disabled:opacity-60"
                      onClick={() => setSelectedId(a.id)}
                      disabled={isBusy}
                      type="button"
                    >
                      Bearbeiten
                    </button>
                    <button
                      className="rounded px-3 py-1 text-sm hover:bg-foreground/5 disabled:opacity-60"
                      onClick={() => remove(a.id)}
                      disabled={isBusy}
                      type="button"
                    >
                      Löschen
                    </button>
                    <button
                      className="rounded px-3 py-1 text-sm hover:bg-foreground/5 disabled:opacity-60"
                      onClick={() => reanalyze(a.id)}
                      disabled={isBusy}
                      type="button"
                    >
                      Re-Analyse
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected ? (
        <div className="rounded border border-foreground/10 p-4">
          <div className="mb-2 text-sm font-medium">Produkt-Zuordnung: {selected.title}</div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <div className="text-sm">Kategorie</div>
              <select
                className="h-10 w-full rounded border border-foreground/15 bg-background px-3 text-sm outline-none focus:border-foreground/30"
                value={selected.category_id ?? ""}
                onChange={(e) => {
                  const v = e.target.value
                  saveAssignments({
                    category_id: v ? Number(v) : null,
                    tag_ids: Array.isArray(selected.tag_ids) ? selected.tag_ids : [],
                    license_model_ids: Array.isArray(selected.license_model_ids)
                      ? selected.license_model_ids
                      : [],
                  })
                }}
                disabled={isBusy}
              >
                <option value="">(keine)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <div className="text-sm">Tags</div>
              <div className="flex flex-wrap gap-3">
                {tags.map((t) => {
                  const current = Array.isArray(selected.tag_ids) ? selected.tag_ids : []
                  const checked = current.includes(t.id)
                  return (
                    <label key={t.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? Array.from(new Set([...current, t.id]))
                            : current.filter((id) => id !== t.id)
                          saveAssignments({
                            category_id: selected.category_id ?? null,
                            tag_ids: next,
                            license_model_ids: Array.isArray(selected.license_model_ids)
                              ? selected.license_model_ids
                              : [],
                          })
                        }}
                        disabled={isBusy}
                      />
                      {t.name}
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <div className="text-sm">Lizenzmodelle (Preis gebunden)</div>
              <div className="flex flex-wrap gap-3">
                {licenses.map((l) => {
                  const current = Array.isArray(selected.license_model_ids)
                    ? selected.license_model_ids
                    : []
                  const checked = current.includes(l.id)
                  return (
                    <label key={l.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? Array.from(new Set([...current, l.id]))
                            : current.filter((id) => id !== l.id)
                          saveAssignments({
                            category_id: selected.category_id ?? null,
                            tag_ids: Array.isArray(selected.tag_ids) ? selected.tag_ids : [],
                            license_model_ids: next,
                          })
                        }}
                        disabled={isBusy}
                      />
                      {l.name} ({(l.priceCents / 100).toFixed(2)} €)
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
