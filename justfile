# ZWA Presentations — local development shortcuts.
# Run `just` or `just --list` to see the available recipes.

default:
    @just --list

# Install the exact dependency versions from the lockfile.
install:
    npm ci

# Start the Next.js development server.
dev:
    npm run dev

# Start development on all interfaces (useful for another device on the LAN).
dev-host:
    npm run dev -- --hostname 0.0.0.0

# Start development on a custom port, e.g. `just dev-port 4000`.
dev-port port='3000':
    npm run dev -- --port {{port}}

# Apply pending database migrations.
migrate:
    node scripts/migrate.mjs

# Build the production bundle.
build:
    npm run build

# Serve the last production build locally.
start:
    npm run start

# Run the unit, API, playground, and quality test suites.
test:
    npm test

# Run browser end-to-end tests (requires a completed build for the smoke suite).
e2e:
    npm run test:e2e

# Run linting, formatting, and type checks.
check:
    npm run lint
    npm run format:check
    npm run typecheck

# Format the repository with Prettier.
format:
    npx prettier --write .

# Run the complete release quality gate.
quality:
    npm run quality
