# Customer Service Knowledge-Based Resolution Platform — Frontend Learning Guide & Architecture

> **Role:** React & Full-Stack Engineering Reference  
> **Scope:** 6 Backend-Completed Modules (Customers, Support Requests, Issue Classification ML, Knowledge Categories, Knowledge Articles, Article Version Management)  
> **UI Style:** Shadow-layered SaaS Dashboard (Dark & Light Mode) with Google Material Symbols

---

## 🗺️ Frontend Architecture & Build Roadmap

We are building the React frontend **one file at a time**, modularly, so every single line is understood before moving forward.

```
frontend/src/
├── index.css                  ← File 1: Theme variables (Light/Dark), shadow cards, tables, badges
├── services/
│   └── api.js                 ← File 2: Centralized Axios instance & API endpoint functions
├── context/
│   └── ThemeContext.jsx       ← File 3: Global Light/Dark theme state + localStorage persistence
├── components/
│   ├── Layout.jsx             ← File 4: Sidebar + Top Header + Theme Toggle + Outlet
│   └── StatusBadge.jsx        ← File 5: Reusable pill badge for statuses, priorities & ML confidence
├── pages/
│   ├── CustomersPage.jsx      ← File 6: Module 1 (List, Search, Create, Edit, Delete Customers)
│   ├── TicketsPage.jsx        ← File 7: Modules 2 & 3 (Tickets CRUD + ML Classification & Probabilities)
│   ├── CategoriesPage.jsx     ← File 8: Module 4 (Knowledge Categories CRUD + Soft Deactivate)
│   └── ArticlesPage.jsx       ← File 9: Modules 5 & 6 (Articles CRUD, Lifecycle Transitions & Version History)
└── App.jsx                    ← File 10: React Router setup connecting all pages
```

---

## 📄 File 1: `src/index.css` — Theme System, Shadows & Base Styles

### 1. What It Does
Defines the global CSS reset, typography, and a **CSS Variable Design System** that powers both **Dark Mode** (deep zinc/charcoal surfaces with layered shadows, inspired by the shadcn dashboard) and **Light Mode** (crisp white elevated cards with soft drop shadows).

### 2. Imports
None (this is a pure CSS stylesheet imported once in `src/main.jsx`).

### 3. Simple Language Explanation
Think of `index.css` as the **paint palette and furniture rulebook** for the entire house. Instead of picking colors separately in every room (component), we define named colors like `--bg-card` and `--text-primary` at the top. When the user flips the Light/Dark switch, we only change one label (`data-theme="dark"` vs `data-theme="light"`) on the root HTML element, and the entire app's colors and shadows update automatically.

### 4. Event & Flow Tracing (Theme Variable Resolution)
1. **Initial Load:** `index.css` sets `:root` (default dark theme) variables on the `<html>` element.
2. **User Toggles Theme:** JavaScript updates `document.documentElement.setAttribute('data-theme', 'light')`.
3. **Browser Recalculation:** The CSS selector `[data-theme="light"]` overrides the variables (`--bg-app`, `--bg-card`, `--shadow-card`, etc.).
4. **Instant Repaint:** Every component using `var(--bg-card)` and `var(--shadow-card)` repaints smoothly via `transition: background-color 0.2s ease, color 0.2s ease`.

### 5. Technical Explanation
- **CSS Custom Properties (`--var-name`):** Runtime-evaluated variables scoped to `:root` and overridden via attribute selectors (`[data-theme="light"]`).
- **Elevation via Box-Shadow:** Dark mode uses subtle top-edge highlights (`inset 0 1px 0 rgba(255,255,255,0.04)`) combined with deep drop shadows (`0 8px 24px rgba(0,0,0,0.45)`) because dark backgrounds swallow standard gray shadows. Light mode uses soft multi-layered ambient + direct shadows (`0 4px 12px rgba(15,23,42,0.06)`).
- **Utility Classes:** `.card`, `.btn`, `.badge`, `.data-table`, and `.modal-backdrop` keep JSX clean and prevent duplicating inline styles across modules.

