# CloudDash DS Quick Start

## 1) Install tokens
Import `tokens.css` once in your app root.

```tsx
import './tokens.css';
```

## 2) Set theme
```html
<html data-theme="light">
```

Toggle to dark mode:
```js
document.documentElement.setAttribute('data-theme', 'dark');
```

## 3) Use components
```tsx
import { Button } from './components/Button';
import { Input } from './components/Input';
import { Card } from './components/Card';
```

## 4) Figma sync
Use `tokens.json` as source for token plugin or Style Dictionary pipeline.
