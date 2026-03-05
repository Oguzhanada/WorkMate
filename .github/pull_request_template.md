## Summary

- 

## Validation

- [ ] `npm run lint` passes
- [ ] Relevant tests pass (`test:unit`, `test:integration`, or `test:e2e:smoke` as applicable)
- [ ] Ireland-first constraints are preserved
- [ ] English-only UI/docs/errors are preserved

## UI Regression Checklist

- [ ] `onAuthStateChange` does not trigger loading-state flicker in visible UI
- [ ] For `Navbar` or other critical shell components, run a manual smoke test:
      keep the page open for 30-60 seconds and verify no auth placeholder/skeleton flicker appears

