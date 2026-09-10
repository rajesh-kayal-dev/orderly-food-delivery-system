# Orderly Frontend Redesign — 5 Phase Implementation Plan

## Goal

Use the **Food Delivery Landing Page Template** as the visual/design source and gradually rebuild the existing **Orderly React frontend** around that design.

### Template Source File

Place the template HTML file inside the Orderly frontend root:

```text
frontend/
├── Food Delivery Landing Page Template.html
├── src/
├── public/
├── package.json
└── ...
```

Use this file as the **UI reference/source** throughout the redesign.

> **Important:** Do not copy the template's Vanilla JavaScript SPA architecture into Orderly. Extract/recreate its UI sections as React components and connect them to Orderly's existing API, Redux, React Router, authentication, cart, orders, and Socket.IO logic.

The template contains the visual structure, Tailwind classes, layout ideas, animations, cards, forms, navigation, footer, and responsive design that should be adapted into Orderly. The original template uses `showPage()` and hardcoded data, but Orderly should continue using React. 

---

# Phase 1 — Prepare Orderly + Add the Template

## Objective

Prepare the existing frontend and make the template easily accessible as the design source before changing any Orderly UI.

### 1. Add the template file

Put:

```text
Food Delivery Landing Page Template.html
```

inside:

```text
apps/frontend/
```

Final structure:

```text
apps/
└── frontend/
    ├── Food Delivery Landing Page Template.html
    ├── public/
    ├── src/
    ├── .env
    ├── .env.example
    ├── package.json
    └── ...
```

### 2. Understand the template

Read the template and identify:

- [ ] Navbar
- [ ] Hero
- [ ] Categories
- [ ] Restaurant/Partner cards
- [ ] Menu cards
- [ ] Cart
- [ ] Checkout summary
- [ ] About
- [ ] Contact
- [ ] Footer
- [ ] Animations
- [ ] Responsive layouts
- [ ] Colors
- [ ] Typography
- [ ] Shadows
- [ ] Border radius
- [ ] Icons
- [ ] Image usage

Important template sections:

```text
Food Delivery Landing Page Template.html

Navigation       → template navbar
Home             → hero + categories + testimonials
Menu             → menu/filter layout
Partners         → restaurant cards
About            → about section
Contact          → contact + map
Cart             → cart + order summary
Footer           → footer
JS               → menu/partner/cart demo logic
```

### 3. Check existing Orderly

Verify the current:

```text
src/
├── adapters/
├── api/
├── assets/
├── components/
├── pages/
├── redux/
├── App.jsx
├── App.css
├── index.css
├── main.jsx
└── socket.js
```

### 4. Run existing application

- [ ] Frontend starts successfully.
- [ ] Login works.
- [ ] Home works.
- [ ] Restaurants work.
- [ ] Menu works.
- [ ] Cart works.
- [ ] Checkout works.
- [ ] Order Tracking works.
- [ ] Profile works.
- [ ] Logout works.

### Phase 1 Rule

**Do not redesign anything yet.**

First understand how Orderly currently works and keep the template available as the reference.

---

# Phase 2 — Extract Template Design into Orderly Components

## Objective

Convert the HTML template design into reusable React components without importing its Vanilla JS application logic.

### Template Source

Use:

```text
Food Delivery Landing Page Template.html
```

as the source for every UI decision in this phase.

---

## 2.1 Create/organize reusable components

Use a simple structure:

```text
src/
├── components/
│   ├── layout/
│   │   ├── Navbar.jsx
│   │   └── Footer.jsx
│   │
│   ├── common/
│   │   ├── Button.jsx
│   │   ├── SearchBar.jsx
│   │   ├── SectionHeader.jsx
│   │   └── EmptyState.jsx
│   │
│   ├── restaurant/
│   │   └── RestaurantCard.jsx
│   │
│   ├── menu/
│   │   └── MenuItemCard.jsx
│   │
│   ├── cart/
│   │   ├── CartItem.jsx
│   │   └── CartSummary.jsx
│   │
│   └── order/
│       └── OrderStatus.jsx
│
└── pages/
    ├── Home.jsx
    ├── Restaurants.jsx
    ├── RestaurantDetails.jsx
    ├── Cart.jsx
    ├── Checkout.jsx
    ├── OrderTracking.jsx
    ├── Profile.jsx
    ├── About.jsx
    └── Contact.jsx
```

