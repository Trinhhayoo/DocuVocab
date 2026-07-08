import { nextApiFailure, nextApiSuccess } from "@/feature/common/data/http/next-api-response";
import PrismaDocRepository from "@/feature/core/doc/data/repository/prisma-doc.repository";
import getRecentDocsUsecase from "@/feature/core/doc/domain/usecase/get-recent-docs.usecase";
import requireCurrentUserUsecase from "@/feature/core/user/domain/usecase/require-current-user.usecase";

const docRepo = new PrismaDocRepository();

export async function GET(): Promise<Response> {
    const user = await requireCurrentUserUsecase();
    const result = await getRecentDocsUsecase(docRepo, user.id);

    if (!result.success) {
        return nextApiFailure(result.failure, 500);
    }

    return nextApiSuccess(
        { docs: result.data.map((doc) => doc.toPlainObject()) },
        "Recent documents retrieved successfully",
    );
}