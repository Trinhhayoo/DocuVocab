export type MockDoc = {
  id: string;
  title: string;
  source: string;
  imageUrl: string;
  readTime: string;
};

export const mockDocs: MockDoc[] = [
  {
    id: "1",
    title: "Getting Started with Next.js App Router",
    source: "nextjs.org",
    imageUrl:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200&auto=format&fit=crop",
    readTime: "12 min",
  },
  {
    id: "2",
    title: "Understanding React Server Components",
    source: "react.dev",
    imageUrl:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1200&auto=format&fit=crop",
    readTime: "18 min",
  },
  {
    id: "3",
    title: "TypeScript Handbook for JavaScript Developers",
    source: "typescriptlang.org",
    imageUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop",
    readTime: "25 min",
  },
  {
    id: "4",
    title: "Prisma ORM: Working with PostgreSQL",
    source: "prisma.io",
    imageUrl:
      "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=1200&auto=format&fit=crop",
    readTime: "15 min",
  },
  {
    id: "5",
    title: "Modern CSS Layout with Tailwind CSS",
    source: "tailwindcss.com",
    imageUrl:
      "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?q=80&w=1200&auto=format&fit=crop",
    readTime: "10 min",
  },
  {
    id: "6",
    title: "Building Forms with TanStack Form",
    source: "tanstack.com",
    imageUrl:
      "https://images.unsplash.com/photo-1551650975-87deedd944c3?q=80&w=1200&auto=format&fit=crop",
    readTime: "14 min",
  },
];