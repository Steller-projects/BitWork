# Contributing to BitWork

Thank you for your interest in contributing to **BitWork** — a trustless, milestone-based settlement layer built on Stellar's Soroban smart contract platform. This document explains how to set up your development environment, follow the project conventions, and submit contributions.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Smart Contracts (Rust / Soroban)](#smart-contracts-rust--soroban)
   - [Frontend (Next.js)](#frontend-nextjs)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Coding Standards](#coding-standards)
6. [Testing](#testing)
7. [Submitting a Pull Request](#submitting-a-pull-request)
8. [Issue Labels](#issue-labels)

---

## Code of Conduct

All contributors are expected to adhere to the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). Please be respectful and constructive in all interactions.

---

## Getting Started

### Prerequisites

| Tool | Minimum Version | Install Guide |
|------|-----------------|---------------|
| Rust | 1.78+ | [rustup.rs](https://rustup.rs) |
| `wasm32-unknown-unknown` target | — | `rustup target add wasm32-unknown-unknown` |
| Stellar CLI | 20.x | [docs.stellar.org](https://developers.stellar.org/docs/tools/developer-tools/cli/install-stellar-cli) |
| Node.js | 20.x LTS | [nodejs.org](https://nodejs.org) |
| npm | 9+ | Bundled with Node.js |

### Smart Contracts (Rust / Soroban)

```bash
# Clone the repo
git clone https://github.com/Stellar-projects/BitWork.git
cd BitWork

# Install Rust and the WASM target
rustup toolchain install stable
rustup target add wasm32-unknown-unknown

# Build all contracts
stellar contract build

# Run unit tests
cargo test --all-features

# Check formatting and lints
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
```

### Frontend (Next.js)

```bash
# Navigate to the frontend directory (adjust path as needed)
cd frontend

# Install dependencies
npm ci

# Run the development server
npm run dev

# Lint & type-check
npm run lint
npm run type-check

# Run tests
npm test
```

---

## Project Structure

```
BitWork/
├── contracts/
│   ├── bitwork_escrow/      # Escrow contract (Soroban / Rust)
│   ├── bitwork_id/          # Reputation / Identity contract
│   └── factory/             # Factory contract
├── frontend/                # Next.js + Tailwind frontend
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # Reusable UI components
│   └── lib/                 # stellar-sdk / soroban-client helpers
├── Cargo.toml               # Workspace manifest
├── CONTRIBUTING.md          # This file
└── README.md
```

---

## Development Workflow

1. **Find or create an issue.** Every PR should be linked to an open issue. If one doesn't exist, open one using the appropriate [issue template](.github/ISSUE_TEMPLATE).
2. **Fork & branch.** Branch off `develop` (not `main`) using a descriptive name:
   - `feat/<short-description>` — new feature
   - `fix/<short-description>` — bug fix
   - `docs/<short-description>` — documentation only
   - `chore/<short-description>` — tooling, CI, refactoring
3. **Commit often with clear messages.** Use the [Conventional Commits](https://www.conventionalcommits.org) format:
   ```
   feat(escrow): add milestone-based release logic
   fix(frontend): correct Freighter wallet connection on mobile
   docs: update CONTRIBUTING prerequisites
   ```
4. **Keep PRs small and focused.** One PR = one concern.
5. **Pass all CI checks** before requesting review (see [Testing](#testing)).
6. **Request review** from the relevant code owner (see [`.github/CODEOWNERS`](.github/CODEOWNERS)).

---

## Coding Standards

### Rust / Soroban

- Follow [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/).
- All public contract functions must be documented with `///` doc-comments.
- Use `require_auth()` for every state-changing entry point that must be authorized.
- Use the appropriate Soroban storage tier:
  - **Instance storage** — contract-level metadata (e.g., admin address).
  - **Persistent storage** — long-lived user data (e.g., reputation scores).
  - **Temporary storage** — short-lived data that can expire (e.g., escrow nonces).
- Run `cargo fmt` and `cargo clippy` before committing. Zero warnings policy (`-D warnings`).

### TypeScript / Next.js

- Follow the [Airbnb TypeScript Style Guide](https://github.com/airbnb/javascript).
- All components must be typed — no `any`.
- Use `async/await` over raw Promises.
- Soroban transaction building must go through helper functions in `lib/`.

---

## Testing

### Smart Contracts

```bash
# Run all contract unit tests
cargo test --all-features

# Run tests for a specific contract
cargo test -p bitwork-escrow
```

Every new contract function **must** have at least one unit test covering:
- The happy path.
- An authorization failure (wrong signer).
- An invalid state transition.

### Frontend

```bash
# Run all frontend tests with coverage
npm test -- --coverage
```

---

## Submitting a Pull Request

1. Ensure your branch is up to date with `develop`.
2. Fill in the [PR template](.github/PULL_REQUEST_TEMPLATE.md) completely.
3. Link the related issue using `Closes #<issue-number>`.
4. Ensure all CI checks pass (Contracts CI, Frontend CI, Security Audit).
5. Tag the relevant code owners for review.

PRs that fail CI, are missing tests, or are not linked to an issue will not be merged.

---

## Issue Labels

| Label | Meaning |
|-------|---------|
| `bug` | Something isn't working correctly |
| `enhancement` | New feature or improvement |
| `smart-contract` | Relates to Soroban / Rust contracts |
| `soroban` | Soroban-specific implementation detail |
| `frontend` | Relates to the Next.js UI |
| `good first issue` | Suitable for first-time contributors |
| `help wanted` | Extra attention or expertise needed |
| `needs-triage` | Awaiting review from a maintainer |
| `blocked` | Blocked by another issue or external dependency |
| `wontfix` | Will not be addressed |

---

Thank you for helping build BitWork! 🚀