Only create components that are actually reused.

---

## 2.2 Transfer the visual system

Take the design from the template:

- [ ] Inter typography
- [ ] Orange primary color
- [ ] Neutral backgrounds
- [ ] Rounded cards
- [ ] Soft shadows
- [ ] Orange buttons
- [ ] Search bar
- [ ] Hover transitions
- [ ] Fade/slide animations
- [ ] Custom scrollbar
- [ ] Responsive spacing
- [ ] Mobile navigation
- [ ] Selection styling

The template specifically defines Tailwind colors, animations, scrollbar styles, and the neutral/orange visual system. Adapt those styles to Orderly's existing Tailwind/Vite setup rather than adding another CSS framework. fileciteturn8file0L15-L74

---

## 2.3 Convert template navigation

Template:

```html
onclick="showPage('home')"
```

Do **not** use this in Orderly.

Replace it with:

```jsx
<Link to="/">
```

or:

```jsx
useNavigate()
```

according to the existing Orderly routing structure.

Keep:

```text
Orderly
Home
Restaurants
Order Tracking
Profile
Cart
Logout
```

---

## 2.4 Convert template data

Do not copy:

```js
const menuItems = [...]
const partners = [...]
```

into Orderly.

Instead:

```text
Backend API
    ↓
React API layer
    ↓
Redux / state
    ↓
React component
    ↓
Template-inspired UI
```

The template's menu and partner arrays are only visual/data-structure references. fileciteturn8file0L582-L606

---

# Phase 3 — Rebuild Main Pages from the Template

## Objective

Apply the template design to the most important Orderly screens first.

### Template Source

For this entire phase, use:

```text
Food Delivery Landing Page Template.html
```

as the visual reference.

---

# 3.1 Home Page

Use the template's:

```text
Hero
+
Categories
+
Restaurant/Recommended section
+
Optional offers/highlights
```

### Orderly version

```text
Home
├── Navbar
├── Hero
│   ├── Greeting
│   ├── Search
│   ├── CTA
│   └── Food Image
│
├── Categories
│
├── Popular Restaurants
│
├── Offers / Highlights
│
└── Footer
```

### Tasks

- [ ] Rebuild hero using template layout.
- [ ] Keep Orderly logo.
- [ ] Keep Orderly user information.
- [ ] Connect search to real Orderly restaurant/menu data.
- [ ] Connect category selection to existing functionality.
- [ ] Rebuild restaurant cards using `RestaurantCard.jsx`.
- [ ] Keep API loading state.
- [ ] Keep API error state.
- [ ] Keep empty state.
- [ ] Replace fake template content with real Orderly data.

### Do not copy template-only content

For example:

```text
QuickBite
2,000+ restaurants
Fake testimonials
Fake statistics
Fake restaurant names
Fake contact information
```

unless the information is actually valid for Orderly.

---

# 3.2 Restaurants Page

Use the template's **Partners** section as the visual reference.

```text
Restaurants
├── Header
├── Search
├── Filters
└── Restaurant Grid
```

### Tasks

- [ ] Rebuild page header.
- [ ] Rebuild restaurant cards.
- [ ] Use real Orderly API data.
- [ ] Keep existing restaurant filtering.
- [ ] Keep search functionality.
- [ ] Add rating if available.
- [ ] Add cuisine if available.
- [ ] Add delivery time if available.
- [ ] Add loading state.
- [ ] Add empty state.
- [ ] Make responsive.

---

# 3.3 Restaurant / Menu Page

Use the template's **Menu** card design.

```text
Restaurant
    ↓
Restaurant Information
    ↓
Menu Categories
    ↓
Menu Items
    ↓
Add to Cart
```

### Tasks

- [ ] Rebuild restaurant header.
- [ ] Rebuild menu cards.
- [ ] Keep real menu API.
- [ ] Keep Add to Cart.
- [ ] Keep quantity functionality.
- [ ] Keep Redux/cart state.
- [ ] Keep existing images where available.
- [ ] Do not use the template's Supabase image as a replacement for real Orderly data.
- [ ] Keep API error/loading states.

The template's menu cards use a dynamically rendered card structure with image, name, price, description, category, rating, and Add button. fileciteturn8file0L643-L668

---

