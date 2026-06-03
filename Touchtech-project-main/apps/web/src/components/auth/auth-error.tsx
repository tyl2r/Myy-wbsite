/** Inline auth error banner with assertive announcement for screen readers. */
export function AuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
    >
      {message}
    </div>
  );
}
