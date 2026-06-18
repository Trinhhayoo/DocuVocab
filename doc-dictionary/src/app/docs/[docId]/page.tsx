import { notFound } from "next/navigation";

import { getDocById } from "@/features/docs/queries";

type DocPageProps = {
  params: Promise<{
    docId: string;
  }>;
};

export default async function DocPage({ params }: DocPageProps) {
  const { docId } = await params;

  const doc = await getDocById(docId);

  if (!doc) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <p className="text-sm text-muted-foreground">
          {doc.siteName ?? new URL(doc.sourceUrl).hostname}
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          {doc.title}
        </h1>

        <a
          href={doc.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-sm text-blue-600 hover:underline"
        >
          Open original source
        </a>
      </div>

      <article className="prose prose-slate max-w-none rounded-xl border bg-white p-6 shadow-sm">
        {doc.content?.htmlContent ? (
           <div
            className="doc-reader-content"
            dangerouslySetInnerHTML={{
                __html: doc.content.htmlContent,
            }}
            />
        ) : doc.content?.textContent ? (
            <p className="whitespace-pre-wrap text-sm leading-7">
            {doc.content.textContent}
            </p>
        ) : (
            <p className="text-sm text-muted-foreground">
            No content yet.
            </p>
        )}
      </article>
    </main>
  );
}