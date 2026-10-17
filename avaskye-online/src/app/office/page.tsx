import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { OfficeExperience } from "@/components/office-experience";
import { casualLookFor } from "@/lib/casual-looks";
import { readOfficeOwner, readVisitorMode } from "@/lib/office-store";
import { SITE } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Owner office",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function backendsConfigured() {
  const org = Boolean(process.env.SUPABASE_ORG_ID?.trim());
  const token = Boolean(process.env.SUPABASE_MANAGEMENT_TOKEN?.trim());
  const oauth = Boolean(
    process.env.SUPABASE_OAUTH_CLIENT_ID?.trim() &&
      process.env.SUPABASE_OAUTH_CLIENT_SECRET?.trim() &&
      process.env.SUPABASE_OAUTH_REFRESH_TOKEN?.trim(),
  );
  return org && (token || oauth);
}

export default async function OfficePage() {
  const [appearance, owner] = await Promise.all([readVisitorMode(), readOfficeOwner()]);
  const ready = backendsConfigured();
  return (
    <main className="min-h-dvh bg-bg">
      <Header cta="Studio" href={`${SITE.agency}/studio`} />
      <OfficeExperience
        visitorMode={appearance.visitorMode}
        isOwner={Boolean(owner)}
        configured={appearance.configured}
        casual={casualLookFor()}
      />
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <p className="max-w-xl text-sm text-muted">
          {ready
            ? "Managed backends can be provisioned. The signed-in owner reviews every workspace from the DigiMark101 studio. Keys stay on the server."
            : "Managed backend is not configured. Add the Supabase organization id and a management token, or OAuth app credentials, on the server."}
        </p>
        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <a className="rounded-full bg-accent px-4 py-2 text-accent-fg" href={`${SITE.agency}/studio/backend`}>
            Open managed backends
          </a>
          <Link className="rounded-full border border-border px-4 py-2" href="/">
            Public site
          </Link>
        </div>
      </section>
    </main>
  );
}
