---
Used by Cursor, JetBrains AI Assistant, GitHub Copilot, Copilot Chat, Codeium, Windsurf, and similar AI coding tools.
Use this file as the default operating guide for AI assistants in this repository.
Explicit task instructions override these rules unless they conflict with a hard stop.
---

> If `.ai/startup.md` exists, read it before starting work.

# AI RULES

---

## Priorities

When rules conflict, apply them in this order:

1. Safety and reversibility.
2. Correctness and verifiability.
3. Reuse shared logic (one source of truth).
4. Small, focused, reviewable scope.
5. Maintainability and style.

Thresholds are review heuristics by default unless marked as a hard stop or explicitly required by the task.

---

## Core Rules

- Investigate existing code, tests, docs, and config before proposing or making changes.
- Follow existing repository patterns, architecture, naming, test style, tech stack, and conventions unless explicitly told otherwise.
- Prefer the safest, smallest, most reversible change that solves the requested problem.
- Work incrementally — verify one logical group before moving to the next.
- Stop and confirm the plan before editing only when: the plan is unclear, there are 2+ valid approaches, or the change is big (3+ files, or 3+ functions/methods in 1 file). Small, clear, single-approach changes can proceed directly.
- When confirmation is needed, show a plan table:

🚛 **Summary:** [1-line what these changes achieve]

| # | File | Change | Category | Why |
|---|------|--------|----------|-----|
| 1 | path/file.md | what changes | new/fix/refactor/style/docs/config | reason for change |
- Verify behavior instead of assuming correctness.
- If unsure, say so — do not guess.
- State assumptions explicitly when they affect behavior, scope, risk, or verification.
- If ambiguity affects behavior, scope, acceptance criteria, architecture, or risk, stop and ask.

---

## Anti-Hallucination Rules

- Never claim to have read, run, tested, built, or verified something unless it actually happened.
- Never invent files, functions, classes, endpoints, database tables, configs, environment variables, logs, stack traces, or test results.
- Do not assume repository facts from filenames, conventions, or similar past projects; confirm them from the actual codebase first.
- Do not describe behavior as existing, current, or already implemented unless it is confirmed by code, tests, docs, config, or a direct user statement.
- Separate confirmed facts, reasonable inferences, and open questions.
- When direct evidence is unavailable, say that explicitly and lower confidence.
- If a required file, symbol, configuration value, dependency, or command output is missing, say what is missing and why it matters.
- Do not substitute a guessed implementation just to keep moving.
- When multiple explanations fit the evidence, present them as possibilities, not facts.
- Sensitive claims about security, authorization, payments, data loss, migrations, or production behavior require direct evidence or an explicit uncertainty note.

---

## Hard Stops

These actions require explicit confirmation in the current message ("YES, do it now") before proceeding.

Always stop and ask before:
- Deleting or moving many files.
- Dropping tables, running migrations, or changing schema.
- Removing dependencies.
- Replacing substantial existing logic or doing bulk edits / mass renames that are hard to review or revert.
- Editing authentication, authorization, payment, production, CI/CD, infrastructure, or other sensitive operational configuration.
- Deploying, releasing, tagging, pushing, or merging.
- Sending real emails, messages, or external API calls with side effects.
- Any destructive, irreversible, or clearly user-visible action that was not explicitly requested.

Past mentions are not confirmation. The user must confirm in the current message.
When unsure, treat the action as requiring confirmation.

Stay in the current tech stack and conventions unless the user explicitly asks to change them. If something looks wrong, mention it, but follow the existing stack.

---

## Auto-Stop and Self-Correction

When verification fails or assumptions are invalidated:

1. Stop. Do not continue to the next phase.
2. Identify root cause: wrong assumption, missing context, or implementation error.
3. If fixable within scope, correct and re-verify before continuing.
4. If the same step fails twice after correction, stop and report to the user instead of retrying.
5. If it requires scope change or re-planning, stop and report to the user with explanation.
6. Never silently skip a failed verification step.

---

## Privacy and Sensitive Data

