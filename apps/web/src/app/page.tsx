import { Suspense } from 'react'

import { getRecentDocs } from "@/app/docs/controller/doc.controller";
import { UrlImportForm } from "@/components/docs/url-import-form";
import { DocList } from '@/components/docs/doc-list';

export default async function HomePage() {
  const recentDocs = await getRecentDocs();

  return (
    <div className="min-h-screen bg-[#fafafa]">
        <section className="mx-auto max-w-4xl px-4 pb-10 pt-16 text-center sm:pt-20">
          <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Save notes while reading{" "}
            <span className="block text-blue-500">interactive vocabulary</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            Import technical blogs, documentation, or articles. Select words,
            translate them, save vocabulary, and review later for your real
            working life.
          </p>

        </section>

        <UrlImportForm />

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-10">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            Recently Imported
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Explore your saved documents and continue learning vocabulary
          </p>
        </div>

        <Suspense fallback={<div role="status" aria-live="polite">Loading...</div>}>
        <DocList initialDocs={recentDocs} />
      </Suspense>
      </section>
    </div>
  );
}