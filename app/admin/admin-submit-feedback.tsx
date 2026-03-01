"use client";

import { useEffect, useState } from "react";

type SubmitEventWithTarget = SubmitEvent & {
  target: EventTarget & HTMLFormElement;
};

const storageKey = "admin-submit-success-message";
const genericErrorLabel = "Operation failed. Please retry or refresh the page.";

function sanitizeErrorMessage(input: string) {
  const normalized = input.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return genericErrorLabel;
  }

  const likelySensitive = /(stack|token|secret|prisma|database|sql|cookie|session)/i.test(normalized);
  if (likelySensitive) {
    return genericErrorLabel;
  }

  if (normalized.length > 180) {
    return `${normalized.slice(0, 177)}...`;
  }

  return normalized;
}

function getPendingLabel(buttonLabel: string) {
  if (/add|create/i.test(buttonLabel)) return "Adding content...";
  if (/delete|remove/i.test(buttonLabel)) return "Deleting content...";
  return "Updating content...";
}

function getSuccessLabel(buttonLabel: string) {
  if (/add|create/i.test(buttonLabel)) return "Content added successfully.";
  if (/delete|remove/i.test(buttonLabel)) return "Content deleted successfully.";
  return "Content updated successfully.";
}

export function AdminSubmitFeedback() {
  const [pending, setPending] = useState(false);
  const [pendingText, setPendingText] = useState("Updating content...");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successText, setSuccessText] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    const previousMessage = sessionStorage.getItem(storageKey);
    if (previousMessage) {
      sessionStorage.removeItem(storageKey);
    }
    return previousMessage;
  });

  useEffect(() => {
    if (!successText) {
      return undefined;
    }

    const toastTimer = window.setTimeout(() => {
      setSuccessText(null);
    }, 3200);

    return () => window.clearTimeout(toastTimer);
  }, [successText]);

  useEffect(() => {
    const handleSubmit = (event: Event) => {
      const submitEvent = event as SubmitEventWithTarget;
      const form = submitEvent.target;

      if (!form.closest("[data-admin-root]")) {
        return;
      }

      const submitter = submitEvent.submitter as HTMLElement | null;
      const label = submitter?.textContent?.trim() || "Update";

      const loadingLabel = getPendingLabel(label);
      setPendingText(loadingLabel);
      setPending(true);

      sessionStorage.setItem(storageKey, getSuccessLabel(label));

      window.setTimeout(() => {
        setPending(false);
      }, 7000);
    };

    const handleRuntimeError = (event: ErrorEvent) => {
      const nextError = sanitizeErrorMessage(event.message ?? "");
      setPending(false);
      setErrorText(nextError);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const nextError = sanitizeErrorMessage(reason instanceof Error ? reason.message : `${reason ?? ""}`);
      setPending(false);
      setErrorText(nextError);
    };

    document.addEventListener("submit", handleSubmit, true);
    window.addEventListener("error", handleRuntimeError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      document.removeEventListener("submit", handleSubmit, true);
      window.removeEventListener("error", handleRuntimeError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    if (!errorText) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setErrorText(null);
    }, 7000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [errorText]);

  return (
    <>
      {pending && (
        <div className="admin-pending-overlay" role="status" aria-live="polite" aria-busy="true">
          <div className="admin-pending-modal">
            <div className="admin-spinner" />
            <p>{pendingText}</p>
          </div>
        </div>
      )}

      {successText && (
        <div className="admin-success-toast" role="status" aria-live="polite">
          {successText}
        </div>
      )}

      {errorText && (
        <div className="admin-error-box" role="alert" aria-live="assertive">
          <span className="admin-error-icon" aria-hidden="true">
            ⚠
          </span>
          <div>
            <p className="admin-error-title">Action failed</p>
            <p className="admin-error-text">{errorText}</p>
          </div>
        </div>
      )}
    </>
  );
}
