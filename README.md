# Interactive Web Canvas Animation

Inspired by https://vorpus.github.io/performativeUI/#/components/node-graph, I built an interactive web canvas animation.

![Demo Image](/public/web-canvas-interactive.avif)

Move your cursor across the web to make it glow, and click to send nearby points dispersing around.

You can also drag individual points!

You probably have seen this animation before (I've seen one in a VPN website in 2017!), but I bet you have not seen one that interactive :)

## See the code

Check out the complete code at [OptimizedCanvasWebAnimationInteractive.tsx](/src/components/OptimizedCanvasWebAnimationInteractive.tsx)!

I didn't build the complex animation that have all features right away.

Instead, first, I build the minimal version that have no interactive at all [CanvasWebAnimation.tsx](/src/components/CanvasWebAnimation.tsx). Next, I build a totally separate canvas that only have 5 points that allows you to drag it around and click it [CanvasInteractivePoint.tsx](/src/components/CanvasInteractivePoint.tsx).

Then, I merge them all together in [CanvasWebAnimationInteractive.tsx](/src/components/CanvasWebAnimationInteractive.tsx).

After that, I tried my best to optimize it in [OptimizedCanvasWebAnimationInteractive.tsx](/src/components/OptimizedCanvasWebAnimationInteractive.tsx) that is my final version.

In case you need to copy my code and modify it to fit with your project, I hope that will help you navigate through all those nasty logic easier.

## Setup

Install the dependencies:

```bash
pnpm install
```

## Get started

Start the dev server, and the app will be available at [http://localhost:3000](http://localhost:3000).

```bash
pnpm run dev
```

Build the app for production:

```bash
pnpm run build
```

Preview the production build locally:

```bash
pnpm run preview
```

## Learn more

To learn more about Rsbuild, check out the following resources:

- [Rsbuild documentation](https://rsbuild.rs) - explore Rsbuild features and APIs.
- [Rsbuild GitHub repository](https://github.com/web-infra-dev/rsbuild) - your feedback and contributions are welcome!
