# 🎨 Growth World — Full Design Update Tasks
# Align entire platform UI to Booking.com design reference

> **Context**: These tasks update the visual design of the existing, working Growth World platform.
> Do NOT touch backend logic, API routes, auth logic, or database models.
> Every change is purely CSS Modules, component structure, and layout.
> All text must remain in translation files — do not hardcode strings.
> All CSS must use logical properties (margin-inline-start, etc.) for RTL/LTR support.
> Work through tasks in order. Test each page at 375px (mobile), 768px (tablet), and 1280px+ (desktop) before moving on.

---

## DESIGN REFERENCE ANALYSIS (Read before starting)

From the three Booking.com screenshots provided, extract and apply these exact patterns:

### Color System (map to Growth World brand)
- Header background: `#003580` (deep blue) — already our `--color-primary`
- Header text/icons: `#FFFFFF`
- Search bar background on hero: `#FFFFFF` with `#FFC107` yellow/gold border (3px) on the outer wrapper
- Search button: `#0071C2` blue with white text — use `--color-primary-light`
- Category nav pills below header: white background, blue text, border — active has filled background
- Page background: `#F2F2F2` (light gray, not pure white)
- Card background: `#FFFFFF`
- Card border: `1px solid #E7E7E7`
- Card hover shadow: `0 2px 8px rgba(0,0,0,0.15)`
- Section titles: `#1A1A1A` bold, font-size 20–24px
- Body text: `#333333`
- Muted text: `#6B6B6B`
- Price text: `#1A1A1A` bold
- Original/strikethrough price: `#CC0000` with line-through
- Green text (deals, perks): `#008009`
- Blue links: `#0071C2`
- Score badge (exceptional): `#003580` dark blue pill, white text
- Score label (Exceptional/Very Good): `#003580` text
- "Featured" badge: `#E8F4FF` background, `#0071C2` text, border `#0071C2`
- "New" badge: `#FFC107` yellow background, dark text
- "Deal" badge: `#008009` green background, white text
- Filter sidebar background: `#FFFFFF`
- Filter section dividers: `1px solid #E7E7E7`
- Active filter checkbox: `#0071C2`
- Breadcrumb text: `#0071C2` links, `#6B6B6B` separator `>`

### Typography
- All headings: Tajawal Bold (700) in Arabic, Inter SemiBold (600) in English
- Body: Tajawal Regular (400) in Arabic, Inter Regular (400) in English
- Section title size: 20px (1.25rem) desktop, 18px mobile
- Card title: 18px bold, blue (`#0071C2`) — clickable
- Price: 24px bold
- Rating score in badge: 14px bold white
- Meta info (distance, tags): 13px gray

### Spacing System
- Container max-width: 1200px, auto margin
- Section vertical gap: 40px (2.5rem)
- Card internal padding: 16px
- Filter sidebar width: 240px fixed, 16px gap to results
- Card image: fixed height 200px (list view) or aspect-ratio 3/2 (grid)
- Grid gap: 16px
- Header height: 54px top row + 48px nav row = 102px total

---

## TASK-D01: Update Global CSS Tokens & Base Styles

Update `client/src/styles/tokens.css` — add/update these tokens without removing existing ones:

```css
:root {
  /* Page & layout */
  --page-bg: #F2F2F2;
  --card-bg: #FFFFFF;
  --card-border: 1px solid #E7E7E7;
  --card-radius: 8px;
  --card-shadow: 0 1px 4px rgba(0,0,0,0.08);
  --card-shadow-hover: 0 2px 12px rgba(0,0,0,0.15);

  /* Header */
  --header-bg: #003580;
  --header-height-top: 54px;
  --header-height-nav: 48px;
  --header-text: #FFFFFF;

  /* Search bar */
  --search-bar-bg: #FFFFFF;
  --search-bar-border: #FFC107;
  --search-bar-border-width: 3px;
  --search-btn-bg: #0071C2;
  --search-btn-hover: #005999;

  /* Text */
  --text-heading: #1A1A1A;
  --text-body: #333333;
  --text-muted: #6B6B6B;
  --text-link: #0071C2;
  --text-link-hover: #005999;
  --text-price: #1A1A1A;
  --text-price-original: #CC0000;
  --text-deal: #008009;

  /* Badges */
  --badge-featured-bg: #EBF3FF;
  --badge-featured-text: #0071C2;
  --badge-featured-border: #0071C2;
  --badge-deal-bg: #008009;
  --badge-deal-text: #FFFFFF;
  --badge-new-bg: #FFC107;
  --badge-new-text: #1A1A1A;
  --badge-score-bg: #003580;
  --badge-score-text: #FFFFFF;

  /* Score labels */
  --score-exceptional: #003580;
  --score-very-good: #0071C2;
  --score-good: #4CAF50;

  /* Filter sidebar */
  --filter-width: 240px;
  --filter-bg: #FFFFFF;
  --filter-divider: #E7E7E7;
  --filter-checkbox-active: #0071C2;

  /* Container */
  --container-max: 1200px;
  --container-px: 16px;
  --section-gap: 40px;
  --card-gap: 16px;
}
```

Update `client/src/styles/global.css`:
- Set `body { background-color: var(--page-bg); }` (was `--color-white`)
- Set `a { color: var(--text-link); text-decoration: none; }`
- Set `a:hover { color: var(--text-link-hover); text-decoration: underline; }`

Update `client/src/styles/typography.css`:
- Section title class: `.sectionTitle { font-size: 1.25rem; font-weight: 700; color: var(--text-heading); margin-bottom: var(--space-4); }`
- Section subtitle: `.sectionSubtitle { font-size: 0.875rem; color: var(--text-muted); margin-bottom: var(--space-4); }`

**Write tests for:** Token values are CSS custom properties accessible on `:root`

---

## TASK-D02: Redesign the Header Component

**Reference**: Top bar of all three screenshots — deep blue `#003580` background, two-row structure.

**`client/src/components/layout/Header/Header.module.css`** — full redesign:

### Structure (two rows):
```
ROW 1 (54px tall, blue bg):
[Logo]                    [Currency] [Flag] [Help?] [List your gym] [Register btn] [Sign In btn]

ROW 2 (48px tall, blue bg, slightly darker or same):
[Category pill: Gyms ✓] [Padel] [Boxing] [Activities] [Restaurants] [Personal Training]
```

