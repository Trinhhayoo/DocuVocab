// "use client";

// import type { ReactNode } from "react";
// import { X } from "lucide-react";

// import { Button } from "@/components/ui/button";
// import { cn } from "@/lib/utils";

// type VocabularyEditorModalProps = {
//   isOpen: boolean;
//   title: string;
//   description?: string;
//   anchorPosition?: { x: number; y: number } | null;
//   onClose: () => void;
//   children: ReactNode;
// };

// export function VocabularyEditorModal({
//   isOpen,
//   title,
//   description,
//   anchorPosition,
//   onClose,
//   children,
// }: VocabularyEditorModalProps) {
//   const viewportWidth = typeof window === "undefined" ? 0 : window.innerWidth;
//   const viewportHeight = typeof window === "undefined" ? 0 : window.innerHeight;

//   const positionStyle = anchorPosition
//     ? {
//         left: `${Math.min(
//           Math.max(anchorPosition.x, 24),
//           viewportWidth > 0 ? viewportWidth - 24 : anchorPosition.x
//         )}px`,
//         top: `${Math.min(
//           Math.max(anchorPosition.y + 12, 24),
//           viewportHeight > 0 ? viewportHeight - 24 : anchorPosition.y + 12
//         )}px`,
//         transform: "translate(-50%, 0)",
//       }
//     : undefined;

//   if (!isOpen) return null;

//   return (
//     <div
//       className={cn(
//         "pointer-events-none fixed z-[60] w-[min(92vw,32rem)] transition-all duration-200",
//         isOpen ? "pointer-events-auto opacity-100" : "opacity-0"
//       )}
//       style={positionStyle}
//     >
//       <div
//         className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-2xl"
//         role="dialog"
//         aria-modal="true"
//         aria-label={title}
//       >
//         <div className="flex items-start justify-between gap-4 border-b px-4 py-4 sm:px-6">
//           <div>
//             <h2 className="text-lg font-semibold">{title}</h2>
//             {description ? (
//               <p className="mt-1 text-sm text-muted-foreground">{description}</p>
//             ) : null}
//           </div>
//           <Button
//             type="button"
//             variant="ghost"
//             size="icon-sm"
//             onClick={onClose}
//             aria-label="Close vocabulary editor"
//           >
//             <X className="size-4" />
//           </Button>
//         </div>

//         <div className="px-4 py-4 sm:px-6">{children}</div>
//       </div>
//     </div>
//   );
// }
"use client";

import { type ReactNode, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnchorPosition } from "./doc-learning-workspace";

type VocabularyEditorModalProps = {
  isOpen: boolean;
  title: string;
  description?: string;
  anchorPosition?: AnchorPosition | null;
  onClose: () => void;
  children: ReactNode;
};

const VIEWPORT_PADDING = 16;
const ANCHOR_GAP = 16;
const DESKTOP_BREAKPOINT = 1024;

export function VocabularyEditorModal({
  isOpen,
  title,
  description,
  anchorPosition,
  onClose,
  children,
}: VocabularyEditorModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  const canUseDOM = typeof document !== "undefined";

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const VIEWPORT_PADDING = 16;
  const ANCHOR_GAP = 12;
  const DESKTOP_BREAKPOINT = 1024;

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    function positionModal() {
      const modal = modalRef.current;

      if (!modal) {
        return;
      }

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (viewportWidth < DESKTOP_BREAKPOINT || !anchorPosition) {
        modal.style.left = "";
        modal.style.top = "";
        modal.style.right = "";
        modal.style.transform = "";

        return;
      }

      const modalRect = modal.getBoundingClientRect();
      const modalWidth = modalRect.width;
      const modalHeight = modalRect.height;

      const spaceRight =
        viewportWidth - anchorPosition.right - VIEWPORT_PADDING;

      const spaceLeft = anchorPosition.left - VIEWPORT_PADDING;

      const spaceBelow =
        viewportHeight - anchorPosition.bottom - VIEWPORT_PADDING;

      const spaceAbove = anchorPosition.top - VIEWPORT_PADDING;

      let left: number;
      let top: number;

      /*
       * Choose the nearest usable side:
       * 1. Right of selection
       * 2. Left of selection
       * 3. Below selection
       * 4. Above selection
       * 5. Center as fallback
       */
      if (spaceRight >= modalWidth + ANCHOR_GAP) {
        left = anchorPosition.right + ANCHOR_GAP;
        top = anchorPosition.top;
      } else if (spaceLeft >= modalWidth + ANCHOR_GAP) {
        left = anchorPosition.left - modalWidth - ANCHOR_GAP;

        top = anchorPosition.top;
      } else if (spaceBelow >= modalHeight + ANCHOR_GAP) {
        left =
          anchorPosition.left +
          (anchorPosition.right - anchorPosition.left) / 2 -
          modalWidth / 2;

        top = anchorPosition.bottom + ANCHOR_GAP;
      } else if (spaceAbove >= modalHeight + ANCHOR_GAP) {
        left =
          anchorPosition.left +
          (anchorPosition.right - anchorPosition.left) / 2 -
          modalWidth / 2;

        top = anchorPosition.top - modalHeight - ANCHOR_GAP;
      } else {
        left = (viewportWidth - modalWidth) / 2;
        top = (viewportHeight - modalHeight) / 2;
      }

      left = Math.max(
        VIEWPORT_PADDING,
        Math.min(left, viewportWidth - modalWidth - VIEWPORT_PADDING),
      );

      top = Math.max(
        VIEWPORT_PADDING,
        Math.min(top, viewportHeight - modalHeight - VIEWPORT_PADDING),
      );

      modal.style.left = `${left}px`;
      modal.style.top = `${top}px`;
      modal.style.right = "auto";
      modal.style.transform = "none";
    }

    positionModal();

    window.addEventListener("resize", positionModal);
    window.addEventListener("scroll", positionModal, true);

    return () => {
      window.removeEventListener("resize", positionModal);
      window.removeEventListener("scroll", positionModal, true);
    };
  }, [isOpen, anchorPosition]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleScroll() {
      onClose();
    }

    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !canUseDOM) {
    return null;
  }

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 -translate-x-1/2 -translate-y-1/2 z-[9999] ",
        "flex items-center justify-center",
      )}
      style={{ left: "50%", top: "50%" }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vocabulary-editor-title"
        aria-describedby={
          description ? "vocabulary-editor-description" : undefined
        }
        className={cn(
          "flex max-h-[90dvh] w-full flex-col overflow-hidden",

          // Mobile
          "rounded-t-2xl",

          // Tablet
          "sm:w-[min(92vw,32rem)] sm:rounded-2xl",

          // Desktop: position is assigned by useLayoutEffect
          "lg:fixed lg:w-[28rem] lg:max-w-[calc(100vw-2rem)]",
        )}
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
