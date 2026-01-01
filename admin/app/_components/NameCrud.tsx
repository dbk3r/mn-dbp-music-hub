"use client";

import { useEffect, useMemo, useState } from "react";
import { adminApiUrl } from "../_lib/api";

type NameItem = {
  id: number;
  name: string;
};

type Props = {
  title: string;
  apiPath: string;
  addLabel: string;
  inputPlaceholder: string;
};

export default function NameCrud({
  title,
  apiPath,
  addLabel,
  inputPlaceholder,
}: Props) {
  const [items, setItems] = useState<NameItem[]>([]);
  const [name, setName] = useState<string>("");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const url = useMemo(() => adminApiUrl(apiPath), [apiPath]);

  async function refresh() {
    setError(null);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      setError(`Laden fehlgeschlagen (${res.status})`);
      return;
    }

    const data: { items: NameItem[] } = await res.json();
    setItems(Array.isArray(data.items) ? data.items : []);
  }

  async function add() {
    const trimmed = name.trim();
    if (!trimmed) return;

    setIsBusy(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        setError(`Speichern fehlgeschlagen (${res.status})`);
        return;
      }
      setName("");
      await refresh();
    } finally {
      setIsBusy(false);
    }
  }

  async function remove(id: number) {
    setIsBusy(true);
    setError(null);
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

  useEffect(() => {
    refresh().catch((e) => setError(String(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-foreground/70">Einträge anlegen und löschen.</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          className="h-10 w-full rounded border border-foreground/15 bg-background px-3 text-sm outline-none focus:border-foreground/30"
          placeholder={inputPlaceholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          className="h-10 rounded bg-foreground px-4 text-sm font-medium text-background disabled:opacity-60"
          onClick={() => add()}
          disabled={isBusy || !name.trim()}
          type="button"
        >
          {addLabel}
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
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-foreground/70" colSpan={3}>
                  Keine Einträge.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t border-foreground/10">
                  <td className="px-3 py-2">{item.id}</td>
                  <td className="px-3 py-2">{item.name}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      className="rounded px-3 py-1 text-sm hover:bg-foreground/5 disabled:opacity-60"
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
