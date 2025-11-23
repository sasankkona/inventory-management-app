import React, { useEffect, useState } from 'react';
import { getProductHistory } from '../api';
import './InventoryHistorySidebar.css';

const InventoryHistorySidebar = ({ product, onClose }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!product) return;
        const fetchHistory = async () => {
            try {
                setLoading(true);
                setError('');
                const data = await getProductHistory(product.id);
                setLogs(data);
            } catch (err) {
                console.error(err);
                setError('Failed to load history');
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [product]);

    if (!product) return null;

    return (
        <div className="history-sidebar-overlay" onClick={onClose}>
            <div className="history-sidebar" onClick={(e) => e.stopPropagation()}>
                <div className="history-header">
                    <h2>Inventory History - {product.name}</h2>
                    <button className="btn btn-ghost" onClick={onClose}>
                        ✕
                    </button>
                </div>
                {loading && <p>Loading history...</p>}
                {error && <p className="error-text">{error}</p>}
                {!loading && !error && logs.length === 0 && <p>No history yet.</p>}
                {!loading && !error && logs.length > 0 && (
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Old Stock</th>
                                <th>New Stock</th>
                                <th>Changed By</th>
                                <th>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id}>
                                    <td>{new Date(log.timestamp).toLocaleDateString()}</td>
                                    <td>{log.oldStock}</td>
                                    <td>{log.newStock}</td>
                                    <td>{log.changedBy}</td>
                                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default InventoryHistorySidebar;
