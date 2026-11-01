import type { Metadata } from "next";
import Link from "next/link";

import { CURRENT_TERMS_VERSION } from "@/modules/accounts";

export const metadata: Metadata = { title: "Community guidelines" };

/** Requirement 24. OpenPulpit does not police doctrine; these rules are about safety and the law. */
export default function GuidelinesPage() {
  return (
    <article className="flex flex-col gap-5 text-pretty" data-testid="guidelines-page">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Community guidelines</h1>
        <p className="text-sm text-muted-foreground">Version {CURRENT_TERMS_VERSION}</p>
      </header>
      <p>
        OpenPulpit is open to every preacher. We don&apos;t judge doctrine, denomination or style of preaching: you are free to
        preach what you believe. These rules exist so the platform stays safe for everyone who listens.
      </p>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Not allowed on OpenPulpit</h2>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>
            <strong>Hate speech:</strong> attacking or demeaning people because of their ethnicity, tribe, religion, nationality,
            sex, disability or similar characteristics.
          </li>
          <li>
            <strong>Incitement to violence:</strong> calling for, praising or threatening violence against any person or group.
          </li>
          <li>
            <strong>Harassment:</strong> targeting, threatening or shaming a specific person, including sharing their private details.
          </li>
          <li>
            <strong>Fraud and solicitation scams:</strong> deceiving listeners for money, fake miracles or prophecies sold for payment,
            &ldquo;seed&rdquo; schemes that promise returns, or asking for bank details.
          </li>
          <li>
            <strong>Illegal content:</strong> anything that breaks Nigerian law, including content that exploits children.
          </li>
          <li>
            <strong>Copyrighted music:</strong> please don&apos;t play recorded worship music you don&apos;t have rights to. Recordings with it may be removed.
          </li>
        </ul>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">What happens when something breaks the rules</h2>
        <p>
          Anyone signed in can report a broadcast, a recording or a profile. Our team reviews every report. Depending on what we
          find we may hide a recording, end a live broadcast, warn the preacher, or suspend or ban an account. Every action our team
          takes is recorded.
        </p>
      </section>
      <p>
        See also our <Link href="/terms" className="font-medium text-primary underline underline-offset-4">terms of use</Link>.
      </p>
    </article>
  );
}
