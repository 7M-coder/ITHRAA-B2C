# Ithraa B2C Frontend — Agent Instructions

## Active phase: frontend-only internal Direct Hajj management system

The current deliverable is the Arabic/English internal Direct Hajj management system for إثراء الخير, including Hajj operations, packages, flight inputs, HR, payroll, custody, and clearance. Use «النظام الداخلي لإدارة الحج المباشر» as the system description and “Internal Direct Hajj Management System” in English. HR and custody are modules, not the identity of the whole system. Follow the latest user-approved requirements for each module. Work exclusively in `frontend/`. The backend and database will be built after demo approval.

- Use Zustand with `persist` and localStorage for all shared business data. Keep React Context for theme/language only.
- Seed synthetic records once on first use, never on page navigation or whenever an array becomes empty.
- Persist employee edits, asset status changes, and issued clearance records across reloads. Use a versioned storage key, validate persisted data, and show a visible warning when storage is unavailable or invalid. Never silently overwrite unreadable saved data.
- Keep domain types, calculations, Zod validation, store actions, and presentation separate. Reuse store actions across pages. Enforce business invariants in actions as well as button states.
- Current implementation sequence: module folders → local types → Zod validation → Zustand persisted store/actions/selectors → hooks if needed → pages and components → translations → tests of behavior/persistence → responsive verification.
- **DEFERRED until explicitly requested:** endpoints, Axios services, React Query server hooks, API error handling, authentication integration, backend code, migrations, and database setup. Existing API setup may remain unused. Make no API calls for demo business data.
- Use the current identity: primary #008186, turquoise #00B5A4, sand #C19F79, quiet neutral backgrounds. Keep Tajawal until licensed brand fonts are supplied. Logo is pending; use an ordinary product name, not a fabricated logo.
- Client validation improves input quality; it is not a security boundary against SQL injection/XSS. Render text safely and never inject user HTML. No backend security claims in this local demo.
- Do not check PR checklist items unless actually completed. No claims of WPS compliance or real authentication.

## Custody workflow

Custody is a local tracking demo, with no approval workflow. Manager creation opens custody immediately. Employees record purchases and invoice evidence. Only the manager records actual receipt and closes cash custody with the returned amount (full positive remainder); overspending remains visible and does not imply reimbursement. Only the manager records physical receipt and closure, without a request or approval cycle. Preserve earlier records, attachments and action history. Storage version 3 performs the user-requested one-time removal of old demo custodies and their nested purchases, attachments and history; employees, inventory and clearances are preserved. New stores start with an empty custody list and never reseed it. Every open custody blocks clearance. Keep role ownership checks and warn on local storage failures. The manager/employee switch is a simulation, not authentication.

## Original Project Background

Ithraa B2C is an internal platform for a Hajj company, operated by its IT department. It records and displays pilgrims and their travel arrangements from booking in their home country through their return home.

Pilgrims are organized into groups called blocks whose members share flight, train, bus, hotel, and sightseeing arrangements in Makkah and Madinah. Bookings are made outside the platform and entered manually. The system displays planned schedules; it does not require real-time location tracking. Pilgrims are records, not system user accounts.

This frontend belongs to the `ithraa-b2c` monorepo alongside a Laravel API backend backed by MySQL. Arabic and English are supported. Follow the latest user-approved requirements in the conversation and inspect the existing implementation before changing feature behavior.

## Package audience

Hajj packages serve international pilgrims only. Do not offer domestic pilgrims in forms or filters. Preserve legacy package and block IDs and links when migrating their audience to international.

New packages use Hajj season 1448 and SAR by default; these are not editable form fields. Use city-dependent demo hotel lists and visible step navigation.

