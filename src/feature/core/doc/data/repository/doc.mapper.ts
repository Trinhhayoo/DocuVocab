import Doc from "../../domain/entity/doc.entity";
import DocContent from "../../domain/entity/doc-content.entity";
import type { Doc as PrismaDoc, DocContent as PrismaDocContent } from "@/generated/prisma/client";

export default class DocMapper {
  static toEntity(record: PrismaDoc): Doc {
    return new Doc({
      id: record.id,
      userId: record.userId,
      title: record.title,
      sourceUrl: record.sourceUrl,
      siteName: record.siteName,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  static toEntityList(records: PrismaDoc[]): Doc[] {
    return records.map(DocMapper.toEntity);
  }

  static toContentEntity(record: PrismaDocContent): DocContent {
    return new DocContent({
      docId: record.docId,
      htmlContent: record.htmlContent,
      textContent: record.textContent,
      wordCount: record.wordCount,
    });
  }
}
