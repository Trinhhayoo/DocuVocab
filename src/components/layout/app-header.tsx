"use client";
import Link from "next/link";
import { BookOpenText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "../providers/auth-provider";
import { signInWithGoogle } from "@/lib/supabase/signInWithGoogle";
import signOutUsecase from "@/feature/core/user/domain/usecase/sign-out.usecase";

export function AppHeader() {
  const { user } = useAuth();

  const handleClick = async () => {
    if (user) {
      await signOutUsecase();
      window.location.href = "/";
    } else {
      await signInWithGoogle();
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <div className="flex size-7 items-center justify-center rounded-md bg-orange-500 text-white">
            <BookOpenText className="size-4" />
          </div>
          <span>DocuVocab</span>
        </Link>

       

        <nav className="flex items-center gap-3 text-sm">
          <Button size="sm" variant="default" onClick={handleClick}>
            {user != null ? 'Logout' : 'Login'}
          </Button>

          <Link href="#" className="hidden text-muted-foreground hover:text-foreground sm:block">
            Feedback
          </Link>
        </nav>
      </div>
    </header>
  );
}