### 6. Interview Corner
1. **Why use CSS Variables (`var(--bg-card)`) for Dark/Light mode instead of React inline styles?**  
   *Answer:* CSS variables update at the browser's CSS engine level without triggering React component re-renders across the entire tree, and they work seamlessly with pseudo-classes like `:hover` and `:focus`.
2. **Why does `box-sizing: border-box` matter in layouts?**  
   *Answer:* By default (`content-box`), adding `padding` or `border` increases an element's total width beyond `100%`, causing horizontal scrollbars. `border-box` includes padding and border inside the declared width/height.
3. **Why do dark mode cards need a subtle `border` or `inset` highlight in addition to `box-shadow`?**  
   *Answer:* On dark backgrounds (`#09090b`), a black drop shadow has very low contrast. Adding a `1px solid` muted border and a faint top inset highlight creates clear visual separation and depth.

---

## 📄 File 2: `src/components/Layout.jsx` — App Shell, Sidebar & Light/Dark Toggle

### 1. What It Does
Renders the persistent dashboard skeleton: a left **Sidebar** (brand + 4 module links), a **Top Header** (page title + Light/Dark theme toggle button), and a **Main Content Area** (`<Outlet />`) where the active page renders.

### 2. Imports
- `useState`, `useEffect` from `'react'` — manages `theme` (`'dark'` / `'light'`) and syncs it with `document.documentElement` and `localStorage`.
- `NavLink`, `Outlet`, `useLocation` from `'react-router-dom'` — handles active sidebar highlighting, nested page rendering, and reading the current URL path for the header title.

### 3. Event & Flow Tracing (Light/Dark Toggle)
1. **Initial Mount:** `useState` reads `localStorage.getItem('theme')` (defaults to `'dark'`).
2. **Side Effect (`useEffect`):** Runs whenever `theme` changes:
   - Sets `document.documentElement.setAttribute('data-theme', theme)`
   - Saves preference via `localStorage.setItem('theme', theme)`
3. **User Clicks Toggle Button:** `onClick` flips `theme` (`'dark'` ↔ `'light'`), triggering `useEffect` and repainting all CSS variables in `index.css`.

### 4. Interview Corner
1. **What is `<Outlet />` in React Router v6?**  
   *Answer:* A placeholder inside a parent layout route that renders whichever child route matches the current URL, keeping the sidebar/header mounted without re-creating them on navigation.
2. **Why `NavLink` instead of `<a href="...">`?**  
   *Answer:* `<a href>` triggers a full browser page reload and loses React state; `NavLink` swaps views client-side and automatically provides `isActive` for styling the active menu item.

---

## 📄 File 4: `src/services/api.js` — Centralized Axios API Client

### 1. What It Does
Creates a single, pre-configured Axios instance pointing to `http://localhost:5000/api` and exports clean helper functions for all 4 backend route groups (Customers, Support Requests, Knowledge Categories, and Knowledge Articles + Versions).

### 2. Imports
- `axios` from `'axios'` — promise-based HTTP client for making `GET`, `POST`, `PUT`, `PATCH`, and `DELETE` requests to the Express backend.

### 3. Event & Flow Tracing (How a Page Calls the Backend)
1. A React page calls a helper like `await customerAPI.getAll()` or `await ticketAPI.create(formData)`.
2. Axios combines `baseURL` (`http://localhost:5000/api`) with the endpoint path (e.g., `/support-requests`).
3. Axios automatically serializes JS objects to JSON and sets `Content-Type: application/json`.
4. The Express backend handles the request (and for new tickets, calls the Python Flask ML service on port 5001) and returns JSON.
5. The React component receives the response inside `try/catch` and updates local state.

### 4. Interview Corner
1. **Why create a centralized `api.js` with `axios.create({ baseURL })` instead of calling `axios.get('http://localhost:5000/api/...')` in every component?**  
   *Answer:* Single Source of Truth—if the backend URL changes in production, you update one line in `api.js` instead of 20+ files. It also lets you attach global headers or auth interceptors in one place.
2. **Why does Knowledge Article update use `PATCH` while Customer/Ticket updates use `PUT`?**  
   *Answer:* Our backend routes explicitly define `router.patch('/:articleId', ...)` for partial updates and lifecycle transitions (`/approve`, `/publish`, `/retire`), whereas `customerRoutes.js` and `supportRequestRoutes.js` use `router.put(...)`. Matching the exact HTTP method prevents `404 Cannot PATCH/PUT` errors.

