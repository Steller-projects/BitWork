/**
 * create-issues.js
 *
 * Called by the `create-issues.yml` workflow via `actions/github-script`.
 * Creates 53 scoped tasks covering smart contracts, backend, frontend, tests,
 * and CI/tooling — skipping any issue whose title already exists.
 *
 * Issue definitions live in issues-data.js (shared with create-issues.sh).
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

  // ── issue definitions (shared with create-issues.sh) ─────────────────────
  const issues = require("./issues-data.js");

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
