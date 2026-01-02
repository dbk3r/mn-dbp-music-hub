import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import UserAvatar from "../components/UserAvatar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DBP Admin",
  description: "Admin Oberfläche",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen bg-background text-foreground">
          <div className="mx-auto flex min-h-screen w-full max-w-7xl">
            <aside className="w-64 border-r border-foreground/5 bg-card/30 p-6">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div className="text-lg font-semibold">DBP Admin</div>
                <UserAvatar />
              </div>
              <nav className="flex flex-col gap-1 text-sm">
                <Link className="rounded px-3 py-2 hover:bg-foreground/5" href="/products">
                  Produkte
                </Link>
                <Link className="rounded px-3 py-2 hover:bg-foreground/5" href="/audio">
                  Audio-Dateien
                </Link>
                <Link className="rounded px-3 py-2 hover:bg-foreground/5" href="/license-models">
                  Lizenzmodelle
                </Link>
                <Link className="rounded px-3 py-2 hover:bg-foreground/5" href="/categories">
                  Kategorien
                </Link>
                <Link className="rounded px-3 py-2 hover:bg-foreground/5" href="/tags">
                  Tags
                </Link>
                <Link className="rounded px-3 py-2 hover:bg-foreground/5" href="/users">
                  User
                </Link>
                <Link className="rounded px-3 py-2 hover:bg-foreground/5" href="/settings">
                  Einstellungen
                </Link>
              </nav>
            </aside>

            <main className="flex-1 p-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
