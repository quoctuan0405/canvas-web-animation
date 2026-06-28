import { createEffect, onCleanup, type VoidComponent } from 'solid-js';

export const CanvasInteractivePoint: VoidComponent = () => {
  // Canvas stuff
  let canvas!: HTMLCanvasElement;
  let canvasX: number;
  let canvasY: number;
  let ctx: CanvasRenderingContext2D;

  let canvasWidth: number;
  let canvasHeight: number;

  // Point stuff
  type Point = {
    x: number;
    y: number;
    velocity: number;
    sinAngle: number;
    cosAngle: number;
  };

  const points: Point[] = [
    { x: 50, y: 50, velocity: 0, sinAngle: 0, cosAngle: 0 },
    { x: 250, y: 150, velocity: 0, sinAngle: 0, cosAngle: 0 },
    { x: 550, y: 150, velocity: 0, sinAngle: 0, cosAngle: 0 },
    { x: 150, y: 50, velocity: 0, sinAngle: 0, cosAngle: 0 },
    { x: 150, y: 250, velocity: 0, sinAngle: 0, cosAngle: 0 },
  ];

  // Effect radius when click
  const clickEffectRadius = 100;

  // Cursor
  let cursorX: number = 0;
  let cursorY: number = 0;

  let pointAttachToCursorIndex = -1;

  createEffect(function storeMousePositionOnMouseMove() {
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
          point.velocity = ratio * distanceToCursor * 0.5;
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
  const isDrawing = true;

  const endAngle = Math.PI * 2;

  let lastTimestamp = performance.now();

  const draw = () => {
    if (!isDrawing) return;

    const now = performance.now();
    const deltaTime = now - lastTimestamp; // In millisecond
    lastTimestamp = now;

    const drag = Math.exp(-0.01 * deltaTime);

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    for (const point of points) {
      point.velocity *= drag;

      point.x += point.cosAngle * point.velocity;
      point.y += point.sinAngle * point.velocity;

      if (point.x < 0 || point.x > canvasWidth) {
        point.cosAngle *= -1;
      }

      if (point.y < 0 || point.y > canvasWidth) {
        point.sinAngle *= -1;
      }

      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, endAngle);
      ctx.fillStyle = `rgba(255, 255, 255`;
      ctx.fill();
    }

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

    draw();
  });

  return <canvas ref={canvas} class="size-[500px] bg-black" />;
};
