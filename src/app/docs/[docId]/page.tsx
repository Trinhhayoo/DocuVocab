import { notFound } from "next/navigation";

import { getDocById } from "@/app/docs/controller/doc.controller";
import { DocLearningWorkspace } from "@/components/docs/doc-learning-workspace";

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
    <>
      <section className="mx-auto max-w-7xl px-4 pt-8">
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
      </section>
      <DocLearningWorkspace
        docId={doc.id}
        htmlContent={doc.content?.htmlContent ?? ""}
        vocabularies={doc.vocabularies.map((vocab) => ({
          id: vocab.id,
          word: vocab.word,
          meaning: vocab.meaning,
          note: vocab.note,
          originalSentence: vocab.originalSentence,
          exampleSentence: vocab.exampleSentence,
          status: vocab.status,
        }))}
      />
    </>
  );
}