# Phase 4 — Redesign Cart, Checkout, Tracking, Profile & Supporting Pages

## Objective

Apply the same template design language to the rest of Orderly while preserving all existing functionality.

### Template Source

Continue using:

```text
Food Delivery Landing Page Template.html
```

as the design reference.

---

# 4.1 Cart

Use the template's:

```text
Cart Items
+
Order Summary
```

layout.

```text
Cart
├── Cart Items
│   ├── Image
│   ├── Name
│   ├── Quantity
│   └── Price
│
└── Order Summary
    ├── Subtotal
    ├── Delivery Fee
    ├── Tax
    └── Total
```

### Tasks

- [ ] Create `CartItem.jsx`.
- [ ] Create `CartSummary.jsx`.
- [ ] Keep Redux cart state.
- [ ] Keep quantity increase/decrease.
- [ ] Keep remove functionality.
- [ ] Keep existing pricing rules.
- [ ] Redesign empty cart.
- [ ] Keep Checkout action.
- [ ] Make summary sticky on desktop if appropriate.
- [ ] Make responsive.

### Important

Do not blindly copy:

```text
8% tax
$2.99 delivery fee
```

from the template.

Orderly's actual business logic must remain the source of truth. The template only provides the layout/design reference. fileciteturn8file0L492-L528

---

# 4.2 Checkout

Keep Orderly's actual checkout flow.

```text
Cart
 ↓
Checkout
 ↓
Address
 ↓
Payment
 ↓
Create Order
 ↓
Success
```

### Tasks

- [ ] Apply template visual style.
- [ ] Keep existing validation.
- [ ] Keep address functionality.
- [ ] Keep payment integration.
- [ ] Keep order creation API.
- [ ] Keep success/failure handling.
- [ ] Improve loading state.
- [ ] Improve error state.

---

# 4.3 Order Tracking

Use the clean structure of the existing Orderly order tracking and redesign it into a visual status timeline.

```text
Order Tracking

Order Placed
     ↓
Restaurant Accepted
     ↓
Preparing
     ↓
Ready
     ↓
Out for Delivery
     ↓
Delivered
```

### Tasks

- [ ] Redesign tracking page.
- [ ] Keep actual backend order status.
- [ ] Keep Socket.IO.
- [ ] Show order details.
- [ ] Show restaurant information.
- [ ] Show delivery information.
- [ ] Add loading state.
- [ ] Add no-active-order state.
- [ ] Handle failed/cancelled state if supported.

---

# 4.4 Profile

Use the template's Account/Personal Information visual direction.

```text
My Account
├── Personal Information
├── Phone
├── Email
├── Password
├── Delivery Address
└── Order History
```

### Tasks

- [ ] Redesign profile header.
- [ ] Redesign form fields.
- [ ] Keep update profile API.
- [ ] Keep password update.
- [ ] Keep order history.
- [ ] Add success/error feedback.
- [ ] Make responsive.

---

# 4.5 About

Use the template's About page structure:

```text
About Orderly
       ↓
Mission
       ↓
Platform Highlights
       ↓
Delivery / Food Image
```

### Tasks

- [ ] Replace QuickBite content with Orderly content.
- [ ] Remove fake statistics.
- [ ] Use actual project information.
- [ ] Keep template visual hierarchy.

---

# 4.6 Contact

Use the template's two-column layout:

```text
Contact
├── Contact Information
├── Contact Form
└── Map / Location
```

### Tasks

- [ ] Rebuild form using React.
- [ ] Connect form if backend support exists.
- [ ] Use real Orderly contact information.
- [ ] Remove fake QuickBite information.
- [ ] Use a map only if a real Orderly location is needed.

The template's contact section contains form fields and a map iframe, so these should be treated as design references rather than copied production data. fileciteturn8file0L418-L469

---

# 4.7 Footer

Create:

```text
src/components/layout/Footer.jsx
```

Use the template footer layout.

Keep:

- [ ] Orderly logo
- [ ] Navigation
- [ ] Support links
- [ ] Social links if real
- [ ] Copyright

Remove:

```text
QuickBite
quickbite.com
fake social links
fake contact information
```

The template footer provides the overall four-column structure that can be adapted for Orderly. fileciteturn8file0L536-L580

---

# Phase 5 — Final Integration, Testing & Cleanup

## Objective

