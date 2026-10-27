import Image from "next/image";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MockDoc } from "@/app/docs/view/server/mock-docs";

type DocCardProps = {
  doc: MockDoc;
};

export function DocCard({ doc }: DocCardProps) {
  return (
    <Link href={`/docs/${doc.id}`} className="group block">
      <Card className="overflow-hidden rounded-xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <div className="relative aspect-video overflow-hidden bg-muted">
          <Image
            src={doc.imageUrl}
            alt={doc.title}
            width={640}
            height={360}
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="aspect-video w-full object-cover transition duration-300 group-hover:scale-105"
          />

          <Badge className="absolute left-3 top-3 bg-white text-red-600 hover:bg-white">
            DOC
          </Badge>

          <div className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-1 text-xs font-medium text-white">
            {doc.readTime}
          </div>
        </div>

        <CardContent className="space-y-2 p-4">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
            {doc.title}
          </h3>

          <p className="text-xs text-muted-foreground">{doc.source}</p>
        </CardContent>
      </Card>
    </Link>
  );
}