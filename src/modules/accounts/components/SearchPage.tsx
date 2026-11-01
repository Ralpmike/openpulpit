"use client";

import { SearchIcon, SearchXIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/atoms/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/atoms/empty";
import { Input } from "@/components/ui/atoms/input";
import { PreacherCard } from "@/components/ui/molecules/PreacherCard";
import { SectionLoadingSkeleton } from "@/components/ui/molecules/SectionLoadingSkeleton";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useSearchPreachersQuery, type PreacherSearchResult } from "@/modules/accounts/store/endpoints";

export interface SearchPageProps {
  initialQuery: string;
  initialResults: PreacherSearchResult[];
}

/** Search preachers by name, ministry, location or denomination. */
export function SearchPage({ initialQuery, initialResults }: SearchPageProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebouncedValue(query.trim(), 300);
  const isServerQuery = debouncedQuery === initialQuery.trim();
  const { data, isFetching: isSearchFetching, isError: isSearchError, refetch } = useSearchPreachersQuery(debouncedQuery, {
    skip: debouncedQuery.length < 2 || isServerQuery,
  });
  const results = isServerQuery ? initialResults : (data ?? []);
  const hasQuery = debouncedQuery.length >= 2;

  return (
    <div className="flex flex-col gap-5" data-testid="search-page">
      <h1 className="text-2xl font-semibold">Find a preacher</h1>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          router.replace(`/search?q=${encodeURIComponent(query.trim())}`);
        }}
      >
        <label htmlFor="search-input" className="sr-only">
          Search by name, ministry, city or denomination
        </label>
        <div className="relative">
          <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="search-input"
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            placeholder="Name, ministry, city or denomination"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-10"
            data-testid="search-input"
          />
        </div>
      </form>

      <div aria-live="polite" aria-busy={isSearchFetching || undefined}>
        {!hasQuery ? (
          <p className="text-sm text-muted-foreground">Try a name like &ldquo;Adebayo&rdquo;, a city like &ldquo;Ibadan&rdquo;, or &ldquo;Anglican&rdquo;.</p>
        ) : isSearchFetching && !results.length ? (
          <SectionLoadingSkeleton rows={3} label="Searching" />
        ) : isSearchError ? (
          <p className="text-sm text-destructive">
            Search didn&apos;t work.{" "}
            <Button variant="link" className="h-auto px-0" onClick={() => refetch()}>
              Try again
            </Button>
          </p>
        ) : results.length ? (
          <>
            <p className="sr-only">{`${results.length} ${results.length === 1 ? "preacher" : "preachers"} found`}</p>
            <ul className="flex flex-col" data-testid="search-results">
              {results.map((preacher) => (
                <li key={preacher.slug}>
                  <PreacherCard {...preacher} />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <Empty data-testid="search-empty-state">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchXIcon aria-hidden />
              </EmptyMedia>
              <EmptyTitle>No preachers match &ldquo;{debouncedQuery}&rdquo;</EmptyTitle>
              <EmptyDescription>Check the spelling, or try their ministry or city.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" onClick={() => setQuery("")}>
                Clear search
              </Button>
            </EmptyContent>
          </Empty>
        )}
      </div>
    </div>
  );
}
