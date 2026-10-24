export type AccessTokenType = 'access' | 'admin_access';

export interface AccessTokenClaims {
  sub: string;
  email: string;
  typ: AccessTokenType;
  corporateId?: string | null;
  roleCode?: string;
  role?: string;
  displayName?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  typ: AccessTokenType;
  corporateId: string | null;
  roleCode: string | null;
  role: string | null;
  displayName: string | null;
}

export interface IssueAccessTokenInput {
  subject: string;
  email: string;
  typ: AccessTokenType;
  corporateId?: string | null;
  roleCode?: string;
  role?: string;
  displayName?: string;
}

export interface IssuedAccessToken {
  accessToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}
