"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  defaultAppearance,
  normalizeAppearance,
  palettes,
  type AppearanceSettings,
} from "@/lib/cojeev/appearance-tokens";
import { Button } from "@/components/ui/Button";
import { ScrollAreaList } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/Label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/Select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Shape } from "@/components/ui/shape";
import { AnimatedIcon } from "@/components/ui/animated-icon";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/Tooltip";

export { palettes, defaultAppearance } from "@/lib/cojeev/appearance-tokens";
export type {
  AppearanceSettings,
  PaletteName,
} from "@/lib/cojeev/appearance-tokens";
// Keep the provider separate so the icon catalogue and settings controls load on demand.
export { AppearanceProvider, useAppearance, setAppearance } from "./appearance-provider";
import { useAppearance } from "./appearance-provider";

export type AppearanceControlsProps = Omit<
  React.ComponentProps<"div">,
  "onChange"
> & {
  value?: AppearanceSettings;
  onValueChange?: (value: AppearanceSettings) => void;
};
export function AppearanceControls({
  value,
  onValueChange,
  className,
  ...props
}: AppearanceControlsProps) {
  const [globalValue, setGlobalValue] = useAppearance();
  const settings = normalizeAppearance(value ?? globalValue);
  const palette = palettes.find((p) => p.id === settings.palette)!;
  const id = React.useId();
  const update = (next: AppearanceSettings) => {
    if (value === undefined) setGlobalValue(next);
    onValueChange?.(next);
  };
  return (
    <div
      data-slot="appearance-controls"
      className={cn("v-appearance", className)}
      {...props}
    >
      <div className="v-appearance__heading">
        <strong>Make it comfortable.</strong>
        <p>Choose a palette. Tune how clearly text and edges stand out.</p>
      </div>
      <div className="v-appearance__field">
        <Label htmlFor={`${id}-palette`}>Colour palette</Label>
        <Select
          value={settings.palette}
          onValueChange={(name) =>
            update({
              ...settings,
              palette: normalizeAppearance({ palette: name }).palette,
            })
          }
        >
          <SelectTrigger id={`${id}-palette`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {palettes.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="v-appearance__swatches" aria-hidden="true">
          {palette.accents.map((color, i) => (
            <Shape
              key={i}
              name={
                ["pebble-soft", "clover-soft", "scalloped-square", "petal-7"][i]
              }
              style={{ color, "--c": color } as React.CSSProperties}
            />
          ))}
        </div>
        <p className="v-appearance__description">{palette.description}</p>
      </div>
      <div className="v-appearance__field">
        <div className="v-appearance__label">
          <Label id={`${id}-contrast`}>Contrast</Label>
          <output>{Math.round(settings.contrast)}%</output>
        </div>
        <Slider
          aria-labelledby={`${id}-contrast`}
          thumbLabel="Contrast"
          min={0}
          max={100}
          step={5}
          value={[settings.contrast]}
          onValueChange={([contrast]) => update({ ...settings, contrast })}
        />
        <div className="v-appearance__ends">
          <span>Comfortable</span>
          <span>Strong</span>
        </div>
      </div>
      <div className="v-appearance__sample">
        <strong>A little colour. A clear thought.</strong>
        <p>Readable labels, distinct panels, and room to focus.</p>
        <span>Selected item</span>
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => update(defaultAppearance)}
      >
        <AnimatedIcon name="refresh-cw" />
        Reset appearance
      </Button>
    </div>
  );
}

export type AppearanceMenuProps = {
  compact?: boolean;
  responsive?: boolean;
  className?: string;
};
export function AppearanceMenu({
  compact = false,
  responsive = false,
  className,
}: AppearanceMenuProps) {
  return (
    <TooltipProvider>
      <Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn("v-appearance-trigger", className)}
                aria-label="Colours and contrast"
                title="Colour and contrast"
                data-compact={compact}
                data-responsive={responsive}
                data-morph="both"
                data-tier="pill"
                data-lobes="3"
                data-depth=".008"
                data-asym=".05"
              >
                <svg
                  data-slot="appearance-palette-icon"
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
                  fill="none"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    d="M12 3C6.8 3 3 6.7 3 11.5C3 16.7 6.7 21 11.8 21C13.4 21 14.3 20.2 14.3 19C14.3 18.1 13.5 17.6 13.5 16.7C13.5 15.7 14.3 15 15.4 15H17C19.6 15 21 13.4 21 11.2C21 6.6 17.1 3 12 3Z"
                    stroke="currentColor"
                    strokeWidth="1.65"
                    strokeLinejoin="round"
                  />
                  <circle cx="7.2" cy="10.5" r="1.35" fill="currentColor" />
                  <circle cx="10.2" cy="6.9" r="1.35" fill="currentColor" />
                  <circle cx="15" cy="7.3" r="1.35" fill="currentColor" />
                  <circle cx="17.6" cy="10.7" r="1.35" fill="currentColor" />
                </svg>
                {!compact && (
                  <span className="v-appearance-trigger__label">Colours</span>
                )}
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>Colour and contrast</TooltipContent>
        </Tooltip>
        <PopoverContent className="v-appearance-popover" align="end">
          <ScrollAreaList maxHeight="min(620px, calc(var(--radix-popover-content-available-height, 80dvh) - 48px))">
            <AppearanceControls />
          </ScrollAreaList>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
}
