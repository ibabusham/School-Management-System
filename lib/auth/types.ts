export type UserRole = "ADMIN" | "TEACHER" | "STUDENT";

export type AuthUser = {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  accountStatus: boolean;
  createdAt: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
