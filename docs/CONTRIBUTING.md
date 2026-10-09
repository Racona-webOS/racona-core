# Contributing to Racona

Thank you for your interest in contributing to Racona! This guide will help you get started with development, understand our conventions, and submit your first contribution.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Code Style & Conventions](#code-style--conventions)
- [Commit Messages](#commit-messages)
- [Branching Strategy](#branching-strategy)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Development Tips](#development-tips)
- [Release Process](#release-process)
- [Getting Help](#getting-help)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming, inclusive, and harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Expected Behavior

- Be respectful and considerate in all interactions
- Welcome newcomers and help them get started
- Accept constructive criticism gracefully
- Focus on what is best for the community and the project
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, trolling, or personal attacks
- Publishing others' private information without consent
- Discriminatory language or imagery
- Any conduct that would be considered inappropriate in a professional setting

### Enforcement

Project maintainers may remove, edit, or reject comments, commits, code, issues, and other contributions that violate this Code of Conduct. Repeated or severe violations may result in a temporary or permanent ban from the project.

Report violations by opening a private issue or contacting the maintainers directly.

---

## Prerequisites

Before you begin, make sure you have the following installed:

- **[Bun](https://bun.sh)** v1.0+ (primary runtime and package manager)
- **[Node.js](https://nodejs.org)** v20+ (required for the web app)
- **[Docker](https://docker.com)** and Docker Compose (for PostgreSQL and containerized development)
- **[Git](https://git-scm.com)** v2.30+

---

## Development Setup

### 1. Fork & Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/<your-username>/racona-core.git
cd racona-core
git remote add upstream https://github.com/szigetidev/racona-core.git
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Set Up Environment Variables

```bash
cp .env.example .env
# Edit .env with your local settings (defaults work for Docker setup)
# Important: fill in required values like BETTER_AUTH_SECRET, ORIGIN, and database credentials
```

> **Note:** The `ORIGIN` variable must match your app URL (e.g. `http://localhost:3000`). Without it, remote function calls will fail with a 403 error due to SvelteKit's CSRF protection.

### 4. Start the Database

```bash
bun docker:db        # Start only PostgreSQL in Docker (for local development)
bun db:init          # Generate migrations, run them, and seed data
```

### 5. Start the Dev Server

```bash
bun app:dev          # Starts the SvelteKit dev server
```

Racona is now running at `http://localhost:5173`.

### Useful Commands

| Command           | Description                             |
| ----------------- | --------------------------------------- |
| `bun app:dev`     | Start development server                |
| `bun app:build`   | Production build                        |
| `bun app:check`   | Type-check with svelte-check + tsc      |
| `bun test`        | Run all tests (from `apps/web`)         |
| `bun lint`        | Check formatting + linting              |
| `bun format`      | Auto-format with Prettier               |
| `bun db:generate` | Generate migrations from schema changes |
| `bun db:migrate`  | Run pending migrations                  |
| `bun db:seed`     | Seed the database                       |
| `bun db:reset`    | Reset the database                      |
| `bun db:studio`   | Open Drizzle Studio                     |
| `bun docker:up`   | Start Docker containers                 |
| `bun docker:down` | Stop Docker containers                  |
| `bun docker:logs` | Follow container logs                   |
| `bun docker:db`   | Start only PostgreSQL (local dev)       |

---

## Project Structure

```
racona-core/
├── apps/web/                  # Main SvelteKit application
│   └── src/
│       ├── apps/              # Built-in desktop applications
│       ├── lib/               # Shared library code
│       │   ├── components/    # UI components (core, shared, ui)
│       │   ├── server/        # Server-only code (database, email, plugins)
│       │   ├── stores/        # Global Svelte 5 rune stores
│       │   └── utils/         # Utility functions
│       └── routes/            # SvelteKit file-based routing
├── packages/
│   ├── database/              # Drizzle ORM schemas, migrations, seeds
│   ├── sdk/                   # @racona/sdk — Plugin SDK package
│   └── cli/                   # CLI tool for scaffolding plugins
├── examples/plugins/          # Example plugin implementations
├── docker/                    # Dockerfile and docker-compose config
├── docs/                      # Project documentation
└── scripts/                   # Utility scripts
```

For a detailed breakdown, see the [Project Structure](../README.md) section in the main README.

---

## Code Style & Conventions

### Language

The codebase uses **Hungarian** for internal comments, variable names, and documentation. When modifying existing files, follow the language convention already present in that file. Public-facing documentation (like this file) is written in English.

### TypeScript

- **Strict mode** is enabled — avoid `any` where possible
- Use explicit return types on exported functions
- Prefer `interface` over `type` for object shapes
- Use `$lib/...` path aliases for all internal imports

### Svelte 5

Racona uses **Svelte 5 with runes**. Key patterns:

- Use `$state`, `$derived`, and `$effect` for reactivity (not the legacy `$:` syntax)
- Class-based stores with `$state` properties, exported via `createX()` / `setX()` / `getX()` functions
- Store files use the `.svelte.ts` extension

### Formatting & Linting

We use **Prettier** and **ESLint**. The Prettier config (`.prettierrc`):

- Tabs for indentation
- Single quotes
- No trailing commas
- 100 character print width

Always run before committing:

```bash
bun format            # Auto-format
bun lint              # Check for issues
```

### CSS

- **Tailwind CSS 4** via the Vite plugin (no `tailwind.config` file)
- Prefer Tailwind utility classes over custom CSS
- Use `class:` directive for conditional classes in Svelte

### Server Actions

Server-side logic in `*.remote.ts` files follows this pattern:

- `command(schema, handler)` for mutations
- `query(handler)` for reads
- Always validate input with **Valibot** schemas
- Return `{ success: boolean, error?: string, ...data }`

### Database

- Schemas live in `packages/database/src/schemas/`
- Use **Drizzle ORM** for all database operations
- After schema changes, run `bun db:generate` to create migrations

### Testing

- **Vitest** for unit tests
- **fast-check** for property-based tests
- **Playwright** for end-to-end tests
- Run tests from the `apps/web` directory: `bun test`

---

## Commit Messages

We follow the **[Conventional Commits](https://www.conventionalcommits.org/)** specification.

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type       | Description                                             |
| ---------- | ------------------------------------------------------- |
| `feat`     | A new feature                                           |
| `fix`      | A bug fix                                               |
| `docs`     | Documentation changes only                              |
| `style`    | Formatting, missing semicolons, etc. (no code change)   |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf`     | Performance improvement                                 |
| `test`     | Adding or updating tests                                |
| `build`    | Changes to build system or dependencies                 |
| `ci`       | Changes to CI/CD configuration                          |
| `chore`    | Other changes that don't modify src or test files       |

### Scope

Use the package or area name as scope:

- `core` — main SvelteKit app (`apps/web`)
- `sdk` — SDK package (`packages/sdk`)
- `cli` — CLI tool (`packages/cli`)
- `db` — database package (`packages/database`)
- `docker` — Docker configuration
- `docs` — documentation

### Examples

```
feat(core): add keyboard shortcuts to window manager
fix(sdk): resolve mock data service localStorage race condition
docs(cli): update template selection instructions
refactor(db): simplify user schema relations
test(core): add property-based tests for taskbar sorting
ci: add arm64 platform to Docker build
```

### Breaking Changes

For breaking changes, add `!` after the type/scope and include a `BREAKING CHANGE:` footer:

```
feat(sdk)!: rename DataService.query to DataService.sql

BREAKING CHANGE: DataService.query() has been renamed to DataService.sql()
to better reflect its purpose. Update all plugin code accordingly.
```

---

## Branching Strategy

- `main` — stable, production-ready code
- `develop` — integration branch for upcoming release
- `feat/<name>` — feature branches (branch from `develop`)
- `fix/<name>` — bug fix branches (branch from `develop` or `main` for hotfixes)

```bash
# Create a feature branch
git checkout develop
git pull upstream develop
git checkout -b feat/my-feature

# Create a bugfix branch
git checkout develop
git pull upstream develop
git checkout -b fix/my-bugfix
```

---

## Pull Request Process

### Before Submitting

1. **Sync with upstream:**

   ```bash
   git fetch upstream
   git rebase upstream/develop
   ```

2. **Run all checks:**

   ```bash
   bun format
   bun lint
   bun app:check
   bun test              # from apps/web
   ```

3. **Keep it focused** — one PR per feature or fix. Avoid mixing unrelated changes.

### Submitting a PR

1. Push your branch to your fork
2. Open a Pull Request against the `develop` branch
3. Fill in the PR template with:
   - A clear description of what changed and why
   - Related issue number(s) (e.g., `Closes #42`)
   - Screenshots or recordings for UI changes
   - Any breaking changes or migration steps

### Review Process

- At least **one maintainer approval** is required before merging
- CI checks (lint, type-check, tests, build) must pass
- Reviewers may request changes — address feedback and push updates to the same branch
- Once approved, a maintainer will merge using **squash and merge**

### PR Tips

- Write a descriptive title using the conventional commit format
- Keep PRs small and reviewable (under 400 lines of diff when possible)
- Add inline comments on your own PR to explain non-obvious decisions
- Respond to review feedback promptly

---

## Issue Reporting

### Bug Reports

When reporting a bug, include:

- **Description** — what happened vs. what you expected
- **Steps to reproduce** — minimal steps to trigger the bug
- **Environment** — OS, browser, Bun version, Node.js version
- **Screenshots or logs** — if applicable
- **Racona version** — commit hash or release tag

### Feature Requests

When requesting a feature, include:

- **Problem** — what problem does this solve?
- **Proposed solution** — how should it work?
- **Alternatives considered** — other approaches you thought about
- **Additional context** — mockups, examples, or references

### Labels

Maintainers will triage issues with labels:

- `bug` — confirmed bug
- `enhancement` — feature request
- `good first issue` — suitable for newcomers
- `help wanted` — community contributions welcome
- `documentation` — docs improvement needed
- `wontfix` — not planned

---

## Development Tips

### Working with Built-in Apps

Each app in `src/apps/[app-name]/` has its own entry point (`index.svelte`), icon, and optional server actions. To add a new built-in app:

1. Create a directory under `src/apps/`
2. Add `index.svelte` (entry point) and `icon.svg`
3. Add `*.remote.ts` files for server-side logic
4. Register the app in the app registry

### Hot Reload

The dev server supports hot module replacement. Changes to `.svelte`, `.ts`, and `.css` files are reflected instantly without a full page reload.

### Database Changes

1. Modify schemas in `packages/database/src/schemas/`
2. Run `bun db:generate` to create a migration
3. Run `bun db:migrate` to apply it
4. Test with `bun db:studio` to inspect the database

### Running Specific Tests

```bash
# Run all tests
cd apps/web && bun test

# Run a specific test file
cd apps/web && bunx vitest run src/lib/utils/myUtil.test.ts

# Run property-based tests only
cd apps/web && bun test:pbt
```

---

## Release Process

### Versioning

Racona follows **[Semantic Versioning](https://semver.org/)**:

- `0.1.0` — initial development release
- `0.2.0` — new features (minor version bump)
- `0.2.1` — bug fixes (patch version bump)
- `1.0.0` — first stable release

### Creating a Release

1. **Update version numbers** in all `package.json` files:
   - Root: `racona-core/package.json`
   - App: `apps/web/package.json`
   - Packages: `packages/database/package.json`, `packages/sdk/package.json`, `packages/cli/package.json`

2. **Update CHANGELOG.md** and **CHANGELOG_HU.md**:
   - Add a new section for the version with the date
   - Document all changes under `Added`, `Changed`, `Fixed`, `Removed` as appropriate

3. **Commit the changes:**

   ```bash
   git add package.json apps/web/package.json packages/*/package.json CHANGELOG.md CHANGELOG_HU.md
   git commit -m "chore: bump version to v0.2.0"
   ```

4. **Create a Git tag:**

   ```bash
   git tag -a v0.2.0 -m "Racona v0.2.0 - New features"
   ```

5. **Push the tag to GitHub:**

   ```bash
   git push origin v0.2.0
   ```

### Automated Release

When you push a tag matching `v*` (e.g., `v0.2.0`), a GitHub Actions workflow automatically:

- Creates a GitHub Release
- Generates release notes from commits since the last tag
- Publishes the release

You can view the release on the [Releases page](https://github.com/szigetidev/racona-core/releases).

### Release Checklist

- [ ] All PRs for this release are merged
- [ ] Version numbers updated in all `package.json` files
- [ ] CHANGELOG.md and CHANGELOG_HU.md updated
- [ ] Changes committed and pushed to `main` or `develop`
- [ ] Git tag created and pushed
- [ ] GitHub Release published (automatic via workflow)

---

## Getting Help

- **Issues** — search existing issues or open a new one
- **Discussions** — use GitHub Discussions for questions and ideas
- **Documentation** — check the `docs/` directory for guides

Thank you for contributing to Racona! Every contribution, no matter how small, makes a difference. 🎉
