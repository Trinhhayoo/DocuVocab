"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getDocs } from "@/app/docs/view/client/doc-api";
import { DocParams } from "@/feature/core/doc/domain/entity/doc.entity";

export function DocList({ initialDocs = [] }: { initialDocs: DocParams[] }) {
  const { data: docsData = { docs: [] }, isLoading } = useQuery({
    queryKey: ["recent-docs"],
    queryFn: getDocs,
    initialData: { docs: initialDocs },
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  if (isLoading) {
    return <div role="status" aria-live="polite">Loading...</div>;
  }

  if (docsData.docs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-muted-foreground">
        No documents yet. Create your first test document above.
      </div>
    );
  }

  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {docsData.docs.map((doc) => (
        <li key={doc.id}>
          <Link
            href={`/docs/${doc.id}`}
            className="block rounded-xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <h3 className="line-clamp-2 text-sm font-semibold">{doc.title}</h3>
            <p className="mt-2 text-xs text-muted-foreground">
              {doc.siteName ?? new URL(doc.sourceUrl).hostname}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}