# CloudDash Design System

## Included
- `tokens.json` (Figma/Style Dictionary source)
- `tokens.css` (runtime CSS tokens + dark mode)
- `tailwind.config.ts` (token mapping)
- `components/Button.tsx`, `components/Input.tsx`, `components/Card.tsx`
- `.storybook/main.ts`, `.storybook/preview.ts`
- stories: `Button`, `Input`, `Card`

## Storybook setup

Install:
```bash
npm i -D storybook @storybook/react-vite @storybook/addon-essentials @storybook/addon-a11y @storybook/addon-interactions
```

Run:
```bash
npx storybook dev -p 6006
```

## Tailwind setup
Point your app Tailwind config to this `tailwind.config.ts` or merge `theme.extend` into your existing config.

## Notes
- Theme switch in Storybook toolbar updates `data-theme` on `<html>`.
- Components are starter-level atoms/molecules intended for extension.
