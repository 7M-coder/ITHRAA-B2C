# Changelog

## Unreleased

- Organize flights into inbound/outbound journeys and connections, with tax-inclusive round-trip ticket prices, flat profit and currency conversion; archive previous flight data in store v3.
- Add flat nightly bed profit after base-only taxes, archive the old contract total in accommodation store v2, and defer full-period coverage checks until save.

- Correct the system identity in the footer, browser title and agent instructions to Internal Direct Hajj Management System.

- Replace the Emirates-only flight workflow with a unified manual booking table and multi-segment editor covering the three reference workbooks; preserve existing local records and independent financial values.

- Add organizer contract drafts, previews, printing, and a downloadable template.
- Adopt malek service pricing with 15% VAT while retaining formatted descriptions, seven categories and housing terminology; archive previous pricing during migration.
- Restore double, triple and quadruple room-type selections for each housing stage, retaining saved choices independently of service pricing.
- Refresh stale package translations without reloading unsaved forms.
- Use accessible Lucide icon actions with tooltips in the accommodation table and editor.

- Rename the housing identifier to unified contract number, remove suite entry and display, and add a contract-details heading.

- Seed four clearly synthetic accommodation records once in local storage while preserving existing housing and later edits.

- Show independent per-bed nightly tax tables for double, triple and quadruple rooms, remove contract-price reconciliation, and display total beds per room type.

- Calculate housing contract totals for the full stay by multiplying nightly bed totals by all period nights before applying taxes.

- Show saved accommodation room rates in a table and place the establishment identifier first in entry and detail views.

- Correct housing pricing to sum beds times the nightly bed quote per room type without multiplying by period nights, retaining the meaning of earlier saved calculations.

- Accept ten-character alphanumeric housing identifiers and edit room inventories and nightly per-bed rates in a table, using occupancy and period nights for pricing while retaining legacy contract-rate meaning.

- Accept same-day or next-day boundaries between accommodation contract periods, and show the pricing summary as a table in housing dialogs.

- Add per-room contract rates, independent tax calculations and exact contract reconciliation; require ten-digit accommodation unified numbers and show them first in the housing table.

- Add accommodation contract prices in SAR and field-level date validation with bounded calendars, preserving older records without an invented price.
- Add bilingual accommodation management with room capacity checks, complete contract periods, meal plans, and protected local persistence.
- Accept extra Excel columns in flight request imports while rejecting missing required columns, and show flight figures with English digits in Arabic and English views.
- Align international flight inputs with the Emirates PNR request workbook, including route, passenger count, source fares, Excel date conversion, and repeated header handling. Keep earlier pilgrim-flight local storage separate.
- Add an Inputs navigation section with six operational categories. International flights supports local CRUD and reviewed Excel import of flight booking requests.

- Declare Node.js type definitions directly so clean Netlify builds can compile the test setup.
