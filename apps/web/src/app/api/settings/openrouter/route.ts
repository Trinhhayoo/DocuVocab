import { nextApiUnauthorized } from "@/feature/common/data/http/next-api-response";
import {
  handleConnectOpenRouter,
  handleDisconnectOpenRouter,
} from "@/feature/core/settings/data/http/openrouter-connect.handler";
import { requireCurrentUser } from "@/feature/core/user/domain/usecase/current-user";

/** Finishes "Connect OpenRouter" from the web callback page. */
export async function POST(request: Request) {
  const user = await requireCurrentUser();

  if (!user) {
    return nextApiUnauthorized();
  }

  return handleConnectOpenRouter(request, user.id);
}

export async function DELETE() {
  const user = await requireCurrentUser();

  if (!user) {
    return nextApiUnauthorized();
  }

  return handleDisconnectOpenRouter(user.id);
}
