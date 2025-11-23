import React from 'react';
import './ProductTable.css';

const ProductTable = ({ products, onEditRow, onSelectProduct }) => {
    return (
        <table className="product-table">
            <thead>
                <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Unit</th>
                    <th>Category</th>
                    <th>Brand</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {products.length === 0 ? (
                    <tr>
                        <td colSpan="8" className="empty-row">
                            No products found.
                        </td>
                    </tr>
                ) : (
                    products.map((product) => (
                        <tr
                            key={product.id}
                            onClick={() => onSelectProduct(product)}
                            className="product-row"
                        >
                            <td>
                                {product.image ? (
                                    <img src={product.image} alt={product.name} className="product-image" />
                                ) : (
                                    <span className="placeholder-image">N/A</span>
                                )}
                            </td>
                            <td>{product.name}</td>
                            <td>{product.unit}</td>
                            <td>{product.category}</td>
                            <td>{product.brand}</td>
                            <td>{product.stock}</td>
                            <td>
                                <span
                                    className={
                                        product.stock === 0
                                            ? 'status-badge status-out'
                                            : 'status-badge status-in'
                                    }
                                >
                                    {product.stock === 0 ? 'Out of Stock' : 'In Stock'}
                                </span>
                            </td>
                            <td>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEditRow(product);
                                    }}
                                >
                                    Edit
                                </button>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    );
};

export default ProductTable;
