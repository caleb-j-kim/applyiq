# ApplyIQ frontend

AI-powered job application assistant — landing page + app shell.

## Stack

- [Vite](https://vite.dev/) + React 19 + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) (components in `src/components/ui`)
- [three.js](https://threejs.org/) / [@react-three/fiber](https://r3f.docs.pmnd.rs/) / [@react-three/drei](https://github.com/pmndrs/drei) for the WebGPU hero effect

## Getting started

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — type-check and build for production
- `npm run preview` — preview the production build locally
- `npm run lint` — run oxlint

## Project structure

```
src/
  components/
    ui/          shadcn/ui primitives + the hero-futuristic component
    sections/     homepage sections (navbar, hero, features, footer, ...)
  assets/images/  logo crops used across the site
  App.tsx         assembles the homepage sections
```

### Notes on the hero

`src/components/ui/hero-futuristic.tsx` renders a WebGPU shader scene
(`three/webgpu` + TSL) and requires a browser with WebGPU support
(current Chrome/Edge). It falls back gracefully to a blank canvas in
unsupported browsers — the rest of the page is unaffected.
