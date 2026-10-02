# hamsyshop

A beginner-friendly e-commerce frontend using React, React Bootstrap, Bootstrap Icons, React Router, and DummyJSON. The layout follows the supplied hamdyshop screenshots: purple navigation, pale lavender backgrounds, mint accents, product cards, and admin tables.

## Run locally

Install Node.js 20.19+ or 22.12+. Open a terminal in this folder:

```sh
npm install
npm run dev
```

Open the local URL printed in the terminal. To create a production build:

```sh
npm run build
npm run preview
```

## Demo login

- Username: `emilys`
- Password: `emilyspass`

Login accepts a DummyJSON username or an existing DummyJSON user's email. Tokens are stored in localStorage, the current user is fetched through `/auth/me`, and expired access tokens are refreshed. Registration is a mock `/users/add` request: a registered account cannot subsequently log in to DummyJSON.

## Pages

- `/products`: products, API search, category filtering, sorting, and pagination. Price/rating or combined search/category filters paginate locally after fetching matching API data.
- `/categories`: all API categories.
- `/products/:id`: single product endpoint, image gallery, reviews, and cart action.
- `/login`, `/register`, `/profile`: authentication, profile editing, and user carts/order history.
- `/cart`: persistent shopping basket, quantity changes, removal, and totals.
- `/checkout`: shipping, mock payment, review, API cart creation, and order confirmation. No payment or email is sent.
- `/admin/products`: product list, search, details, create, edit, delete, CSV export.
- `/admin/users`: user list, search, pagination, details, create, edit, delete, CSV export.
- `/admin/carts`: cart list, per-user endpoint, pagination, details, create, edit, delete, CSV export. The text search filters the current page; user ID filtering calls the API.

## Keep the code simple

Each page is an ordinary function component using `useState` and `useEffect`. There is one small fetch helper, shared loading/error/pagination components, and one CSS file. There is no Redux, TypeScript, custom backend, or complex state framework. Comments explain the few API-specific details.

## Demo API limitations

DummyJSON simulates writes; it does not permanently change server records. Successful admin changes are kept in localStorage and shown over API results. Added items receive a local ID because the API reuses simulated IDs. Further edits of these items call the add endpoint again; their removal is local. Original records use PUT and DELETE endpoints. API pagination counts describe original server rows, and local additions/deletions can change how many rows appear on a page. Clearing site storage resets these demo changes.

Admin pages are openly accessible for coursework; this frontend is not a secure production administration system. Profile edits remain for the current session. Browser cart/order data is shared by accounts on the same browser; history is filtered by user ID. Tokens in localStorage follow the assignment requirements.

Product names, photos, categories, and statistics use live API data instead of copying the screenshots' sample records. The screenshots show only the upper portions of pages; lower sections and mobile layouts use the same design style. Login and registration layouts were added because they were not pictured.

PDF sections 1–9 are implemented. GitHub publishing, Vercel deployment, and CRM submission in section 10 are outside the requested scope.

API reference: https://dummyjson.com/docs

## Verification

26 live API checks passed, including login, authenticated user, refresh, search, sorting, category filtering, pagination, and product/user/cart CRUD endpoints. Browser checks passed for login persistence, cart quantity persistence, checkout, product details, category sorting/pagination, and create/edit/delete flows for all three admin resources. Desktop and 390px mobile layouts were visually inspected.

The restricted local runner blocks the child processes used by Vite, so the standard `npm run build` could not be verified here. A separate Rollup/Babel verification build compiled the same source successfully and was used for the browser checks. That verification tooling is not part of this project; the delivered setup remains standard Vite. Run `npm run build` on your computer as the final build check.
