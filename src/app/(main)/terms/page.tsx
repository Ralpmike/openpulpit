import type { Metadata } from "next";
import Link from "next/link";

import { CURRENT_TERMS_VERSION } from "@/modules/accounts";

export const metadata: Metadata = { title: "Terms of use" };

export default function TermsPage() {
  return (
    <article className="flex flex-col gap-5 text-pretty" data-testid="terms-page">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Terms of use</h1>
        <p className="text-sm text-muted-foreground">Version {CURRENT_TERMS_VERSION}. Run by FutureLabs, Nigeria.</p>
      </header>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Using OpenPulpit</h2>
        <p>
          Anyone can listen. To follow preachers, get notifications, report content or preach, you need an account and must follow
          our <Link href="/guidelines" className="font-medium text-primary underline underline-offset-4">community guidelines</Link>.
        </p>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">If you preach</h2>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>You own what you preach. You let OpenPulpit stream, record, store and share it on the platform so people can listen.</li>
          <li>Every broadcast is recorded. You can rename, hide or delete your recordings at any time.</li>
          <li>The free plan includes 10 broadcast hours a month and keeps your 20 newest recordings.</li>
          <li>You are responsible for what you say on air, including not playing music you don&apos;t have rights to.</li>
        </ul>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Your data</h2>
        <p>
          We collect only what we need to run the service (your name, email, profile, who you follow and what you listen to) and
          handle it in line with the Nigeria Data Protection Act 2023. We don&apos;t store your IP address, and we never sell your data.
          You can ask us to delete your account at any time.
        </p>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">When we act</h2>
        <p>
          We may hide content, end broadcasts, or warn, suspend or ban accounts that break these terms or the guidelines. Contact us
          if you think we got it wrong.
        </p>
      </section>
    </article>
  );
}
