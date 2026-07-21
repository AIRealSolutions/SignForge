# SignForge Product Requirements

## Product vision

SignForge is a web-based business and production operating system for vinyl sign shops, real-estate sign vendors, screen printers, heat-transfer apparel businesses, dye-sublimation shops, and promotional-product sellers.

The platform should manage the complete workflow:

> Customer request → quote → artwork → proof approval → payment → production → delivery → reorder

The initial commercial focus is real-estate professionals and local businesses, with Lightkeeper Realty serving as the first demonstration customer.

## Target customers

- Real-estate brokerages and agents
- Property managers, builders, and contractors
- Local businesses and restaurants
- Churches, schools, athletic programs, and community organizations
- Political campaigns and municipal departments
- Sign, screen-printing, apparel, and promotional-product shops

## Production modules

### Vinyl products

- Real-estate yard signs and riders
- Open-house and directional signs
- Corrugated plastic, PVC, and aluminum signs
- Decals, window lettering, and storefront hours
- Vehicle lettering and magnets
- Banners and printed graphics
- Heat-transfer vinyl artwork

### Screen printing and apparel

- Garment catalog and size breakdowns
- Print locations and dimensions
- Ink and Pantone colors
- Color separations and screen specifications
- Setup charges, quantity pricing, and production worksheets
- Heat-transfer time, temperature, pressure, and peel presets

### Dye sublimation

- Mugs, tumblers, shirts, name badges, photo panels, and other blanks
- Product-specific artwork templates
- Bleed and safe-area guides
- Mirrored print output
- Gang-sheet layout
- Printer, paper, time, temperature, and pressure presets

## Core business capabilities

### Customer and organization management

- Multi-tenant organizations and locations
- Staff and customer roles
- Customer contacts, addresses, notes, and tax status
- Saved logos, brand colors, and fonts
- Brokerage and company accounts with multiple users
- Customer-specific and contract pricing

### Product catalog and pricing

Each product can define materials, dimensions, options, finishing, setup fees, quantity breaks, turnaround time, shipping, taxes, and artwork requirements.

The pricing engine should support material cost, labor, machine time, artwork time, waste, setup charges, garment cost, print colors, outsourced services, tax, and target margin.

### Quotes and orders

- Build and send quotes
- Accept quotes electronically
- Collect deposits and balances
- Convert accepted quotes to orders
- Support mixed orders containing signs, apparel, and sublimated products
- Preserve status history and audit records

### Artwork and proofing

- Upload SVG, PDF, PNG, and JPG files
- Store artwork versions
- Create web and PDF proofs
- Watermark unapproved artwork
- Collect customer comments and approval
- Record approval timestamp
- Prevent production before approval

### Production management

- Kanban production board
- Department queues for design, vinyl cutting, weeding, application, screen preparation, screen printing, heat press, sublimation, finishing, packing, and installation
- Job tickets with quantities, materials, colors, files, due dates, assignments, estimated time, actual time, and quality-control checklists

### Inventory

- Vinyl rolls by brand, series, color, width, lot, cost, and remaining length
- Sign blanks and substrates
- Garments by brand, style, color, size, quantity, and supplier
- Screen-printing ink and supplies
- Sublimation blanks, ink, paper, and transfer supplies
- Material reservations, consumption, waste, reorder points, and purchase orders

## Roland CAMM-1 GS-24 integration

Direct USB cutter control should be handled through a local desktop bridge rather than directly from the browser.

Architecture:

> SignForge web application → signed local job → desktop bridge → Windows driver or cutter protocol → Roland GS-24

The first release will export dependable SVG and PDF production files. Direct cutter control follows after the order, artwork, proofing, and production workflows are stable.

A future `CutterAdapter` interface should make it possible to support Roland, Graphtec, Mimaki, USCutter, and other machines.

## MVP 1 — Vinyl and real-estate workflow

The first usable release must support:

1. Authentication and multi-tenant organizations
2. Customer CRM
3. Real-estate sign product catalog
4. Quote creation and acceptance
5. Order conversion
6. Artwork upload and versioning
7. Proof comments and approval
8. Deposit-ready payment architecture
9. Production Kanban board
10. Vinyl and sign-blank inventory
11. SVG and PDF production export
12. Audit logging and role-based access

The first vertical workflow is:

> Create customer → create quote → accept quote → create order → upload artwork → approve proof → move job into production

## Later milestones

### MVP 2 — Cutter bridge

- Windows desktop bridge
- GS-24 detection and test cut
- Speed and pressure presets
- Secure job queue
- Progress and error reporting

### MVP 3 — Apparel

- Garment catalog and size breakdowns
- Screen-print pricing and specifications
- Heat-transfer workflow
- Production worksheets and file storage

### MVP 4 — Sublimation

- Product templates and wrap designer
- Print-sheet nesting
- Heat-press presets
- Blank-product inventory

### MVP 5 — Storefront and SaaS

- Public ordering storefront
- Brokerage portals and approved templates
- Subscription billing
- White-label branding
- Multi-location support

## Recommended architecture

- pnpm monorepo
- Next.js App Router and TypeScript strict mode
- Tailwind CSS and shadcn/ui
- Supabase PostgreSQL, Auth, Storage, and Row Level Security
- Zod and React Hook Form
- Stripe-ready payment architecture
- Tauri desktop bridge for cutter integration
- Vitest and Playwright
- Vercel deployment for the web application

Suggested repository structure:

```text
apps/
  web/
  cutter-bridge/
packages/
  database/
  ui/
  pricing-engine/
  artwork-engine/
  product-catalog/
  shared/
supabase/
  migrations/
  functions/
  seed.sql
docs/
```

## Product principle

SignForge should become a dependable operating system before becoming complicated design or machine-control software. Every production job must remain under human control, and AI-assisted artwork must always be reviewed before approval or cutting.