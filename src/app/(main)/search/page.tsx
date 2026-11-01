import type { Metadata } from "next";

import { getDb } from "@/lib/cloudflare";
import { searchPreachers } from "@/modules/accounts";
import { SearchPage } from "@/modules/accounts/components/SearchPage";

export const metadata: Metadata = { title: "Find a preacher" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: PageProps<"/search">) {
  const raw = (await searchParams).q;
  const query = (Array.isArray(raw) ? raw[0] : raw)?.slice(0, 100) ?? "";
  const results = query.trim().length >= 2 ? await searchPreachers(getDb(), query) : [];
  return <SearchPage initialQuery={query} initialResults={results} />;
}
