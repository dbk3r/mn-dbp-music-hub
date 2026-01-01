import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <p className="text-sm text-foreground/70">
        Verwaltung von Lizenzmodellen, Kategorien, Tags, Usern und Audio-Dateien.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/license-models"
          className="rounded border border-foreground/10 p-4 hover:bg-foreground/5"
        >
          Lizenzmodelle
        </Link>
        <Link
          href="/categories"
          className="rounded border border-foreground/10 p-4 hover:bg-foreground/5"
        >
          Kategorien
        </Link>
        <Link
          href="/tags"
          className="rounded border border-foreground/10 p-4 hover:bg-foreground/5"
        >
          Tags
        </Link>
        <Link
          href="/users"
          className="rounded border border-foreground/10 p-4 hover:bg-foreground/5"
        >
          User
        </Link>
        <Link
          href="/audio"
          className="rounded border border-foreground/10 p-4 hover:bg-foreground/5"
        >
          Audio-Dateien
        </Link>
      </div>
    </div>
  );
}