---

## 📄 File 5: `src/components/StatusBadge.jsx` — Reusable Status & Category Pill

### 1. What It Does
Renders a small color-coded pill badge (like the status pills in the reference dashboard) for any status, priority, service plan, or ML-predicted category across all 4 modules.

### 2. Imports
None (pure presentational React component receiving `label` as a prop).

### 3. Event & Flow Tracing
1. A parent page (e.g., `CustomersPage` or `TicketsPage`) passes a string prop: `<StatusBadge label={ticket.status} />`.
2. `StatusBadge` looks up `label` in the `COLOR_MAP` dictionary to pick matching text, background, and border colors.
3. If `label` is unknown or custom, it safely falls back to a neutral gray pill style (`DEFAULT_STYLE`) instead of crashing.

### 4. Interview Corner
1. **Why use a lookup object (`COLOR_MAP[label]`) instead of a long `if / else if` or `switch` chain?**  
   *Answer:* A lookup map gives $O(1)$ constant-time access, avoids repetitive JSX, and makes adding a new status as simple as adding one line to the dictionary.
2. **What is a "presentational" (dumb) component in React?**  
   *Answer:* A component that has no internal state or API calls—it only takes `props` in and returns UI out, making it super easy to reuse and test.

---

## 📄 File 6: `src/pages/CustomersPage.jsx` — Module 1 (Customer Management)

### 1. What It Does
Full CRUD screen for **Module 1 (Customer Management)**: displays summary stat cards, a live search bar, a shadow-styled customer table, and a single reusable modal form for creating or editing a customer, plus delete confirmation.

### 2. Imports
- `useState`, `useEffect` (`react`) — manages customers list, loading/error states, search text, modal open/close, and controlled form inputs.
- `customerAPI` (`../services/api`) — calls `getAll`, `create`, `update`, and `delete` against `/api/customers`.
- `StatusBadge` (`../components/StatusBadge`) — renders colored pills for `servicePlan` and `accountStatus`.

### 3. Event & Flow Tracing
- **Page Load (`useEffect`):**
  1. `fetchCustomers()` runs once on mount (`[]` dependency array).
  2. Sets `loading = true`, `error = ''`.
  3. Calls `GET http://localhost:5000/api/customers` via `customerAPI.getAll()`.
  4. On success: stores `res.data` array in `customers` state; React re-renders the stat cards and table.
  5. On failure (e.g., backend offline): catches error, displays a readable red error banner with a **Retry** button.
- **Create / Edit Submit (`handleSubmit`):**
  1. `e.preventDefault()` stops browser page refresh.
  2. Sets `saving = true`.
  3. If `editingId` is `null` → calls `POST /api/customers` with `formData`. If `editingId` has a `customerId` → calls `PUT /api/customers/${editingId}`.
  4. Backend validates, updates MongoDB, and returns the saved customer.
  5. Closes modal and calls `fetchCustomers()` to refresh the table with the latest database state.
- **Delete (`handleDelete`):**
  1. Confirms with user via `window.confirm`.
  2. Calls `DELETE /api/customers/${customerId}`.
  3. Removes deleted customer from local state immediately (or re-fetches).

### 4. Interview Corner
1. **Why use controlled inputs (`value={formData.fullName}` + `onChange`) instead of uncontrolled inputs (`useRef`)?**  
   *Answer:* Controlled inputs keep React state as the single source of truth, making it effortless to pre-fill the form when editing an existing customer and reset fields when opening a blank Create form.
2. **Why do we handle `loading`, `error`, and `empty` states explicitly?**  
   *Answer:* Real network requests can be slow or fail. Explicit async states prevent blank screens, give users clear feedback when the backend is down, and avoid crashes like `.map()` on `undefined`.
3. **Why did we pass `customer.customerId` (e.g., `1001`) instead of `customer._id` to `update` and `delete`?**  
   *Answer:* Our Express `customerController.js` queries by `{ customerId: Number(req.params.id) }`, not MongoDB's ObjectId `_id`.




