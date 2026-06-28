import {
  createEffect,
  createSignal,
  onCleanup,
  Show,
  type VoidComponent,
} from "solid-js";
import { Slider } from "./Slider";

type Props = {
  onToggleShowTitle?: () => void;
  initialPointCount?: number;
  onPointCountChange?: (pointCount: number) => void;
  initialSpeed?: number;
  onSpeedChange?: (speed: number) => void;
  initialMaxEdgeLength?: number;
  onMaxEdgeLengthChange?: (maxEdgeLength: number) => void;
  initialHoverEffectRadius?: number;
  onHoverEffectRadiusChange?: (hoverEffectRadius: number) => void;
  initialClickEffectRadius?: number;
  onClickEffectRadiusChange?: (clickEffectRadius: number) => void;
};

export const Settings: VoidComponent<Props> = (props) => {
  let settingsButton!: HTMLButtonElement;
  let menu: HTMLDivElement | undefined;

  const [isShowMenu, setIsShowMenu] = createSignal<boolean>(false);

  createEffect(function closeMenuWhenPressEscKey() {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsShowMenu(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    onCleanup(() => window.removeEventListener("keydown", handleKeyDown));
  });

  createEffect(function closeMenuWhenClickOutside() {
    const handleClick = (e: PointerEvent) => {
      if (!(e.target instanceof HTMLElement)) {
        return;
      }

      if (!settingsButton.contains(e.target) && !menu?.contains(e.target)) {
        setIsShowMenu(false);
      }
    };

    document.addEventListener("click", handleClick);

    onCleanup(() => window.removeEventListener("click", handleClick));
  });

  return (
    <div class="absolute z-20 top-10 right-10">
      <div class="relative flex flex-row flex-wrap gap-4">
        {/* Title button */}
        <div class="relative group/container">
          <button
            type="button"
            class="group/button rounded-full p-3 bg-white/10 backdrop-blur-xs cursor-pointer"
            onClick={() => props.onToggleShowTitle?.()}
          >
            <TitleIcon class="stroke-white/80 group-hover/button:stroke-white/90 group-hover/button:scale-110 group-active/button:scale-95" />
          </button>

          {/* Title button tooltip */}
          <div
            classList={{
              "absolute -left-9 -bottom-10": true,
              "bg-white/20 backdrop-blur-xs rounded-lg": true,
              "text-center text-neutral-300 w-[120px] p-2 text-xs font-medium": true,
              "opacity-0 -translate-y-2 group-hover/container:opacity-100 group-hover/container:translate-y-0 ease-in-out duration-200": true,
            }}
          >
            Show / hide text
          </div>
        </div>

        {/* Settings button */}
        <div class="relative group/container">
          <button
            ref={settingsButton}
            type="button"
            class="group/button rounded-full p-3 bg-white/10 backdrop-blur-xs cursor-pointer"
            onClick={() => setIsShowMenu((prev) => !prev)}
          >
            <SettingIcon class="stroke-white/80 group-hover/button:stroke-white/90 group-hover/button:scale-110 group-active/button:scale-95" />
          </button>

          {/* Settings button tooltip */}
          <Show when={!isShowMenu()}>
            <div
              classList={{
                "absolute -left-4 -bottom-10": true,
                "bg-white/20 backdrop-blur-xs rounded-lg": true,
                "text-center text-neutral-300 w-[80px] p-2 text-xs text-center font-medium": true,
                "opacity-0 -translate-y-2 group-hover/container:opacity-100 group-hover/container:translate-y-0 ease-in-out duration-200": true,
              }}
            >
              Settings
            </div>
          </Show>
        </div>

        {/* Menu bar */}
        <Show when={isShowMenu()}>
          <div
            ref={menu}
            classList={{
              "absolute right-0 z-40 -bottom-[390px] w-[300px]": true,
              "flex flex-col flex-wrap gap-5": true,
              "bg-white/20 backdrop-blur-lg rounded-lg": true,
              "py-5 pl-7 pr-3": true,
            }}
          >
            <Slider
              title="Points"
              initialValue={props.initialPointCount}
              minCount={0}
              maxCount={10000}
              onChange={props.onPointCountChange}
            />

            <Slider
              title="Speed"
              initialValue={props.initialSpeed}
              minCount={1}
              maxCount={100}
              onChange={props.onSpeedChange}
            />

            <Slider
              title="Max edge length"
              initialValue={props.initialMaxEdgeLength}
              minCount={0}
              maxCount={1000}
              onChange={props.onMaxEdgeLengthChange}
            />

            <Slider
              title="Hover effect radius"
              initialValue={props.initialHoverEffectRadius}
              minCount={0}
              maxCount={1000}
            />

            <Slider
              title="Click effect radius"
              initialValue={props.initialClickEffectRadius}
              minCount={0}
              maxCount={1000}
              onChange={props.onClickEffectRadiusChange}
            />
          </div>
        </Show>
      </div>
    </div>
  );
};

type IconProps = {
  class?: string;
};

const SettingIcon: VoidComponent<IconProps> = (props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={`ease-in-out duration-200 ${props.class}`}
    >
      <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
};

const TitleIcon: VoidComponent<IconProps> = (props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={`ease-in-out duration-200 ${props.class}`}
    >
      <path d="M14 21h1" />
      <path d="M14 3h1" />
      <path d="M19 3a2 2 0 0 1 2 2" />
      <path d="M21 14v1" />
      <path d="M21 19a2 2 0 0 1-2 2" />
      <path d="M21 9v1" />
      <path d="M3 14v1" />
      <path d="M3 9v1" />
      <path d="M5 21a2 2 0 0 1-2-2" />
      <path d="M5 3a2 2 0 0 0-2 2" />
      <path d="M7 12h10" />
      <path d="M7 16h6" />
      <path d="M7 8h8" />
      <path d="M9 21h1" />
      <path d="M9 3h1" />
    </svg>
  );
};
