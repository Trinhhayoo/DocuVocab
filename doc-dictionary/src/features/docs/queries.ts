import { prisma } from "@/lib/prisma";
import { MOCK_USER_ID } from "@/lib/constants";

export async function getRecentDocs() {
  return prisma.doc.findMany({
    where: {
      userId: MOCK_USER_ID,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 8,
    select: {
      id: true,
      title: true,
      sourceUrl: true,
      siteName: true,
      createdAt: true,
    },
  });
}

export async function getDocById(docId: string) {
  return prisma.doc.findFirst({
    where: {
      id: docId,
      userId: MOCK_USER_ID,
    },
    include: {
      content: true,
      vocabularies: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}