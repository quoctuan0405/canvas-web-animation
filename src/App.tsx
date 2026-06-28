import "./App.css";
import { CanvasWebAnimationInteractive } from "./components/CanvasWebAnimationInteractive";
import { CanvasWebAnimation } from "./components/CanvasWebAnimation";
import { CanvasInteractivePoint } from "./components/CanvasInteractivePoint";
import { OptimizedCanvasWebAnimationInteractive } from "./components/OptimizedCanvasWebAnimationInteractive";
import { Settings } from "./components/Settings";
import { createSignal, Show } from "solid-js";

const App = () => {
  const [isShowTitle, setIsShowTitle] = createSignal<boolean>(true);
  const [pointCount, setPointCount] = createSignal<number>(500);
  const [speed, setSpeed] = createSignal<number>(10);
  const [maxEdgeLength, setMaxEdgeLength] = createSignal<number>(100);
  const [hoverEffectRadius, setHoverEffectRadius] = createSignal<number>(100);
  const [clickEffectRadius, setClickEffectRadius] = createSignal<number>(100);

  return (
    <div class="flex flex-wrap items-center justify-center w-screen h-screen relative">
      <Settings
        onToggleShowTitle={() => setIsShowTitle((prev) => !prev)}
        initialPointCount={pointCount()}
        onPointCountChange={setPointCount}
        initialSpeed={speed()}
        onSpeedChange={setSpeed}
        initialMaxEdgeLength={maxEdgeLength()}
        onMaxEdgeLengthChange={setMaxEdgeLength}
        initialHoverEffectRadius={hoverEffectRadius()}
        onHoverEffectRadiusChange={setHoverEffectRadius}
        initialClickEffectRadius={clickEffectRadius()}
        onClickEffectRadiusChange={setClickEffectRadius}
      />

      <Show when={isShowTitle()}>
        <div class="relative z-10 flex flex-wrap justify-center">
          <p class="text-7xl text-white font-bold w-full max-w-[70vw] text-center leading-20">
            We're in the business of selling AI to GenZ
          </p>

          <p class="text-3xl text-neutral-300 font-medium w-full max-w-[50vw] text-center pt-10">
            Give us <span class="italic">your money</span> please!
          </p>
        </div>
      </Show>

      <OptimizedCanvasWebAnimationInteractive
        class="absolute z-0 top-0 left-0 size-full"
        pointCount={pointCount()}
        speed={speed()}
        maxEdgeLength={maxEdgeLength()}
        hoverEffectRadius={hoverEffectRadius()}
        clickEffectRadius={clickEffectRadius()}
      />
    </div>
  );
};

export default App;