Make the new frontend look like the template while remaining a fully working Orderly React application.

---

# 5.1 Complete User Flow

Test:

```text
Login / Register
       ↓
Home
       ↓
Search
       ↓
Restaurants
       ↓
Restaurant
       ↓
Menu
       ↓
Add to Cart
       ↓
Cart
       ↓
Checkout
       ↓
Payment
       ↓
Order Created
       ↓
Order Tracking
       ↓
Socket.IO Updates
       ↓
Delivered
```

### Verify

- [ ] React Router
- [ ] Authentication
- [ ] API calls
- [ ] Redux
- [ ] Restaurant listing
- [ ] Menu
- [ ] Cart
- [ ] Checkout
- [ ] Payment
- [ ] Order creation
- [ ] Order tracking
- [ ] Socket.IO
- [ ] Profile
- [ ] Logout

---

# 5.2 Responsive Testing

Test:

```text
Desktop
Laptop
Tablet
Mobile
```

Check especially:

- [ ] Navbar
- [ ] Mobile menu
- [ ] Hero
- [ ] Search
- [ ] Categories
- [ ] Restaurant cards
- [ ] Menu grid
- [ ] Cart
- [ ] Checkout
- [ ] Tracking
- [ ] Profile
- [ ] Footer

---

# 5.3 Remove Template Artifacts

Search the entire frontend for:

```text
QuickBite
FoodieExpress
quickbite.com
Empire State Building
555
showPage(
menuItems = [
partners = [
Supabase template image URLs
fake testimonials
fake statistics
fake restaurants
fake contact details
```

Remove or replace them.

---

# 5.4 Compare Against the Template

Open both:

```text
Food Delivery Landing Page Template.html
```

and:

```text
Orderly React Application
```

Compare:

- [ ] Navbar
- [ ] Hero
- [ ] Typography
- [ ] Colors
- [ ] Search
- [ ] Cards
- [ ] Spacing
- [ ] Border radius
- [ ] Shadows
- [ ] Buttons
- [ ] Hover effects
- [ ] Animations
- [ ] Responsive behavior
- [ ] Footer

The goal is:

> **Template-level visual quality + Orderly's real application functionality.**

---

# Final Architecture

Keep the existing Orderly architecture and add the template-inspired UI on top:

```text
apps/
└── frontend/
    │
    ├── Food Delivery Landing Page Template.html
    │
    ├── public/
    │
    ├── src/
    │   ├── adapters/
    │   ├── api/
    │   ├── assets/
    │   │
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── Navbar.jsx
    │   │   │   └── Footer.jsx
    │   │   ├── common/
    │   │   ├── restaurant/
    │   │   ├── menu/
    │   │   ├── cart/
    │   │   └── order/
    │   │
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── Restaurants.jsx
    │   │   ├── RestaurantDetails.jsx
    │   │   ├── Cart.jsx
    │   │   ├── Checkout.jsx
    │   │   ├── OrderTracking.jsx
    │   │   ├── Profile.jsx
    │   │   ├── About.jsx
    │   │   └── Contact.jsx
    │   │
    │   ├── redux/
    │   ├── App.jsx
    │   ├── App.css
    │   ├── index.css
    │   ├── main.jsx
    │   └── socket.js
    │
    ├── .env
    ├── .env.example
    ├── package.json
    └── ...
```

# Exact 5-Phase Execution Order

```text
PHASE 1
Add Food Delivery Landing Page Template.html
+
Understand Orderly
        ↓
PHASE 2
Extract Template UI
+
Create React Components
        ↓
PHASE 3
Rebuild Home
+
Restaurants
+
Restaurant/Menu
        ↓
PHASE 4
Rebuild Cart
+
Checkout
+
Tracking
+
Profile
+
About/Contact/Footer
        ↓
PHASE 5
Test Everything
+
Responsive Review
+
Remove Template Artifacts
+
Final Polish
```

# Golden Rule

**Never modify working Orderly business logic just to match the template.**

Use this separation:

```text
Food Delivery Landing Page Template.html
        │
        │  DESIGN SOURCE
        ↓
React Components
        │
        │  UI
        ↓
Existing Orderly API / Redux / Router / Socket.IO
        │
        │  FUNCTIONALITY
        ↓
Real Orderly Application
```

The template is the **design source**.  
Orderly is the **actual application**.
