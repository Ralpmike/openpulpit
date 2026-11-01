import Link from "next/link";

import { Button } from "@/components/ui/atoms/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/atoms/empty";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-12">
      <Empty data-testid="not-found">
        <EmptyHeader>
          <EmptyTitle>We couldn&apos;t find that page</EmptyTitle>
          <EmptyDescription>It may have been removed, or the link may be wrong.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/">Go to the home page</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}
