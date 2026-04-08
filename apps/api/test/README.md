# Test Coverage Scope

Automated tests now cover:
- API unit/integration-style service tests in `apps/api/test/*.spec.ts`
- Web system/NFR UI tests in `apps/web/src/**/*.spec.tsx`

## Traceability Snapshot

- `TC1 / FR1` Log AI usage: `ai-logs.service.spec.ts`
- `TC2 / FR2` Generate declaration: `declarations.service.spec.ts`
- `TC3 / FR3` Categorize usage purpose: `ai-logs.service.spec.ts`, `analytics.service.spec.ts`
- `TC4 / FR4` Course/assignment guideline retrieval: `guidelines.service.spec.ts`
- `TC5 / FR5` Compliance feedback generation: `compliance.service.spec.ts`
- `TC6 / FR6` Usage-over-time shown in dashboard analytics UI: `apps/web/src/features/analytics/analytics-page.spec.tsx`
- `TC7 / FR7` AI logs organized by assignment context: `ai-logs.service.spec.ts`, `apps/web/src/features/ai-logs/logs-panel.spec.tsx`
- `TC8 / FR8` Export metadata JSON generation: `privacy.service.spec.ts`
- `TC9 / FR9` Aggregated anonymized usage output shape: `analytics.service.spec.ts`
- `TC10 / NFR1` Unauthorized/forbidden data access paths: `ai-logs.service.spec.ts`, `compliance.service.spec.ts`
- `TC11 / NFR2` Transparency text visible in privacy UI: `apps/web/src/features/privacy/privacy-settings-page.spec.tsx`
- `TC12 / NFR4` Guidance-oriented compliance feedback rendering: `apps/web/src/features/compliance/compliance-panel.spec.tsx`
- `TC13 / NFR5` GDPR-aligned raw prompt retention workflow: `privacy.service.spec.ts`
