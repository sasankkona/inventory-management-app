require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');
const { body, validationResult } = require('express-validator');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Multer setup for CSV uploads
const upload = multer({ dest: path.join(__dirname, 'uploads') });

// Helper to run db queries with Promise
function dbAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

function dbGet(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) return reject(err);
            resolve(row);
        });
    });
}

function dbRun(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) return reject(err);
            resolve(this); // has lastID, changes
        });
    });
}

// GET /api/products - list products (optional category)
app.get('/api/products', async (req, res, next) => {
    try {
        const { category } = req.query;
        let sql = 'SELECT * FROM products';
        const params = [];
        if (category) {
            sql += ' WHERE category = ?';
            params.push(category);
        }
        const products = await dbAll(sql, params);
        res.json(products);
    } catch (err) {
        next(err);
    }
});

// GET /api/products/search?name=
app.get('/api/products/search', async (req, res, next) => {
    try {
        const { name } = req.query;
        if (!name) {
            const all = await dbAll('SELECT * FROM products');
            return res.json(all);
        }
        const query = `%${name.toLowerCase()}%`;
        const rows = await dbAll(
            'SELECT * FROM products WHERE LOWER(name) LIKE ?;',
            [query]
        );
        res.json(rows);
    } catch (err) {
        next(err);
    }
});

// CSV Import - POST /api/products/import
app.post('/api/products/import', upload.single('file'), async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    let added = 0;
    let skipped = 0;
    const duplicates = [];

    const rows = [];

    fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (data) => {
            rows.push(data);
        })
        .on('end', async () => {
            try {
                for (const row of rows) {
                    const name = (row.name || '').trim();
                    if (!name) {
                        skipped += 1;
                        continue;
                    }
                    const unit = row.unit || '';
                    const category = row.category || '';
                    const brand = row.brand || '';
                    const stock = Number(row.stock) || 0;
                    const status = row.status || (stock > 0 ? 'In Stock' : 'Out of Stock');
                    const image = row.image || '';

                    const existing = await dbGet(
                        'SELECT id, name FROM products WHERE LOWER(name) = LOWER(?)',
                        [name]
                    );

                    if (existing) {
                        skipped += 1;
                        duplicates.push({ name: existing.name, existingId: existing.id });
                        continue;
                    }

                    await dbRun(
                        'INSERT INTO products (name, unit, category, brand, stock, status, image) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [name, unit, category, brand, stock, status, image]
                    );
                    added += 1;
                }
                fs.unlink(filePath, () => { });
                res.json({ added, skipped, duplicates });
            } catch (err) {
                fs.unlink(filePath, () => { });
                next(err);
            }
        })
        .on('error', (err) => {
            fs.unlink(filePath, () => { });
            next(err);
        });
});

// CSV Export - GET /api/products/export
app.get('/api/products/export', async (req, res, next) => {
    try {
        const products = await dbAll('SELECT * FROM products');
        const headers = ['name', 'unit', 'category', 'brand', 'stock', 'status', 'image'];
        const lines = [headers.join(',')];
        for (const p of products) {
            const row = [
                p.name ?? '',
                p.unit ?? '',
                p.category ?? '',
                p.brand ?? '',
                p.stock ?? 0,
                p.status ?? '',
                p.image ?? ''
            ].map((val) => {
                const v = String(val).replace(/"/g, '""');
                return /[",\n]/.test(v) ? `"${v}"` : v;
            });
            lines.push(row.join(','));
        }
        const csv = lines.join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
        res.status(200).send(csv);
    } catch (err) {
        next(err);
    }
});

// Validation rules for PUT
const validateProduct = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('unit').optional().isString(),
    body('category').optional().isString(),
    body('brand').optional().isString(),
    body('stock')
        .notEmpty()
        .withMessage('Stock is required')
        .bail()
        .isInt({ min: 0 })
        .withMessage('Stock must be a number greater than or equal to 0'),
    body('status').optional().isString(),
    body('image').optional().isString()
];

// PUT /api/products/:id
app.put('/api/products/:id', validateProduct, async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, unit, category, brand, stock, status, image } = req.body;

    try {
        const numericStock = Number(stock);

        // Check unique name except itself
        const existingByName = await dbGet(
            'SELECT id FROM products WHERE LOWER(name) = LOWER(?) AND id != ?',
            [name, id]
        );
        if (existingByName) {
            return res.status(400).json({ error: 'Product name must be unique' });
        }

        const existing = await dbGet('SELECT * FROM products WHERE id = ?', [id]);
        if (!existing) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Insert inventory log if stock changed
        if (existing.stock !== numericStock) {
            const changedBy = 'admin';
            const timestamp = new Date().toISOString();
            await dbRun(
                'INSERT INTO inventory_logs (productId, oldStock, newStock, changedBy, timestamp) VALUES (?, ?, ?, ?, ?)',
                [id, existing.stock, numericStock, changedBy, timestamp]
            );
        }

        const finalStatus = status || (numericStock > 0 ? 'In Stock' : 'Out of Stock');

        await dbRun(
            'UPDATE products SET name = ?, unit = ?, category = ?, brand = ?, stock = ?, status = ?, image = ? WHERE id = ?',
            [name, unit, category, brand, numericStock, finalStatus, image, id]
        );

        const updated = await dbGet('SELECT * FROM products WHERE id = ?', [id]);
        res.json(updated);
    } catch (err) {
        next(err);
    }
});

// GET /api/products/:id/history
app.get('/api/products/:id/history', async (req, res, next) => {
    const { id } = req.params;
    try {
        const logs = await dbAll(
            'SELECT * FROM inventory_logs WHERE productId = ? ORDER BY timestamp DESC',
            [id]
        );
        res.json(logs);
    } catch (err) {
        next(err);
    }
});

// Basic error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}`);
});
