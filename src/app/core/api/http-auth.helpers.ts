import { HttpHeaders } from '@angular/common/http';

export function bearerHeaders(accessToken: string | null): HttpHeaders | undefined {
  if (!accessToken) {
    return undefined;
  }

  return new HttpHeaders({ Authorization: `Bearer ${accessToken}` });
}
