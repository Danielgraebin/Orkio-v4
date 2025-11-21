export interface AuthLoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  email: string;
}

export interface AuthTenant {
  id: number;
  name: string;
}

export type UserRole = "OWNER" | "ADMIN" | "USER";

export interface AuthLoginResponse {
  access_token: string;
  token_type: "bearer";
  user_id: number;
  tenant_id: number;
  role: UserRole;
  email: string;
}

