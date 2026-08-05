# Example Output

## 1. Objective
- Add CSV export for the Orders list so support users can download the currently filtered results from the admin UI.
- Confidence level: Medium

## 2. Evidence
- Relevant files/modules:

| File/Module | Why it is relevant |
| --- | --- |
| `src/admin/orders/OrdersPage.tsx` | Owns the Orders list UI, filter state, and toolbar actions. |
| `src/api/orders.ts` | Contains the client methods used by the Orders page to fetch filtered order data. |
| `server/routes/orders.ts` | Defines the backend Orders endpoints and request validation. |
| `server/services/orderService.ts` | Builds the filtered Orders query and shapes the response data. |

- Similar implementations:

| File/Module | Why it is relevant |
| --- | --- |
| `src/admin/customers/CustomersPage.tsx` | Already exposes a toolbar export action with loading and error handling. |
| `server/routes/customers.ts` | Shows the existing pattern for returning CSV downloads from Express routes. |
| `server/services/customerExportService.ts` | Demonstrates CSV generation, column mapping, and filename conventions used in the repo. |

- Existing patterns to follow
  - Keep export actions in the page toolbar beside existing filter and refresh controls.
  - Reuse the current filter DTO instead of introducing a second export-specific request shape.
  - Stream CSV from the backend rather than generating it in the browser.

- Tests/config/contracts found
  - `src/admin/orders/OrdersPage.test.tsx` covers filter application and toolbar actions.
  - `server/routes/orders.test.ts` covers auth and request validation for Orders endpoints.
  - `server/contracts/orderFilters.ts` defines the shared filter contract used by client and server.
  - `config/permissions.ts` contains the support-admin permission gate used by the Orders page.

## 3. Questions and Answers

| Blocker/Non-blocker | Question | Answer/Status | Owner if deferred |
| --- | --- | --- | --- |
| Blocker | Should the export include all filtered rows or only the current paginated page? | Answered: export all rows matching active filters. | User |
| Blocker | Which roles may use export? | Answered: same roles that can access the Orders admin page; no new permission model. | User |
| Non-blocker | Should the CSV contain internal order IDs that are hidden in the UI? | Answered: yes, include internal order ID as the first column for support workflows. | User |
| Non-blocker | Do we need a background job for large exports? | Answered: no for this phase; synchronous export is acceptable up to current page filter limits. | User |

## 4. Additional Decisions and Risks
- Additional decisions confirmed with user beyond Q&A section
  - Filename format should be `orders-YYYY-MM-DD.csv`.
  - Export should preserve the current UI sort order when possible.

- Key risks and mitigations
  - Risk: exporting all filtered rows could time out on broad queries.
    - Mitigation: enforce existing maximum date-range filter limits and add route-level timing logs.
  - Risk: CSV column order may drift from support team expectations.
    - Mitigation: codify column order in a dedicated export mapper and cover it with a server test.

- Alternatives considered
  - Generate CSV in the browser from currently loaded rows -> rejected because it would export only one page and bypass server-side filter truth.
  - Queue async exports with email delivery -> rejected for now because current requirements do not justify new infra.

## 5. Plan
### Step 1: Confirm and reuse the existing Orders filter contract
#### Objective
verify the current Orders filter DTO can drive both onscreen queries and CSV export without contract drift.

#### Files/components likely affected:
- `server/contracts/orderFilters.ts`
- `src/api/orders.ts`
- `server/routes/orders.ts`

#### Dependencies/prerequisites:
- confirmed export scope and permission answers from user

#### Expected output artifact
- documented export request path that reuses the current filter contract

#### Acceptance criteria:
- export route accepts the same filter fields as the Orders list query and rejects invalid input consistently
   
#### Validation method:
- [x] unit test
- [x] integration test
- [ ] manual test
- [ ] custom test script

### Step 2: Add backend CSV export endpoint
#### Objective
implement a server endpoint that applies active filters, fetches matching orders, and streams a CSV response.

#### Files/components likely affected:
- `server/routes/orders.ts`
- `server/services/orderService.ts`
- `server/services/orderExportService.ts`

#### Dependencies/prerequisites:
- Step 1 contract validation complete

#### Expected output artifact
- authenticated Orders export endpoint returning `text/csv` with the agreed filename and column order

#### Acceptance criteria:
- endpoint returns filtered rows, includes internal order ID, and sets download headers correctly

#### Validation method:
- [x] unit test
- [x] integration test
- [ ] manual test
- [ ] custom test script

### Step 3: Wire the export action into the Orders admin UI
#### Objective
add an Export CSV action that submits the active filters and handles loading and failure states clearly.

#### Files/components likely affected:
- `src/admin/orders/OrdersPage.tsx`
- `src/admin/orders/components/OrdersToolbar.tsx`
- `src/api/orders.ts`

#### Dependencies/prerequisites:
- Step 2 endpoint available

#### Expected output artifact
- visible Export CSV control in the Orders toolbar with download behavior and error messaging

#### Acceptance criteria:
- support users can trigger export from the Orders page, current filters are preserved, and failures surface a non-silent error state

#### Validation method:
- [x] unit test
- [ ] integration test
- [x] manual test
- [ ] custom test script

### Step 4: Cover permissions, regression paths, and operational limits
#### Objective
verify only authorized users can export and that the feature does not regress existing Orders flows.

#### Files/components likely affected:
- `server/routes/orders.test.ts`
- `src/admin/orders/OrdersPage.test.tsx`
- `config/permissions.ts`

#### Dependencies/prerequisites:
- Steps 2 and 3 complete

#### Expected output artifact
- regression coverage for auth, filters, column mapping, and download initiation

#### Acceptance criteria:
- unauthorized requests are rejected, existing list behavior still passes, and large-filter guardrails are enforced

#### Validation method:
- [x] unit test
- [x] integration test
- [x] manual test
- [ ] custom test script