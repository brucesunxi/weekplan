"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/children", label: "我的孩子", emoji: "👶" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-4xl animate-spin">🌟</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">📋</span>
            <span className="font-bold text-lg">小计划</span>
          </Link>

          <nav className="flex items-center gap-4">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium px-3 py-2 rounded-xl transition-colors ${
                  pathname.startsWith(item.href)
                    ? "bg-primary-100 text-primary-700"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {item.emoji} {item.label}
              </Link>
            ))}
            <div className="flex items-center gap-3 ml-2 pl-4 border-l border-border">
              <span className="text-sm text-muted-foreground">
                {session?.user?.name}
              </span>
              <button
                onClick={() => signOut()}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                退出
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </div>
  );
}
