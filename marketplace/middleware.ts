// Next.js middleware entry point.
// Logic lives in proxy.ts to keep this file lean and allow isolated testing.
export { proxy as middleware, config } from './proxy';
