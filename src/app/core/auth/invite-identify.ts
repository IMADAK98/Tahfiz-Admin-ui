/** sessionStorage: this tab already chose «التسجيل كطالب جديد» for this invite token. */
const NEW_STUDENT_TOKEN_KEY = 'tahfiz.invite.newStudentToken';

/** Router navigation state set by identify → signup. Value is the invite token. */
export const INVITE_IDENTIFIED_STATE = 'inviteIdentified';

export function allowSignupFromIdentify(token: string): void {
  const trimmed = token.trim();
  if (!trimmed) {
    return;
  }
  try {
    sessionStorage.setItem(NEW_STUDENT_TOKEN_KEY, trimmed);
  } catch {
    // ponytail: private mode can block storage; navigation state still covers this click.
  }
}

export function readSignupIdentifyToken(): string | null {
  try {
    const value = sessionStorage.getItem(NEW_STUDENT_TOKEN_KEY);
    return value?.trim() ? value : null;
  } catch {
    return null;
  }
}

/** True when `/signup/student` has an invite token and this visit did not come from identify. */
export function inviteTokenNeedsIdentifyGate(
  token: string,
  allowedToken: string | null,
  navigationToken: unknown,
): boolean {
  const trimmed = token.trim();
  if (!trimmed) {
    return false;
  }
  if (navigationToken === trimmed) {
    return false;
  }
  return allowedToken !== trimmed;
}
