import type { Feedback as PrismaFeedback } from "@/generated/prisma/client";

import Feedback from "../../domain/entity/feedback.entity";
import type { FeedbackDto } from "./feedback.dto";

export default class FeedbackMapper {
  static toEntity(record: PrismaFeedback): Feedback {
    return new Feedback({
      id: record.id,
      userId: record.userId,
      name: record.name,
      email: record.email,
      category: record.category,
      message: record.message,
      pageUrl: record.pageUrl,
      createdAt: record.createdAt,
    });
  }

  static toDto(entity: Feedback): FeedbackDto {
    return {
      id: entity.id,
      userId: entity.userId,
      name: entity.name,
      email: entity.email,
      category: entity.category,
      message: entity.message,
      pageUrl: entity.pageUrl,
      createdAt: entity.createdAt.toISOString(),
    };
  }
}