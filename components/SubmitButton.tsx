"use client";

import { useFormStatus } from "react-dom";
import Spinner from "./Spinner";

/**
 * Submit button that auto-shows a spinner + disables itself while its
 * parent <form action={serverAction}> is pending. Drop into any server-action
 * form to get loading feedback for free.
 */
export default function SubmitButton({
  children,
  pendingLabel,
  className = "",
  spinnerClassName = "h-4 w-4",
}: {
  children: React.ReactNode;
  pendingLabel?: React.ReactNode;
  className?: string;
  spinnerClassName?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${className} disabled:opacity-70 disabled:cursor-not-allowed`}
    >
      <span className="inline-flex items-center justify-center gap-2">
        {pending && <Spinner className={spinnerClassName} />}
        {pending ? pendingLabel ?? children : children}
      </span>
    </button>
  );
}
