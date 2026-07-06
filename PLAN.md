# Plan

## Backend
- [ ] Split `engine.go` into `units.go`, `functions.go`, `variables.go`
- [ ] Add `GetHistory` method
- [ ] Service methods accept `context.Context`

## Frontend
- [ ] Reactive store (`stores/calculator.ts` with subscriber pattern)
- [ ] Loading / empty / error UI states
- [ ] `Enter` to force-evaluate
- [ ] `Esc` to clear / close panels
- [ ] History navigation (↑/↓)
