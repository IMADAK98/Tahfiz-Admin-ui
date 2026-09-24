/** GET /center/{id} — only the fields the center profile page is allowed to show. */
export interface CenterApiRecord {
  name?: string | null;
  address?: string | null;
  isActive?: boolean | null;
}
