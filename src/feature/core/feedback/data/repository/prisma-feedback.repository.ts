import { prisma } from "@/bootstrap/configs/server/prisma.config";
import { failure, success, type Result } from "@/feature/common/data/result";
import ServerFailure from "@/feature/common/failures/server.failure";

import Feedback from "../../domain/entity/feedback.entity";
import type FeedbackRepository from "../../domain/i-repo/feedback.repository.interface";
import type { CreateFeedbackInput } from "../../domain/params/feedback.param";
import FeedbackMapper from "./feedback.mapper";

export default class PrismaFeedbackRepository implements FeedbackRepository {
  async create(
    userId: string | null,
    input: CreateFeedbackInput,
  ): Promise<Result<Feedback>> {
    try {
      const record = await prisma.feedback.create({
        data: {
          userId,
          name: input.name?.trim() ?? null,
          email: input.email?.trim() ?? null,
          category: input.category,
          message: input.message.trim(),
          pageUrl: input.pageUrl ?? null,
        },
      });

      return success(FeedbackMapper.toEntity(record));
    } catch (error) {
      return failure(new ServerFailure({ error }));
    }
  }
}