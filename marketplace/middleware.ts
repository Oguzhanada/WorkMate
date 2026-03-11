/**
 * Next.js middleware entry point — DO NOT DELETE THIS FILE.
 *
 * This file MUST exist for Next.js to run any middleware at all.
 * Without it: locale routing (next-intl) is dead, auth guard is dead,
 * and every dashboard page errors out with a bad [locale] param.
 *
 * History: deleted twice by mistake (commits 9f73b6c and 6a4af6b).
 * Restored each time — now frozen as FD-28 in ai-context/context/agents.md.
 *
 * To change middleware behaviour: edit proxy.ts, NOT this file.
 */
export { proxy as middleware, config } from './proxy';
