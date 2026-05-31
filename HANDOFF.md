# A-1 Enterprises Website — Handover Document

## Project Overview

A complete multi-page pet services website for **A-1 Enterprises** based in **Shillong, Meghalaya, India**. Tagline: **"Passion Turned Profession"**. The site presents a growing canine care ecosystem including dog training, grooming, boarding, a pet store, and future expansions (vet clinic, eco stay).

### Brand Details
- **Company:** A-1 Enterprises
- **Tagline:** Passion Turned Profession
- **Email:** a1.enterprises8891@gmail.com
- **WhatsApp:** +91 8891 000 000
- **Business Hours:** Mon–Sat 10:00 AM – 6:00 PM
- **Address:** Block-C, Nongrimmaw, Laitumkhrah, Shillong, Meghalaya 793011
- **Google Maps:** https://g.co/kgs/knmDPK
- **YouTube Video:** https://youtu.be/Lgpqqi8ZEQI ("SHILLONG MYNTA || DOG TRAINING AS AN ALTERNATE CAREER OPTION")
- **Founder:** Mrs. Francisca S. Sangma (acknowledged in founder's note)

### Social Media
| Platform | URL |
|---|---|
| Facebook | https://www.facebook.com/SANGPRETI/ |
| Instagram | https://instagram.com/boxerfosterhome |
| YouTube | https://youtu.be/Lgpqqi8ZEQI |
| Google Business | https://g.co/kgs/knmDPK |

---

## File Structure

```
aiwebsite/
├── index.html        ─ Main homepage (all sections, branding, gallery)
├── training.html     ─ Training & Rehabilitation detail page
├── grooming.html     ─ Grooming detail page (pre-existing, updated)
├── boarding.html     ─ Boarding & Kennels detail page
├── store.html        ─ Pet store with product grid & inquiry modal
├── admin.html        ─ Password-protected admin CRUD dashboard
├── images/
│   ├── a1logo.jpeg         ─ Company logo
│   ├── welcome.jpeg        ─ Welcome/facility image
│   ├── review1.png         ─ Google review screenshots
│   ├── review2.png
│   ├── review3.png
│   ├── review4.png
│   ├── review5.png
│   ├── 4081455907607392.jpg  ─ Training/facility photos
│   ├── 2533343538804035.jpg
│   ├── 7177680652812423.jpg
│   ├── herosection.jpg       ─ Hero section image
│   ├── prevent-mats.jpg      ─ Grooming mat image
│   └── frames/               ─ Video frames folder
├── HANDOFF.md        ─ THIS FILE
└── pupbar.html       ─ DELETED (was old redundant page)
```

---

## Page-by-Page Breakdown

### `index.html` — Homepage
The main landing page. Contains **all sections inline** (no partial loading). Sections in order:

1. **Nav** — Fixed top bar with logo, links (About, Services, Grooming, Store, Gallery, Contact), WhatsApp CTA button, hamburger mobile menu
2. **Hero** — Full-viewport dark gradient overlay on background image. Badge "Since 2020 · Shillong, Meghalaya". Tagline "Passion Turned Profession". H1: "Building the Future of Pet & Working Dog Services in Northeast India". CTA buttons + service keywords list
3. **About** — Split layout: text (journey story + quote) on left, image + founder's note card on right. Mentions Mrs. Francisca S. Sangma
4. **Services** — 3-column grid of 6 service cards (Training, Grooming, Boarding, Pet Store, Rehabilitation, Working Dog Development). Each links to relevant detail page
5. **Training & Rehab** — Split layout with image. Feature list (6 items). Links to `training.html`
6. **Grooming Overview** — Split layout with image. Links to `grooming.html`
7. **Boarding** — Split layout with image. Feature checklist (6 items). Links to `boarding.html`
8. **Gallery** — Dynamic masonry grid populated by JS from `GALLERY_IMAGES[]` array. Lightbox on click. Uses local `images/` files
9. **Vision · Mission · Goals** — 3-card grid. Vision paragraph, Mission bullet list, Goals short/long-term
10. **USP** — Dark section. 6 unique selling points in cards
11. **Social Responsibility** — 4 cards (Cleanliness Drives, Dustbin Campaigns, Awareness Programs, Ethical Practices)
12. **Testimonials** — Dark section. 3 testimonial cards with star ratings
13. **Future Expansion** — 2 cards (Vet Clinic "Coming Soon", Eco Stay "Coming Soon") with styled badges
14. **CTA / Contact** — WhatsApp button + social link row
15. **Footer** — 4-column grid: brand + social icons, quick links, services, contact info

### `training.html` — Training Detail Page
Full detail page for dog training & rehabilitation services. Includes:
- Hero section with training-specific background
- Programs grid (Obedience, Behavioral, Rehabilitation, Protection, Detection, Puppy Socialization, Working Dog)
- Approach/Methodology section
- Why Choose Us section
- CTA section with WhatsApp button
- Footer with social links and site navigation

### `grooming.html` — Grooming Detail Page
Pre-existing grooming detail page that was updated with:
- Updated navigation links
- Social media buttons
- New unified footer matching the rest of the site
- Floating Home button (bottom-right corner)

### `boarding.html` — Boarding Detail Page
Full detail page for boarding & kennels services. Includes:
- Hero section with kennel imagery
- Features grid (secure facility, 24/7 care, exercise, nutrition, medical, pickup/drop)
- Details section (daily routine, what to bring)
- CTA with WhatsApp
- Footer with social links

### `store.html` — Pet Store Page
Product catalog page with:
- **Nav** — Links to Home, Training, Grooming, Boarding, Store, Admin
- **Search bar** — Filters products in real-time
- **Category filters** — Dog Food, Treats, Toys, Accessories, Grooming, Health
- **Product grid** — Responsive cards with image, name, price, description, "Inquire" button
- **Inquiry modal** — Form with product name (auto-filled), customer name, phone, message. On submit, opens WhatsApp with pre-filled message
- **Footer** — Brand + social, quick links, shop categories, contact info
- **Data source:** `localStorage` key `a1_store_products`

### `admin.html` — Admin Dashboard
Password-protected product management CRUD. See dedicated section below.

---

## Admin System — Complete Technical Details

### Architecture
Entirely **client-side**. No backend server, no database, no API. All data lives in the browser's `localStorage`. The admin authentication is simulated via SHA-256 hashing.

### Authentication Flow

1. **Login screen** overlays the page on load (if no valid session)
2. User enters password, clicks "Sign In"
3. JavaScript appends a **static salt** (`A1-ENTERPRISES::2026`) to the password
4. Computes **SHA-256 hash** of `password + salt` using the **Web Crypto API** (`crypto.subtle.digest`)
5. Compares against the hardcoded hash `3a39e22d9cc93390556fcc5ba1014374fb56195337fd6b6dd5e2af25af9bdd6c`
6. On match: creates a **session token** (32 random bytes → hex string) stored in `sessionStorage` with a **24-hour expiry** (`SESSION_KEY = 'a1_admin_session'`)
7. On mismatch: increments a **lockout counter** in `sessionStorage` (`LOCKOUT_KEY = 'a1_admin_lockout'`)
8. After **5 failed attempts**, login is locked with **exponential backoff** (60s, 120s, 240s, max 300s)

### Security Notes (Important!)
**This is not real security.** Everything is client-side:
- The password hash is visible in the source code
- Anyone can read `admin.html`, extract the hash, and attempt offline brute force
- The salt is visible in plaintext
- Session tokens are stored in `sessionStorage` (cleared when browser tab closes)
- A motivated user can bypass the login entirely by setting `sessionStorage` manually
- **For production, replace this with a real backend** (PHP, Node.js, Firebase, Supabase, etc.)

### Admin Password
- **Password:** `admin123`
- **Salt:** `A1-ENTERPRISES::2026`
- **Stored Hash:** `3a39e22d9cc93390556fcc5ba1014374fb56195337fd6b6dd5e2af25af9bdd6c`

### CRUD — Product Management

**Storage Key:** `a1_store_products` (same key used by `store.html`)

**Product Schema:**
```javascript
{
  id: 'p' + Date.now() + randomString,   // unique ID
  name: string,                           // product name (max 100 chars)
  price: string,                          // e.g. "₹1,200" (any format)
  cat: string,                            // category ID (e.g. "dog-food")
  catLabel: string,                       // display name (e.g. "Dog Food")
  desc: string,                           // product description (max 300 chars)
  img: string                             // image URL or data URI ('' if none)
}
```

**Categories:**
| ID | Label |
|---|---|
| `dog-food` | Dog Food |
| `treats` | Treats |
| `toys` | Toys |
| `accessories` | Accessories |
| `grooming` | Grooming |
| `health` | Health |

**Dashboard Features:**
- **Stats row** — Total products, categories count, total value, food items count
- **Search** — Filters products by name, category, or description (case-insensitive)
- **Table** — Columns: Image, Name, Price, Category, Description, Actions (Edit/Delete)
- **Add Product** — Form modal with: image upload (converted to data URI), name, price, category dropdown, description
- **Edit Product** — Same form pre-filled. Preserves existing image unless a new one is uploaded
- **Delete Product** — Confirmation modal before deletion

### Default Product Seed Data
On first load, if `localStorage` key `a1_store_products` is empty, the store page seeds **16 default products** across all 6 categories.

---

## Technical Architecture

### Design System
- **CSS Custom Properties** (`--cream`, `--charcoal`, `--gold`, etc.) for consistent theming
- **Fonts:** Inter (body), Playfair Display (headings) via Google Fonts
- **Animations:** `IntersectionObserver`-based scroll reveal (`.reveal` class), fade-up with staggered delays (`.reveal-delay-1` through `-4`)
- **Responsive breakpoints:**
  - `1024px` — Desktop nav → hamburger menu
  - `900px` — Multi-column grids → single column
  - `768px` — Section padding reduced (100px→60px), footer collapses
  - `640px` — Hero padding reduced, headings smaller, gallery 2-col
  - `480px` — Hero padding further reduced, sections 40px padding, buttons full-width, footers 1-col
  - `360px` — iPhone SE support: tightest padding, smallest headings, gallery 1-col, admin session info hidden

### Navigation Pattern
- Fixed top nav with `backdrop-filter: blur(20px)` for frosted glass effect
- Mobile: hamburger toggle → full-screen overlay menu
- Scroll shadow added via `.scrolled` class

### Image Handling
- Images sourced from `images/` folder (local files)
- All images have `onerror` fallbacks (hide element or show gradient background)
- Gallery uses hardcoded array `GALLERY_IMAGES` in index.html JS
- Product images can be either URLs or data URIs (from admin upload)

### Lightbox
- Simple JS lightbox for gallery (click to open, click backdrop or × to close)
- Body scroll locked when open

### Inquiry Flow (Store)
1. User clicks "Inquire" on a product card
2. Modal opens with product name pre-filled
3. User fills name, phone, message
4. Submit opens WhatsApp with pre-composed message containing product name, name, phone, and message
5. Format: `Hi A-1 Enterprises! I'm interested in: [product name]. Name: [name], Phone: [phone]. [message]`

---

## Hybrid Architecture Decision

The site uses a **hybrid approach**:
- **Homepage (`index.html`)** — Contains overview/summary of every service section
- **Detail pages** (`training.html`, `grooming.html`, `boarding.html`) — Deep-dive into each service
- **Store** (`store.html`) — Standalone product catalog page
- **Admin** (`admin.html`) — Standalone management page

Each detail page links back to `index.html` and to other pages. The footer on every page includes links to all other pages + social media.

---

## Mobile Responsiveness

The site was professionally audited and optimized for mobile with the following applied across all 6 pages:

### Breakpoints Added

| Page | Before | After |
|------|--------|-------|
| **index.html** | 1024, 900, 768, 640, 480 (out of order) | 1024, 900, 768, 640, 480, **360** (sequential) |
| **training.html** | 1024, 768 | 1024, 768, 640, 480, **360** |
| **boarding.html** | 1024, 768 | 1024, 768, 640, 480, **360** |
| **grooming.html** | min/max 480 + slider bp | Added **360**, fixed `img{width:100%}` bug |
| **store.html** | 900, 768, 640, 400 | 900, 768, 640, 480, **360** |
| **admin.html** | 768, 480 | 768, 480, **360** |

### Key Optimizations
- **Section padding** reduced from 100px→50px at 640px, 40px at 480px (was never responsive before)
- **Hero top padding** reduced from 120px→80px at 640px, 60px at 480px
- **Headings** use `clamp()` to scale down at every breakpoint smoothly
- **Buttons** go full-width on mobile (easier tap targets)
- **Modal padding** reduced at 480px/360px to maximize content area
- **Admin dashboard** header now wraps (`flex-wrap:wrap`), session info hidden at 360px
- **Bug fix:** `--brown` undefined CSS variable in store.html replaced with `--charcoal-soft`
- **Bug fix:** grooming.html `img{width:100%}` changed to `img{max-width:100%}` to prevent stretching
- **Gallery** collapses to 2 columns at 640px, 1 column at 360px
- **Floating home button** in grooming.html repositioned at 360px

---

## Future Considerations

### Known Improvements Needed for Production
1. **Backend authentication** — Replace client-side SHA-256 with real server-side auth
2. **Database** — Replace `localStorage` with a real database (Firebase, Supabase, custom API)
3. **Image hosting** — Upload product images to cloud storage instead of data URIs (which are inefficient)
4. **Contact form** — Replace WhatsApp-only inquiries with email/backend form processing
5. **Analytics** — Add Google Analytics or similar to track page views and conversions
6. **SEO** — meta tags are present but could be improved; consider sitemap.xml
7. **Performance** — Consider lazy-loading off-screen sections, image optimization, `font-display:swap`
8. **HTTPS** — Ensure deployment uses HTTPS for security (especially for admin page)

### Fixed Items (no longer needed)
- ❌ Mobile responsiveness: Added 360px breakpoint + reduced padding across all pages
- ❌ `--brown` undefined CSS variable in store.html footer
- ❌ grooming.html `img{width:100%}` → `max-width:100%`
- ❌ admin dashboard header overflow on small screens
- ❌ Media queries out of order in index.html

### Pages That Need Future Content
- **training.html** — Currently has good structure but real program details/pricing
- **boarding.html** — Add actual boarding rates, availability calendar
- **Vet Clinic** section on homepage — Currently "Coming Soon"
- **Eco Stay** section on homepage — Currently "Coming Soon"
- **Working Dog Development** — Full detail page yet to be created

---

## Deployment Notes
- All files are static HTML/CSS/JS — deploy to any static hosting (Netlify, Vercel, GitHub Pages, Firebase Hosting, etc.)
- No build step needed — just upload the files
- Ensure the `images/` folder is included in deployment
- The site is fully self-contained (no external dependencies besides Google Fonts CDN)

---

## Files to Delete Before Deployment
- `pupbar.html` — Already deleted (was an old redundant copy of the original index)
- `HANDOFF.md` — Should not be deployed (this file)

---

## Contact for Questions

If any part of this system is unclear, the next developer should:
1. Read this document thoroughly
2. Open each `.html` file and read through the JavaScript sections (especially the admin auth and product CRUD logic)
3. Check `localStorage` in browser DevTools → Application → Local Storage to see product data
4. Test the admin login with password `admin123`
