export interface JwtPayload {
  sub: string;
  idx: number;
  nickname?: string;
  iat: number;
  exp: number;
}
