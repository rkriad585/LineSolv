# Contributing

Contributions are welcome! Here's how you can help.

## Development Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| **Go** | 1.24+ | Required for backend |
| **Node.js** | 20+ | Required for frontend |
| **npm** | 10+ | Required for frontend |
| **Wails CLI** | v2.12.0+ | `go install github.com/wailsapp/wails/v2/cmd/wails@latest` |
| **golangci-lint** | v2+ | `go install github.com/golangci/golangci-lint/v2/cmd/golangci-lint@latest` |

**Linux-only system dependencies:**

```bash
# Ubuntu/Debian
sudo apt install -y libwebkit2gtk-4.1-dev libgtk-3-dev

# Fedora
sudo dnf install webkit2gtk4.1-devel gtk3-devel

# Arch
sudo pacman -S webkit2gtk-4.1 gtk3
```

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/LineSolv.git
   cd LineSolv
   ```
3. Install frontend dependencies:
   ```bash
   npm install --prefix frontend
   ```
4. Start the dev server:
   ```bash
   wails dev -tags "webkit2_41"
   ```
   > The `-tags "webkit2_41"` flag is required on Ubuntu 24.04+ and Debian 12+. On macOS and Windows, it can be omitted.

## Running Tests

```bash
# Backend tests
go test ./app/... -v

# Frontend tests
cd frontend && npm run test

# Full verification (matches CI)
go test ./app/... -v && cd frontend && npm run typecheck && npm run lint && npm run test
```

## Linting & Formatting

```bash
# Go linting
golangci-lint run ./...

# TypeScript / CSS linting
cd frontend && npm run lint

# TypeScript type checking
cd frontend && npm run typecheck
```

- **Go**: `gofmt` conventions enforced by golangci-lint v2; the linter config excludes `govet` for `frontend/node_modules/`
- **TypeScript**: strict mode (`noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`)
- **CSS**: Tailwind v4 utility classes; prefer CSS custom properties for theme values

## Building

```bash
# Development
wails dev -tags "webkit2_41"

# Production build
wails build -tags "webkit2_41"
```

## Commit Messages

- Use imperative mood ("Add feature" not "Added feature")
- Keep subject line under 72 characters
- Reference issues where relevant: `Fix #123`

## Branch Naming

Use descriptive prefixes:
- `feat/` — new features
- `fix/` — bug fixes
- `refactor/` — code restructuring
- `docs/` — documentation changes

## Pull Request Process

1. Keep changes focused — one feature or fix per PR
2. Write a clear, descriptive title and summary
3. If adding a feature, update the relevant documentation
4. Ensure all CI checks pass (lint, typecheck, tests)
5. The PR template includes a checklist — verify each item before requesting review

### CI Checks

The following checks run automatically on every PR:
- `golangci-lint` (Go linting)
- ESLint + TypeScript type check (frontend linting)
- Frontend build (Vite)
- Go tests with coverage
- Frontend tests with coverage (Vitest)

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold its standards.

## Questions?

Open a [discussion](https://github.com/rkriad585/LineSolv/discussions) or issue.

For full development documentation, see [docs/development.md](docs/development.md).
