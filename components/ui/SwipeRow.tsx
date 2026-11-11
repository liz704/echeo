"use client";

import { PointerEvent as ReactPointerEvent, ReactNode, useRef, useState } from "react";
import { Trash2 } from "lucide-react";

// Distance (px) the card must travel, left or right, to trigger the action.
const ACTIVATE_PX = 96;
// The card never moves further than this.
const MAX_PX = 140;

interface SwipeRowProps {
  children: ReactNode;
  /** Called when the card is released past the threshold, in either direction. */
  onSwipe: () => void;
  /** Text shown on the red background while swiping (e.g. "Delete"). */
  label: string;
  disabled?: boolean;
}

/**
 * Swipe left or right to trigger an action (delete). The card always springs back;
 * the parent is expected to open a confirmation dialog in `onSwipe`.
 * Elements marked with `data-no-swipe` (switches, buttons) never start a swipe.
 */
export function SwipeRow({ children, onSwipe, label, disabled = false }: SwipeRowProps) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const moved = useRef(false);
  const suppressClick = useRef(false);

  function handleDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (disabled) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if ((e.target as HTMLElement).closest("[data-no-swipe]")) return;
    start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    moved.current = false;
  }

  function handleMove(e: ReactPointerEvent<HTMLDivElement>) {
    const s = start.current;
    if (!s || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;

    if (!moved.current) {
      // Vertical gesture: let the page scroll.
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
        start.current = null;
        return;
      }
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
      moved.current = true;
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    setOffset(Math.max(-MAX_PX, Math.min(MAX_PX, dx)));
  }

  function finish(e: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) {
    const s = start.current;
    if (!s || s.id !== e.pointerId) return;
    start.current = null;
    if (!moved.current) return;

    // A drag must not be interpreted as a tap on the card.
    suppressClick.current = true;
    window.setTimeout(() => {
      suppressClick.current = false;
    }, 60);

    const shouldTrigger = !cancelled && Math.abs(offset) >= ACTIVATE_PX;
    setDragging(false);
    setOffset(0);
    if (shouldTrigger) onSwipe();
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div
        aria-hidden
        className={`absolute inset-0 flex items-center bg-red-600 px-6 text-white ${
          offset > 0 ? "justify-start" : "justify-end"
        }`}
        style={{ opacity: offset === 0 ? 0 : Math.min(1, Math.abs(offset) / 48) }}
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Trash2 className="h-5 w-5" />
          {label}
        </span>
      </div>

      <div
        className="relative select-none"
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging ? "none" : "transform 200ms ease-out",
          touchAction: "pan-y",
        }}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={(e) => finish(e, false)}
        onPointerCancel={(e) => finish(e, true)}
        onClickCapture={(e) => {
          if (suppressClick.current) {
            e.stopPropagation();
            e.preventDefault();
            suppressClick.current = false;
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
