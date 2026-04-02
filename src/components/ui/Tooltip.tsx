"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FocusEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cx } from "@/lib/helpers";

type TooltipProps = {
  content: string;
  children: ReactNode;
  className?: string;
};

type TooltipPlacement = "top" | "bottom";

const TOOLTIP_OFFSET = 10;
const VIEWPORT_PADDING = 8;
const emptySubscribe = () => () => {};

export function Tooltip({ content, children, className }: TooltipProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
    placement: TooltipPlacement;
  } | null>(null);

  const updatePosition = () => {
    if (!triggerRef.current) {
      return;
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current?.getBoundingClientRect();

    if (!tooltipRect) {
      setPosition({
        left: triggerRect.left + triggerRect.width / 2,
        top: triggerRect.bottom + TOOLTIP_OFFSET,
        placement: "bottom",
      });
      return;
    }

    const centeredLeft = triggerRect.left + triggerRect.width / 2;
    const left = Math.min(
      Math.max(centeredLeft, VIEWPORT_PADDING + tooltipRect.width / 2),
      window.innerWidth - VIEWPORT_PADDING - tooltipRect.width / 2,
    );
    const bottomTop = triggerRect.bottom + TOOLTIP_OFFSET;
    const topTop = triggerRect.top - tooltipRect.height - TOOLTIP_OFFSET;
    const shouldPlaceOnTop =
      bottomTop + tooltipRect.height > window.innerHeight - VIEWPORT_PADDING &&
      topTop >= VIEWPORT_PADDING;

    setPosition({
      left,
      top: shouldPlaceOnTop ? topTop : bottomTop,
      placement: shouldPlaceOnTop ? "top" : "bottom",
    });
  };

  useEffect(() => {
    if (!isMounted || !isOpen) {
      return;
    }

    const frameId = window.requestAnimationFrame(updatePosition);

    const syncPosition = () => {
      updatePosition();
    };

    window.addEventListener("resize", syncPosition);
    window.addEventListener("scroll", syncPosition, true);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", syncPosition);
      window.removeEventListener("scroll", syncPosition, true);
    };
  }, [isMounted, isOpen]);

  const handleBlur = (event: FocusEvent<HTMLSpanElement>) => {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) {
      return;
    }

    setIsOpen(false);
  };

  return (
    <span
      ref={triggerRef}
      className={cx("relative inline-flex", className)}
      onBlur={handleBlur}
      onFocus={() => setIsOpen(true)}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {children}
      {isMounted && isOpen
        ? createPortal(
          <span
            ref={tooltipRef}
            aria-hidden="true"
            className={cx(
              "pointer-events-none fixed z-[80] whitespace-nowrap rounded-md border border-slate-700/80 bg-slate-900 px-2 py-1 text-[11px] font-medium text-slate-200 shadow-[0_10px_30px_rgba(2,6,23,0.45)]",
              position?.placement === "top" ? "origin-bottom" : "origin-top",
            )}
            role="tooltip"
            style={{
              left: position?.left ?? 0,
              top: position?.top ?? 0,
              transform: "translateX(-50%)",
              visibility: position ? "visible" : "hidden",
            }}
          >
            {content}
          </span>,
          document.body,
        )
        : null}
    </span>
  );
}
