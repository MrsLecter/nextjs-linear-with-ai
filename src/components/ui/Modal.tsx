"use client";

import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { cx } from "@/lib/helpers";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  closeDisabled?: boolean;
};

let activeBodyScrollLocks = 0;
let bodyOriginalOverflow: string | null = null;

function lockBodyScroll() {
  if (typeof document === "undefined") {
    return;
  }

  if (activeBodyScrollLocks === 0) {
    bodyOriginalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }

  activeBodyScrollLocks += 1;
}

function unlockBodyScroll() {
  if (typeof document === "undefined" || activeBodyScrollLocks === 0) {
    return;
  }

  activeBodyScrollLocks -= 1;

  if (activeBodyScrollLocks === 0) {
    document.body.style.overflow = bodyOriginalOverflow ?? "";
    bodyOriginalOverflow = null;
  }
}

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      [
        "button:not([disabled])",
        "[href]",
        "input:not([disabled])",
        "select:not([disabled])",
        "textarea:not([disabled])",
        "[tabindex]:not([tabindex='-1'])",
      ].join(", "),
    ),
  );
}

function getInitialFocusElement(container: HTMLElement) {
  const autofocusElement = container.querySelector<HTMLElement>("[autofocus]");

  if (autofocusElement) {
    return autofocusElement;
  }

  const formFieldElement = container.querySelector<HTMLElement>(
    "input:not([disabled]), select:not([disabled]), textarea:not([disabled])",
  );

  if (formFieldElement) {
    return formFieldElement;
  }

  return getFocusableElements(container)[0] ?? container;
}

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  className,
  closeDisabled = false,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const dialogElement = dialogRef.current;
    const previousActiveElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    lockBodyScroll();

    if (dialogElement) {
      getInitialFocusElement(dialogElement).focus();
    }

    return () => {
      unlockBodyScroll();
      previousActiveElement?.focus();
    };
  }, [open]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();

      if (!closeDisabled) {
        onClose();
      }

      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const dialogElement = dialogRef.current;

    if (!dialogElement) {
      return;
    }

    const focusableElements = getFocusableElements(dialogElement);

    if (focusableElements.length === 0) {
      event.preventDefault();
      dialogElement.focus();
      return;
    }

    const firstFocusableElement = focusableElements[0];
    const lastFocusableElement = focusableElements[focusableElements.length - 1];
    const activeElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    if (event.shiftKey && activeElement === firstFocusableElement) {
      event.preventDefault();
      lastFocusableElement.focus();
      return;
    }

    if (!event.shiftKey && activeElement === lastFocusableElement) {
      event.preventDefault();
      firstFocusableElement.focus();
    }
  };

  const handleClose = () => {
    if (closeDisabled) {
      return;
    }

    onClose();
  };

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-[1px] sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
      onKeyDown={handleKeyDown}
      role="presentation"
    >
      <div
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className={cx(
          "relative z-10 flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl shadow-black/40 sm:max-h-[calc(100vh-3rem)]",
          className,
        )}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="shrink-0 border-b border-slate-800 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-slate-50" id={titleId}>
                {title}
              </h2>
              {description ? (
                <p className="text-sm text-slate-400" id={descriptionId}>
                  {description}
                </p>
              ) : null}
            </div>
            <button
              aria-label="Close modal"
              className="inline-flex size-8 aspect-square items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition-colors duration-150 hover:cursor-pointer hover:border-slate-700 hover:bg-slate-900 hover:text-slate-100 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
              disabled={closeDisabled}
              onClick={handleClose}
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
        {children ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            {children}
          </div>
        ) : null}
        {footer ? (
          <div className="shrink-0 border-t border-slate-800 px-5 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
