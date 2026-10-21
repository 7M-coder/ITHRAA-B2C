# Changelog

## Unreleased

- Calculate housing contract totals for the full stay by multiplying nightly bed totals by all period nights before applying taxes.

- Show saved accommodation room rates in a table and place the establishment identifier first in entry and detail views.

- Correct housing pricing to sum beds times the nightly bed quote per room type without multiplying by period nights, retaining the meaning of earlier saved calculations.

- Accept ten-character alphanumeric housing identifiers and edit room inventories and nightly per-bed rates in a table, using occupancy and period nights for pricing while retaining legacy contract-rate meaning.

- Accept same-day or next-day boundaries between accommodation contract periods, and show the pricing summary as a table in housing dialogs.

- Add per-room contract rates, independent tax calculations and exact contract reconciliation; require ten-digit accommodation unified numbers and show them first in the housing table.

- Add accommodation contract prices in SAR and field-level date validation with bounded calendars, preserving older records without an invented price.

- Add bilingual accommodation management with room capacity checks, complete contract periods, meal plans, protected local persistence.

- Accept extra Excel columns in flight request imports while rejecting missing required columns, and show flight figures with English digits in Arabic and English views.
- Align international flight inputs with the Emirates PNR request workbook, including route, passenger count, source fares, Excel date conversion, and repeated header handling. Keep earlier pilgrim-flight local storage separate.
- Add an Inputs navigation section with six operational categories. International flights supports local CRUD and reviewed Excel import of flight booking requests.
- Replace room options and room-based calculations with fixed per-pilgrim service pricing, 15% service VAT, and a calculated service total. Remove legacy room pricing and tax data during storage migration while preserving hotel stays, service prices, and block links.
