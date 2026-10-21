# Changelog

## Unreleased

- Add accommodation contract prices in SAR and field-level date validation with bounded calendars, preserving older records without an invented price.

- Add bilingual accommodation management with room capacity checks, complete contract periods, meal plans, protected local persistence.

- Accept extra Excel columns in flight request imports while rejecting missing required columns, and show flight figures with English digits in Arabic and English views.
- Align international flight inputs with the Emirates PNR request workbook, including route, passenger count, source fares, Excel date conversion, and repeated header handling. Keep earlier pilgrim-flight local storage separate.
- Add an Inputs navigation section with six operational categories. International flights supports local CRUD and reviewed Excel import of flight booking requests.
- Replace room options and room-based calculations with fixed per-pilgrim service pricing, 15% service VAT, and a calculated service total. Remove legacy room pricing and tax data during storage migration while preserving hotel stays, service prices, and block links.
