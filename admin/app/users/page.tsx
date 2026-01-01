"use client";

import { useEffect, useMemo, useState } from "react";
import { adminApiUrl } from "../_lib/api";

type UserItem = {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  created_at?: string | null;
};

export default function UsersPage() {
  const [items, setItems] = useState<UserItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const url = useMemo(() => adminApiUrl("/users"), []);

  useEffect(() => {
    async function run() {
      setError(null);
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        setError(`Laden fehlgeschlagen (${res.status})`);
        return;
      }
      const data: { items: UserItem[] } = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    }

    run().catch((e) => setError(String(e)));
  }, [url]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">User</h1>
        <p className="text-sm text-foreground/70">Aktuell read-only Listing.</p>
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
              <th className="px-3 py-2 font-medium">E-Mail</th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Erstellt</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-foreground/70" colSpan={4}>
                  Keine User.
                </td>
              </tr>
            ) : (
              items.map((u) => (
                <tr key={u.id} className="border-t border-foreground/10">
                  <td className="px-3 py-2">{u.id}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">
                    {[u.first_name, u.last_name].filter(Boolean).join(" ")}
                  </td>
                  <td className="px-3 py-2">{u.created_at ?? ""}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
