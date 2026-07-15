export default {
  '*.{ts,tsx}': [
    'frontend/node_modules/.bin/eslint --fix --config frontend/eslint.config.js',
    'prettier --write',
  ],
  '*.css': ['prettier --write'],
  '*.md': ['prettier --write'],
  '*.json': ['prettier --write --ignore-unknown'],
  '*.go': ['gofmt -w'],
};