### Row 1 styling:
```css
.headerTop {
  background-color: var(--color-primary);
  height: var(--header-height-top);
  display: flex;
  align-items: center;
  padding-inline: var(--container-px);
}
.logo {
  color: var(--color-white);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  font-family: var(--font-arabic);
  /* Logo text: "Growth World" bold white — no box, just clean text */
}
.headerActions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-inline-start: auto;
}
.currencyBtn {
  color: var(--color-white);
  font-size: var(--text-sm);
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--space-1);
}
.helpBtn {
  color: var(--color-white);
  width: 28px; height: 28px;
  border: 2px solid rgba(255,255,255,0.6);
  border-radius: var(--radius-full);
  display: flex; align-items: center; justify-content: center;
  font-size: var(--text-sm);
  cursor: pointer;
}
.listGymBtn {
  color: var(--color-white);
  background: transparent;
  border: none;
  font-size: var(--text-sm);
  cursor: pointer;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  white-space: nowrap;
}
.listGymBtn:hover { background: rgba(255,255,255,0.15); }
.divider { width: 1px; height: 20px; background: rgba(255,255,255,0.4); }
.registerBtn {
  color: var(--color-white);
  border: 2px solid var(--color-white);
  background: transparent;
  padding: 6px 14px;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: background var(--transition-fast);
}
.registerBtn:hover { background: rgba(255,255,255,0.15); }
.signInBtn {
  background: var(--color-white);
  color: var(--color-primary);
  border: 2px solid var(--color-white);
  padding: 6px 14px;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.signInBtn:hover { background: var(--color-gray-100); }
```

### Row 2 — Category nav pills:
```css
.headerNav {
  background-color: var(--color-primary);
  border-top: 1px solid rgba(255,255,255,0.2);
  height: var(--header-height-nav);
  display: flex;
  align-items: center;
  padding-inline: var(--container-px);
  gap: var(--space-1);
  overflow-x: auto;
  scrollbar-width: none;
}
.navPill {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-white);
  font-size: var(--text-sm);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
  border: 2px solid transparent;
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition-fast);
  text-decoration: none;
  opacity: 0.85;
}
.navPill:hover { border-color: rgba(255,255,255,0.6); opacity: 1; }
.navPillActive {
  border-color: var(--color-white);
  opacity: 1;
  font-weight: var(--font-medium);
}
.navPillIcon { width: 18px; height: 18px; }
```

### Language switcher integration:
- Place the `LanguageSwitcher` component between the help button and "List your gym" in the top row
- Style: `AR | EN` in small white text, no border, hover underline

### Authenticated state (when user is logged in):
- Hide Register + Sign In buttons
- Show: notification bell icon (white, with count badge) + user avatar circle (32px, white border) + user name text (white, hidden on mobile) + chevron-down icon
- Dropdown on avatar click: Profile, Favorites, Dashboard (if gym_owner), Admin Panel (if admin+), divider, Sign Out

### Mobile header (< 768px):
- Row 1: Logo (left) + hamburger menu icon (right) only
- Row 2: Horizontal scroll category pills (same as desktop but smaller padding)
- Hamburger opens full-screen slide-in drawer with all nav links + language switcher + auth buttons

**Write tests for:** Nav pill active state, authenticated vs guest header, mobile hamburger renders

---

## TASK-D03: Redesign the Hero Search Bar (Home Page)

**Reference**: Booking.com homepage — white search bar with thick yellow/gold border sitting below the category nav, full-width container on a clean white or image background.

**`client/src/features/home/HomePage/HeroSection/`** — redesign:

### Layout:
```
[HERO AREA — white background or subtle gradient, NOT a dark image overlay]
  "اكتشف أفضل الخدمات الرياضية"    (large bold heading, dark text)
  "في المملكة العربية السعودية"     (subtitle, muted)

  [SEARCH BAR WRAPPER — yellow border, white bg, rounded, full-width up to 900px]
  ┌──────────────────────────────────────────────────────────┐  ← yellow 3px border
  │ [🏋️ Category dropdown] │ [📍 City dropdown] │ [🔍 text input] │ [Search btn] │
  └──────────────────────────────────────────────────────────┘
  
  [checkbox row: "I'm looking for the best price" small text below]
```

### CSS:
```css
.heroSection {
  background: var(--color-white);
  padding: var(--space-12) var(--container-px) var(--space-8);
  text-align: center;
}
.heroTitle {
  font-size: 2rem;
  font-weight: var(--font-bold);
  color: var(--text-heading);
  margin-bottom: var(--space-2);
}
.heroSubtitle {
  font-size: 1.125rem;
  color: var(--text-muted);
  margin-bottom: var(--space-6);
}
.searchWrapper {
  max-width: 900px;
  margin-inline: auto;
  border: var(--search-bar-border-width) solid var(--search-bar-border);
  border-radius: var(--radius-md);
  background: var(--search-bar-bg);
  display: flex;
  align-items: stretch;
  box-shadow: var(--shadow-md);
  overflow: hidden;
}
.searchField {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-inline-end: 1px solid var(--color-gray-200);
  cursor: pointer;
  min-height: 56px;
}
.searchField:hover { background: var(--color-gray-50); }
.searchFieldIcon { color: var(--color-gray-500); flex-shrink: 0; }
.searchFieldLabel {
  font-size: var(--text-xs);
  color: var(--text-muted);
  display: block;
  margin-bottom: 2px;
}
.searchFieldValue {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-body);
}
.searchBtn {
  background: var(--search-btn-bg);
  color: var(--color-white);
  border: none;
  padding: 0 var(--space-8);
  font-size: var(--text-base);
  font-weight: var(--font-bold);
  cursor: pointer;
  transition: background var(--transition-fast);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 120px;
  justify-content: center;
}
.searchBtn:hover { background: var(--search-btn-hover); }
```

### Mobile (< 768px):
- Search fields stack vertically in a card with yellow border
- Each field full-width, separated by thin dividers
- Search button full-width at bottom

**Write tests for:** Search bar renders all fields, mobile stacked layout, submit triggers search

---

## TASK-D04: Redesign the Home Page Sections