Package pricing now follows the service-pricing workflow from `malek`: ten required services and three optional services, each priced per pilgrim before 15% VAT. Calculate the total once from enabled service prices. The old room-options/approved-price/cost-draft workflow and bed taxes no longer appear in the form. Archive historical room costs, options, and approvals during migration without applying them to the new service total. Keep rich descriptions, the seven current categories, and Arabic housing terminology «السكن». Each housing stage independently offers double, triple and quadruple room-type checkboxes. These are descriptive choices (one bed per person), with no separate bed/person count inputs or link to service pricing; preserve their selection through saves and migrations.

Current package form has no package-company selector or provider requirement. Program and housing dates run from 2027-04-08 through 2027-06-05. Each stay supports at most three sequential periods; all their nights count. Preserve historical extra periods for review, but require reducing them before saving. Transport choices are intercity (bus, Haramain train, private car) and holy sites (bus, Mashair train). After a transport mode is chosen, select its provider from active transport-provider records; preserve recorded links. Save business data locally with Zustand and versioned migration; preserve rich descriptions, categories, IDs and block links.

## Documentation policy

Keep agent instructions in `AGENTS.md`. Do not create separate requirements, progress-tracking, or demo specification Markdown files unless the user explicitly requests them. Clarify unresolved product questions in the conversation.

## Architecture and Implementation Instructions

 
 

