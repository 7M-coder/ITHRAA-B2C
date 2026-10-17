export default {
  'frontend/**/*.{ts,tsx}': ['npm --prefix frontend exec -- eslint --config frontend/eslint.config.js', 'npm --prefix frontend exec -- prettier --write'],
  'frontend/**/*.{js,json,css,md,html}': 'npm --prefix frontend exec -- prettier --write',
  'backend/**/*.php': 'backend/vendor/bin/pint'
}
