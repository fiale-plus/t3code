import type { SidebarMode } from "@t3tools/contracts/settings";
import { PanelsTopLeftIcon } from "lucide-react";
import { useRef, useState } from "react";

import { useSidebarMode, useUpdateClientSettings } from "~/hooks/useSettings";
import { Popover, PopoverPopup, PopoverTrigger } from "~/components/ui/popover";
import { Toggle, ToggleGroup } from "~/components/ui/toggle-group";

const MODES: ReadonlyArray<{ value: SidebarMode; label: string }> = [
  { value: "default", label: "Default" },
  { value: "legacy", label: "Legacy" },
  { value: "chaotic", label: "Chaotic" },
];

export function SidebarModeSelector() {
  const mode = useSidebarMode();
  const updateSettings = useUpdateClientSettings();
  const [open, setOpen] = useState(false);
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
        <div className="w-60 p-1">
          <ToggleGroup
            aria-label="Sidebar mode"
            className="w-full *:flex-1"
            value={[mode]}
            onValueChange={(next) => {
              const choice = MODES.find((option) => option.value === next[0]);
              if (choice) updateSettings({ sidebarMode: choice.value });
              pinnedOpen.current = false;
              setOpen(false);
            }}
          >
            {MODES.map((option) => (
              <Toggle key={option.value} value={option.value}>
                {option.label}
              </Toggle>
            ))}
          </ToggleGroup>
        </div>
      </PopoverPopup>
    </Popover>
  );
}
