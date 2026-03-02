## Description

<!-- Briefly describe the changes made and why. Link the related issue below. -->

Closes #<!-- issue number -->

---

## Type of Change

<!-- Put an `x` in the boxes that apply. -->

- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 🦀 Smart contract change (Soroban / Rust)
- [ ] 🖥️ Frontend change (Next.js)
- [ ] 📖 Documentation update
- [ ] 🔧 Chore / refactor / tooling

---

## Checklist

<!-- Put an `x` in the boxes that apply. -->

### General
- [ ] My code follows the style guidelines in [`CONTRIBUTING.md`](../CONTRIBUTING.md)
- [ ] I have performed a self-review of my code
- [ ] I have added comments to any hard-to-understand areas
- [ ] My changes generate no new warnings or linter errors

### Smart Contracts (Soroban / Rust) — skip if not applicable
- [ ] `cargo fmt --all` passes with no changes
- [ ] `cargo clippy --all-targets --all-features -- -D warnings` passes
- [ ] `cargo test --all-features` passes
- [ ] `stellar contract build` produces a valid `.wasm` artifact
- [ ] Authorization logic (`require_auth`) is correct and tested
- [ ] Storage entries use the appropriate Soroban storage tier (Temporary / Persistent / Instance)

### Frontend (Next.js) — skip if not applicable
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] `npm test` passes (or no tests affected)
- [ ] Wallet integration (Freighter / LOBSTR) has been manually verified in the browser

### Documentation
- [ ] I have updated the `README.md` if my change affects the public API or setup steps
- [ ] New Soroban contract functions are documented with `///` doc-comments

---

## Testing

<!-- Describe the tests you ran to verify your changes. Include instructions so reviewers can reproduce. -->

**Test environment:** <!-- e.g. Stellar Testnet, local Soroban sandbox -->

**Steps to reproduce:**
1.
2.
3.

---

## Screenshots / Recordings (if applicable)

<!-- Paste screenshots, screen-recordings, or transaction links here. -->

---

## Additional Context

<!-- Any other information that reviewers should know about. -->
