import type { SidebarMode } from "@t3tools/contracts/settings";
import { PanelsTopLeftIcon } from "lucide-react";
import { useRef, useState } from "react";

import { useSidebarMode, useUpdateClientSettings } from "~/hooks/useSettings";
import { cn } from "~/lib/utils";
import { Popover, PopoverPopup, PopoverTrigger } from "~/components/ui/popover";

const MODES: ReadonlyArray<{ value: SidebarMode; label: string }> = [
  { value: "default", label: "Default" },
  { value: "legacy", label: "Legacy" },
  { value: "chaotic", label: "Chaotic" },
];

export function SidebarModeSelector() {
  const mode = useSidebarMode();
  const updateSettings = useUpdateClientSettings();
  const [open, setOpen] = useState(false);
  const choicesRef = useRef<HTMLDivElement>(null);
  const pinnedOpen = useRef(false);
  return (
    <Popover
      open={open}
      onOpenChange={(next, details) => {
        if (details.reason === "trigger-press") {
          pinnedOpen.current = true;
          setOpen(true);
          return;
        }
        if (!next && details.reason === "trigger-hover" && pinnedOpen.current) return;
        if (!next) pinnedOpen.current = false;
        setOpen(next);
      }}
    >
      <PopoverTrigger
        openOnHover
        delay={100}
        closeDelay={150}
        aria-label={`Sidebar mode: ${MODES.find((choice) => choice.value === mode)?.label}`}
        render={
          <button
            type="button"
            className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-row-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        }
      >
        <PanelsTopLeftIcon aria-hidden className="size-3.5" />
      </PopoverTrigger>
      <PopoverPopup aria-label="Choose sidebar mode" align="end" padding="none">
        <div
          ref={choicesRef}
          role="radiogroup"
          aria-label="Sidebar mode"
          className="flex w-60 gap-1 p-1"
          onKeyDown={(event) => {
            if (!["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp"].includes(event.key)) return;
            event.preventDefault();
            const choices =
              choicesRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
            if (!choices?.length) return;
            const index = Array.from(choices).findIndex(
              (choice) => choice === document.activeElement,
            );
            const backwards = event.key === "ArrowLeft" || event.key === "ArrowUp";
            choices[(index + (backwards ? -1 : 1) + choices.length) % choices.length]?.focus();
          }}
        >
          {MODES.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={mode === option.value}
              className={cn(
                "flex-1 rounded-md px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                mode === option.value
                  ? "bg-accent font-medium text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent",
              )}
              onClick={() => {
                updateSettings({ sidebarMode: option.value });
                pinnedOpen.current = false;
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </PopoverPopup>
    </Popover>
  );
}