**Reference**: Booking.com homepage screenshot — clean white sections on gray page background, horizontal scrolling carousels, section titles with "View all" links.

Remove the current homepage hero image/banner. The page background is `var(--page-bg)` (#F2F2F2). Each section sits in a `--color-white` card or directly on the page bg.

### Section 1: Offers Banner
Immediately below the search bar. A thin promotional banner card:
```
[Blue "Genius" icon]  No catch. Just getaways.
                      At least 15% off select stays worldwide – Just book and go.
                      [Save with a Getaway Deal btn]              [Small promo image right side]
```
```css
.offersBanner {
  max-width: var(--container-max);
  margin-inline: auto;
  margin-top: var(--space-6);
  background: var(--card-bg);
  border: var(--card-border);
  border-radius: var(--card-radius);
  padding: var(--space-5) var(--space-6);
  display: flex;
  align-items: center;
  gap: var(--space-4);
}
.offersTitle { font-size: var(--text-sm); color: var(--text-muted); margin-bottom: 4px; }
.offersHeadline { font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--text-heading); }
.offersDesc { font-size: var(--text-sm); color: var(--text-body); margin-bottom: var(--space-3); }
.offersCta {
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
}
```

### Section 2: Category Types Grid (replaces old icon grid)
**Reference**: "Property types unique to Cairo" — 4 image cards in a row, each with a photo background and text overlay.
```
[Image card]  [Image card]  [Image card]  [Image card]
Gyms          Padel         Boxing        Restaurants
```
```css
.categoryTypeGrid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--card-gap);
}
/* tablet: 2 cols, mobile: 2 cols */
.categoryTypeCard {
  border-radius: var(--card-radius);
  overflow: hidden;
  position: relative;
  aspect-ratio: 3/2;
  cursor: pointer;
}
.categoryTypeImg {
  width: 100%; height: 100%;
  object-fit: cover;
  transition: transform var(--transition-base);
}
.categoryTypeCard:hover .categoryTypeImg { transform: scale(1.04); }
.categoryTypeLabel {
  position: absolute;
  inset-block-end: 0;
  inset-inline-start: 0;
  inset-inline-end: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.65), transparent);
  color: var(--color-white);
  font-weight: var(--font-bold);
  padding: var(--space-3) var(--space-3) var(--space-2);
  font-size: var(--text-sm);
}
```

### Section 3: Cities Grid (replaces old city section)
**Reference**: "Trending destinations" — 2 large cards top row + 3 medium cards bottom row.
```
[RIYADH — large]    [JEDDAH — large]
[DAMMAM]  [MAKKAH]  [MADINAH]
```
```css
.citiesGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto auto;
  gap: var(--card-gap);
}
.cityCardLarge {
  grid-column: span 1;
  /* first 2 cities span more visually */
}
/* Actually implement as: top row = 2 cols (each 50%), bottom row = 3 cols */
.citiesGridTop { display: grid; grid-template-columns: 1fr 1fr; gap: var(--card-gap); margin-bottom: var(--card-gap); }
.citiesGridBottom { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--card-gap); }
.cityCard {
  border-radius: var(--card-radius);
  overflow: hidden;
  position: relative;
  aspect-ratio: 16/9;
  cursor: pointer;
}
.cityCardBottom { aspect-ratio: 4/3; }
.cityName {
  position: absolute;
  inset-block-start: var(--space-3);
  inset-inline-start: var(--space-3);
  color: var(--color-white);
  font-weight: var(--font-bold);
  font-size: var(--text-lg);
  text-shadow: 0 1px 4px rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.cityFlag { width: 20px; height: 20px; border-radius: var(--radius-full); }
```

### Section 4: Deals Horizontal Scroll (Featured Listings)
**Reference**: "Deals for the weekend" — horizontal scrolling row of listing cards with price.
```css
.horizontalScroll {
  display: flex;
  gap: var(--card-gap);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  padding-block-end: var(--space-2);
}
.horizontalScroll::-webkit-scrollbar { display: none; }
.dealCard {
  flex: 0 0 220px;
  scroll-snap-align: start;
  background: var(--card-bg);
  border: var(--card-border);
  border-radius: var(--card-radius);
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow var(--transition-fast);
}
.dealCard:hover { box-shadow: var(--card-shadow-hover); }
.dealCardImage { width: 100%; aspect-ratio: 3/2; object-fit: cover; }
.dealCardBody { padding: var(--space-3); }
.dealCardBadge {
  font-size: 11px;
  font-weight: var(--font-bold);
  background: var(--badge-deal-bg);
  color: var(--badge-deal-text);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  display: inline-block;
  margin-bottom: var(--space-2);
}
.dealCardName { font-size: var(--text-sm); font-weight: var(--font-bold); color: var(--text-link); margin-bottom: 4px; }
.dealCardCity { font-size: var(--text-xs); color: var(--text-muted); margin-bottom: var(--space-2); }
.dealCardRating {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-bottom: var(--space-2);
}
.dealCardScore {
  background: var(--badge-score-bg);
  color: var(--badge-score-text);
  font-size: 11px;
  font-weight: var(--font-bold);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}
.dealCardRatingLabel { font-size: var(--text-xs); color: var(--text-body); }
.dealCardPriceOld { font-size: var(--text-xs); color: var(--text-price-original); text-decoration: line-through; }
.dealCardPrice { font-size: var(--text-base); font-weight: var(--font-bold); color: var(--text-price); }
.dealCardPriceSub { font-size: var(--text-xs); color: var(--text-muted); }
```

### Section 5: Browse by Category Type
**Reference**: "Browse by property type" — 4 large image cards in a row (Hotels, Apartments, Resorts, Villas). Adapt to: Gyms, Padel, Boxing, Restaurants — large square-ish image with label below (not overlaid).
```css
.browseTypeGrid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--card-gap); }
.browseTypeCard { cursor: pointer; }
.browseTypeImg { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: var(--card-radius); margin-bottom: var(--space-2); }
.browseTypeCard:hover .browseTypeImg { opacity: 0.9; }
.browseTypeName { font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--text-body); }
```

### Section 6: Top Unique Properties / Featured Listings
**Reference**: "Stay at our top unique properties" — 4-column card grid with heart icon, rating badge, score label.
(This is the same as the listing cards in search results — reuse `ListingCard` component in grid layout)

### Section 7: "Explore by City" Strip
**Reference**: "Explore Egypt" — horizontal scroll of city thumbnails with property count.
```css
.exploreStrip { display: flex; gap: var(--card-gap); overflow-x: auto; scrollbar-width: none; }
.exploreCityCard { flex: 0 0 160px; cursor: pointer; }
.exploreCityImg { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: var(--card-radius); margin-bottom: var(--space-2); }
.exploreCityName { font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--text-body); }
.exploreCityCount { font-size: var(--text-xs); color: var(--text-muted); }
```

### Section 8: Travel More / Sign-in Prompt Banner (for guests only)
**Reference**: "Travel more, spend less" blue section at bottom — only show to non-authenticated users.
```css
.signInBanner {
  background: var(--color-primary);
  border-radius: var(--card-radius);
  padding: var(--space-8);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}
.signInBannerTitle { color: var(--color-white); font-size: var(--text-xl); font-weight: var(--font-bold); }
.signInBannerSubtitle { color: rgba(255,255,255,0.8); font-size: var(--text-sm); margin-top: var(--space-1); }
.signInBannerBtn {
  background: var(--color-white);
  color: var(--color-primary);
  border: none;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  font-weight: var(--font-bold);
  cursor: pointer;
  white-space: nowrap;
}
```

### Section 9: "List Your Gym" CTA (for non-gym-owners)
Same blue banner style but with sports icon and "Add your facility for free" CTA.

### Section layout wrapper (apply to all sections):
```css
.section {
  max-width: var(--container-max);
  margin-inline: auto;
  padding-inline: var(--container-px);
  margin-block-end: var(--section-gap);
}
.sectionHeader {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}
.sectionTitle { font-size: 1.25rem; font-weight: var(--font-bold); color: var(--text-heading); }
.sectionSubtitle { font-size: var(--text-sm); color: var(--text-muted); margin-top: 2px; }
.sectionViewAll { font-size: var(--text-sm); color: var(--text-link); cursor: pointer; white-space: nowrap; }
.sectionViewAll:hover { text-decoration: underline; }
```

**Write tests for:** All sections render, horizontal scroll does not show scrollbar, guest-only banner hidden when logged in

---

## TASK-D05: Redesign the Listing Card Component

**Reference**: Search results page — horizontal list-view card (image left, content right) with score badge top-right.

The `ListingCard` component must support two variants: `list` (horizontal, search results) and `grid` (vertical, homepage sections).

### List variant (primary — search results):
```
┌──────────────────────────────────────────────────────────────────────┐
│ [IMAGE 200x200]  │  [Name — blue link]  ★★★★☆  [Featured badge]     │
│                  │  [City · District · Distance]                     │  [Score: 8.9]
│                  │  [Amenity chip] [Amenity chip] [Amenity chip]      │  Exceptional
│                  │  ✓ Free cancellation available                     │  21 reviews
│                  │  ✓ Women's section available                       │
│                  │                                [From SAR 150/mo]  │
│                  │                                [See all options →] │
├──────────────────────────────────────────────────────────────────────┤
│  [💡 Sign in to see savings – sign in link]           [Genius logo]  │  ← guests only
└──────────────────────────────────────────────────────────────────────┘
```

```css
/* ListingCard.module.css */
.card {
  background: var(--card-bg);
  border: var(--card-border);
  border-radius: var(--card-radius);
  overflow: hidden;
  transition: box-shadow var(--transition-fast);
  display: flex;
  flex-direction: column;
}
.card:hover { box-shadow: var(--card-shadow-hover); }

/* List variant */
.cardList { flex-direction: row; }
.cardListImage {
  flex: 0 0 200px;
  position: relative;
}
.cardListImage img {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
}
.favoriteBtn {
  position: absolute;
  inset-block-start: var(--space-2);
  inset-inline-end: var(--space-2);
  background: rgba(255,255,255,0.9);
  border: none;
  border-radius: var(--radius-full);
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: background var(--transition-fast);
}
.favoriteBtn:hover { background: var(--color-white); }
.favoriteBtnActive svg { fill: var(--color-danger); color: var(--color-danger); }

.cardBody {
  flex: 1;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
}
.cardBodyInner {
  display: flex;
  gap: var(--space-4);
  flex: 1;
}
.cardMain { flex: 1; }
.cardSide {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-2);
  min-width: 140px;
}

/* Badges row */
.badgeRow { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-2); }
.badgeFeatured {
  font-size: 11px;
  font-weight: var(--font-medium);
  background: var(--badge-featured-bg);
  color: var(--badge-featured-text);
  border: 1px solid var(--badge-featured-border);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}
.badgeDeal {
  font-size: 11px;
  font-weight: var(--font-bold);
  background: var(--badge-deal-bg);
  color: var(--badge-deal-text);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

/* Name */
.cardName {
  font-size: 1.1rem;
  font-weight: var(--font-bold);
  color: var(--text-link);
  text-decoration: none;
  margin-bottom: var(--space-1);
  display: block;
  line-height: 1.4;
}
.cardName:hover { text-decoration: underline; }

/* Location */
.cardLocation {
  font-size: var(--text-xs);
  color: var(--text-link);
  margin-bottom: var(--space-3);
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex-wrap: wrap;
}
.locationDot { color: var(--text-muted); }
.showOnMap { text-decoration: underline; cursor: pointer; }
.distance { color: var(--text-muted); }

/* Amenity chips */
.amenitiesRow { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-3); }
.amenityChip {
  font-size: var(--text-xs);
  color: var(--text-body);
  background: var(--color-gray-100);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

/* Perks (green checkmarks) */
.perksRow { display: flex; flex-direction: column; gap: 4px; }
.perkItem {
  font-size: var(--text-xs);
  color: var(--text-deal);
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

/* Score side panel */
.scoreBlock { text-align: end; }
.scoreLabel { font-size: var(--text-xs); color: var(--score-exceptional); font-weight: var(--font-medium); margin-bottom: 4px; }
.scoreReviews { font-size: var(--text-xs); color: var(--text-muted); margin-bottom: var(--space-2); }
.scoreBadge {
  background: var(--badge-score-bg);
  color: var(--badge-score-text);
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  padding: 4px 8px;
  border-radius: var(--radius-md) var(--radius-md) var(--radius-md) 0;
  /* Booking.com style: rounded except bottom-start corner */
  display: inline-block;
}

/* Price block */
.priceBlock { text-align: end; margin-block-start: auto; }
.priceOriginal {
  font-size: var(--text-xs);
  color: var(--text-price-original);
  text-decoration: line-through;
  margin-bottom: 2px;
}
.priceMain {
  font-size: 1.375rem;
  font-weight: var(--font-bold);
  color: var(--text-price);
  line-height: 1.2;
}
.priceSub { font-size: var(--text-xs); color: var(--text-muted); margin-bottom: var(--space-3); }
.seeOptionsBtn {
  background: var(--color-primary-light);
  color: var(--color-white);
  border: none;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  transition: background var(--transition-fast);
  white-space: nowrap;
}
.seeOptionsBtn:hover { background: var(--color-primary); }

/* Genius/savings strip — guests only */
.savingsStrip {
  border-block-start: var(--card-border);
  padding: var(--space-3) var(--space-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-gray-50);
}
.savingsText { font-size: var(--text-xs); color: var(--text-body); }
.savingsLink { color: var(--text-link); font-weight: var(--font-medium); }
.savingsLogo { font-size: var(--text-sm); font-weight: var(--font-bold); color: var(--color-primary); }

/* Grid variant */
.cardGrid { flex-direction: column; }
.cardGridImage { width: 100%; aspect-ratio: 3/2; object-fit: cover; }
.cardGridBody { padding: var(--space-3); }
```

### Skeleton for list card:
```css
.skeletonCard { background: var(--card-bg); border: var(--card-border); border-radius: var(--card-radius); display: flex; height: 200px; overflow: hidden; }
.skeletonImage { flex: 0 0 200px; background: var(--color-gray-200); animation: skeletonPulse 1.5s ease-in-out infinite; }
.skeletonBody { flex: 1; padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-3); }
.skeletonLine { height: 14px; background: var(--color-gray-200); border-radius: var(--radius-sm); animation: skeletonPulse 1.5s ease-in-out infinite; }
.skeletonLineShort { width: 60%; }
.skeletonLineMedium { width: 80%; }
```

**Write tests for:** List vs grid variant renders, favorite button toggle, score badge color, savings strip hidden when logged in

---

## TASK-D06: Redesign the Search Results Page (Listings Page)

**Reference**: Search results page screenshot — left filter sidebar, right listing list, map thumbnail top-left, sort bar, result count.

### Page layout:
```
[STICKY HEADER]
[SEARCH BAR STRIP — condensed version of hero search, always visible on this page]
[BREADCRUMB — Home > Gyms > Riyadh > Search results]

[CONTENT AREA — max-width 1200px, two columns]
├── LEFT (240px fixed): FILTER SIDEBAR
│   ├── Mini map with "Show on map" button
│   ├── "Filter by:" title
│   ├── Budget slider (price range)
│   ├── Popular filters (checkboxes with count)
│   ├── Rating filter (star rows with count)
│   ├── Category filter
│   ├── Amenities
│   └── Open now toggle
│
└── RIGHT (flex 1): RESULTS AREA
    ├── Result count + sort dropdown
    ├── List/Grid toggle buttons (top-right)
    └── Listing cards (vertical stack, list variant)
```

### Search bar strip (condensed, attached to header):
```css
.searchStrip {
  background: var(--color-primary);
  padding: var(--space-3) var(--container-px);
  border-block-end: 3px solid var(--search-bar-border);
}
.searchStripInner {
  max-width: var(--container-max);
  margin-inline: auto;
  display: flex;
  gap: var(--space-2);
  align-items: center;
}
.searchStripField {
  flex: 1;
  background: var(--color-white);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  border: none;
  height: 40px;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
}
.searchStripBtn {
  background: var(--search-btn-bg);
  color: var(--color-white);
  border: none;
  padding: 0 var(--space-5);
  height: 40px;
  border-radius: var(--radius-md);
  font-weight: var(--font-bold);
  font-size: var(--text-sm);
  cursor: pointer;
}
```

### Filter sidebar:
```css
.filterSidebar {
  width: var(--filter-width);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.mapThumbnail {
  width: 100%;
  aspect-ratio: 4/3;
  border-radius: var(--card-radius);
  overflow: hidden;
  position: relative;
  cursor: pointer;
  border: var(--card-border);
}
.mapThumbnail img { width: 100%; height: 100%; object-fit: cover; }
.showOnMapBtn {
  position: absolute;
  inset-block-end: var(--space-3);
  inset-inline-start: 50%;
  transform: translateX(-50%);
  background: var(--color-white);
  color: var(--color-primary);
  border: none;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  box-shadow: var(--shadow-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  white-space: nowrap;
}
.filterCard {
  background: var(--filter-bg);
  border: var(--card-border);
  border-radius: var(--card-radius);
  padding: var(--space-4);
}
.filterTitle {
  font-size: var(--text-base);
  font-weight: var(--font-bold);
  color: var(--text-heading);
  margin-bottom: var(--space-3);
  padding-block-end: var(--space-3);
  border-block-end: 1px solid var(--filter-divider);
}
.filterSection { margin-block-end: var(--space-4); }
.filterSectionTitle {
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  color: var(--text-body);
  margin-bottom: var(--space-3);
}
.filterCheckboxItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-1) 0;
  cursor: pointer;
}
.filterCheckboxLabel { font-size: var(--text-sm); color: var(--text-body); flex: 1; }
.filterCheckboxCount { font-size: var(--text-xs); color: var(--text-muted); }
.filterCheckbox { width: 16px; height: 16px; accent-color: var(--filter-checkbox-active); }
.priceRangeSlider { width: 100%; accent-color: var(--color-primary); margin-block: var(--space-3); }
.priceRangeLabels { display: flex; justify-content: space-between; font-size: var(--text-xs); color: var(--text-muted); }
```

### Results area:
```css
.resultsArea { flex: 1; min-width: 0; }
.resultsHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
  gap: var(--space-3);
}
.resultsCount { font-size: 1.25rem; font-weight: var(--font-bold); color: var(--text-heading); }
.resultsCountSub { font-size: var(--text-sm); color: var(--text-muted); margin-top: 2px; }
.sortRow { display: flex; align-items: center; gap: var(--space-3); }
.sortLabel { font-size: var(--text-sm); color: var(--text-muted); }
.sortDropdown {
  padding: var(--space-2) var(--space-8) var(--space-2) var(--space-3);
  border: var(--card-border);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  background: var(--card-bg);
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,..."); /* chevron down icon */
}
.viewToggle { display: flex; border: var(--card-border); border-radius: var(--radius-md); overflow: hidden; }
.viewToggleBtn { padding: var(--space-2) var(--space-3); border: none; background: var(--card-bg); cursor: pointer; font-size: var(--text-sm); }
.viewToggleBtnActive { background: var(--color-gray-200); }
.resultsList { display: flex; flex-direction: column; gap: var(--card-gap); }
```

### Breadcrumb:
```css
.breadcrumb {
  max-width: var(--container-max);
  margin-inline: auto;
  padding-inline: var(--container-px);
  padding-block: var(--space-3);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  flex-wrap: wrap;
}
.breadcrumbLink { color: var(--text-link); }
.breadcrumbLink:hover { text-decoration: underline; }
.breadcrumbSeparator { color: var(--text-muted); }
.breadcrumbCurrent { color: var(--text-muted); }
```

### Mobile (< 768px):
- Filter sidebar becomes a bottom sheet, triggered by floating "Filter" button
- Sort stays as a dropdown strip above results
- Map thumbnail removed, replaced by "Show on map" text link

**Write tests for:** Filter sidebar renders, sort dropdown updates results, list/grid toggle switches view, breadcrumb links correct

---

## TASK-D07: Redesign the Listing Detail Page

**Reference**: Full listing detail page screenshot — image gallery hero, sticky right panel, tabbed sections.

### Page structure:
```
[HEADER]
[BREADCRUMB: Home > Gyms > Riyadh > FitLife Gym]
[STICKY SECONDARY NAV: Overview | Info | Facilities | Reviews | Location]

[IMAGE GALLERY HERO]
  [Main large image — 60% width]  [2x2 grid of smaller images — 40%]
                                   [Show all photos btn — bottom right]

[TWO-COLUMN LAYOUT — max 1200px]
LEFT COLUMN (flex 1):             RIGHT STICKY PANEL (360px):
├── Name + rating + badges        ├── "Perfect for a night stay!"
├── Location + map link           ├── Availability note
├── About section                 ├── [Reserve / Contact btn — blue full width]
├── Highlight chips row           ├── Price from (large)
├── Packages/Pricing table        ├── [See availability btn — outline]
├── "Why book with us?" row       └── Property highlights (3 bullets)
├── Reviews section
├── Hotel info / Facilities
├── Location map embed
├── FAQ section
└── House rules
```

### Image gallery:
```css
.galleryHero {
  display: grid;
  grid-template-columns: 60% 40%;
  grid-template-rows: 200px 200px;
  gap: 4px;
  max-width: var(--container-max);
  margin-inline: auto;
  border-radius: var(--card-radius);
  overflow: hidden;
}
.galleryMain {
  grid-row: span 2;
  position: relative;
}
.galleryMain img { width: 100%; height: 100%; object-fit: cover; cursor: pointer; }
.galleryThumb img { width: 100%; height: 100%; object-fit: cover; cursor: pointer; }
.galleryThumb:hover img { opacity: 0.85; }
.showAllPhotosBtn {
  position: absolute;
  inset-block-end: var(--space-4);
  inset-inline-end: var(--space-4);
  background: var(--color-white);
  border: 2px solid var(--color-gray-700);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
```

### Sticky secondary nav (appears after scrolling past gallery):
```css
.stickyNav {
  position: sticky;
  inset-block-start: 102px; /* below header */
  background: var(--card-bg);
  border-block-end: 1px solid var(--filter-divider);
  z-index: var(--z-sticky);
  display: flex;
  align-items: center;
  gap: 0;
  padding-inline: var(--container-px);
  max-width: 100%;
}
.stickyNavLink {
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-sm);
  color: var(--text-muted);
  border-block-end: 3px solid transparent;
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition-fast);
}
.stickyNavLink:hover { color: var(--text-body); }
.stickyNavLinkActive { color: var(--color-primary); border-block-end-color: var(--color-primary); font-weight: var(--font-medium); }
```

### Sticky right panel:
```css
.rightPanel {
  width: 360px;
  flex-shrink: 0;
  position: sticky;
  inset-block-start: 156px; /* below header + sticky nav */
  align-self: flex-start;
  background: var(--card-bg);
  border: var(--card-border);
  border-radius: var(--card-radius);
  padding: var(--space-5);
  box-shadow: var(--shadow-md);
}
.rightPanelTitle {
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  color: var(--text-heading);
  margin-bottom: var(--space-1);
}
.rightPanelSubtitle { font-size: var(--text-xs); color: var(--text-muted); margin-bottom: var(--space-4); }
.reserveBtn {
  width: 100%;
  background: var(--color-primary-light);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-md);
  padding: var(--space-3);
  font-size: var(--text-base);
  font-weight: var(--font-bold);
  cursor: pointer;
  margin-bottom: var(--space-3);
  transition: background var(--transition-fast);
}
.reserveBtn:hover { background: var(--color-primary); }
.availabilityBtn {
  width: 100%;
  background: transparent;
  color: var(--color-primary-light);
  border: 2px solid var(--color-primary-light);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  margin-bottom: var(--space-4);
}
.priceFrom { font-size: var(--text-xs); color: var(--text-muted); }
.priceAmount { font-size: 1.5rem; font-weight: var(--font-bold); color: var(--text-price); }
.priceAmountSub { font-size: var(--text-xs); color: var(--text-muted); margin-bottom: var(--space-4); }
.panelHighlights { display: flex; flex-direction: column; gap: var(--space-2); }
.panelHighlightItem {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  font-size: var(--text-xs);
  color: var(--text-body);
}
.panelHighlightIcon { color: var(--color-primary); flex-shrink: 0; margin-block-start: 2px; }
```

### Packages/Availability table:
**Reference**: The "Accommodation Type" table with columns: Room type | Number of guests | Price for X nights | Your choices | Select.

Adapt to packages:
```css
.packagesTable { width: 100%; border-collapse: collapse; font-size: var(--text-sm); margin-block: var(--space-4); }
.packagesTable thead tr { background: var(--color-primary); color: var(--color-white); }
.packagesTable th { padding: var(--space-3); text-align: start; font-weight: var(--font-medium); font-size: var(--text-xs); }
.packagesTable td { padding: var(--space-3); border-block-end: 1px solid var(--filter-divider); vertical-align: top; }
.packagesTable tr:hover td { background: var(--color-gray-50); }
.packageName { font-weight: var(--font-bold); color: var(--text-link); }
.packageFeature { font-size: var(--text-xs); color: var(--text-deal); display: flex; align-items: center; gap: 4px; }
.packagePrice { font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--text-price); }
.packageSelectBtn {
  background: var(--color-primary-light);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  white-space: nowrap;
}
.popularBadge {
  font-size: 10px;
  background: var(--badge-deal-bg);
  color: var(--badge-deal-text);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-weight: var(--font-bold);
}
```

### Rating summary (Booking.com style):
```css
.ratingSummaryCard {
  background: var(--card-bg);
  border: var(--card-border);
  border-radius: var(--card-radius);
  padding: var(--space-4);
  margin-block-end: var(--space-4);
}
.ratingSummaryTop {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}
.ratingBigScore {
  font-size: 3rem;
  font-weight: var(--font-bold);
  color: var(--text-heading);
  line-height: 1;
}
.ratingLabel { font-size: 1.25rem; font-weight: var(--font-bold); color: var(--score-exceptional); }
.ratingReviewCount { font-size: var(--text-sm); color: var(--text-muted); margin-block-start: 4px; }
.ratingBars { display: flex; flex-direction: column; gap: var(--space-2); }
.ratingBarRow { display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-xs); }
.ratingBarLabel { width: 80px; color: var(--text-body); text-align: end; flex-shrink: 0; }
.ratingBarTrack { flex: 1; height: 8px; background: var(--color-gray-200); border-radius: var(--radius-full); }
.ratingBarFill { height: 100%; background: var(--color-primary); border-radius: var(--radius-full); }
.ratingBarScore { width: 30px; font-weight: var(--font-bold); color: var(--text-body); }
```

### Facilities section:
**Reference**: The large grid of icons with category groupings (Internet, Parking, Room, Bathroom etc.).
```css
.facilitiesGrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-6); }
.facilityGroup { }
.facilityGroupTitle { font-weight: var(--font-bold); font-size: var(--text-sm); color: var(--text-heading); margin-bottom: var(--space-3); display: flex; align-items: center; gap: var(--space-2); }
.facilityList { display: flex; flex-direction: column; gap: var(--space-2); }
.facilityItem { font-size: var(--text-sm); color: var(--text-body); display: flex; align-items: center; gap: var(--space-2); }
.facilityIcon { color: var(--text-muted); flex-shrink: 0; }
```

### FAQ section (Accordion):
```css
.faqSection { margin-block-end: var(--section-gap); }
.faqTitle { font-size: 1.125rem; font-weight: var(--font-bold); color: var(--text-heading); margin-bottom: var(--space-4); }
.faqItem { border-block-end: 1px solid var(--filter-divider); }
.faqQuestion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) 0;
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-body);
}
.faqAnswer { padding-block-end: var(--space-4); font-size: var(--text-sm); color: var(--text-muted); line-height: 1.6; }
```

### House rules section:
```css
.houseRulesCard { background: var(--card-bg); border: var(--card-border); border-radius: var(--card-radius); padding: var(--space-5); }
.houseRuleItem { display: flex; align-items: flex-start; gap: var(--space-4); padding-block: var(--space-3); border-block-end: 1px solid var(--filter-divider); font-size: var(--text-sm); }
.houseRuleIcon { color: var(--text-muted); flex-shrink: 0; }
.houseRuleLabel { font-weight: var(--font-medium); color: var(--text-body); min-width: 120px; }
.houseRuleValue { color: var(--text-muted); }
```

### Mobile (< 768px):
- Gallery: single image with dot pagination + "X photos" button
- Right panel moves to below the listing info (not sticky)
- Sticky nav collapses to horizontal scroll strip
- Facilities grid: 2 columns
- Packages table: card-per-package layout instead of table

**Write tests for:** Gallery thumbnail click opens lightbox, sticky nav highlights active section on scroll, right panel reserve button visible, mobile packages render as cards

---

## TASK-D08: Redesign the Reviews Section

**Reference**: "Guest reviews" section in listing detail — score header, category breakdowns, filter chips, review cards with green verified checkmark.

### Review card design:
```css
.reviewCard {
  padding: var(--space-4) 0;
  border-block-end: 1px solid var(--filter-divider);
}
.reviewHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}
.reviewUser { display: flex; align-items: center; gap: var(--space-3); }
.reviewAvatar {
  width: 36px; height: 36px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: var(--color-white);
  display: flex; align-items: center; justify-content: center;
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  flex-shrink: 0;
}
.reviewUserName { font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--text-heading); }
.reviewUserMeta { font-size: var(--text-xs); color: var(--text-muted); margin-block-start: 2px; }
.reviewScore {
  background: var(--badge-score-bg);
  color: var(--badge-score-text);
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  padding: 4px 8px;
  border-radius: var(--radius-md) var(--radius-md) var(--radius-md) 0;
}
.reviewContent { font-size: var(--text-sm); color: var(--text-body); line-height: 1.7; margin-bottom: var(--space-3); }
.reviewPositive { display: flex; align-items: flex-start; gap: var(--space-2); font-size: var(--text-sm); margin-bottom: var(--space-2); }
.reviewPositiveIcon { color: var(--color-success); flex-shrink: 0; }
.reviewNegative { display: flex; align-items: flex-start; gap: var(--space-2); font-size: var(--text-sm); color: var(--text-muted); }
.reviewNegativeIcon { color: var(--text-muted); flex-shrink: 0; }
.reviewDate { font-size: var(--text-xs); color: var(--text-muted); }
.ownerReply {
  margin-block-start: var(--space-3);
  padding: var(--space-3);
  background: var(--color-gray-50);
  border-inline-start: 3px solid var(--color-primary);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}
.ownerReplyLabel { font-size: var(--text-xs); font-weight: var(--font-bold); color: var(--color-primary); margin-bottom: var(--space-2); }
.ownerReplyContent { font-size: var(--text-sm); color: var(--text-body); }
```

### Review filter chips (below rating summary):
```css
.reviewFilters { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-block: var(--space-4); }
.reviewFilterChip {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  cursor: pointer;
  background: var(--card-bg);
  transition: all var(--transition-fast);
}
.reviewFilterChip:hover { border-color: var(--color-primary); color: var(--color-primary); }
.reviewFilterChipActive {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-white);
}
```

**Write tests for:** Review card renders, owner reply indented, filter chip active state

---

## TASK-D09: Redesign the Footer

**Reference**: Booking.com footer — 5-column layout, dark gray bottom bar with copyright and payment icons.

```css
.footer { background: var(--color-gray-50); border-block-start: var(--card-border); margin-block-start: var(--section-gap); }
.footerTop {
  max-width: var(--container-max);
  margin-inline: auto;
  padding-inline: var(--container-px);
  padding-block: var(--space-10);
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-8);
}
.footerColTitle { font-size: var(--text-sm); font-weight: var(--font-bold); color: var(--text-heading); margin-bottom: var(--space-4); }
.footerLink { display: block; font-size: var(--text-xs); color: var(--text-muted); margin-bottom: var(--space-2); cursor: pointer; }
.footerLink:hover { color: var(--text-link); text-decoration: underline; }
.footerBottom {
  border-block-start: var(--card-border);
  padding-block: var(--space-5);
  padding-inline: var(--container-px);
  max-width: var(--container-max);
  margin-inline: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-4);
}
.footerCopyright { font-size: var(--text-xs); color: var(--text-muted); }
.footerLogos { display: flex; align-items: center; gap: var(--space-4); }
.partnerLogo { height: 20px; opacity: 0.6; }
/* Mobile: 2 columns */
```

**Write tests for:** All footer columns render, copyright year correct

---

## TASK-D10: Redesign Shared Badge & Score Components

Update the existing `Badge` shared component to support all Booking.com badge variants:

```tsx
// Badge variants:
type BadgeVariant = 'featured' | 'deal' | 'new' | 'popular' | 'verified' | 'score' | 'exceptional' | 'very-good' | 'good'
```

```css
/* Badge.module.css */
.badge { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: var(--font-bold); padding: 2px 8px; border-radius: var(--radius-sm); line-height: 1.5; }
.featured { background: var(--badge-featured-bg); color: var(--badge-featured-text); border: 1px solid var(--badge-featured-border); }
.deal { background: var(--badge-deal-bg); color: var(--badge-deal-text); }
.new { background: var(--badge-new-bg); color: var(--badge-new-text); }
.popular { background: var(--color-accent); color: var(--color-white); }
.verified { background: var(--color-success); color: var(--color-white); }
.score {
  background: var(--badge-score-bg);
  color: var(--badge-score-text);
  border-radius: var(--radius-md) var(--radius-md) var(--radius-md) 0;
  font-size: var(--text-sm);
  padding: 4px 8px;
}
```

Update `StarRating` component:
- Filled stars: `#FFC107` yellow (not blue)
- Empty stars: `#CCCCCC`
- Half-star support via clip-path
- Sizes: `sm` (12px), `md` (16px, default), `lg` (20px)

**Write tests for:** Each badge variant renders correct colors, star rating displays correct filled count

---

## TASK-D11: Update Page Backgrounds & Card Surfaces

Apply `background: var(--page-bg)` (`#F2F2F2`) globally. Every "section" or "content area" sits either directly on this gray background (no card) or in a white card.

Rules:
- Filter sidebar panels: white card with border
- Listing cards: white card with border + hover shadow
- Right panel (detail page): white card with border + shadow
- Form pages (login, register, profile): white card max-width 480px centered on gray bg
- Dashboard pages: white cards for each stat/section on gray bg
- Admin pages: white card for the main data table, gray bg

**Update all page-level CSS files** to use `--page-bg` instead of `--color-white` for the page background.

---

## TASK-D12: Update Notification Toast Position & Style

**Reference**: Booking.com uses subtle slide-in toasts — no harsh colors, softer borders.

```css
/* Update toast styles */
.toastSuccess { background: var(--color-white); border-inline-start: 4px solid var(--color-success); color: var(--text-body); box-shadow: var(--shadow-lg); }
.toastError { background: var(--color-white); border-inline-start: 4px solid var(--color-danger); color: var(--text-body); box-shadow: var(--shadow-lg); }
.toastInfo { background: var(--color-white); border-inline-start: 4px solid var(--color-info); color: var(--text-body); box-shadow: var(--shadow-lg); }
.toastWarning { background: var(--color-white); border-inline-start: 4px solid var(--color-warning); color: var(--text-body); box-shadow: var(--shadow-lg); }
/* Toast always appears at top-inline-end (top-right in LTR, top-left in RTL) */
```

---

## ✅ Definition of Done — Design Tasks

Before marking any design task complete:
- [ ] Pixel-matched to the Booking.com reference screenshots in structure and spacing
- [ ] Fully RTL: all CSS uses logical properties, tested in Arabic mode
- [ ] Fully LTR: tested in English mode, no broken layouts
- [ ] Tajawal renders correctly in Arabic mode
- [ ] Mobile-responsive: 375px looks correct (no overflow, no tiny text)
- [ ] No hardcoded colors — all via CSS custom properties from `tokens.css`
- [ ] No hardcoded strings — all via `useTranslation()`
- [ ] All interactive elements have hover + focus states
- [ ] Skeleton loaders updated to match new card dimensions
- [ ] Tests updated/added for new component structure

---

## 🗂️ Design Update Order

```
TASK-D01: Global tokens + base CSS
TASK-D02: Header redesign
TASK-D03: Hero search bar
TASK-D04: Home page sections
TASK-D05: Listing card component
TASK-D06: Search results page
TASK-D07: Listing detail page
TASK-D08: Reviews section
TASK-D09: Footer
TASK-D10: Badges + star rating
TASK-D11: Page backgrounds + surfaces
TASK-D12: Toast notifications
```

**Total: 12 design tasks — full Booking.com-aligned UI.**