- React 18 + TypeScript + Vite
- Ant Design v5 for UI components + Tailwind CSS v4 for layout/spacing utilities
- RTL layout (direction="rtl"), Arabic UI (with English support via i18next)
- React Context for global state (AuthContext, ThemeContext, LanguageProvider)
- Axios for data fetching (via src/api/axiosInstance.ts)
- TanStack Query v5 for server state management (@tanstack/react-query)
- React Router v7 for routing
   
   
- JSDoc is required for every component, hook, and utility function — include a description, @param, and @returns tags
- Use named exports for components (not default unless it's the page-level component)
- Prefer functional components with typed props interfaces
- Always follow ESLint rules — all code must pass the project's ESLint configuration without errors or warnings
- One component per file — never define or export more than one component in a single .tsx file
   
   
  /** * Displays a summary card with a label and value. * @param {SummaryCardProps} props * @param {string} props.label - The card label shown above the value * @param {string | number} props.value - The main value to display * @returns A styled Ant Design Card component */
   
   
- src/modules/<module>/ — feature modules (e.g. auth, home, etc.), each representing a distinct app feature
  - Every module must follow this exact folder structure:
    - pages/ — route-level page components
    - types/ — TypeScript interfaces and types
    - services/ — API calls and data fetching logic (using axios)
    - hooks/ — custom React hooks
    - components/ — feature-specific components
    - layouts/ — layout wrappers specific to the module
    - validations/ — Zod schemas and form validation logic
    - tests/ — unit and integration tests for the module
    - utils/ — helper functions
- src/modules/core/ — shared/core components used across the entire app (e.g. loading spinners, buttons, pagination, layout wrappers)
- src/api/ — global API configuration (axiosInstance.ts) and shared endpoints (endpoints.ts)
- src/antd/ — Ant Design theme config and CSS overrides
- src/context/ — React Context providers (Auth, Theme, Language)
- src/i18n/ — i18next configuration
- src/styles/ — global CSS
   
   
- **DEFERRED — backend phase:** All API calls use src/api/axiosInstance.ts
- **DEFERRED — backend phase:** All endpoint strings live in src/api/endpoints.ts, grouped by feature (e.g. AUTH, USERS, etc.)
- **DEFERRED — backend phase:** When adding a new feature, add its endpoints to src/api/endpoints.ts before writing services
   
   
- Translation files live in public/locales/<lang>/<namespace>.json (e.g. public/locales/ar/auth.json)
- Each module has its own namespace file (e.g. auth.json, home.json, core.json, common.json)
- Always add display strings to both ar and en locale files under the correct namespace
- Never hardcode display text — always use translation keys via useTranslation
   
   
  When implementing a new feature, follow these steps in order:
   

1. ~~Endpoint — add the API endpoint to src/api/endpoints.ts~~ **DEFERRED: frontend-only demo.**
2. Module folder — create src/modules/<feature>/ with the full folder structure
3. Types — define TypeScript interfaces for request/response shapes in types/
4. Validations — add Zod schemas in validations/ if the feature has forms. Every text field must include .refine(isSafeInput, messages.field.unsafe) using isSafeInput from src/modules/core/utils/inputSafety.ts to guard against SQL injection and XSS. Use createAdminUserFieldValidator (or an equivalent factory) to connect the Zod schema to Ant Design Form.Item rules — never write inline validator functions in the JSX.
5. ~~Services — implement API call functions in services/ using axiosInstance~~ **DEFERRED: use persisted Zustand actions.**
6. **DEFERRED — server integration only:** create a custom hook in hooks/ that wraps the service using TanStack Query (useMutation for write operations, useQuery for read operations). The hook returns the raw mutation/query objects — do not extract state inside the hook. Consumers destructure the object in the component:

- // hook (hooks/useFeature.ts) export const useFeature = () => { const loginMutation = useMutation({ mutationKey: ['feature', 'action'], mutationFn: serviceFunction }) return { loginMutation } } // component const { loginMutation } = useFeature() const { mutate, isPending, isError, data } = loginMutation

1. Page component — build the route-level page in pages/
2. Child components — break the page into smaller components in components/; one component per file
3. Ant Design — use built-in Ant Design components throughout; do not recreate what antd already provides
4. Responsive — ensure every component works on mobile, tablet, and desktop using Tailwind responsive prefixes (sm:, md:, lg:)
5. States — handle loading, error, empty, and success states; use shared state components from src/modules/core/. **DEFERRED — API callbacks:** For mutation onError callbacks, always call extractApiErrorMessage(error, t('fallback.key')) from src/modules/core/utils/apiError.ts — it reads the real backend message first (e.g. DRF field errors { field: ["..."] } or { detail: "..." }), and only falls back to the default i18n string when the backend returns no message.
6. i18n — add all display strings to both ar and en locale files under the feature's namespace
7. Theme — use the current demo palette above; the source project blue palette is superseded.
    
    

- Use Tailwind utility classes for all layout, spacing, typography, and color — no style={{}} objects
- Use Ant Design components for all UI elements (buttons, inputs, cards, tables, etc.)
- Override antd styles using Tailwind with the ! important suffix (Tailwind v4 syntax): e.g. bg-white!, h-14!
- Reserve style={{}} only for truly dynamic values that Tailwind cannot express (e.g. style={{ width: dynamicWidth }})
- Global antd CSS overrides go in src/antd/overrides.css
   
   
  Use this template when generating pull request messages:
   

<!--markdownlint-disable-next-line first-line-heading-->  **By submitting this merge request, I confirm the following:** _please fill any appropriate checkboxes, e.g: [x]_  - [x] The merge request title follows the conventional commits convention (see `README.md`) - [ ] I have made only one major change in my proposed changes. - [x] I have commented my proposed changes within the code (classes, methods/functions, and wherever additional explanation is necessary). - [ ] I have tested my proposed changes, and have included unit tests where possible. - [ ] New and existing unit tests pass locally with my changes - [x] I have added a changelog entry to `CHANGELOG.md`. - [x] I have updated the documentation if necessary. - [x] I have implemented translations in the code and added the necessary keys in the relevant namespaces (files).  ---  ### Summary  <!-- Describe what was implemented -->  ### Test Instructions  <!-- Step-by-step instructions to manually verify the changes -->

## Unified flight inputs

International flights use one manual table and form combining the supplied workbook columns. Do not restore format-specific Excel imports. Preserve optional source fields, ordered segments, foreign currencies and historical dates. Financial figures are independent recorded values; do not calculate taxes, conversions or payments. Version 2 of the flight store preserves legacy request IDs and adds empty segment arrays. No real source booking records belong in public seeds.
