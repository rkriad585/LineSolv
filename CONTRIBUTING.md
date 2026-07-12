# Contributing

Contributions are welcome! Here's how you can help.

## Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Install [prerequisites](README.md#building-from-source)
4. Run the dev server with `wails dev -tags "webkit2_41"`
5. Make your changes
6. Verify everything builds: `wails build -tags "webkit2_41"`

## Code Style

- **Go**: follow `gofmt` conventions; no unused exports
- **TypeScript**: strict mode enabled (`noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`)
- **CSS**: Tailwind v4 utility classes; prefer CSS custom properties for theme values

## Pull Request Process

1. Keep changes focused — one feature or fix per PR
2. Write a clear, descriptive title and summary
3. If adding a feature, update the relevant documentation
4. Ensure the project builds cleanly

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold its standards.

## Questions?

Open a [discussion](https://github.com/rkriad585/LineSolv/discussions) or issue.
