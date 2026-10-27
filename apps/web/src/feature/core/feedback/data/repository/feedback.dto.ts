export type FeedbackDto = {
  id: string;
  userId: string | null;
  name: string | null;
  email: string | null;
  category: string;
  message: string;
  pageUrl: string | null;
  createdAt: string;
};