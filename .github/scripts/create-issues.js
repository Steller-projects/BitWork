/**
 * create-issues.js
 *
 * Called by the `create-issues.yml` workflow via `actions/github-script`.
 * Creates 53 scoped tasks covering smart contracts, backend, frontend, tests,
 * and CI/tooling — skipping any issue whose title already exists.
 *
 * @param {import('@actions/github').GitHub} github
 * @param {{ repo: { owner: string; repo: string } }} context
 */
module.exports = async ({ github, context }) => {
  const { owner, repo } = context.repo;

  // ── helpers ──────────────────────────────────────────────────────────────
  async function existingTitles() {
    const titles = new Set();
    let page = 1;
    while (true) {
      const { data } = await github.rest.issues.listForRepo({
        owner,
        repo,
        state: "all",
        per_page: 100,
        page,
      });
      if (data.length === 0) break;
      data.forEach((i) => titles.add(i.title.trim()));
      page++;
    }
    return titles;
  }

  // ── issue definitions ────────────────────────────────────────────────────
  const issues = [
    // ── Smart Contracts – Escrow (bitwork_escrow) ────────────────────────
    {
      title: "[Contract] Implement `initialize` entry point for Escrow contract",
      labels: ["smart-contract", "soroban", "enhancement"],
      body: `## Task Description
Implement the \`initialize\` entry point for the \`bitwork_escrow\` Soroban contract.

The function should accept and persist the following arguments using **Instance storage**:
- \`owner\` (Address) — the client/payer
- \`builder\` (Address) — the service provider
- \`token\` (Address) — Stellar Asset Contract (SAC) address for the payment token (default USDC)
- \`admin\` (Address) — optional admin / arbitrator address

It must be callable **only once** (guard against re-initialization).

## Acceptance Criteria
- [ ] \`initialize\` stores \`owner\`, \`builder\`, \`token\`, and \`admin\` in Instance storage
- [ ] Second call to \`initialize\` returns an error (already initialized)
- [ ] \`cargo test -p bitwork-escrow\` passes
- [ ] \`stellar contract build\` produces a valid \`.wasm\` artifact
- [ ] At least one unit test covers the happy path and one covers re-init guard`,
    },
    {
      title: "[Contract] Add `create_milestone` function to Escrow contract",
      labels: ["smart-contract", "soroban", "enhancement"],
      body: `## Task Description
Add a \`create_milestone\` function to \`bitwork_escrow\` that lets the **owner** define a new milestone with:
- \`description\` (String)
- \`amount\` (i128) — USDC amount locked for this milestone
- \`deadline\` (u64) — Unix timestamp deadline

Each milestone should be stored in **Persistent storage** keyed by a sequential \`milestone_id\`.

## Acceptance Criteria
- [ ] \`create_milestone\` requires auth from \`owner\`
- [ ] Milestone is stored with status \`Pending\`
- [ ] \`milestone_id\` increments monotonically
- [ ] Unit tests cover happy path, unauthorized caller, and invalid amount (≤ 0)
- [ ] All Clippy warnings resolved`,
    },
    {
      title: "[Contract] Implement `deposit_funds` with SAC token transfer",
      labels: ["smart-contract", "soroban", "enhancement"],
      body: `## Task Description
Implement \`deposit_funds\` in \`bitwork_escrow\` that transfers the milestone amount from \`owner\` into the contract using the Soroban token interface (\`token::Client::transfer\`).

## Acceptance Criteria
- [ ] \`deposit_funds(milestone_id)\` calls \`token.transfer(owner, contract_address, amount)\`
- [ ] Milestone status transitions from \`Pending\` → \`Funded\`
- [ ] Depositing to a non-existent or already-funded milestone returns an error
- [ ] \`require_auth(owner)\` is called before the transfer
- [ ] Unit tests cover happy path, double-deposit guard, and wrong caller`,
    },
    {
      title: "[Contract] Implement `release_milestone` with require_auth guard",
      labels: ["smart-contract", "soroban", "enhancement"],
      body: `## Task Description
Implement \`release_milestone\` in \`bitwork_escrow\`. When called by the **owner**, it transfers the locked milestone amount from the contract to the \`builder\` and marks the milestone \`Released\`.

## Acceptance Criteria
- [ ] Only \`owner\` (or \`admin\`) may call \`release_milestone\`
- [ ] \`require_auth(owner)\` enforced
- [ ] Milestone must be in \`Funded\` state; other states return an error
- [ ] Token transfer calls \`token.transfer(contract_address, builder, amount)\`
- [ ] Unit tests: happy path, wrong caller, wrong state`,
    },
    {
      title: "[Contract] Add `dispute_milestone` function and DisputeState enum",
      labels: ["smart-contract", "soroban", "enhancement"],
      body: `## Task Description
Add a dispute mechanism to \`bitwork_escrow\`. Either \`owner\` or \`builder\` may call \`dispute_milestone\` to flag a funded milestone as disputed, freezing the funds until the \`admin\` resolves it via \`resolve_dispute(milestone_id, winner)\`.

## Acceptance Criteria
- [ ] \`DisputeState\` enum: \`None\`, \`Raised\`, \`Resolved\`
- [ ] \`dispute_milestone\` transitions status to \`Disputed\`
- [ ] \`resolve_dispute\` callable only by \`admin\`; transfers funds to the winner
- [ ] Raising a dispute on a non-funded milestone returns an error
- [ ] Unit tests cover: owner disputes, builder disputes, admin resolves, unauthorized resolution`,
    },
    {
      title: "[Contract] Implement escrow expiry / timeout logic",
      labels: ["smart-contract", "soroban", "enhancement"],
      body: `## Task Description
Add \`claim_timeout\` to \`bitwork_escrow\`. If a milestone's \`deadline\` has passed and the milestone is still \`Funded\` (not released or disputed), the \`owner\` may reclaim their funds.

## Acceptance Criteria
- [ ] \`claim_timeout(milestone_id)\` checks \`env.ledger().timestamp() > deadline\`
- [ ] Funds transferred back to \`owner\`; milestone status set to \`Expired\`
- [ ] Calling before deadline returns an error
- [ ] \`require_auth(owner)\` enforced
- [ ] Unit tests cover: valid timeout, premature claim, and already-released milestone`,
    },
    {
      title: "[Contract] Add `cancel_escrow` for mutual agreement cancellation",
      labels: ["smart-contract", "soroban", "enhancement"],
      body: `## Task Description
Implement \`cancel_escrow\` which requires **both** \`owner\` and \`builder\` to authorize. Any unfunded milestones are marked \`Cancelled\`; funded milestones are refunded to \`owner\`.

## Acceptance Criteria
- [ ] Both \`require_auth(owner)\` and \`require_auth(builder)\` called
- [ ] Funded milestones refunded; unfunded milestones marked Cancelled
- [ ] Overall contract state marked \`Cancelled\`
- [ ] Cannot cancel an escrow that has at least one \`Released\` milestone (or make it configurable)
- [ ] Unit tests cover happy path and partial-cancellation guard`,
    },
    {
      title: "[Contract] Write unit tests – Escrow happy path",
      labels: ["smart-contract", "soroban", "good first issue"],
      body: `## Task Description
Write comprehensive unit tests for the full happy-path flow in \`bitwork_escrow\`:
\`initialize\` → \`create_milestone\` → \`deposit_funds\` → \`release_milestone\`

Use the Soroban test utilities (\`soroban_sdk::testutils\`).

## Acceptance Criteria
- [ ] Test registers two addresses (owner, builder)
- [ ] Mocks a SAC token contract
- [ ] Executes the full happy path end-to-end
- [ ] Asserts final token balances are correct
- [ ] \`cargo test -p bitwork-escrow\` passes with 0 failures`,
    },
    {
      title: "[Contract] Write unit tests – Escrow authorization failures",
      labels: ["smart-contract", "soroban", "good first issue"],
      body: `## Task Description
Write unit tests that verify \`bitwork_escrow\` correctly rejects unauthorized callers on every auth-guarded entry point.

## Acceptance Criteria
- [ ] Test that calling \`release_milestone\` as \`builder\` returns \`AuthError\`
- [ ] Test that calling \`dispute_milestone\` as a random third party returns an error
- [ ] Test that \`resolve_dispute\` as \`owner\` (non-admin) returns an error
- [ ] At least one test per guarded function
- [ ] \`cargo test -p bitwork-escrow\` passes`,
    },
    {
      title: "[Contract] Write unit tests – invalid state transitions for Escrow",
      labels: ["smart-contract", "soroban", "good first issue"],
      body: `## Task Description
Write unit tests that verify \`bitwork_escrow\` rejects invalid state transitions (e.g., releasing a milestone that is not \`Funded\`, disputing a released milestone).

## Acceptance Criteria
- [ ] Test: release on \`Pending\` milestone → error
- [ ] Test: dispute on \`Released\` milestone → error
- [ ] Test: double-deposit → error
- [ ] Test: \`claim_timeout\` before deadline → error
- [ ] All tests pass under \`cargo test -p bitwork-escrow\``,
    },

    // ── Smart Contracts – Reputation / Identity (bitwork_id) ─────────────
    {
      title: "[Contract] Implement `initialize` entry point for BitworkID contract",
      labels: ["smart-contract", "soroban", "enhancement"],
      body: `## Task Description
Implement the \`initialize\` entry point for the \`bitwork_id\` Soroban contract. This contract stores on-chain professional reputation for builders.

Arguments:
- \`admin\` (Address) — contract administrator
- \`escrow_contract\` (Address) — authorized caller that may update reputation scores

## Acceptance Criteria
- [ ] Stored in Instance storage
- [ ] Re-initialization returns an error
- [ ] \`require_auth(admin)\` called during initialization
- [ ] Unit test covers happy path and re-init guard`,
    },
    {
      title: "[Contract] Add `complete_job` function to update reputation score",
      labels: ["smart-contract", "soroban", "enhancement"],
      body: `## Task Description
Add \`complete_job(builder, rating, job_value)\` to \`bitwork_id\`. This must only be callable by the authorized \`escrow_contract\` address (set during \`initialize\`).

- \`rating\` (u32): 1–5 star rating
- \`job_value\` (i128): USDC value of completed job

Update the builder's cumulative score and job count in **Persistent storage**.

## Acceptance Criteria
- [ ] Only \`escrow_contract\` address may call \`complete_job\`
- [ ] Builder's \`total_jobs\`, \`total_score\`, and \`total_volume\` updated
- [ ] Rating out of range (< 1 or > 5) returns an error
- [ ] Unit tests: happy path, unauthorized caller, invalid rating`,
    },
    {
      title: "[Contract] Implement `get_reputation` query function",
      labels: ["smart-contract", "soroban", "good first issue"],
      body: `## Task Description
Implement a read-only \`get_reputation(builder) -> ReputationData\` function that returns:
- \`total_jobs\` (u32)
- \`average_rating\` (u32, scaled ×100 for precision)
- \`total_volume\` (i128)
- \`member_since\` (u64) ledger timestamp of first job

## Acceptance Criteria
- [ ] Returns \`None\` (or zero-value struct) for unknown builders
- [ ] \`average_rating\` is correctly computed as \`total_score * 100 / total_jobs\`
- [ ] Function is \`#[contractimpl]\` and accessible via XDR
- [ ] Unit tests cover known builder and unknown builder cases`,
    },
    {
      title: "[Contract] Add skill attestation / badge system to BitworkID",
      labels: ["smart-contract", "soroban", "enhancement"],
      body: `## Task Description
Add a skill attestation mechanism to \`bitwork_id\`. A peer (attester) may call \`attest_skill(builder, skill)\` to add an attestation. Skills are stored as a vector of \`(attester, skill_tag)\` tuples in Persistent storage.

## Acceptance Criteria
- [ ] \`attest_skill(builder, skill_tag: Symbol)\` callable by any authenticated address
- [ ] \`require_auth(attester)\` enforced
- [ ] Self-attestation returns an error
- [ ] Maximum 50 unique attesters per skill tag (prevent spam)
- [ ] \`get_attestations(builder, skill_tag)\` returns attester count
- [ ] Unit tests cover happy path, self-attest guard, and spam prevention`,
    },
    {
      title: "[Contract] Write unit tests – Reputation happy path",
      labels: ["smart-contract", "soroban", "good first issue"],
      body: `## Task Description
Write unit tests for the full happy-path flow in \`bitwork_id\`:
\`initialize\` → \`complete_job\` (multiple times) → \`get_reputation\`

## Acceptance Criteria
- [ ] Simulate 3 completed jobs with different ratings
- [ ] Verify \`total_jobs\` = 3
- [ ] Verify \`average_rating\` is correctly computed
- [ ] Verify \`total_volume\` accumulates correctly
- [ ] \`cargo test -p bitwork-id\` passes`,
    },
    {
      title: "[Contract] Write unit tests – Reputation authorization failures",
      labels: ["smart-contract", "soroban", "good first issue"],
      body: `## Task Description
Write unit tests that verify \`bitwork_id\` rejects callers that are not the authorized \`escrow_contract\` when calling \`complete_job\`.

## Acceptance Criteria
- [ ] Calling \`complete_job\` from \`owner\` address (not escrow contract) → error
- [ ] Calling \`complete_job\` from a random address → error
- [ ] \`cargo test -p bitwork-id\` passes`,
    },
    {
      title: "[Contract] Add on-chain job history storage with cursor-based access",
      labels: ["smart-contract", "soroban", "enhancement"],
      body: `## Task Description
Extend \`bitwork_id\` to store a job history ledger per builder. Each entry records:
- \`job_id\` (u64)
- \`escrow_contract\` (Address)
- \`rating\` (u32)
- \`value\` (i128)
- \`completed_at\` (u64)

Expose \`get_job_history(builder, start: u32, limit: u32)\` for paginated access.

## Acceptance Criteria
- [ ] History stored in Persistent storage
- [ ] \`get_job_history\` respects \`start\` offset and \`limit\` (max 20)
- [ ] Unit tests for history retrieval and pagination bounds`,
    },
    {
      title: "[Contract] Emit contract events for escrow lifecycle (created, funded, released)",
      labels: ["smart-contract", "soroban", "enhancement"],
      body: `## Task Description
Emit Soroban contract events at key lifecycle transitions in \`bitwork_escrow\`:
- \`escrow_created\` on \`initialize\`
- \`milestone_funded\` on \`deposit_funds\`
- \`milestone_released\` on \`release_milestone\`
- \`dispute_raised\` on \`dispute_milestone\`
- \`dispute_resolved\` on \`resolve_dispute\`

Use \`env.events().publish()\` with structured topic + data.

## Acceptance Criteria
- [ ] Each lifecycle point emits the correct event
- [ ] Event topic is a two-element tuple: \`(contract_name_symbol, event_name_symbol)\`
- [ ] Unit tests assert events are emitted using \`env.events().all()\``,
    },

    // ── Smart Contracts – Factory ─────────────────────────────────────────
    {
      title: "[Contract] Implement Factory contract deploy entry point",
      labels: ["smart-contract", "soroban", "enhancement"],
      body: `## Task Description
Implement the Factory contract that deploys new \`bitwork_escrow\` instances on demand. Use \`env.deployer().upload_contract_wasm()\` and \`env.deployer().deploy_contract()\`.

Entry point: \`create_escrow(owner, builder, token) -> Address\`

## Acceptance Criteria
- [ ] Factory deploys a new escrow contract and calls its \`initialize\`
- [ ] Returns the deployed contract \`Address\`
- [ ] \`require_auth(owner)\` called before deployment
- [ ] Unit test covers successful deployment and verifies returned address is callable
- [ ] \`cargo test -p bitwork-factory\` passes`,
    },
    {
      title: "[Contract] Add factory registry mapping owner to deployed escrow list",
      labels: ["smart-contract", "soroban", "enhancement"],
      body: `## Task Description
Extend the Factory contract to maintain a registry in Persistent storage: \`owner → Vec<Address>\` (list of deployed escrow contracts).

Expose \`get_escrows(owner) -> Vec<Address>\` as a read-only query.

## Acceptance Criteria
- [ ] Registry updated on every \`create_escrow\` call
- [ ] \`get_escrows\` returns correct list per owner
- [ ] Unit tests: create multiple escrows for same owner, query registry`,
    },
    {
      title: "[Contract] Write unit tests – Factory contract",
      labels: ["smart-contract", "soroban", "good first issue"],
      body: `## Task Description
Write unit tests for the Factory contract covering:
1. Deploying a new escrow and verifying the returned address
2. Registry lookup via \`get_escrows\`
3. Unauthorized deploy (missing auth) returns error

## Acceptance Criteria
- [ ] All 3 scenarios have passing tests
- [ ] \`cargo test -p bitwork-factory\` passes`,
    },
    {
      title: "[Contract] Add upgradability (set_wasm / upgrade) for all contracts",
      labels: ["smart-contract", "soroban", "enhancement"],
      body: `## Task Description
Add a \`upgrade(new_wasm_hash: BytesN<32>)\` function to each contract. Only the \`admin\` may call it. Use \`env.deployer().update_current_contract_wasm(new_wasm_hash)\`.

## Acceptance Criteria
- [ ] \`upgrade\` implemented in \`bitwork_escrow\`, \`bitwork_id\`, and the Factory
- [ ] \`require_auth(admin)\` enforced
- [ ] Unit tests verify upgrade succeeds for admin and fails for non-admin
- [ ] All Clippy warnings resolved`,
    },

    // ── Backend / Infrastructure ──────────────────────────────────────────
    {
      title: "[Chore] Configure Cargo workspace with all three contract crates",
      labels: ["smart-contract", "good first issue"],
      body: `## Task Description
Set up the Cargo workspace \`Cargo.toml\` with members:
- \`contracts/bitwork_escrow\`
- \`contracts/bitwork_id\`
- \`contracts/factory\`

Each crate should have its own \`Cargo.toml\` with correct dependencies (\`soroban-sdk\`, \`soroban-token-sdk\`).

## Acceptance Criteria
- [ ] \`cargo build --all\` compiles without errors
- [ ] \`cargo test --all\` runs tests for all crates
- [ ] \`stellar contract build\` produces \`.wasm\` files for all three contracts
- [ ] Workspace-level \`Cargo.lock\` is committed`,
    },
    {
      title: "[Chore] Add testnet deployment scripts using Stellar CLI",
      labels: ["smart-contract", "enhancement"],
      body: `## Task Description
Add shell scripts under \`scripts/\` for deploying contracts to Stellar Testnet:
- \`scripts/deploy-escrow.sh\`
- \`scripts/deploy-id.sh\`
- \`scripts/deploy-factory.sh\`

Scripts should use \`stellar contract deploy\` and write contract IDs to \`.env.testnet\`.

## Acceptance Criteria
- [ ] Scripts accept a \`--network\` flag (\`testnet\` / \`mainnet\`)
- [ ] Deployed contract address echoed to stdout and written to \`.env.testnet\`
- [ ] README updated with deployment instructions
- [ ] Scripts are executable and pass \`shellcheck\``,
    },
    {
      title: "[Chore] Add integration test harness for multi-contract scenarios",
      labels: ["smart-contract", "soroban", "enhancement"],
      body: `## Task Description
Create a Rust integration test crate (\`tests/integration\`) that tests cross-contract interactions: Factory deploys Escrow → Escrow calls BitworkID on milestone release.

## Acceptance Criteria
- [ ] Integration tests live under \`tests/\` at workspace root
- [ ] Full flow: factory deploy → escrow fund → release → reputation update verified
- [ ] \`cargo test --test integration\` passes
- [ ] Added to the Contracts CI workflow`,
    },
    {
      title: "[Chore] Generate TypeScript bindings from Soroban contract ABI",
      labels: ["smart-contract", "enhancement", "frontend"],
      body: `## Task Description
Use \`stellar contract bindings typescript\` to generate TypeScript client bindings for all three contracts and place them in \`frontend/src/contracts/\`.

## Acceptance Criteria
- [ ] Generated clients committed to \`frontend/src/contracts/\`
- [ ] A \`scripts/gen-bindings.sh\` script automates regeneration
- [ ] \`frontend/src/contracts/index.ts\` re-exports all three clients
- [ ] README updated with binding generation instructions`,
    },
    {
      title: "[Chore] Add Dependabot configuration for Cargo and npm ecosystems",
      labels: ["good first issue"],
      body: `## Task Description
Create \`.github/dependabot.yml\` to automate dependency updates for:
- Cargo (smart contracts)
- npm (frontend)
- GitHub Actions

## Acceptance Criteria
- [ ] \`.github/dependabot.yml\` created with correct package-ecosystem entries
- [ ] Update schedule set to weekly
- [ ] PRs target the \`develop\` branch
- [ ] Labels set to \`dependencies\` for all update PRs`,
    },

    // ── Frontend Scaffold & Infrastructure ───────────────────────────────
    {
      title: "[Feature] Scaffold Next.js 14 App Router frontend with Tailwind CSS",
      labels: ["frontend", "enhancement"],
      body: `## Task Description
Bootstrap the \`frontend/\` directory using \`create-next-app\` with:
- Next.js 14 (App Router)
- TypeScript strict mode
- Tailwind CSS
- ESLint + Prettier

## Acceptance Criteria
- [ ] \`frontend/\` directory contains a valid Next.js 14 App Router project
- [ ] \`npm run dev\` starts the dev server on port 3000
- [ ] \`npm run build\` succeeds with zero errors
- [ ] \`npm run lint\` passes with zero warnings
- [ ] README updated with frontend setup instructions`,
    },
    {
      title: "[Feature] Integrate Freighter wallet connector and useWallet hook",
      labels: ["frontend", "enhancement"],
      body: `## Task Description
Integrate the Freighter browser extension wallet into the frontend using \`@stellar/freighter-api\`.

Create a \`useWallet\` React hook in \`frontend/src/lib/useWallet.ts\` that exposes:
- \`address\`: connected wallet address
- \`connect()\`: prompts Freighter to connect
- \`disconnect()\`: clears the session
- \`network\`: current network (Testnet / Mainnet)
- \`signTransaction(xdr)\`: signs and returns a signed XDR string

## Acceptance Criteria
- [ ] Hook exported from \`frontend/src/lib/index.ts\`
- [ ] WalletConnectButton component uses the hook
- [ ] Graceful error message if Freighter extension is not installed
- [ ] TypeScript strict — no \`any\`
- [ ] Unit tests for the hook (mocked Freighter API)`,
    },
    {
      title: "[Feature] Set up stellar-sdk / soroban-client transaction builder helpers",
      labels: ["frontend", "enhancement"],
      body: `## Task Description
Create helper functions in \`frontend/src/lib/stellar.ts\` for:
- Building and submitting Soroban contract invocations
- Polling for transaction finality (\`getTransaction\` RPC loop)
- Fee-bump transaction support
- Formatting XLM / USDC amounts for display

## Acceptance Criteria
- [ ] \`invokeContract(contractId, method, args, signer)\` helper implemented
- [ ] Polling helper with configurable timeout
- [ ] Amount formatter tested for edge cases (0, max i128, negative)
- [ ] TypeScript strict — no \`any\``,
    },
    {
      title: "[Chore] Configure ESLint, Prettier, and TypeScript strict mode for frontend",
      labels: ["frontend", "good first issue"],
      body: `## Task Description
Configure the frontend linting and formatting toolchain:
- ESLint with \`@typescript-eslint\` and Next.js rules
- Prettier with project-consistent config
- TypeScript \`strict: true\` in \`tsconfig.json\`

## Acceptance Criteria
- [ ] \`.eslintrc.json\` (or \`eslint.config.mjs\`) present and configured
- [ ] \`.prettierrc\` present with agreed-upon rules
- [ ] \`tsconfig.json\` has \`"strict": true\`
- [ ] \`npm run lint\` passes on the initial scaffold
- [ ] \`npm run type-check\` passes`,
    },
    {
      title: "[Feature] Add environment variable management (.env.example)",
      labels: ["frontend", "good first issue"],
      body: `## Task Description
Create \`frontend/.env.example\` documenting all required environment variables:
- \`NEXT_PUBLIC_STELLAR_NETWORK\` (testnet / mainnet)
- \`NEXT_PUBLIC_SOROBAN_RPC_URL\`
- \`NEXT_PUBLIC_ESCROW_CONTRACT_ID\`
- \`NEXT_PUBLIC_BITWORKID_CONTRACT_ID\`
- \`NEXT_PUBLIC_FACTORY_CONTRACT_ID\`
- \`NEXT_PUBLIC_USDC_CONTRACT_ID\`

## Acceptance Criteria
- [ ] \`frontend/.env.example\` committed with placeholder values
- [ ] \`frontend/.env.local\` added to \`.gitignore\`
- [ ] README references \`.env.example\` in setup instructions
- [ ] Type-safe env access via a \`frontend/src/lib/env.ts\` module`,
    },

    // ── Frontend UI ───────────────────────────────────────────────────────
    {
      title: "[Feature] Build landing / home page with hero and feature sections",
      labels: ["frontend", "enhancement"],
      body: `## Task Description
Design and implement the BitWork landing page (\`frontend/src/app/page.tsx\`) including:
- Hero section: headline, sub-headline, CTA buttons (Get Started / Learn More)
- Feature grid: Trustless Escrow, Verifiable Reputation, Low-Cost Settlement
- How It Works: 3-step explainer
- Footer with links

## Acceptance Criteria
- [ ] Page is responsive (mobile-first, Tailwind breakpoints)
- [ ] Passes Lighthouse accessibility score ≥ 90
- [ ] \`npm run build\` succeeds
- [ ] No TypeScript errors`,
    },
    {
      title: "[Feature] Build job posting and proposal creation form",
      labels: ["frontend", "enhancement"],
      body: `## Task Description
Build a multi-step form at \`/new-job\` that allows an **owner** to:
1. Enter job title, description, and total budget
2. Add milestones (description, amount, deadline)
3. Enter builder's Stellar address
4. Review & submit (invokes Factory \`create_escrow\`)

## Acceptance Criteria
- [ ] Multi-step form with validation (react-hook-form + zod)
- [ ] Stellar address validation (correct format check)
- [ ] Milestone amounts must sum to ≤ total budget
- [ ] On submit: calls Factory contract via \`invokeContract\` helper
- [ ] Shows success state with contract address link to Stellar Expert
- [ ] TypeScript strict — no \`any\``,
    },
    {
      title: "[Feature] Build escrow dashboard listing active engagements",
      labels: ["frontend", "enhancement"],
      body: `## Task Description
Build the main dashboard at \`/dashboard\` listing all escrow contracts for the connected wallet address (both as owner and builder).

## Acceptance Criteria
- [ ] Fetches escrow list from Factory \`get_escrows\` or event indexer
- [ ] Cards show: counterparty address, total value, milestone progress, status badge
- [ ] Supports filtering by status (Active, Completed, Disputed)
- [ ] Links to individual escrow detail page
- [ ] Loading skeleton shown while fetching
- [ ] Empty state with CTA to create first job`,
    },
    {
      title: "[Feature] Build milestone tracker UI (progress, status, release action)",
      labels: ["frontend", "enhancement"],
      body: `## Task Description
Build the escrow detail page at \`/escrow/[contractId]\` showing:
- Escrow metadata (parties, token, total value)
- Milestone list with status chips (Pending / Funded / Released / Disputed)
- Action buttons: Deposit Funds, Release Milestone, Dispute, Claim Timeout

## Acceptance Criteria
- [ ] Reads escrow state from Soroban RPC using generated bindings
- [ ] Buttons conditionally visible based on connected wallet role (owner vs builder)
- [ ] Each action invokes the correct contract function
- [ ] Transaction status toast after each action
- [ ] TypeScript strict — no \`any\``,
    },
    {
      title: "[Feature] Build builder profile / reputation page",
      labels: ["frontend", "enhancement"],
      body: `## Task Description
Build a public profile page at \`/profile/[address]\` displaying a builder's on-chain reputation:
- Avatar (Gravatar or blockie fallback), truncated address + ENS-style name
- Overall rating (star display), total jobs, total volume
- Skill attestation badges
- Job history timeline

## Acceptance Criteria
- [ ] Reads data from \`bitwork_id\` contract via \`get_reputation\` and \`get_job_history\`
- [ ] Star rating rendered as an accessible SVG component
- [ ] Skill badges sorted by attestation count
- [ ] Shareable URL (no wallet connection required to view)`,
    },
    {
      title: "[Feature] Implement USDC balance display in wallet header",
      labels: ["frontend", "enhancement", "good first issue"],
      body: `## Task Description
Show the connected wallet's USDC balance in the site header. Use the USDC SAC contract's \`balance(address)\` function via Soroban RPC simulation.

## Acceptance Criteria
- [ ] USDC balance displayed next to wallet address in header
- [ ] Balance refreshes after every transaction
- [ ] Formatted as \`1,234.56 USDC\` (2 decimal places, thousands separator)
- [ ] Shows \`--\` when wallet is not connected
- [ ] Unit test for the balance formatter utility`,
    },
    {
      title: "[Feature] Build dispute filing UI flow",
      labels: ["frontend", "enhancement"],
      body: `## Task Description
Build a modal/page for filing a dispute on a milestone at \`/escrow/[contractId]/dispute/[milestoneId]\`:
1. Reason selection (Incomplete Work / Non-Delivery / Other)
2. Description textarea
3. Evidence upload (IPFS link or text)
4. Confirm & submit (calls \`dispute_milestone\`)

## Acceptance Criteria
- [ ] Only visible to owner or builder on a \`Funded\` milestone
- [ ] Form validated before submission
- [ ] Contract call uses \`invokeContract\` helper
- [ ] Navigates back to escrow detail with updated status after success`,
    },
    {
      title: "[Feature] Add toast notification system for transaction status",
      labels: ["frontend", "good first issue"],
      body: `## Task Description
Add a toast/notification system for transaction lifecycle feedback:
- Pending: "Transaction submitted…"
- Success: "Transaction confirmed ✓" with Stellar Expert link
- Error: "Transaction failed" with error detail

Use a lightweight library (e.g., \`react-hot-toast\` or a custom component).

## Acceptance Criteria
- [ ] Toast provider added to root layout
- [ ] Success toast includes Stellar Expert transaction link
- [ ] Error toast displays human-readable error from Soroban diagnostic events
- [ ] Unit test for the toast utility hook`,
    },
    {
      title: "[Feature] Implement loading skeletons and Suspense fallbacks",
      labels: ["frontend", "good first issue"],
      body: `## Task Description
Add skeleton loaders and Next.js \`<Suspense>\` boundaries to all data-fetching pages (dashboard, escrow detail, profile) to prevent layout shift during loading.

## Acceptance Criteria
- [ ] \`DashboardSkeleton\`, \`EscrowDetailSkeleton\`, \`ProfileSkeleton\` components created
- [ ] Used as Suspense \`fallback\` on the respective pages
- [ ] Skeleton uses Tailwind \`animate-pulse\` classes
- [ ] Accessible (aria-busy on container)`,
    },
    {
      title: "[Feature] Add Stellar Expert deep-link explorer integration",
      labels: ["frontend", "good first issue"],
      body: `## Task Description
Create a utility in \`frontend/src/lib/stellarExpert.ts\` that generates Stellar Expert URLs for:
- Accounts: \`https://stellar.expert/explorer/{network}/account/{address}\`
- Transactions: \`.../tx/{txHash}\`
- Contracts: \`.../contract/{contractId}\`

Use this utility throughout the app for all address/tx/contract displays.

## Acceptance Criteria
- [ ] Utility exported from \`lib/index.ts\`
- [ ] Network-aware: uses \`NEXT_PUBLIC_STELLAR_NETWORK\` env var
- [ ] Used in: wallet header, transaction toasts, escrow detail, profile page
- [ ] Unit tests for all three URL generators (testnet + mainnet)`,
    },

    // ── SDK / Library (lib/) ──────────────────────────────────────────────
    {
      title: "[Feature] Implement EscrowClient helper wrapping generated bindings",
      labels: ["frontend", "enhancement"],
      body: `## Task Description
Create \`frontend/src/lib/escrowClient.ts\` that wraps the generated Soroban bindings for \`bitwork_escrow\` with:
- Error normalization (Soroban error codes → human-readable messages)
- Automatic fee estimation via \`simulateTransaction\`
- Retry logic for rate limits

## Acceptance Criteria
- [ ] \`EscrowClient\` class instantiated with \`contractId\` and \`rpcUrl\`
- [ ] All escrow entry points wrapped: \`initialize\`, \`createMilestone\`, \`depositFunds\`, \`releaseMilestone\`, \`disputeMilestone\`
- [ ] TypeScript strict — no \`any\`
- [ ] Unit tests with mocked RPC responses`,
    },
    {
      title: "[Feature] Implement ReputationClient helper wrapping generated bindings",
      labels: ["frontend", "enhancement"],
      body: `## Task Description
Create \`frontend/src/lib/reputationClient.ts\` wrapping the generated \`bitwork_id\` Soroban bindings with the same error normalization and fee estimation patterns as \`EscrowClient\`.

## Acceptance Criteria
- [ ] \`ReputationClient\` wraps: \`getReputation\`, \`getJobHistory\`, \`getAttestations\`
- [ ] Formats reputation data for UI consumption (average rating as float)
- [ ] TypeScript strict — no \`any\`
- [ ] Unit tests with mocked RPC`,
    },

    // ── Frontend Tests ────────────────────────────────────────────────────
    {
      title: "[Test] Set up Jest and React Testing Library with coverage reporting",
      labels: ["frontend", "enhancement"],
      body: `## Task Description
Install and configure the frontend test infrastructure:
- \`jest\` + \`jest-environment-jsdom\`
- \`@testing-library/react\` + \`@testing-library/user-event\`
- \`@testing-library/jest-dom\` matchers
- Coverage reporting (lcov + text)

## Acceptance Criteria
- [ ] \`jest.config.ts\` (or \`jest.config.js\`) present
- [ ] \`npm test\` runs all tests
- [ ] \`npm test -- --coverage\` generates a coverage report
- [ ] A sample smoke test (\`app/page.test.tsx\`) passes
- [ ] CI Frontend workflow passes`,
    },
    {
      title: "[Test] Write tests for WalletConnect component",
      labels: ["frontend", "good first issue"],
      body: `## Task Description
Write unit tests for the WalletConnect / wallet header component using React Testing Library:
1. Renders "Connect Wallet" button when disconnected
2. Calls \`connect()\` hook on button click
3. Renders truncated address when connected
4. Renders USDC balance when connected

## Acceptance Criteria
- [ ] Freighter API mocked in tests
- [ ] All 4 scenarios have passing tests
- [ ] \`npm test\` passes with 0 failures`,
    },
    {
      title: "[Test] Write tests for EscrowForm validation logic",
      labels: ["frontend", "good first issue"],
      body: `## Task Description
Write unit tests for the job/escrow creation form:
1. Submitting with empty fields shows validation errors
2. Invalid Stellar address shows error
3. Milestone amounts exceeding budget shows error
4. Valid form calls \`invokeContract\` with correct arguments

## Acceptance Criteria
- [ ] React Testing Library + user-event used for interactions
- [ ] \`invokeContract\` mocked
- [ ] All 4 scenarios covered
- [ ] \`npm test\` passes`,
    },
    {
      title: "[Test] Write tests for MilestoneList display component",
      labels: ["frontend", "good first issue"],
      body: `## Task Description
Write unit tests for the MilestoneList component:
1. Renders correct number of milestone cards from mock data
2. Status chips display correct label for each status
3. "Release" button visible only for owner on \`Funded\` milestone
4. "Dispute" button visible only for owner or builder on \`Funded\` milestone

## Acceptance Criteria
- [ ] Mock escrow state provided via props
- [ ] All 4 scenarios covered
- [ ] \`npm test\` passes`,
    },
    {
      title: "[Test] Write tests for reputation score display component",
      labels: ["frontend", "good first issue"],
      body: `## Task Description
Write unit tests for the reputation/profile display:
1. Correct number of filled vs empty stars rendered
2. Total jobs and volume formatted correctly
3. Skill badges displayed in correct order
4. "No reputation yet" empty state for a new builder

## Acceptance Criteria
- [ ] Mock reputation data provided as props
- [ ] All 4 scenarios covered
- [ ] \`npm test\` passes`,
    },
    {
      title: "[Test] Add Playwright E2E tests for escrow creation happy path",
      labels: ["frontend", "enhancement"],
      body: `## Task Description
Add Playwright end-to-end tests that simulate the full escrow creation happy path against a Testnet or local Soroban emulator:
1. Connect wallet (Freighter mock)
2. Fill in job form
3. Submit → Factory deploys escrow
4. Dashboard shows new escrow card
5. Deposit funds
6. Release milestone

## Acceptance Criteria
- [ ] \`playwright.config.ts\` present in \`frontend/\`
- [ ] E2E test covers all 6 steps
- [ ] \`npx playwright test\` passes against a local dev server
- [ ] Added to CI as a separate \`e2e\` job (runs on PRs to \`main\` only)`,
    },

    // ── CI / Tooling ──────────────────────────────────────────────────────
    {
      title: "[Chore] Add testnet auto-deploy workflow triggered on merge to develop",
      labels: ["enhancement"],
      body: `## Task Description
Create \`.github/workflows/deploy-testnet.yml\` that automatically deploys all three contracts to Stellar Testnet on every merge to the \`develop\` branch.

## Acceptance Criteria
- [ ] Workflow triggers on \`push\` to \`develop\`
- [ ] Uses repository secrets for testnet keypair (\`STELLAR_SECRET_KEY\`)
- [ ] Stores deployed contract IDs as GitHub Actions outputs / environment variables
- [ ] Posts a summary comment on the triggering commit with contract addresses
- [ ] Workflow uses least-privilege permissions`,
    },
    {
      title: "[Chore] Add pre-commit hooks with Husky and lint-staged",
      labels: ["frontend", "good first issue"],
      body: `## Task Description
Set up pre-commit hooks using \`husky\` and \`lint-staged\` in the frontend to enforce code quality before every commit:
- Run \`eslint --fix\` on staged \`.ts\` / \`.tsx\` files
- Run \`prettier --write\` on all staged files
- Run \`cargo fmt\` on staged \`.rs\` files (using a shell hook)

## Acceptance Criteria
- [ ] \`.husky/pre-commit\` script present
- [ ] \`lint-staged\` config in \`package.json\` or \`.lintstagedrc\`
- [ ] Pre-commit hook blocks commit on lint errors
- [ ] README updated with setup step (\`npm run prepare\`)`,
    },
    {
      title: "[Chore] Add GitHub issue and PR templates for frontend tasks",
      labels: ["good first issue"],
      body: `## Task Description
Add a \`frontend_task.yml\` issue template in \`.github/ISSUE_TEMPLATE/\` mirroring the existing \`contract_task.yml\`, tailored for frontend work items (component name, affected page, browser support).

Also review and update \`.github/PULL_REQUEST_TEMPLATE.md\` to include a frontend-specific checklist section.

## Acceptance Criteria
- [ ] \`frontend_task.yml\` issue template present and valid
- [ ] Template includes: affected component, affected page, accessibility checklist
- [ ] PR template has a "Frontend Checklist" section (lint, type-check, tests, a11y)
- [ ] \`config.yml\` updated to reference new template if needed`,
    },
  ];

  // ── create issues ────────────────────────────────────────────────────────
  const existing = await existingTitles();
  let created = 0;
  let skipped = 0;

  for (const issue of issues) {
    if (existing.has(issue.title)) {
      console.log(`⏭  Skipping (already exists): ${issue.title}`);
      skipped++;
      continue;
    }
    await github.rest.issues.create({
      owner,
      repo,
      title: issue.title,
      body: issue.body,
      labels: issue.labels,
    });
    console.log(`✅ Created: ${issue.title}`);
    created++;
    // Respect GitHub secondary rate limit (10 creates per minute)
    await new Promise((r) => setTimeout(r, 6500));
  }

  console.log(`\nDone. Created: ${created}  Skipped (duplicate): ${skipped}`);
};
