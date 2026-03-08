# UX Improvement Ideas

Inspired by CartoArt's editor and ordering flow, filtered through PrintAPoint's premium/minimal/low-friction philosophy. Additions and refinements only — nothing gets removed.


## Ordering / Checkout UX

### 8. In-app multi-step order flow with progress stepper
This is the biggest UX gap. CartoArt has a clean 3-step in-app flow: **Select Size → Shipping → Payment** with a visual progress indicator (circles + connecting lines, with checkmarks for completed steps). Currently, PrintAPoint selects size in the right sidebar of the editor, then jumps directly to Stripe Checkout for everything else. A dedicated order page (or modal) with a clear stepper would:
- Feel more premium and intentional
- Give space to show product details, specs, quality badges
- Let users review before committing
- Reduce the jarring context switch from editor → Stripe

The shipping and payment steps can still delegate to Stripe (either embedded Stripe Elements or redirect), but the size selection + review step should live in-app.

### 9. Size selection as cards with prices
CartoArt shows sizes as a grid of cards, each displaying the dimensions AND price together (e.g., "18x26" / $50"). The price is front-and-center, not hidden. PrintAPoint's SizeSelector shows size names but the pricing relationship could be more prominent. Showing price directly on each size card helps users make faster decisions and sets expectations before checkout.

### 10. Product description + specs on size selection
When a size is selected in CartoArt, a description and bullet-pointed specs appear below:
- "A canvas is a statement piece and artwork all in one."
- Thickness, Fabric weight, Print quality details
- "Printed on textured and fade-resistant canvas (OBA-Free)"

Adding a brief, tasteful product description and 2-3 key specs below the size grid adds confidence and justifies the price. Keep it minimal — just enough to convey quality.

### 11. Quality assurance badges
CartoArt shows small badges below the preview: "Quality Guaranteed" and "Free Shipping $75+". These are subtle trust signals that reduce purchase anxiety. PrintAPoint could add similar minimal badges near the checkout area — things like "Museum-quality print", "Shipped in 3-5 days", or free shipping thresholds if applicable. Keep them understated, not salesy.

### 12. Size dimension label on preview
During the order flow, CartoArt overlays the selected size (e.g., "40x60"") as a small label on the poster preview image. This is a small but effective detail — it helps users connect the abstract size number to the visual, and reinforces what they're ordering. Easy to add as a small overlay chip.

### 13. Order summary before payment
CartoArt shows a clear order summary panel before the payment step: product thumbnail, line items (Framed Print $192.78, Shipping $86.99, Tax $0.00), and a bold Total. Currently PrintAPoint delegates all of this to Stripe Checkout, which handles it fine, but having an in-app summary before the redirect sets expectations and feels more premium.

### 14. "Change" link for going back
In CartoArt's shipping step, the selected size is shown as a compact card with a "Change" link to go back. This is good UX for multi-step flows — letting users easily revisit decisions without losing progress. If implementing the multi-step flow (#8), include this.

---

## Editor Enhancements (Lower Priority)

### 15. "By Product" aspect ratio mode
CartoArt has a toggle between "By Product" and "Manual" in their Frame & Layout panel. In "By Product" mode, the aspect ratio is automatically determined by the selected product type/size. In "Manual" mode, users can pick any ratio (2:3, 3:4, 1:1, etc.). PrintAPoint already ties aspect ratio to the selected size, but making this relationship more explicit — and possibly allowing a manual override for download-only use cases — could be useful.

### 18. Landscape orientation toggle
CartoArt has an explicit Portrait / Landscape orientation toggle in their Frame & Layout panel. If PrintAPoint's product catalog supports landscape sizes (or could in the future), adding this toggle would unlock a whole new set of use cases. Even if Printful only offers portrait, this could work for digital downloads.

---

## Store / Discovery

### 19. Product comparison section
CartoArt has a "Compare Products" table on their store page showing differences between product types (Canvas, Framed Poster, etc.) side by side. PrintAPoint's product type selector in the editor is compact. A comparison view — either on a landing page or as an expandable section near the product selector — would help users understand the difference between poster, framed poster, canvas, and framed canvas at a glance.

### 20. "Shop by Product" browsing
CartoArt has a store page where users can browse pre-made designs by product type. PrintAPoint is purely create-your-own, which is great, but a small gallery of featured/example designs that link directly to the editor (pre-loaded via share URLs) could inspire new users and reduce the blank-canvas intimidation.