# LineSolv — Desktop Natural-Language Calculator

Cross-platform desktop calculator using **Wails v2** (Go backend), **Vite** (build tool),
**Tailwind CSS v4** (styling), and **TypeScript** (frontend logic).

---

## Remaining Work

### Backend Polish
- [ ] Split `app/calculator/engine.go` into `units.go`, `functions.go`, `variables.go`
- [ ] Add `GetHistory` method for computation history
- [ ] Service methods accept `context.Context` per Wails conventions

### Frontend Enhancements
- [ ] Formal reactive store (`stores/calculator.ts` with subscriber pattern)
- [ ] Loading / empty / error UI states
- [ ] `Enter` to force-evaluate immediately
- [ ] `Esc` to clear input / close panels
- [ ] History navigation (↑/↓ arrows)

---

## Architectural Rules

1. **`main.go` is minimal** — wire dependencies, call `wails.Run`, nothing else.
2. **All Go ⇔ frontend methods** should accept `context.Context`, return `(T, error)`.
3. **No global mutable state** — inject `*Engine` and `*AppService` via constructor.
4. **Frontend never hardcodes URLs** — always use `frontend/wailsjs/go/` bindings.
5. **Every Go call** is wrapped in `async/await` + `try/catch`.
6. **Frameless window** with custom `data-wails-drag` title bar.
