import { ArrowRight } from "lucide-react";
import { Suspense } from 'react'

import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { getRecentDocs } from "@/features/docs/queries";
import { UrlImportForm } from "@/components/docs/url-import-form";

export default async function HomePage() {
  const recentDocs = await getRecentDocs();

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <AppHeader />

      <main>
        <section className="mx-auto max-w-4xl px-4 pb-10 pt-16 text-center sm:pt-20">
          <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Read docs and learn English with{" "}
            <span className="block text-blue-500">interactive vocabulary</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            Import technical blogs, documentation, or articles. Select words,
            translate them, save vocabulary, and review later for your real
            working life.
          </p>

          <div className="mt-7 flex justify-center">
            <Button className="gap-2 bg-emerald-500 px-6 hover:bg-emerald-600">
              Start building your vocabulary
              <ArrowRight className="size-4" />
            </Button>
          </div>
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

        <Suspense fallback={<div>Loading...</div>}>
        {recentDocs.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-muted-foreground">
            No documents yet. Create your first test document above.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recentDocs.map((doc) => (
              <a
                key={doc.id}
                href={`/docs/${doc.id}`}
                className="rounded-xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <h3 className="line-clamp-2 text-sm font-semibold">
                  {doc.title}
                </h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  {doc.siteName ?? new URL(doc.sourceUrl).hostname}
                </p>
              </a>
            ))}
          </div>
        )}
      </Suspense>
      </section>

      </main>
    </div>
  );
}