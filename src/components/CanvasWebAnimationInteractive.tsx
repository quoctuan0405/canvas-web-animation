import { createEffect, onCleanup, type VoidComponent } from 'solid-js';
import { generateRandomInt } from '../utils/randomInt';

type Props = {
  class?: string;
};

export const CanvasWebAnimationInteractive: VoidComponent<Props> = (props) => {
  // Canvas stuff
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

  // Point stuff
  type Point = {
    x: number;
    y: number;
    clickAffectedVelocity: number;
    sinAngle: number;
    cosAngle: number;
    baseOpacity: number;
    distanceToCursor: number;
  };

  const points: Point[] = [];

  // Generate points
  const generatePoints = () => {
    for (let i = 0; i < 500; i++) {
      const angle = generateRandomInt();

      points.push({
        x: generateRandomInt() % canvasWidth,
        y: generateRandomInt() % canvasHeight,
        clickAffectedVelocity: 0,
        sinAngle: Math.sin(angle),
        cosAngle: Math.cos(angle),
        baseOpacity: 0.05 + Math.random() * 0.4,
        distanceToCursor: 0,
      });
    }
  };

  // Effect radius when click
  const maxEdgeLength = 100;
  const hoverEffectDistance = 100;
  const clickEffectRadius = 50;

  // Cursor
  let cursorX: number = 0;
  let cursorY: number = 0;

  let pointAttachToCursorIndex = -1;

  createEffect(function storeMousePositionAndOrMoveParticleOnMouseMove() {
    const handleMouseMove = (e: MouseEvent) => {
      cursorX = e.clientX - canvasX;
      cursorY = e.clientY - canvasY;

      if (pointAttachToCursorIndex !== -1) {
        points[pointAttachToCursorIndex].x = cursorX;
        points[pointAttachToCursorIndex].y = cursorY;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    onCleanup(() => {
      window.removeEventListener('mousemove', handleMouseMove);
    });
  });

  createEffect(function allowMovePointOnMouseDown() {
    const allowMovePointAccordingToCursor = () => {
      const pointDistanceToCursorX: number[] = new Array(points.length);
      const pointDistanceToCursorY: number[] = new Array(points.length);
      const pointDistanceToCursor: number[] = new Array(points.length);

      for (let i = 0; i < points.length; i++) {
        const point = points[i];

        const distanceToCursorX = point.x - cursorX;
        const distanceToCursorY = point.y - cursorY;
        const distanceToCursor = Math.sqrt(
          distanceToCursorX ** 2 + distanceToCursorY ** 2,
        );

        // Only move point according to cursor when mouse down on that point
        if (distanceToCursor <= 7) {
          pointAttachToCursorIndex = i;
          return;
        }

        pointDistanceToCursor[i] = distanceToCursor;
        pointDistanceToCursorX[i] = distanceToCursorX;
        pointDistanceToCursorY[i] = distanceToCursorY;
      }

      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        const distanceToCursorX = pointDistanceToCursorX[i];
        const distanceToCursorY = pointDistanceToCursorY[i];
        const distanceToCursor = pointDistanceToCursor[i];

        if (distanceToCursor < clickEffectRadius) {
          const ratio = 1 - distanceToCursor / clickEffectRadius;
          point.clickAffectedVelocity = ratio * distanceToCursor * 0.5;
          point.cosAngle = distanceToCursorX / distanceToCursor;
          point.sinAngle = distanceToCursorY / distanceToCursor;
        }
      }
    };

    window.addEventListener('mousedown', allowMovePointAccordingToCursor, {
      passive: true,
    });

    onCleanup(() => {
      window.removeEventListener('mousedown', allowMovePointAccordingToCursor);
    });
  });

  createEffect(function cancelMovePointOnMouseUp() {
    const cancelMovePointAccordingToCursor = () => {
      pointAttachToCursorIndex = -1;
    };

    window.addEventListener('mouseup', cancelMovePointAccordingToCursor, {
      passive: true,
    });

    onCleanup(() => {
      window.removeEventListener('mouseup', cancelMovePointAccordingToCursor);
    });
  });

  // Draw
  const endAngle = Math.PI * 2;

  let lastTimestamp = performance.now();

  const draw = () => {
    if (isStopAnimation) return;

    const now = performance.now();
    const deltaTime = now - lastTimestamp; // In millisecond
    lastTimestamp = now;

    const velocity = 0.01 * deltaTime;
    const drag = Math.exp(-0.01 * deltaTime);

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    for (const point of points) {
      point.clickAffectedVelocity *= drag;

      point.x += point.cosAngle * (velocity + point.clickAffectedVelocity);
      point.y += point.sinAngle * (velocity + point.clickAffectedVelocity);

      if (point.x < 0 || point.x > canvasWidth) {
        point.x = 0;
        point.cosAngle *= -1;
      }

      if (point.y < 0 || point.y > canvasWidth) {
        point.y = 0;
        point.sinAngle *= -1;
      }

      point.distanceToCursor = Math.sqrt(
        (cursorX - point.x) ** 2 + (cursorY - point.y) ** 2,
      );
      const opacity = Math.max(
        point.baseOpacity,
        1 - point.distanceToCursor / hoverEffectDistance,
      );

      ctx.beginPath();
      ctx.arc(point.x, point.y, 3, 0, endAngle);
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

      let edgeOpacity = Math.min(1 - edgeLength / maxEdgeLength, 0.15);

      if (
        firstPoint.distanceToCursor < hoverEffectDistance ||
        secondPoint.distanceToCursor < hoverEffectDistance
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

    generatePoints();

    draw();
  });

  return <canvas ref={canvas} class={`size-full bg-black ${props.class}`} />;
};
