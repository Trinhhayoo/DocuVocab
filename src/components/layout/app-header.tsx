import Link from "next/link";
import { BookOpenText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <div className="flex size-7 items-center justify-center rounded-md bg-orange-500 text-white">
            <BookOpenText className="size-4" />
          </div>
          <span>DocuVocab</span>
        </Link>

        <form className="hidden w-full max-w-xl items-center gap-2 md:flex">
          <Input
            placeholder="Paste documentation or blog URL..."
            className="h-10"
          />
          <Button type="submit" className="h-10 bg-slate-700 hover:bg-slate-800">
            Import Doc
          </Button>
        </form>

        <nav className="flex items-center gap-3 text-sm">
          <Button size="sm" variant="default">
            Login
          </Button>

          <Link href="#" className="hidden text-emerald-600 hover:underline sm:block">
            Join waitlist
          </Link>

          <Link href="#" className="hidden text-muted-foreground hover:text-foreground sm:block">
            Feedback
          </Link>
        </nav>
      </div>
    </header>
  );
}