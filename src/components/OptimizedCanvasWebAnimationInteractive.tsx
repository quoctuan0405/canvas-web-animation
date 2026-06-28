import { createEffect, onCleanup, type VoidComponent } from 'solid-js';
import { generateRandomInt } from '../utils/randomInt';

type Props = {
  class?: string;
  pointCount?: number;
  speed?: number;
  maxEdgeLength?: number;
  hoverEffectRadius?: number;
  clickEffectRadius?: number;
};

export const OptimizedCanvasWebAnimationInteractive: VoidComponent<Props> = (
  props,
) => {
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
    opacity: number;
    distanceToCursorX: number;
    distanceToCursorY: number;
    distanceToCursorSquared: number;
  };

  let points: Point[] = [];

  // Generate points
  const generatePoints = (pointCount: number) => {
    points = [];

    for (let i = 0; i < pointCount; i++) {
      const angle = generateRandomInt();

      const baseOpacity = 0.05 + Math.random() * 0.4;

      points.push({
        x: generateRandomInt() % canvasWidth,
        y: generateRandomInt() % canvasHeight,
        clickAffectedVelocity: 0,
        sinAngle: Math.sin(angle),
        cosAngle: Math.cos(angle),
        baseOpacity: 0.05 + Math.random() * 0.4,
        opacity: baseOpacity,
        distanceToCursorX: hoverEffectRadius,
        distanceToCursorY: hoverEffectRadius,
        distanceToCursorSquared: hoverEffectRadiusSquared,
      });
    }
  };

  // Effect radius when click
  let maxEdgeLengthSquared = 100 ** 2;
  let hoverEffectRadius = 100;
  let hoverEffectRadiusSquared = hoverEffectRadius ** 2;
  let clickEffectRadiusSquared = 50 ** 2;
  const pointHitBoxRadiusSquared = 7 ** 2;

  // Cursor
  let cursorX: number = 0;
  let cursorY: number = 0;

  let pointAttachToCursorIndex = -1;

  createEffect(function storeMousePositionAndOrMoveParticleOnMouseMove() {
    const handleMouseMove = (e: MouseEvent) => {
      // Store cursor position
      cursorX = e.clientX - canvasX;
      cursorY = e.clientY - canvasY;

      // Calculate each distance of point to cursor
      // NOTE: should move this into requestAnimationFrame draw since point position change all the time
      // but for performance reason, put it here is good enough
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        point.distanceToCursorX = point.x - cursorX;
        point.distanceToCursorY = point.y - cursorY;
        point.distanceToCursorSquared =
          point.distanceToCursorX ** 2 + point.distanceToCursorY ** 2;

        if (point.distanceToCursorSquared < hoverEffectRadiusSquared) {
          point.opacity = Math.max(
            point.baseOpacity,
            1 - point.distanceToCursorSquared / hoverEffectRadiusSquared,
          );
        } else {
          point.opacity = point.baseOpacity;
        }
      }

      // Move chosen point on cursor
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
      // Detect if user is click on a point
      for (let i = 0; i < points.length; i++) {
        const point = points[i];

        const distanceToCursorSquared =
          point.distanceToCursorX ** 2 + point.distanceToCursorY ** 2;

        // Only move point according to cursor when mouse down on that point
        if (distanceToCursorSquared <= pointHitBoxRadiusSquared) {
          pointAttachToCursorIndex = i;
          return;
        }
      }

      // Detect if user is click on a point
      for (let i = 0; i < points.length; i++) {
        const point = points[i];

        if (point.distanceToCursorSquared < clickEffectRadiusSquared) {
          const distanceToCursor = Math.sqrt(point.distanceToCursorSquared);

          const ratio =
            1 - point.distanceToCursorSquared / clickEffectRadiusSquared;
          point.clickAffectedVelocity = ratio * distanceToCursor * 0.3;
          point.cosAngle = point.distanceToCursorX / distanceToCursor;
          point.sinAngle = point.distanceToCursorY / distanceToCursor;
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

  // Edges (only recalculate to re-connection point to point after 200ms)
  type Edge = {
    firstPointIndex: number;
    secondPointIndex: number;
    opacity: number;
  };
  let edges: Edge[] = [];

  createEffect(function connectEdges(intervalId?: number) {
    if (intervalId) {
      clearInterval(intervalId);
    }

    return window.setInterval(() => {
      edges = [];

      for (let i = 0; i < points.length; i++) {
        for (let j = i; j < points.length; j++) {
          const edgeLengthSquared =
            (points[i].x - points[j].x) ** 2 + (points[i].y - points[j].y) ** 2;

          if (edgeLengthSquared < maxEdgeLengthSquared) {
            let opacity = Math.min(
              1 - edgeLengthSquared / maxEdgeLengthSquared,
              0.15,
            );

            if (
              points[i].distanceToCursorSquared < hoverEffectRadiusSquared &&
              points[j].distanceToCursorSquared < hoverEffectRadiusSquared
            ) {
              const altitudeOfCursorToEdge =
                Math.abs(
                  (points[j].y - points[i].y) * cursorX -
                    (points[j].x - points[i].x) * cursorY +
                    points[j].x * points[i].y -
                    points[i].x * points[j].y,
                ) / Math.sqrt(edgeLengthSquared);

              opacity *= 2 - altitudeOfCursorToEdge / hoverEffectRadius;
            }

            edges.push({
              firstPointIndex: i,
              secondPointIndex: j,
              opacity,
            });
          }
        }
      }
    }, 100);
  });

  // If point get out of canvas, put it in the canvas
  createEffect(function putPointBackIntoCanvas(intervalId?: number) {
    if (intervalId) {
      clearInterval(intervalId);
    }

    return window.setInterval(() => {
      for (const point of points) {
        if (point.x < 0) {
          point.x = 3;
          point.cosAngle *= -1;
        }

        if (point.x > canvasWidth) {
          point.x = canvasWidth - 3;
          point.cosAngle *= -1;
        }

        if (point.y < 0) {
          point.y = 3;
          point.sinAngle *= -1;
        }

        if (point.y > canvasHeight) {
          point.y = canvasHeight - 3;
          point.sinAngle *= -1;
        }
      }
    }, 1000);
  });

  // Draw
  let speed = 10;
  const drag = 0.85;

  const endAngle = Math.PI * 2;

  let lastTimestamp = performance.now();

  const draw = () => {
    if (isStopAnimation) return;

    const now = performance.now();
    const deltaTime = (now - lastTimestamp) / 1000; // In second
    lastTimestamp = now;

    const velocity = speed * deltaTime;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    for (const point of points) {
      point.clickAffectedVelocity *= drag;

      const pointVelocity = velocity + point.clickAffectedVelocity;
      point.x += point.cosAngle * pointVelocity;
      point.y += point.sinAngle * pointVelocity;

      ctx.beginPath();
      ctx.arc(point.x, point.y, 3, 0, endAngle);
      ctx.fillStyle = `rgba(255, 255, 255, ${point.opacity})`;
      ctx.fill();
    }

    for (const edge of edges) {
      const firstPoint = points[edge.firstPointIndex];
      const secondPoint = points[edge.secondPointIndex];

      if (
        firstPoint.x <= 2 ||
        firstPoint.x >= canvasWidth - 2 ||
        firstPoint.y <= 2 ||
        firstPoint.y >= canvasHeight - 2
      ) {
        continue;
      }

      if (
        secondPoint.x <= 2 ||
        secondPoint.x >= canvasWidth - 2 ||
        secondPoint.y <= 2 ||
        secondPoint.y >= canvasHeight - 2
      ) {
        continue;
      }

      ctx.beginPath();
      ctx.moveTo(firstPoint.x, firstPoint.y);
      ctx.lineTo(secondPoint.x, secondPoint.y);
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(255, 255, 255, ${edge.opacity})`;
      ctx.stroke();
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

    generatePoints(props.pointCount ?? 500);

    draw();
  });

  // Set settings to ref when props change
  createEffect(() => {
    if (props.pointCount) {
      generatePoints(props.pointCount);
    }

    if (props.speed) {
      speed = props.speed;
    }

    if (props.maxEdgeLength) {
      maxEdgeLengthSquared = props.maxEdgeLength ** 2;
    }

    if (props.hoverEffectRadius) {
      hoverEffectRadius = props.hoverEffectRadius;
      hoverEffectRadiusSquared = hoverEffectRadius ** 2;
    }

    if (props.clickEffectRadius) {
      clickEffectRadiusSquared = props.clickEffectRadius ** 2;
    }
  });

  return <canvas ref={canvas} class={`size-full bg-black ${props.class}`} />;
};
