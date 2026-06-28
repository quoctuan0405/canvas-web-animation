import {
  createEffect,
  createSignal,
  onCleanup,
  Show,
  untrack,
  type VoidComponent,
} from "solid-js";

type Props = {
  class?: string;
  title?: string;
  initialValue?: number;
  minCount: number;
  maxCount: number;
  onChange?: (value: number) => void;
};

export const Slider: VoidComponent<Props> = (props) => {
  let track!: HTMLDivElement;
  let progressTrack!: HTMLDivElement;
  let thumb!: HTMLDivElement;

  let trackWidth: number;
  let thumbWidth: number;
  let totalWidth: number;

  const [isMouseDown, setIsMouseDown] = createSignal<boolean>(false);
  let lastMouseX = 0;
  let translateX = 0;

  const [value, setValue] = createSignal<number>(props.initialValue ?? 1);

  createEffect(function setUp() {
    trackWidth = track.getBoundingClientRect().width;
    thumbWidth = thumb.getBoundingClientRect().width;
    totalWidth = trackWidth - thumbWidth;

    const initialValue = untrack(() => props.initialValue);

    const percentage = (initialValue || 0) / (props.maxCount - props.minCount);
    translateX = percentage * trackWidth;
    handleTranslateXChange();
  });

  const handleTranslateXChange = () => {
    thumb.style.transform = `translateX(${translateX}px)`;

    const percentage = translateX / totalWidth;
    progressTrack.style.transform = `scale(${percentage}, 1)`;
  };

  createEffect(function handleUserSlide() {
    const handleMouseUp = () => {
      if (isMouseDown()) {
        setIsMouseDown(false);
        document.body.style.userSelect = "auto";
        document.body.style.cursor = "auto";
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isMouseDown()) {
        translateX += e.clientX - lastMouseX;
        if (translateX < 0) translateX = 0;
        if (translateX > totalWidth) translateX = totalWidth;

        handleTranslateXChange();

        const percentage = translateX / totalWidth;
        setValue(
          props.minCount +
            Math.round(percentage * (props.maxCount - props.minCount)),
        );

        lastMouseX = e.clientX;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    onCleanup(() => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    });
  });

  const handleValueChange = (value: number) => {
    try {
      if (value < props.minCount || value > props.maxCount) return;

      setValue(value);

      const percentage =
        (value - props.minCount) / (props.maxCount - props.minCount);
      translateX = percentage * trackWidth;
      handleTranslateXChange();
    } catch {
      setValue(0);
    }
  };

  createEffect(function passValueToOutside() {
    props.onChange?.(value());
  });

  return (
    <div class={`relative w-full ${props.class}`}>
      <p class="text-neutral-300 font-semibold text-sm mb-1">{props.title}</p>

      <div class="flex flex-row gap-2 items-center justify-center w-full">
        <div class="relative w-full">
          {/** biome-ignore lint/a11y/noStaticElementInteractions: this is a thumb */}
          <div
            ref={thumb}
            class="absolute z-10 top-0 bottom-0 my-auto left-0 bg-blue-500 active:bg-blue-600 size-5 rounded-full cursor-pointer transition-colors will-change-transform"
            onMouseDown={(e) => {
              setIsMouseDown(true);
              lastMouseX = e.clientX;
              document.body.style.userSelect = "none";
              document.body.style.cursor = "pointer";
            }}
          >
            <Show when={isMouseDown()}>
              <div class="relative z-50">
                <div class="absolute top-7 left-0 right-0 mx-auto bg-neutral-800 color-white text-sm font-semibold text-neutral-300 rounded-sm w-max px-1 py-1 text-center">
                  {value()}
                </div>
              </div>
            </Show>
          </div>

          <div
            ref={progressTrack}
            class="absolute top-0 left-0 origin-left bg-blue-600 w-full h-1 rounded-full"
          />

          <div ref={track} class="bg-neutral-500 w-full h-1 rounded-full" />
        </div>

        <input
          type="text"
          value={!Number.isNaN(value()) ? value() : 0}
          class="text-neutral-400 text-sm font-semibold p-1 outline-0 w-12"
          onInput={(e) => {
            const intValue = parseInt(e.currentTarget.value, 10);
            if (intValue >= props.minCount && intValue <= props.maxCount) {
              handleValueChange(intValue);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") {
              e.preventDefault();
              const intValue =
                parseInt(e.currentTarget.value, 10) + (e.shiftKey ? 10 : 1);
              if (intValue >= props.minCount && intValue <= props.maxCount) {
                handleValueChange(intValue);
              }
            }

            if (e.key === "ArrowDown") {
              e.preventDefault();
              const intValue =
                parseInt(e.currentTarget.value, 10) - (e.shiftKey ? 10 : 1);
              if (intValue >= props.minCount && intValue <= props.maxCount) {
                handleValueChange(intValue);
              }
            }
          }}
        />
      </div>
    </div>
  );
};
