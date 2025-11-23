# Inventory Management App

A full‑stack **Product Inventory Management System** built with **React**, **Node.js/Express**, and **SQLite**.

The app supports product search, filtering, inline editing, CSV import/export, and inventory change history tracking.

---

## 1. Live Demo & Repository

Fill these in before submitting:

- **GitHub Repository:** `<your-public-github-repo-url>`
- **Live Frontend URL:** `<your-frontend-deployment-url>` (e.g. Netlify / Vercel)
- **Live Backend Base URL:** `<your-backend-deployment-url>` (e.g. Render / Railway)

Example backend base URL format:

```text
https://your-backend-service.onrender.com
```

---

## 2. Tech Stack

**Frontend**

- React (Create React App)
- Axios
- React Router DOM (extensible, minimal usage now)
- CSS (custom, no heavy UI framework)

**Backend**

- Node.js
- Express
- SQLite (`sqlite3`)
- Multer (file uploads)
- csv-parser (CSV import)
- express-validator (validation)
- cors
- dotenv

---

## 3. Features

### 3.1 Frontend

- **Product Search & Filtering**
  - Search bar calling `GET /api/products/search?name=<query>`.
  - Category filter dropdown (client-side filter).
  - “Add New Product” button (UI placeholder – easy to extend).

- **Products Table**
  - Columns: `Image | Name | Unit | Category | Brand | Stock | Status | Actions`.
  - “In Stock” / “Out of Stock” labels with green/red badges.
  - **Edit** action opens an inline edit bar at the top.

- **Import / Export**
  - **Import** button:
    - Opens file picker (CSV).
    - Sends `POST /api/products/import`.
    - Shows basic feedback via `alert` + reloads products.
  - **Export** button:
    - Triggers download from `GET /api/products/export`.

- **Inline Editing**
  - Click **Edit**:
    - Row’s data is loaded into a top edit bar.
    - Fields editable: `name, unit, category, brand, stock` (image & ID not edited).
  - **Save**:
    - Sends `PUT /api/products/:id`.
    - Updates table immediately on success.
  - **Cancel**: discards edits.

- **Inventory History Sidebar**
  - Click a product row → slide‑in panel on the right.
  - Fetches `GET /api/products/:id/history`.
  - Shows: Date, Old Stock, New Stock, Changed By, Timestamp.

### 3.2 Backend

- **CSV Import API**
  - `POST /api/products/import`
  - `multipart/form-data`, file field: **`file`**
  - CSV columns: `name,unit,category,brand,stock,status,image`
  - Only inserts **new products**; duplicates by **name** (case-insensitive) are skipped.
  - Returns:

    ```json
    {
      "added": 12,
      "skipped": 5,
      "duplicates": [
        { "name": "Product A", "existingId": 1 }
      ]
    }
    ```

- **CSV Export API**
  - `GET /api/products/export`
  - Returns CSV for all products with `Content-Disposition: attachment`.

- **Products APIs**
  - `GET /api/products`  
    - Returns JSON list of all products.
    - Optional `?category=<category>` filter.
  - `GET /api/products/search?name=<query>`  
    - Case-insensitive, partial search on `name`.

- **Update Product API**
  - `PUT /api/products/:id`
  - Validation:
    - `name` required and unique (except the current product).
    - `stock` must be integer ≥ 0.
  - On stock change:
    - Inserts inventory log into `inventory_logs` with:
      - `productId, oldStock, newStock, changedBy, timestamp`.

- **Inventory History API**
  - `GET /api/products/:id/history`
  - Returns logs sorted by `timestamp DESC`.

---

## 4. Project Structure

```text
inventory-management-app/
  backend/
    package.json
    server.js
    db.js
    inventory.db        # created at runtime (local)
  frontend/
    package.json
    public/
    src/
      App.js
      App.css
      index.js
      index.css
      api.js
      components/
        ProductTable.js
        ProductTable.css
        InventoryHistorySidebar.js
        InventoryHistorySidebar.css
```

---

## 5. Local Development

### 5.1 Prerequisites

- Node.js (v16+ recommended)
- npm

### 5.2 Backend Setup

```bash
cd backend
npm install
npm start
```

- Backend runs on: `http://localhost:4000`
- SQLite DB file: `backend/inventory.db` (auto-created on first run).

### 5.3 Frontend Setup

In a new terminal:

```bash
cd frontend
npm install
npm start
```

- Frontend runs on: `http://localhost:3000`

By default, the frontend talks to `http://localhost:4000` via:

```js
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';
```

---

## 6. Environment Variables

### Backend

- **Optional**: `PORT`  
  Default: `4000`

Create a `.env` in `backend/` if needed:

```bash
PORT=4000
```

### Frontend

To point the frontend to a deployed backend:

```bash
REACT_APP_API_BASE_URL=https://your-backend-service.onrender.com
```

Then rebuild:

```bash
cd frontend
npm run build
```

---

## 7. API Reference (Summary)

### Products

- `GET /api/products`
  - Returns: `Product[]`

- `GET /api/products/search?name=<query>`
  - Returns: filtered `Product[]` by name.

### CSV Import/Export

- `POST /api/products/import`
  - `multipart/form-data`, field `file` (CSV).
  - Response: `{ added, skipped, duplicates }`.

- `GET /api/products/export`
  - Response: CSV file download.

### Update & History

- `PUT /api/products/:id`
  - Body (JSON):

    ```json
    {
      "name": "Product A",
      "unit": "pcs",
      "category": "Electronics",
      "brand": "BrandX",
      "stock": 10,
      "status": "In Stock",
      "image": "https://example.com/image.jpg"
    }
    ```

- `GET /api/products/:id/history`
  - Response: `InventoryLog[]` sorted by latest first.

---

## 8. CSV Format

**Required header row:**

```text
name,unit,category,brand,stock,status,image
```

Example row:

```text
Mouse,pcs,Electronics,Logi,15,In Stock,https://example.com/mouse.png
```

Notes:

- `stock` is parsed as a number.
- If `status` is empty, backend infers:
  - `stock > 0` → `In Stock`
  - `stock == 0` → `Out of Stock`

---

## 9. Deployment Notes

### Backend (Render / Railway / etc.)

1. Push code to GitHub.
2. Create a new web service:
   - Build command: `npm install`
   - Start command: `npm start`
   - Root directory: `backend/`
3. Ensure:
   - `PORT` is set by the platform or `.env`.
   - SQLite file (`inventory.db`) is allowed (may be ephemeral on some providers).

### Frontend (Netlify / Vercel)

1. New project from GitHub, root: `frontend/`.
2. Build command:

   ```bash
   npm install
   npm run build
   ```

3. Publish directory: `build/`
4. Set env variable:
   - `REACT_APP_API_BASE_URL=<your-backend-base-url>`

---

## 10. How to Submit (for the Assignment)

In your email reply, include:

- **GitHub Repository URL**
- **Live Frontend URL**
- **Live Backend Base URL**

You can also briefly mention:

- CSV import/export tested.
- Inline editing + history tracking working.
