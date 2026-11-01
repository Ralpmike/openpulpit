import Link from "next/link";
import { notFound } from "next/navigation";

import { Header } from "@/components/layout/Header";
import { getViewer } from "@/modules/accounts";

export const dynamic = "force-dynamic";

const TABS = [
  { href: "/admin", label: "Reports" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/stats", label: "Stats" },
  { href: "/admin/audit", label: "Audit log" },
];

/** Admin only. Everyone else gets a 404 (the API checks the role again on every call). */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const viewer = await getViewer({ fresh: true });
  if (viewer?.role !== "admin") notFound();
  return (
    <>
      <Header actions={<Link href="/" className="text-sm text-muted-foreground underline-offset-4 hover:underline">Back to app</Link>} />
      <main id="main" className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6">
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto border-b">
          {TABS.map((tab) => (
            <Link key={tab.href} href={tab.href} className="min-h-11 px-3 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground hover:text-foreground">
              {tab.label}
            </Link>
          ))}
        </nav>
        {children}
      </main>
    </>
  );
}
