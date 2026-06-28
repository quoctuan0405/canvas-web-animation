import { createEffect, onCleanup, type VoidComponent } from 'solid-js';
import { generateRandomInt } from '../utils/randomInt';

export const CanvasWebAnimation: VoidComponent = () => {
  let canvas!: HTMLCanvasElement;
  let canvasX: number;
  let canvasY: number;
  let ctx: CanvasRenderingContext2D;

  let canvasWidth: number;
  let canvasHeight: number;

  // Stop and resume animation
  let isStopAnimation = false;

  createEffect(function pauseAnimationWhenOffFocus() {
    const pauseAnimation = () => {
      if (document.hidden) {
        isStopAnimation = true;
      }
    };

    window.addEventListener('blur', pauseAnimation, { passive: true });

    document.addEventListener('visibilitychange', pauseAnimation, {
      passive: true,
    });
  });

  createEffect(function resumeAnimationWhenFocusAgain() {
    const resumeAnimation = () => {
      if (!document.hidden) {
        lastTimestamp = performance.now();
        isStopAnimation = false;
      }
    };

    window.addEventListener('focus', resumeAnimation, { passive: true });

    document.addEventListener('visibilitychange', resumeAnimation, {
      passive: true,
    });
  });

  // Points
  type Point = {
    x: number;
    y: number;
    sinAngle: number;
    cosAngle: number;
    baseOpacity: number;
    distanceToCursor: number;
  };

  const points: Point[] = [];

  const generatePoints = () => {
    for (let i = 0; i < 150; i++) {
      const angle = generateRandomInt();

      points.push({
        x: generateRandomInt() % canvasWidth,
        y: generateRandomInt() % canvasHeight,
        sinAngle: Math.sin(angle),
        cosAngle: Math.cos(angle),
        baseOpacity: 0.05 + Math.random() * 0.4,
        distanceToCursor: 0,
      });
    }
  };

  // Canvas effect distance
  // Only when the cursor on this bounding do draw the canvas
  const canvasEffectDistance = 100;
  const maxEdgeLength = 100;
  let boundingX = 0;
  let boundingY = 0;
  let boundingWidth = 0;
  let boundingHeight = 0;

  // Cursor
  let cursorX: number = 0;
  let cursorY: number = 0;

  createEffect(function storeMousePositionOnMouseMove() {
    const storeCursorPosition = (e: MouseEvent) => {
      if (
        e.clientX >= boundingX &&
        e.clientX <= boundingWidth &&
        e.clientY >= boundingY &&
        e.clientY <= boundingHeight
      ) {
        cursorX = e.clientX - canvasX;
        cursorY = e.clientY - canvasY;
      }
    };

    window.addEventListener('mousemove', storeCursorPosition, {
      passive: true,
    });

    onCleanup(() => {
      window.removeEventListener('mousemove', storeCursorPosition);
    });
  });

  // Draw
  const endAngle = Math.PI * 2;

  let lastTimestamp = performance.now();

  const draw = () => {
    if (isStopAnimation) {
      return;
    }

    const now = performance.now();
    const deltaTime = now - lastTimestamp; // In millisecond
    lastTimestamp = now;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const distance = 0.01 * deltaTime;

    for (let i = 0; i < points.length; i++) {
      const point = points[i];

      point.x += point.cosAngle * distance;
      point.y += point.sinAngle * distance;

      if (point.x < 0 || point.x > canvasWidth) {
        point.cosAngle *= -1;
      }

      if (point.y < 0 || point.y > canvasHeight) {
        point.sinAngle *= -1;
      }

      point.distanceToCursor = Math.sqrt(
        (cursorX - point.x) ** 2 + (cursorY - point.y) ** 2,
      );
      const opacity = Math.max(
        point.baseOpacity,
        1 - point.distanceToCursor / canvasEffectDistance,
      );

      ctx.beginPath();
      ctx.arc(point.x, point.y, 2.5, 0, endAngle);
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.fill();
    }

    const edges: [number, number, number][] = [];

    for (let i = 0; i < points.length; i++) {
      for (let j = i; j < points.length; j++) {
        const edgeLength = Math.sqrt(
          (points[i].x - points[j].x) ** 2 + (points[i].y - points[j].y) ** 2,
        );

        if (edgeLength < maxEdgeLength) {
          edges.push([i, j, edgeLength]);
        }
      }
    }

    edges.forEach((edge) => {
      const [firstPointIndex, secondPointIndex, edgeLength] = edge;
      const firstPoint = points[firstPointIndex];
      const secondPoint = points[secondPointIndex];

      let edgeOpacity = Math.min(1 - edgeLength / maxEdgeLength, 0.2);

      // const altitudeOfCursorToEdge =
      //   Math.abs(
      //     (secondPoint.y - firstPoint.y) * cursorX -
      //       (secondPoint.x - firstPoint.x) * cursorY +
      //       secondPoint.x * firstPoint.y -
      //       firstPoint.x * secondPoint.y,
      //   ) / edgeLength;
      // if (altitudeOfCursorToEdge < canvasEffectDistance) {
      //   edgeOpacity *= 3;
      // }

      if (
        firstPoint.distanceToCursor < canvasEffectDistance ||
        secondPoint.distanceToCursor < canvasEffectDistance
      ) {
        edgeOpacity *= 2;
      }

      ctx.beginPath();
      ctx.moveTo(firstPoint.x, firstPoint.y);
      ctx.lineTo(secondPoint.x, secondPoint.y);
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(255, 255, 255, ${edgeOpacity})`;
      ctx.stroke();
    });

    requestAnimationFrame(draw);
  };

  // Setup canvas
  createEffect(function setupCanvas() {
    const dpr = window.devicePixelRatio;
    const { x, y, width, height } = canvas.getBoundingClientRect();
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const context = canvas.getContext('2d');
    if (!context) return;
    context.scale(dpr, dpr);

    ctx = context;
    canvasX = x;
    canvasY = y;
    canvasWidth = width;
    canvasHeight = height;

    boundingX = x - canvasEffectDistance;
    boundingY = y - canvasEffectDistance;
    boundingWidth = x + width + canvasEffectDistance;
    boundingHeight = y + height + canvasEffectDistance;

    generatePoints();

    draw();
  });

  return <canvas ref={canvas} class="size-[500px] bg-black" />;
};
