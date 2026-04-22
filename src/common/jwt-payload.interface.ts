export interface JwtPayload {
  sub: string;
  idx: number;
  iat: number;
  exp: number;
}
