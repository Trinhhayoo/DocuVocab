import signOutUsecase from "@/feature/core/user/domain/usecase/sign-out.usecase";
import { redirect } from "next/navigation";

export async function signOutAction() {
    await signOutUsecase();
    redirect("/");
}