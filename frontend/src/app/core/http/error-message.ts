const FRIENDLY_MESSAGES: Record<string, string> = {
  CANDIDATE_PROFILE_NOT_FOUND: 'No candidate profile found. Create one to get started.',
  PROFILE_NOT_FOUND: 'No candidate profile found. Create one to get started.',
  PROFILE_ALREADY_EXISTS: 'A candidate profile already exists for this account.',
  PROFILE_INCOMPLETE: 'Your profile needs at least 20% completion before starting an interview.',
  INTERVIEW_PROFILE_NOT_FOUND: 'Complete your candidate profile before starting an interview.',
  CV_ANALYSIS_FAILED: 'We could not analyze your CV. Please try uploading it again.',
};

export function extractRawMessage(err: unknown): string | null {
  if (typeof err === 'object' && err !== null && 'error' in err) {
    const httpErr = err as { error?: { message?: string } };
    return httpErr.error?.message ?? null;
  }
  return null;
}

export function toFriendlyError(err: unknown): string {
  const raw = extractRawMessage(err);
  if (!raw) return 'Something went wrong. Please try again.';
  if (FRIENDLY_MESSAGES[raw]) return FRIENDLY_MESSAGES[raw];
  if (/^[A-Z][A-Z0-9_]*$/.test(raw)) return 'Something went wrong. Please try again.';
  return raw;
}
