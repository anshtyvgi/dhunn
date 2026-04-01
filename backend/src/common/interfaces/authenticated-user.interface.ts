export interface AuthenticatedUser {
  clerkUserId: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  imageUrl?: string | null;
}
