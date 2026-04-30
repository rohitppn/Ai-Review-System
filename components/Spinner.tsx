/**
 * Inline circle spinner. Inherits color from `currentColor` so it picks up
 * the parent button's text color automatically. Size via `className`
 * (Tailwind h-/w-) — defaults to h-4 w-4.
 */
export default function Spinner({
  className = "h-4 w-4",
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      role="img"
      aria-label={label}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
