import { prisma } from "@/bootstrap/configs/server/prisma.config";
import { Result, success, failure } from "@/feature/common/data/result";
import ServerFailure from "@/feature/common/failures/server.failure";
import Doc from "../../domain/entity/doc.entity";
import type DocRepository from "../../domain/i-repo/doc.repository.interface";
import type { DocWithContent } from "../../domain/i-repo/doc.repository.interface";
import DocMapper from "./doc.mapper";

export default class PrismaDocRepository implements DocRepository {
  async getRecentDocs(
    userId: string,
    limit: number = 8,
  ): Promise<Result<Doc[]>> {
    try {
      const records = await prisma.doc.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      return success(DocMapper.toEntityList(records));
    } catch (error) {
      return failure(new ServerFailure({ error }));
    }
  }

  async getDocById(
    userId: string,
    docId: string,
  ): Promise<Result<DocWithContent | null>> {
    try {
      const record = await prisma.doc.findFirst({
        where: { id: docId, userId },
        include: {
          content: true,
          vocabularies: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              word: true,
              meaning: true,
              note: true,
              originalSentence: true,
              exampleSentence: true,
              status: true,
            },
          },
        },
      });

      if (!record) {
        return success(null);
      }

      return success({
        doc: DocMapper.toEntity(record),
        content: record.content ? DocMapper.toContentEntity(record.content) : null,
        vocabularies: record.vocabularies,
      });
    } catch (error) {
      return failure(new ServerFailure({ error }));
    }
  }

  async createDocFromImport(
    userId: string,
    data: {
      title: string;
      sourceUrl: string;
      siteName: string | null;
      htmlContent: string;
      textContent: string;
      wordCount: number;
    },
  ): Promise<Result<Doc>> {
    try {
      const existingDoc = await prisma.doc.findFirst({
        where: { userId, sourceUrl: data.sourceUrl },
        select: { id: true },
      });

      if (existingDoc) {
        await prisma.doc.delete({ where: { id: existingDoc.id } });
      }

      const record = await prisma.doc.create({
        data: {
          userId,
          title: data.title,
          sourceUrl: data.sourceUrl,
          siteName: data.siteName,
          content: {
            create: {
              htmlContent: data.htmlContent,
              textContent: data.textContent,
              wordCount: data.wordCount,
            },
          },
        },
      });

      return success(DocMapper.toEntity(record));
    } catch (error) {
      return failure(new ServerFailure({ error }));
    }
  }

  async createManualDoc(
    userId: string,
    data: { title: string; sourceUrl: string },
  ): Promise<Result<Doc>> {
    try {
      const record = await prisma.doc.create({
        data: {
          userId,
          title: data.title,
          sourceUrl: data.sourceUrl,
          siteName: new URL(data.sourceUrl).hostname,
          content: {
            create: {
              htmlContent: "",
              textContent: "",
              wordCount: 0,
            },
          },
        },
      });

      return success(DocMapper.toEntity(record));
    } catch (error) {
      return failure(new ServerFailure({ error }));
    }
  }
}
