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

type Variant = {
  id: number
  license_model_id: number
  license_model_name: string
  name: string
  price_cents: number
  status: string
  description: string | null
}

type VariantFile = {
  id: number
  original_name: string
  size: number
  download_url: string
}

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
  const [isUploadFormExpanded, setIsUploadFormExpanded] = useState(false);
  const [search, setSearch] = useState("");

  const [variants, setVariants] = useState<Variant[]>([])
  const [variantFiles, setVariantFiles] = useState<Map<number, VariantFile[]>>(new Map())
  const [newVariantLicense, setNewVariantLicense] = useState(0)
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null)
  const [variantFormData, setVariantFormData] = useState<{
    name: string
    price_cents: number
    status: string
    description: string
  }>({ name: "", price_cents: 0, status: "active", description: "" })

  const selected = useMemo(
    () => items.find((i) => i.id === selectedId) ?? null,
    [items, selectedId]
  );

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items
    const term = search.toLowerCase()
    return items.filter((a) =>
      a.title.toLowerCase().includes(term) ||
      (a.artist?.toLowerCase().includes(term) ?? false) ||
      (a.description?.toLowerCase().includes(term) ?? false) ||
      a.original_name.toLowerCase().includes(term) ||
      a.filename.toLowerCase().includes(term)
    )
  }, [items, search]);

  // Metadata fields for editing
  const [editTitle, setEditTitle] = useState<string>("");
  const [editArtist, setEditArtist] = useState<string>("");
  const [editDescription, setEditDescription] = useState<string>("");
  const [editReleaseYear, setEditReleaseYear] = useState<string>("");
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [editTagIds, setEditTagIds] = useState<number[]>([]);
  const [editLicenseModelIds, setEditLicenseModelIds] = useState<number[]>([]);

  useEffect(() => {
    if (selected) {
      setEditTitle(selected.title || "");
      setEditArtist(selected.artist || "");
      setEditDescription(selected.description || "");
      setEditReleaseYear(selected.release_year ? String(selected.release_year) : "");
      setEditCategoryId(selected.category_id ?? null);
      setEditTagIds(Array.isArray(selected.tag_ids) ? selected.tag_ids : []);
      setEditLicenseModelIds(Array.isArray(selected.license_model_ids) ? selected.license_model_ids : []);
      
      // Load variants for selected audio
      refreshVariants(selected.id)
    }
  }, [selected]);

  useEffect(() => {
    if (!selected) return
    variants.forEach((v) => {
      if (!variantFiles.has(v.id)) {
        const token = localStorage.getItem('admin_auth_token')
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        fetch(adminApiUrl(`/admin/audio/${selected.id}/variants/${v.id}/files`), { headers })
          .then((r) => r.json())
          .then((data) => {
            setVariantFiles((prev) => {
              const next = new Map(prev)
              next.set(v.id, Array.isArray(data.items) ? data.items : [])
              return next
            })
          })
      }
    })
  }, [variants, selected, variantFiles])

  const url = useMemo(() => adminApiUrl("/audio"), []);
  const categoriesUrl = useMemo(() => adminApiUrl("/categories"), []);
  const tagsUrl = useMemo(() => adminApiUrl("/tags"), []);
  const licensesUrl = useMemo(() => adminApiUrl("/license-models"), []);

  async function refresh() {
    setError(null);
    setInfo(null);
    const token = localStorage.getItem("admin_auth_token")
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    const res = await fetch(url, { cache: "no-store", headers });
    if (!res.ok) {
      setError(`Laden fehlgeschlagen (${res.status})`);
      return;
    }
    const data: { items: AudioItem[] } = await res.json();
    setItems(Array.isArray(data.items) ? data.items : []);
  }

  async function refreshOptions() {
    const token = localStorage.getItem("admin_auth_token")
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    const [cRes, tRes, lRes] = await Promise.all([
      fetch(categoriesUrl, { cache: "no-store", headers }),
      fetch(tagsUrl, { cache: "no-store", headers }),
      fetch(licensesUrl, { cache: "no-store", headers }),
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
      // Build query params
      const params = new URLSearchParams();
      params.set("filename", file.name);
      params.set("mime", file.type);
      if (title) params.set("title", title);
      if (artist) params.set("artist", artist);
      if (description) params.set("description", description);
      if (releaseYear) params.set("release_year", releaseYear);

      // Use HAProxy URL for browser access (localhost) - backend:9000 only works in Docker network
      // Upload audio file first using admin API and include auth token
      const uploadUrl = `${adminApiUrl("/audio")}?${params.toString()}`
      const token = localStorage.getItem("admin_auth_token")
      const authHeaders = token ? { Authorization: `Bearer ${token}`, "Content-Type": file.type } : { "Content-Type": file.type }

      const audioRes = await fetch(uploadUrl, {
        method: "POST",
        headers: authHeaders,
        body: file,
      });

      if (!audioRes.ok) {
        const text = await audioRes.text().catch(() => "");
        setError(`Upload fehlgeschlagen (${audioRes.status}) ${text}`.trim());
        return;
      }

      const audioData = await audioRes.json();
      const audioId = audioData?.item?.id;

      // Upload cover if provided
      if (cover && audioId) {
        const coverParams = new URLSearchParams();
        coverParams.set("filename", cover.name);
        coverParams.set("mime", cover.type);

        await fetch(`${adminApiUrl(`/audio/${audioId}/cover`)}?${coverParams.toString()}`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}`, "Content-Type": cover.type } : { "Content-Type": cover.type },
          body: cover,
        });
      }

      setFile(null);
      setCover(null);
      setTitle("");
      setArtist("");
      setDescription("");
      setReleaseYear("");
      await refresh();
      setInfo("Upload abgeschlossen. Bearbeiten Sie das Audio und fügen Sie Lizenzmodelle/Varianten hinzu.");
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

  async function saveMetadata() {
    if (!selected) return;
    setIsBusy(true);
    setError(null);
    try {
      const token = localStorage.getItem("admin_auth_token");
      const headers = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
      
      const res = await fetch(`${url}/${selected.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          title: editTitle,
          artist: editArtist || null,
          description: editDescription || null,
          release_year: editReleaseYear ? Number(editReleaseYear) : null,
          category_id: editCategoryId,
          tag_ids: editTagIds,
          license_model_ids: editLicenseModelIds,
        }),
      });
      if (!res.ok) {
        setError(`Speichern fehlgeschlagen (${res.status})`);
        return;
      }
      setInfo("Metadaten gespeichert.");
      await refresh();
      setSelectedId(null);
    } finally {
      setIsBusy(false);
    }
  }

  async function refreshVariants(audioId: number) {
    const token = localStorage.getItem('admin_auth_token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    const res = await fetch(adminApiUrl(`/admin/audio/${audioId}/variants`), { headers })
    if (res.ok) {
      const data = await res.json()
      setVariants(Array.isArray(data.items) ? data.items : [])
    }
  }

  async function handleAddVariant() {
    if (!selected || !newVariantLicense) return
    setIsBusy(true)
    try {
      const token = localStorage.getItem('admin_auth_token')
      const r = await fetch(adminApiUrl(`/admin/audio/${selected.id}/variants`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ license_model_id: newVariantLicense }),
      })
      if (r.ok) {
        const created = await r.json()
        setVariants((prev) => [...prev, created])
        setNewVariantLicense(0)
      }
    } finally {
      setIsBusy(false)
    }
  }

  async function handleUpdateVariant(variantId: number) {
    if (!selected) return
    setIsBusy(true)
    try {
      const token = localStorage.getItem('admin_auth_token')
      const r = await fetch(adminApiUrl(`/admin/audio/${selected.id}/variants/${variantId}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(variantFormData),
      })
      if (r.ok) {
        const updated = await r.json()
        setVariants((prev) => prev.map((v) => (v.id === variantId ? { ...v, ...updated } : v)))
        setEditingVariantId(null)
      }
    } finally {
      setIsBusy(false)
    }
  }

  async function handleDeleteVariant(variantId: number) {
    if (!selected || !confirm("Variante löschen?")) return
    setIsBusy(true)
    try {
      const token = localStorage.getItem('admin_auth_token')
      const r = await fetch(adminApiUrl(`/admin/audio/${selected.id}/variants/${variantId}`), {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (r.ok) {
        setVariants((prev) => prev.filter((v) => v.id !== variantId))
        setVariantFiles((prev) => {
          const next = new Map(prev)
          next.delete(variantId)
          return next
        })
      }
    } finally {
      setIsBusy(false)
    }
  }

  async function handleUploadFile(variantId: number) {
    if (!selected) return
    const input = document.createElement("input")
    input.type = "file"
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0]
      if (!file) return

      setIsBusy(true)
      try {
        const token = localStorage.getItem('admin_auth_token')
        const backendUrl = typeof window !== 'undefined' ? 'http://localhost' : 'http://backend:9000';
        const r = await fetch(`${backendUrl}/custom/admin/audio/${selected.id}/variants/${variantId}/files?filename=${encodeURIComponent(file.name)}&mime=${encodeURIComponent(file.type)}`, {
          method: "POST",
          headers: {
            "Content-Type": file.type,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: file,
        })
        if (r.ok) {
          const created = await r.json()
          setVariantFiles((prev) => {
            const next = new Map(prev)
            const existing = next.get(variantId) || []
            next.set(variantId, [...existing, created])
            return next
          })
        }
      } finally {
        setIsBusy(false)
      }
    }
    input.click()
  }

  async function handleDeleteFile(variantId: number, fileId: number) {
    if (!selected || !confirm("Datei löschen?")) return
    setIsBusy(true)
    try {
      const token = localStorage.getItem('admin_auth_token')
      const r = await fetch(adminApiUrl(`/admin/audio/${selected.id}/variants/${variantId}/files/${fileId}`), {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (r.ok) {
        setVariantFiles((prev) => {
          const next = new Map(prev)
          const existing = next.get(variantId) || []
          next.set(variantId, existing.filter((f) => f.id !== fileId))
          return next
        })
      }
    } finally {
      setIsBusy(false)
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

      <div className="rounded border border-foreground/10">
        <div 
          onClick={() => setIsUploadFormExpanded(!isUploadFormExpanded)}
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-foreground/5"
        >
          <div className="font-medium">Neue Audio-Datei hochladen</div>
          <span style={{ transform: isUploadFormExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 160ms ease' }}>▶</span>
        </div>
        
        {isUploadFormExpanded && (
          <div className="border-t border-foreground/10 p-4">
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
        )}
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

      <div className="mb-4">
        <input
          type="text"
          placeholder="Suchen... (Titel, Künstler, Beschreibung, Dateiname)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full max-w-[600px] rounded border border-foreground/15 bg-background px-3 text-sm outline-none focus:border-foreground/30"
        />
      </div>

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
            {filteredItems.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-foreground/70" colSpan={10}>
                  {search ? "Keine Treffer." : "Keine Audio-Dateien."}
                </td>
              </tr>
            ) : (
              filteredItems.map((a) => (
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
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded hover:bg-foreground/5 disabled:opacity-60"
                        onClick={() => setSelectedId(a.id)}
                        disabled={isBusy}
                        type="button"
                        title="Bearbeiten"
                      >
                        <span className="text-lg">✏️</span>
                      </button>
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded hover:bg-foreground/5 disabled:opacity-60"
                        onClick={() => remove(a.id)}
                        disabled={isBusy}
                        type="button"
                        title="Löschen"
                      >
                        <span className="text-lg">🗑️</span>
                      </button>
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded hover:bg-foreground/5 disabled:opacity-60"
                        onClick={() => reanalyze(a.id)}
                        disabled={isBusy}
                        type="button"
                        title="Re-Analyse"
                      >
                        <span className="text-lg">🔄</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected ? (
        <div className="rounded border border-foreground/10 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-medium">Bearbeiten: {selected.title}</div>
            <button
              className="rounded px-3 py-1 text-sm hover:bg-foreground/5"
              onClick={() => setSelectedId(null)}
              type="button"
            >
              Schließen
            </button>
          </div>

          {/* Combined Metadata & Product Assignment Section */}
          <div className="space-y-3 rounded border border-foreground/10 p-3">
            <div className="text-sm font-medium">Metadaten & Produkt-Zuordnung</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <div className="text-sm">Titel</div>
                <input
                  className="h-10 w-full rounded border border-foreground/15 bg-background px-3 text-sm outline-none focus:border-foreground/30"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Titel"
                />
              </div>
              <div className="space-y-1">
                <div className="text-sm">Künstler</div>
                <input
                  className="h-10 w-full rounded border border-foreground/15 bg-background px-3 text-sm outline-none focus:border-foreground/30"
                  value={editArtist}
                  onChange={(e) => setEditArtist(e.target.value)}
                  placeholder="Künstler"
                />
              </div>
              <div className="space-y-1">
                <div className="text-sm">Erscheinungsjahr</div>
                <input
                  type="number"
                  min={1900}
                  max={2100}
                  className="h-10 w-full rounded border border-foreground/15 bg-background px-3 text-sm outline-none focus:border-foreground/30"
                  value={editReleaseYear}
                  onChange={(e) => setEditReleaseYear(e.target.value)}
                  placeholder="z.B. 2024"
                />
              </div>
              <div className="space-y-1">
                <div className="text-sm">Kategorie</div>
                <select
                  className="h-10 w-full rounded border border-foreground/15 bg-background px-3 text-sm outline-none focus:border-foreground/30"
                  value={editCategoryId ?? ""}
                  onChange={(e) => setEditCategoryId(e.target.value ? Number(e.target.value) : null)}
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
              <div className="space-y-1 sm:col-span-2">
                <div className="text-sm">Beschreibung</div>
                <textarea
                  className="min-h-20 w-full rounded border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Beschreibung"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <div className="text-sm">Tags</div>
                <div className="flex flex-wrap gap-3">
                  {tags.map((t) => {
                    const checked = editTagIds.includes(t.id)
                    return (
                      <label key={t.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? Array.from(new Set([...editTagIds, t.id]))
                              : editTagIds.filter((id) => id !== t.id)
                            setEditTagIds(next)
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
                    const checked = editLicenseModelIds.includes(l.id)
                    return (
                      <label key={l.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? Array.from(new Set([...editLicenseModelIds, l.id]))
                              : editLicenseModelIds.filter((id) => id !== l.id)
                            setEditLicenseModelIds(next)
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
            <button
              className="h-10 rounded bg-foreground px-4 text-sm font-medium text-background disabled:opacity-60"
              onClick={saveMetadata}
              disabled={isBusy || !editTitle.trim()}
              type="button"
            >
              Speichern
            </button>
          </div>

          {/* Varianten / Lizenzmodelle Section */}
          <div className="mt-6 space-y-3 rounded border border-foreground/10 p-3">
            <div className="text-sm font-medium">Varianten / Lizenzmodelle</div>
            <div className="text-sm text-foreground/70">Jede Variante repräsentiert ein Lizenzmodell mit eigenem Preis und Download-Dateien.</div>
            
            {variants.length === 0 ? (
              <div className="rounded border border-foreground/10 bg-foreground/5 p-4 text-sm text-foreground/70">
                Keine Varianten vorhanden. Fügen Sie unten eine hinzu.
              </div>
            ) : (
              variants.map((v) => {
                const files = variantFiles.get(v.id) || []
                const isEditing = editingVariantId === v.id
                return (
                  <div
                    key={v.id}
                    className="rounded border border-foreground/10 p-3"
                    style={{
                      borderColor: isEditing ? 'var(--primary, #0070f3)' : undefined,
                      borderWidth: isEditing ? '2px' : undefined,
                    }}
                  >
                    {isEditing ? (
                      <div>
                        <div className="mb-3 text-sm font-medium">Variante bearbeiten</div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm">Name</label>
                            <input
                              type="text"
                              value={variantFormData.name}
                              onChange={(e) => setVariantFormData({ ...variantFormData, name: e.target.value })}
                              className="h-10 w-full rounded border border-foreground/15 bg-background px-3 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-sm">Preis (Cent)</label>
                            <input
                              type="number"
                              value={variantFormData.price_cents}
                              onChange={(e) => setVariantFormData({ ...variantFormData, price_cents: Number(e.target.value) })}
                              className="h-10 w-full rounded border border-foreground/15 bg-background px-3 text-sm"
                            />
                            <small className="text-foreground/70">Aktuell: {(variantFormData.price_cents / 100).toFixed(2)}€</small>
                          </div>
                          <div>
                            <label className="text-sm">Status</label>
                            <select
                              value={variantFormData.status}
                              onChange={(e) => setVariantFormData({ ...variantFormData, status: e.target.value })}
                              className="h-10 w-full rounded border border-foreground/15 bg-background px-3 text-sm"
                            >
                              <option value="active">Aktiv (verfügbar)</option>
                              <option value="inactive">Inaktiv (nicht verfügbar)</option>
                              <option value="sold_out">Ausverkauft</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-sm">Beschreibung / Lizenzbedingungen</label>
                            <textarea
                              value={variantFormData.description}
                              onChange={(e) => setVariantFormData({ ...variantFormData, description: e.target.value })}
                              placeholder="Details zur Lizenz, Nutzungsbedingungen, etc."
                              className="min-h-20 w-full rounded border border-foreground/15 bg-background px-3 py-2 text-sm"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateVariant(v.id)}
                              className="h-10 rounded bg-foreground px-4 text-sm font-medium text-background"
                            >
                              Speichern
                            </button>
                            <button
                              className="h-10 rounded border border-foreground/15 px-4 text-sm"
                              onClick={() => setEditingVariantId(null)}
                            >
                              Abbrechen
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="mb-3 flex items-start justify-between">
                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <div className="text-sm font-medium">{v.name}</div>
                              <span className="rounded bg-foreground/10 px-2 py-0.5 text-xs">
                                {v.status === "active" ? "Aktiv" : v.status === "sold_out" ? "Ausverkauft" : "Inaktiv"}
                              </span>
                            </div>
                            <div className="text-sm text-foreground/70">
                              Lizenzmodell: <strong>{v.license_model_name}</strong> · Preis: <strong>{(v.price_cents / 100).toFixed(2)}€</strong>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingVariantId(v.id)
                                setVariantFormData({
                                  name: v.name,
                                  price_cents: v.price_cents,
                                  status: v.status,
                                  description: v.description || "",
                                })
                              }}
                              className="h-8 rounded border border-foreground/15 px-3 text-sm hover:bg-foreground/5"
                            >
                              Bearbeiten
                            </button>
                            <button
                              className="h-8 rounded border border-red-500 px-3 text-sm text-red-500 hover:bg-red-500 hover:text-white"
                              onClick={() => handleDeleteVariant(v.id)}
                            >
                              Löschen
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 rounded border border-foreground/10 bg-foreground/5 p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <strong className="text-sm">Download-Dateien ({files.length})</strong>
                            <button
                              className="h-8 rounded bg-green-600 px-3 text-sm text-white hover:bg-green-700"
                              onClick={() => handleUploadFile(v.id)}
                            >
                              + Datei hochladen
                            </button>
                          </div>
                          {files.length === 0 ? (
                            <p className="text-sm text-foreground/70">Keine Dateien angehängt. Laden Sie Dateien hoch, die Käufer herunterladen können.</p>
                          ) : (
                            <div className="space-y-2">
                              {files.map((f) => (
                                <div
                                  key={f.id}
                                  className="flex items-center justify-between rounded border border-foreground/10 bg-background p-2"
                                >
                                  <div className="flex-1">
                                    <a
                                      href={f.download_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm font-medium hover:underline"
                                    >
                                      {f.original_name}
                                    </a>
                                    <div className="text-xs text-foreground/70">{(f.size / 1024).toFixed(1)} KB</div>
                                  </div>
                                  <button
                                    className="h-8 rounded border border-red-500 px-3 text-xs text-red-500 hover:bg-red-500 hover:text-white"
                                    onClick={() => handleDeleteFile(v.id, f.id)}
                                  >
                                    Löschen
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}

            <div className="rounded border-2 border-dashed border-foreground/20 p-3">
              <div className="mb-2 text-sm font-medium">Neue Variante hinzufügen</div>
              <div className="mb-3 text-sm text-foreground/70">Wählen Sie ein Lizenzmodell. Preis und Name werden als Vorlage übernommen und können anschließend angepasst werden.</div>
              <div className="flex gap-2">
                <select
                  value={newVariantLicense}
                  onChange={(e) => setNewVariantLicense(Number(e.target.value))}
                  className="h-10 flex-1 rounded border border-foreground/15 bg-background px-3 text-sm"
                >
                  <option value={0}>Lizenzmodell wählen ({licenses.length} verfügbar)</option>
                  {licenses.map((lm) => (
                    <option key={lm.id} value={lm.id}>
                      {lm.name} — {(lm.priceCents / 100).toFixed(2)}€
                    </option>
                  ))}
                </select>
                <button
                  className="h-10 rounded bg-green-600 px-4 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
                  onClick={handleAddVariant}
                  disabled={!newVariantLicense}
                >
                  + Hinzufügen
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
