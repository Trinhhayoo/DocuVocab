import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { QueryProvider } from "@/components/providers/query-provider";

import "./globals.css";
import { AppHeader } from "@/components/layout/app-header";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AuthProvider } from "@/components/providers/auth-provider";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Document Note",
  description: "Explore your saved documents and continue learning vocabulary.",
  icons: {
    icon: "/logo.svg",
  }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createSupabaseServerClient();

  const {
  data: { user },
  } = await supabase.auth.getUser();
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">

      <AuthProvider initialUser={user}>
        <QueryProvider>
          <AppHeader />
          <main className="flex-1">{children}</main>
        </QueryProvider>
      </AuthProvider>
      </body>
    </html>
  );
}
