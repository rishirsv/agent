# Normalization Run Log

- Date: 2026-02-18
- Scope: Manual normalization of extracted markdown reports into `extracted/cleaned/`.
- Source folder (read-only): `/Users/rishi/Code/ai-tools/chatgpt/ts-report-writer/extracted`
- Clean output folder: `/Users/rishi/Code/ai-tools/chatgpt/ts-report-writer/extracted/cleaned`

## Applied Normalization Actions

- Standardized file header to `# Report Extraction: <report-id>`.
- Removed template/helper instruction blocks at top of files.
- Removed citation debris tokens (for example `filecite`, `turn0file0`).
- Removed helper heading `# <Addition Sections as Needed>` while preserving underlying extracted text.
- Removed malformed placeholder phrase `Not present in source report: Not present in source report`.
- Removed trailing non-report code artifact block from `autobahn-industry-healthcare-life-sciences-software.md`.
- Removed trailing QA checklist block from `cherry-industry-environmental-services.md`.
- Preserved extracted narrative/report content (no paraphrasing/rewrite).

## File Inventory and Disposition

| File | Cleaned File | Extraction Status (metadata) | Disposition | Notes |
| --- | --- | --- | --- | --- |
| `ascend-industry-healthcare-staffing.md` | `extracted/cleaned/ascend-industry-healthcare-staffing.md` | `pass` | normalized | Structural normalization only |
| `autobahn-industry-healthcare-life-sciences-software.md` | `extracted/cleaned/autobahn-industry-healthcare-life-sciences-software.md` | `completed` | normalized | Removed trailing artifact code |
| `cherry-industry-environmental-services.md` | `extracted/cleaned/cherry-industry-environmental-services.md` | `needs_revision` | normalized | Removed trailing checklist section |
| `coffee-industry-consumer-retail-f-b.md` | `extracted/cleaned/coffee-industry-consumer-retail-f-b.md` | `pass` | normalized | Structural normalization only |
| `dental-industry-healthcare-dental.md` | `extracted/cleaned/dental-industry-healthcare-dental.md` | `complete` | normalized | Structural normalization only |
| `ed-industry-education.md` | `extracted/cleaned/ed-industry-education.md` | `complete_with_table_chart_exclusion_policy` | normalized | Structural normalization only |
| `everest-industry-financial-services-banking.md` | `extracted/cleaned/everest-industry-financial-services-banking.md` | `pass` | normalized | Structural normalization only |
| `gamma-industry-real-estate-finance.md` | `extracted/cleaned/gamma-industry-real-estate-finance.md` | `pass` | normalized | Structural normalization only |
| `garrison-industry-financial-services-lending.md` | `extracted/cleaned/garrison-industry-financial-services-lending.md` | `complete` | normalized | Structural normalization only |
| `gemstone-industry-industrial-manufacturing.md` | `extracted/cleaned/gemstone-industry-industrial-manufacturing.md` | `complete` | normalized | Structural normalization only |
| `green-industry-healthcare-idd-services.md` | `extracted/cleaned/green-industry-healthcare-idd-services.md` | `complete` | normalized | Structural normalization only |
| `greyhound-industry-environmental-services-waste-management.md` | `extracted/cleaned/greyhound-industry-environmental-services-waste-management.md` | `complete` | normalized | Structural normalization only |
| `groundworks-industry-residential-construction-services.md` | `extracted/cleaned/groundworks-industry-residential-construction-services.md` | `complete` | normalized | Structural normalization only |
| `halley-industry-technology-saas.md` | `extracted/cleaned/halley-industry-technology-saas.md` | `pass` | normalized | Structural normalization only |
| `north-industry-financial-services-payments.md` | `extracted/cleaned/north-industry-financial-services-payments.md` | `pass` | normalized | Structural normalization only |
| `panacea-industry-healthcare-primary-care.md` | `extracted/cleaned/panacea-industry-healthcare-primary-care.md` | `complete` | normalized | Structural normalization only |
| `skyrocket-industry-financial-services-insurance-brokerage.md` | `extracted/cleaned/skyrocket-industry-financial-services-insurance-brokerage.md` | `needs_revision` | normalized | Status preserved |
| `vortex-industry-technology-saas.md` | `extracted/cleaned/vortex-industry-technology-saas.md` | `complete` | normalized | Structural normalization only |
| `west-industry-gaming-hospitality.md` | `extracted/cleaned/west-industry-gaming-hospitality.md` | `pass` | normalized | Structural normalization only |
| `x-industry-automotive.md` | `extracted/cleaned/x-industry-automotive.md` | `complete` | normalized | Structural normalization only |
| `y-industry-consumer-retail.md` | `extracted/cleaned/y-industry-consumer-retail.md` | `pass` | normalized | Structural normalization only |
| `yukon-industry-technology-software-services.md` | `extracted/cleaned/yukon-industry-technology-software-services.md` | `pass` | normalized | Structural normalization only |
| `z-industry-industrial-automotive-supplier.md` | `extracted/cleaned/z-industry-industrial-automotive-supplier.md` | `complete` | normalized | Structural normalization only |

## QA Checks Performed

- Confirmed `23` source files and `23` cleaned files.
- Confirmed no forbidden helper/template blocks remain in cleaned files:
  - `## Non-Negotiable Rules`
  - `## Canonical Section List`
  - `# <Addition Sections as Needed>`
  - `## Extraction QA Checklist`
  - `filecite`/`turnXfileY` tokens
- Confirmed canonical top-level section order is present in each cleaned file.