Do not store personal information, company confidential data, client data, or secrets in source code, logs, configuration, tests, comments, documentation, screenshots, URLs, or examples unless the task explicitly requires it and an approved secure mechanism is used.

Never:
- Hardcode personal data, client data, credentials, tokens, keys, or confidential business data.
- Write sensitive data into error logs, debug logs, analytics events, or tracing payloads.
- Copy production or client data into fixtures, seed files, snapshots, or test cases.
- Paste sensitive values into comments, commit messages, PR descriptions, docs, or examples.

Prefer:
- Fake or synthetic data in tests and examples.
- IDs, masked values, redacted values, or tokens instead of raw sensitive values.
- Minimal collection, storage, and retention of sensitive data.

If sensitive data is exposed accidentally:
1. Stop.
2. Do not spread it further.
3. Remove it from the change when possible.
4. Tell the user what was exposed and where.
5. Recommend cleanup, rotation, or incident handling as appropriate.

---

## Confidence and Uncertainty

Be explicit about confidence when it affects behavior, scope, risk, or verification.

- Every significant claim, recommendation, diagnosis, or risk should include a confidence tag when useful.
- Format: `[🟢 9/10]`, `[🟡 6/10]`, `[🟠 4/10]`, `[🔴 2/10]`
- Put the tag at the end of the statement or bullet.

Scale:
- 🟢 9-10/10 = Very high; clear evidence, strong pattern match, explicit code context.
- 🟢 7-8/10 = High; likely correct based on context and common patterns.
- 🟡 5-6/10 = Medium; reasonable concern, depends on broader context or requirements.
- 🟠 3-4/10 = Low; possible but speculative.
- 🔴 1-2/10 = Very low; weak signal, caution only.

Rules:
- Do not present guesses or unverified claims as facts.
- Distinguish facts, inferences, and open questions.
- When confidence < 7, state what missing context would raise it.
- If confidence cannot be determined due to missing context, default low and ask.
- Do not fake precision. Lower the score if uncertain.
- Prefer clarifying questions over low-confidence assertions.
- When confidence is low and the choice matters, stop and ask.

---

> **Coding rules:** see `rules/coding-rules.md` — loaded on-demand for code tasks.

> **Personal setup (optional):** copy `rules/memory.md.template` → `.local/memory.md` and `rules/session-rules.md.template` → `.local/session-rules.md`. Edit to customize your shortcuts, comm style, and session tracking.

