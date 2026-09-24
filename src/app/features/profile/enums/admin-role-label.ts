/** Nest Role.name is a code. The locked mock shows Arabic for the center admin. */
export function adminRoleFactLabel(roleName: string | null | undefined): string {
  const code = roleName?.trim();
  if (!code) {
    return '—';
  }
  if (code === 'ADMIN') {
    return 'مدير مركز';
  }
  if (code === 'SYSTEM_ADMIN') {
    return 'مدير النظام';
  }
  if (code === 'TEACHER') {
    return 'معلّم';
  }
  if (code === 'STUDENT') {
    return 'طالب';
  }
  return code;
}

/** Page-head phrase. ADMIN matches the mock «مدير المركز · {center}». */
export function adminRoleHeadLabel(roleName: string | null | undefined): string {
  if (roleName?.trim() === 'ADMIN') {
    return 'مدير المركز';
  }
  return adminRoleFactLabel(roleName);
}
