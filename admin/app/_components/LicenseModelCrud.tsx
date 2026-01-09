"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { adminApiUrl } from "../_lib/api";
import { useCallback } from "react";

type LicenseModelItem = {
  id: number;
  name: string;
  icon: string | null;
  description: string | null;
  priceCents: number;
  legalDescription: string | null;
};

type FormState = {
  id: number | null;
  name: string;
  icon: string;
  description: string;
  priceEuros: string;
  legalDescription: string;
};

const emptyForm: FormState = {
  id: null,
  name: "",
  icon: "",
  description: "",
  priceEuros: "0",
  legalDescription: "",
};

export default function LicenseModelCrud() {
  const [items, setItems] = useState<LicenseModelItem[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [search, setSearch] = useState("");

  const url = useMemo(() => adminApiUrl("/license-models"), []);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items
    const term = search.toLowerCase()
    return items.filter((item) =>
      item.name.toLowerCase().includes(term) ||
      (item.description?.toLowerCase().includes(term) ?? false) ||
      (item.legalDescription?.toLowerCase().includes(term) ?? false)
    )
  }, [items, search]);

  const refresh = useCallback(async () => {
    setError(null);
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") : null;
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined
    const res = await fetch(url, { cache: "no-store", headers });
    if (!res.ok) {
      setError(`Laden fehlgeschlagen (${res.status})`);
      return;
    }
    const data: { items: any[] } = await res.json();
    const normalized = Array.isArray(data.items)
      ? data.items.map((it) => ({
          id: it.id,
          name: it.name,
          icon: it.icon ?? it.icon_identifier ?? null,
          description: it.description ?? it.desc ?? null,
          priceCents: it.priceCents ?? it.price_cents ?? 0,
          legalDescription: it.legalDescription ?? it.legal_description ?? null,
        }))
      : []
    setItems(normalized)
  }, [url]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function startEdit(item: LicenseModelItem) {
    setIsFormExpanded(true);
    setForm({
      id: item.id,
      name: item.name ?? "",
      icon: item.icon ?? "",
      description: item.description ?? "",
      priceEuros: ((item.priceCents ?? 0) / 100).toFixed(2),
      legalDescription: item.legalDescription ?? "",
    });
    // focus first input so edit is visible
    setTimeout(() => {
      nameRef.current?.focus()
      nameRef.current?.select()
      nameRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 0)
  }

  function reset() {
    setForm(emptyForm);
  }

  const nameRef = useRef<HTMLInputElement | null>(null)

  async function save() {
    const name = form.name.trim();
    if (!name) return;

    const payload = {
      name,
      icon: form.icon.trim() || null,
      description: form.description.trim() || null,
      legalDescription: form.legalDescription.trim() || null,
      priceCents: Math.round((Number(form.priceEuros) || 0) * 100),
    };

    setIsBusy(true);
    setError(null);
    try {
      const target = form.id ? `${url}/${form.id}` : url;
      const method = form.id ? "PUT" : "POST";

      const token = typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(target, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        setError(`Speichern fehlgeschlagen (${res.status}) ${text}`.trim());
        return;
      }

      reset();
      await refresh();
    } finally {
      setIsBusy(false);
    }
  }

  async function remove(id: number) {
    setIsBusy(true);
    setError(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined
      const res = await fetch(`${url}/${id}`, { method: "DELETE", headers });
      if (!res.ok) {
        setError(`Löschen fehlgeschlagen (${res.status})`);
        return;
      }
      if (form.id === id) reset();
      await refresh();
    } finally {
      setIsBusy(false);
    }
  }

  useEffect(() => {
    refresh().catch((e) => setError(String(e)));
  }, [refresh]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Lizenzmodelle</h1>
        <p className="text-sm text-foreground/70">
          Name, Icon, Beschreibung, Preis und rechtlicher Text.
        </p>
      </div>

      <div className="rounded border border-foreground/10">
        <div 
          onClick={() => setIsFormExpanded(!isFormExpanded)}
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-foreground/5"
        >
          <div className="font-medium">
            {form.id ? `Lizenzmodell #${form.id} bearbeiten` : 'Neues Lizenzmodell anlegen'}
          </div>
          <span style={{ transform: isFormExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 160ms ease' }}>▶</span>
        </div>
        
        {isFormExpanded && (
          <div className="border-t border-foreground/10 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <div className="text-sm">Name</div>
            <input
              className="h-10 w-full rounded border border-foreground/15 bg-background px-3 text-sm outline-none focus:border-foreground/30"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="z.B. Standard Lizenz"
            />
          </div>
          <div className="space-y-1">
            <div className="text-sm">Icon (Identifier/Emoji)</div>
            <input
              className="h-10 w-full rounded border border-foreground/15 bg-background px-3 text-sm outline-none focus:border-foreground/30"
              value={form.icon}
              onChange={(e) => setField("icon", e.target.value)}
              placeholder="z.B. 🎵 oder 'music'"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <div className="text-sm">Beschreibung</div>
            <textarea
              className="min-h-20 w-full rounded border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30"
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Kurzbeschreibung"
            />
          </div>
          <div className="space-y-1">
            <div className="text-sm">Preis (€)</div>
            <input
              type="number"
              min={0}
              step="0.01"
              className="h-10 w-full rounded border border-foreground/15 bg-background px-3 text-sm outline-none focus:border-foreground/30"
              value={form.priceEuros}
              onChange={(e) => setField("priceEuros", e.target.value)}
              placeholder="z.B. 9.99"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <div className="text-sm">Rechtliche Beschreibung</div>
            <textarea
              className="min-h-28 w-full rounded border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30"
              value={form.legalDescription}
              onChange={(e) => setField("legalDescription", e.target.value)}
              placeholder="Rechtlicher Text / Lizenzbedingungen"
            />
          </div>
        </div>

            <div className="mt-3 flex gap-2">
              <button
                className="h-10 rounded bg-foreground px-4 text-sm font-medium text-background disabled:opacity-60"
                onClick={() => save()}
                disabled={isBusy || !form.name.trim()}
                type="button"
              >
                {form.id ? "Speichern" : "Anlegen"}
              </button>
              <button
                className="h-10 rounded px-4 text-sm hover:bg-foreground/5 disabled:opacity-60"
                onClick={() => reset()}
                disabled={isBusy}
                type="button"
              >
                Zurücksetzen
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

      <div className="mb-4">
        <input
          type="text"
          placeholder="Suchen... (Name, Beschreibung, Rechtlicher Text)"
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
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Icon</th>
              <th className="px-3 py-2 font-medium">Preis (€)</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-foreground/70" colSpan={5}>
                  {search ? "Keine Treffer." : "Keine Lizenzmodelle."}
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} className="border-t border-foreground/10">
                  <td className="px-3 py-2">{item.id}</td>
                  <td className="px-3 py-2">{item.name}</td>
                  <td className="px-3 py-2">{item.icon ?? ""}</td>
                  <td className="px-3 py-2">{((item.priceCents ?? 0) / 100).toFixed(2)} €</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      className="rounded px-3 py-1 text-sm hover:bg-foreground/5 disabled:opacity-60"
                      onClick={() => startEdit(item)}
                      disabled={isBusy}
                      type="button"
                    >
                      Bearbeiten
                    </button>
                    <button
                      className="ml-1 rounded px-3 py-1 text-sm hover:bg-foreground/5 disabled:opacity-60"
                      onClick={() => remove(item.id)}
                      disabled={isBusy}
                      type="button"
                    >
                      Löschen
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