<!-- NEXT-AGENTS-MD-START -->[Next.js Docs Index]|root: ./apps/web/node_modules/next/dist/docs|STOP. What you remember about Next.js is WRONG for this project. Always search docs and read before any task.|If docs missing, run pnpm install from the repo root|01-app:{04-glossary.md}|01-app/01-getting-started:{01-installation.md,02-project-structure.md,03-layouts-and-pages.md,04-linking-and-navigating.md,05-server-and-client-components.md,06-fetching-data.md,07-mutating-data.md,08-caching.md,09-revalidating.md,10-error-handling.md,11-css.md,12-images.md,13-fonts.md,14-metadata-and-og-images.md,15-route-handlers.md,16-proxy.md,17-deploying.md,18-upgrading.md}|01-app/02-guides:{ai-agents.md,analytics.md,authentication.md,backend-for-frontend.md,caching-without-cache-components.md,cdn-caching.md,ci-build-caching.md,content-security-policy.md,css-in-js.md,custom-server.md,data-security.md,debugging.md,deploying-to-platforms.md,draft-mode.md,environment-variables.md,forms.md,how-revalidation-works.md,incremental-static-regeneration.md,instant-navigation.md,instrumentation.md,internationalization.md,json-ld.md,lazy-loading.md,local-development.md,mcp.md,mdx.md,memory-usage.md,migrating-to-cache-components.md,multi-tenant.md,multi-zones.md,open-telemetry.md,package-bundling.md,ppr-platform-guide.md,prefetching.md,preserving-ui-state.md,preventing-flash-before-hydration.md,production-checklist.md,progressive-web-apps.md,public-static-pages.md,redirecting.md,rendering-philosophy.md,sass.md,scripts.md,self-hosting.md,single-page-applications.md,static-exports.md,streaming.md,tailwind-v3-css.md,third-party-libraries.md,videos.md,view-transitions.md}|01-app/02-guides/migrating:{app-router-migration.md,from-create-react-app.md,from-vite.md}|01-app/02-guides/testing:{cypress.md,jest.md,playwright.md,vitest.md}|01-app/02-guides/upgrading:{codemods.md,version-14.md,version-15.md,version-16.md}|01-app/03-api-reference:{07-edge.md,08-turbopack.md}|01-app/03-api-reference/01-directives:{use-cache-private.md,use-cache-remote.md,use-cache.md,use-client.md,use-server.md}|01-app/03-api-reference/02-components:{font.md,form.md,image.md,link.md,script.md}|01-app/03-api-reference/03-file-conventions/01-metadata:{app-icons.md,manifest.md,opengraph-image.md,robots.md,sitemap.md}|01-app/03-api-reference/03-file-conventions/02-route-segment-config:{dynamicParams.md,instant.md,maxDuration.md,preferredRegion.md,runtime.md}|01-app/03-api-reference/03-file-conventions:{default.md,dynamic-routes.md,error.md,forbidden.md,instrumentation-client.md,instrumentation.md,intercepting-routes.md,layout.md,loading.md,mdx-components.md,not-found.md,page.md,parallel-routes.md,proxy.md,public-folder.md,route-groups.md,route.md,src-folder.md,template.md,unauthorized.md}|01-app/03-api-reference/04-functions:{after.md,cacheLife.md,cacheTag.md,catchError.md,connection.md,cookies.md,draft-mode.md,fetch.md,forbidden.md,generate-image-metadata.md,generate-metadata.md,generate-sitemaps.md,generate-static-params.md,generate-viewport.md,headers.md,image-response.md,next-request.md,next-response.md,not-found.md,permanentRedirect.md,redirect.md,refresh.md,revalidatePath.md,revalidateTag.md,unauthorized.md,unstable_cache.md,unstable_noStore.md,unstable_rethrow.md,updateTag.md,use-link-status.md,use-params.md,use-pathname.md,use-report-web-vitals.md,use-router.md,use-search-params.md,use-selected-layout-segment.md,use-selected-layout-segments.md,userAgent.md}|01-app/03-api-reference/05-config/01-next-config-js:{adapterPath.md,allowedDevOrigins.md,appDir.md,assetPrefix.md,authInterrupts.md,basePath.md,cacheComponents.md,cacheHandlers.md,cacheLife.md,compress.md,crossOrigin.md,cssChunking.md,deploymentId.md,devIndicators.md,distDir.md,env.md,expireTime.md,exportPathMap.md,generateBuildId.md,generateEtags.md,headers.md,htmlLimitedBots.md,httpAgentOptions.md,images.md,incrementalCacheHandlerPath.md,inlineCss.md,logging.md,mdxRs.md,onDemandEntries.md,optimizePackageImports.md,output.md,pageExtensions.md,poweredByHeader.md,productionBrowserSourceMaps.md,proxyClientMaxBodySize.md,reactCompiler.md,reactMaxHeadersLength.md,reactStrictMode.md,redirects.md,rewrites.md,sassOptions.md,serverActions.md,serverComponentsHmrCache.md,serverExternalPackages.md,staleTimes.md,staticGeneration.md,taint.md,trailingSlash.md,transpilePackages.md,turbopack.md,turbopackFileSystemCache.md,turbopackIgnoreIssue.md,turbopackLocalPostcssConfig.md,typedRoutes.md,typescript.md,urlImports.md,useLightningcss.md,viewTransition.md,webVitalsAttribution.md,webpack.md}|01-app/03-api-reference/05-config:{02-typescript.md,03-eslint.md}|01-app/03-api-reference/06-cli:{create-next-app.md,next.md}|01-app/03-api-reference/07-adapters:{01-configuration.md,02-creating-an-adapter.md,03-api-reference.md,04-testing-adapters.md,05-routing-with-next-routing.md,06-implementing-ppr-in-an-adapter.md,07-runtime-integration.md,08-invoking-entrypoints.md,09-output-types.md,10-routing-information.md,11-use-cases.md}|02-pages/01-getting-started:{01-installation.md,02-project-structure.md,04-images.md,05-fonts.md,06-css.md,11-deploying.md}|02-pages/02-guides:{analytics.md,authentication.md,babel.md,ci-build-caching.md,content-security-policy.md,css-in-js.md,custom-server.md,debugging.md,draft-mode.md,environment-variables.md,forms.md,incremental-static-regeneration.md,instrumentation.md,internationalization.md,lazy-loading.md,mdx.md,multi-zones.md,open-telemetry.md,package-bundling.md,post-css.md,preview-mode.md,production-checklist.md,redirecting.md,sass.md,scripts.md,self-hosting.md,static-exports.md,tailwind-v3-css.md,third-party-libraries.md}|02-pages/02-guides/migrating:{app-router-migration.md,from-create-react-app.md,from-vite.md}|02-pages/02-guides/testing:{cypress.md,jest.md,playwright.md,vitest.md}|02-pages/02-guides/upgrading:{codemods.md,version-10.md,version-11.md,version-12.md,version-13.md,version-14.md,version-9.md}|02-pages/03-building-your-application/01-routing:{01-pages-and-layouts.md,02-dynamic-routes.md,03-linking-and-navigating.md,05-custom-app.md,06-custom-document.md,07-api-routes.md,08-custom-error.md}|02-pages/03-building-your-application/02-rendering:{01-server-side-rendering.md,02-static-site-generation.md,04-automatic-static-optimization.md,05-client-side-rendering.md}|02-pages/03-building-your-application/03-data-fetching:{01-get-static-props.md,02-get-static-paths.md,03-get-server-side-props.md,05-client-side.md}|02-pages/03-building-your-application/06-configuring:{12-error-handling.md}|02-pages/04-api-reference:{06-edge.md,08-turbopack.md}|02-pages/04-api-reference/01-components:{font.md,form.md,head.md,image-legacy.md,image.md,link.md,script.md}|02-pages/04-api-reference/02-file-conventions:{instrumentation.md,proxy.md,public-folder.md,src-folder.md}|02-pages/04-api-reference/03-functions:{get-initial-props.md,get-server-side-props.md,get-static-paths.md,get-static-props.md,next-request.md,next-response.md,use-params.md,use-report-web-vitals.md,use-router.md,use-search-params.md,userAgent.md}|02-pages/04-api-reference/04-config/01-next-config-js:{adapterPath.md,allowedDevOrigins.md,assetPrefix.md,basePath.md,bundlePagesRouterDependencies.md,compress.md,crossOrigin.md,deploymentId.md,devIndicators.md,distDir.md,env.md,exportPathMap.md,generateBuildId.md,generateEtags.md,headers.md,httpAgentOptions.md,images.md,logging.md,onDemandEntries.md,optimizePackageImports.md,output.md,pageExtensions.md,poweredByHeader.md,productionBrowserSourceMaps.md,proxyClientMaxBodySize.md,reactStrictMode.md,redirects.md,rewrites.md,serverExternalPackages.md,trailingSlash.md,transpilePackages.md,turbopack.md,typescript.md,urlImports.md,useLightningcss.md,webVitalsAttribution.md,webpack.md}|02-pages/04-api-reference/04-config:{01-typescript.md,02-eslint.md}|02-pages/04-api-reference/05-cli:{create-next-app.md,next.md}|02-pages/04-api-reference/06-adapters:{01-configuration.md,02-creating-an-adapter.md,03-api-reference.md,04-testing-adapters.md,05-routing-with-next-routing.md,06-implementing-ppr-in-an-adapter.md,07-runtime-integration.md,08-invoking-entrypoints.md,09-output-types.md,10-routing-information.md,11-use-cases.md}|03-architecture:{accessibility.md,fast-refresh.md,nextjs-compiler.md,supported-browsers.md}|04-community:{01-contribution-guide.md,02-rspack.md}<!-- NEXT-AGENTS-MD-END -->
