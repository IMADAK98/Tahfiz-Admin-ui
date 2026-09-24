/** GET /users/{id} — fields the admin profile page reads. Secrets stay off this type. */
export interface UserApiRecord {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  nationality?: string | null;
  birthDate?: string | null;
  identificationNumber?: string | null;
  passportNumber?: string | null;
  isActive?: boolean | null;
  role?: { name?: string | null } | string | null;
  center?: { name?: string | null } | null;
}
