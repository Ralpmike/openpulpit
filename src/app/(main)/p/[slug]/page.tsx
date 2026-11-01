import { BadgeCheckIcon, MapPinIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { Badge } from "@/components/ui/atoms/badge";
import { PreacherAvatar } from "@/components/ui/molecules/PreacherAvatar";
import { getDb } from "@/lib/cloudflare";
import { getPublicProfileBySlug, toPreacherProfile } from "@/modules/accounts";

const loadProfile = cache(async (slug: string) => {
  const row = await getPublicProfileBySlug(getDb(), slug.toLowerCase());
  return row ? toPreacherProfile(row) : null;
});

export async function generateMetadata({ params }: PageProps<"/p/[slug]">): Promise<Metadata> {
  const profile = await loadProfile((await params).slug);
  if (!profile) return { title: "Preacher not found" };
  const description = profile.bio || `${profile.ministry}, ${profile.city}. Listen live and replay sermons on OpenPulpit.`;
  return {
    title: profile.displayName,
    description,
    openGraph: { title: profile.displayName, description, type: "profile", images: profile.photoUrl ? [profile.photoUrl] : [] },
  };
}

export default async function PreacherPage({ params }: PageProps<"/p/[slug]">) {
  const profile = await loadProfile((await params).slug);
  if (!profile) notFound();
  const location = [profile.city, profile.state].filter(Boolean).join(", ");
  return (
    <article className="flex flex-col gap-6" data-testid="preacher-page">
      <header className="flex flex-col items-center gap-3 text-center">
        <PreacherAvatar name={profile.displayName} photoUrl={profile.photoUrl} size="lg" />
        <div className="flex flex-col items-center gap-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold">{profile.displayName}</h1>
          {profile.isVerified ? (
            <Badge variant="good" data-testid="verified-badge">
              <BadgeCheckIcon data-icon="inline-start" aria-hidden />
              Verified
            </Badge>
          ) : null}
          <p className="text-muted-foreground">{profile.ministry}</p>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPinIcon aria-hidden className="size-4" />
            {location}
            {profile.denomination ? ` · ${profile.denomination}` : null}
          </p>
        </div>
      </header>
      {profile.bio ? <p className="text-pretty whitespace-pre-line">{profile.bio}</p> : null}
      <section aria-labelledby="sermons-heading" className="flex flex-col gap-3">
        <h2 id="sermons-heading" className="text-lg font-semibold">
          Sermons
        </h2>
        <p className="text-sm text-muted-foreground">Broadcasts appear here when they end.</p>
      </section>
    </article>
  );
}
