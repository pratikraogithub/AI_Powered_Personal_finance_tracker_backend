// src/pages/Transactions.jsx
import React, { useEffect, useState, useMemo } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import TransactionChart from '../components/TransactionChart';

const Transactions = () => {
    const [filterType, setFilterType] = useState('');
    const [sortOrder, setSortOrder] = useState('newest');
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingTx, setEditingTx] = useState(null);
    const [editForm, setEditForm] = useState({
        type: '',
        amount: '',
        category: '',
        date: '',
        description: ''
    });
    const { register, handleSubmit, reset, watch } = useForm();
    const navigate = useNavigate();

    const selectedType = watch('type');

    useEffect(() => {
        const token = localStorage.getItem('access');
        if (!token) {
            navigate('/');
            return;
        }

        api.get('finance/transactions/', {


        })
            .then((res) => {
                setTransactions(res.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Fetch error:', err);
                setLoading(false);
            });

        api.get('finance/categories/', {

        })
            .then((res) => {
                setCategories(res.data);
            })
            .catch((err) => {
                console.error('Categories fetch error:', err);
            });
    }, [navigate]);

    const onSubmit = async (data) => {
        const token = localStorage.getItem('access');

        const payload = {
            ...data,
            type: data.type.toUpperCase(),
            category_id: parseInt(data.category),
            amount: parseFloat(data.amount),
        };

        try {
            const response = await api.post('finance/transactions/', payload, {

            });
            setTransactions(prev => [response.data, ...prev]);
            reset();
        } catch (err) {
            console.error('Post error:', err.response?.data || err.message);
        }
    };

    const filteredTransactions = useMemo(() => {
        const filtered = transactions.filter((tx) =>
            filterType ? tx.type === filterType : true
        );

        return filtered.sort((a, b) => {
            switch (sortOrder) {
                case 'newest':
                    return new Date(b.date) - new Date(a.date);

                case 'oldest':
                    return new Date(a.date) - new Date(b.date);

                case 'high':
                    return parseFloat(b.amount) - parseFloat(a.amount);

                case 'low':
                    return parseFloat(a.amount) - parseFloat(b.amount);

                default:
                    return 0;
            }
        });
    }, [transactions, filterType, sortOrder]);

    const incomeTotal = transactions
        .filter(tx => tx.type === 'INCOME')
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

    const expenseTotal = transactions
        .filter(tx => tx.type === 'EXPENSE')
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

    const balance = incomeTotal - expenseTotal;

    const filteredCategories = categories.filter(
        (cat) => cat.type === selectedType?.toUpperCase()
    );

    const deleteTransaction = async (id) => {
        const token = localStorage.getItem('access');

        if (!window.confirm('Are you sure you want to delete this transaction?')) return;

        try {
            await api.delete(`finance/transactions/${id}/`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setTransactions(prev => prev.filter(tx => tx.id !== id));
        } catch (err) {
            console.error('Delete error:', err.response?.data || err.message);
        }
    };

    const startEdit = (tx) => {
        setEditingTx(tx);

        setEditForm({
            type: tx.type,
            amount: tx.amount,
            category: tx.category?.id || '',
            date: tx.date,
            description: tx.description || ''
        });
    };

    const handleEditChange = (e) => {
        setEditForm({
            ...editForm,
            [e.target.name]: e.target.value
        });
    };

    const updateTransaction = async () => {
        const token = localStorage.getItem('access');

        try {
            const payload = {
                type: editForm.type.toUpperCase(),
                amount: parseFloat(editForm.amount),
                category_id: parseInt(editForm.category),
                date: editForm.date,
                description: editForm.description
            };

            const res = await api.put(
                `finance/transactions/${editingTx.id}/`,
                payload,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setTransactions(prev =>
                prev.map(tx =>
                    tx.id === editingTx.id ? res.data : tx
                )
            );

            setEditingTx(null);
        } catch (err) {
            console.error('Update error:', err.response?.data || err.message);
        }
    };

    return (
        <div className="w-100 min-vh-100 bg-light py-4">
            <div className="container-fluid">
                <div className="row">
                    <div className="col-12">
                        {/* Header */}
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2 className="fw-bold text-primary mb-0">
                                💰 My Transactions
                            </h2>
                            <button
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => navigate('/dashboard')}
                            >
                                ← Back to Dashboard
                            </button>
                        </div>

                        {/* Summary Cards */}
                        <div className="row g-3 mb-4">
                            <div className="col-12 col-sm-6 col-lg-4">
                                <div className="card h-100 shadow-sm border-0 border-start border-success border-4">
                                    <div className="card-body text-center py-4">
                                        <h6 className="card-subtitle mb-2 text-muted text-uppercase">Total Income</h6>
                                        <h2 className="card-title text-success fw-bold mb-0">
                                            ₹{incomeTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </h2>
                                    </div>
                                </div>
                            </div>
                            <div className="col-12 col-sm-6 col-lg-4">
                                <div className="card h-100 shadow-sm border-0 border-start border-danger border-4">
                                    <div className="card-body text-center py-4">
                                        <h6 className="card-subtitle mb-2 text-muted text-uppercase">Total Expense</h6>
                                        <h2 className="card-title text-danger fw-bold mb-0">
                                            ₹{expenseTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </h2>
                                    </div>
                                </div>
                            </div>
                            <div className="col-12 col-sm-12 col-lg-4">
                                <div className="card h-100 shadow-sm border-0 border-start border-primary border-4">
                                    <div className="card-body text-center py-4">
                                        <h6 className="card-subtitle mb-2 text-muted text-uppercase">Net Balance</h6>
                                        <h2 className={`card-title fw-bold mb-0 ${balance >= 0 ? 'text-primary' : 'text-warning'}`}>
                                            ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </h2>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Add Transaction Form */}
                        <div className="card shadow-sm border-0 mb-4">
                            <div className="card-header bg-white border-bottom py-3">
                                <h5 className="mb-0 text-secondary">
                                    ➕ Add New Transaction
                                </h5>
                            </div>
                            <div className="card-body">
                                <form onSubmit={handleSubmit(onSubmit)}>
                                    <div className="row g-3">
                                        <div className="col-12 col-md-6 col-lg-3">
                                            <label className="form-label small text-muted">Transaction Type</label>
                                            <select className="form-select" {...register('type')} required>
                                                <option value="">Select Type</option>
                                                <option value="income">💵 Income</option>
                                                <option value="expense">💸 Expense</option>
                                            </select>
                                        </div>

                                        <div className="col-12 col-md-6 col-lg-3">
                                            <label className="form-label small text-muted">Amount</label>
                                            <div className="input-group">
                                                <span className="input-group-text">₹</span>
                                                <input
                                                    className="form-control"
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    {...register('amount')}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="col-12 col-md-6 col-lg-3">
                                            <label className="form-label small text-muted">Category</label>
                                            <select
                                                className="form-select"
                                                {...register('category')}
                                                disabled={!selectedType}
                                                required
                                            >
                                                <option value="">
                                                    {selectedType
                                                        ? 'Select Category'
                                                        : 'Select Transaction Type First'}
                                                </option>

                                                {filteredCategories.map((cat) => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {cat.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-12 col-md-6 col-lg-3">
                                            <label className="form-label small text-muted">Date</label>
                                            <input
                                                className="form-control"
                                                type="date"
                                                {...register('date')}
                                                required
                                            />
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label small text-muted">Description (Optional)</label>
                                            <input
                                                className="form-control"
                                                type="text"
                                                placeholder="Enter transaction details..."
                                                {...register('description')}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-3">
                                        <button className="btn btn-primary px-4" type="submit">
                                            Add Transaction
                                        </button>
                                        <button
                                            className="btn btn-outline-secondary ms-2 px-4"
                                            type="button"
                                            onClick={() => reset()}
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Chart Section */}
                        <div className="card shadow-sm border-0 mb-4">
                            <div className="card-header bg-white border-bottom py-3">
                                <h5 className="mb-0 text-secondary">
                                    📊 Transaction Overview
                                </h5>
                            </div>
                            <div className="card-body">
                                <TransactionChart data={filteredTransactions} />
                            </div>
                        </div>

                        {/* Filter & Sort Controls */}
                        <div className="card shadow-sm border-0 mb-4">
                            <div className="card-body">
                                <div className="row g-3 align-items-end">
                                    <div className="col-12 col-md-6 col-lg-3">
                                        <label className="form-label small text-muted">Filter by Type</label>
                                        <select
                                            className="form-select"
                                            value={filterType}
                                            onChange={(e) => setFilterType(e.target.value)}
                                        >
                                            <option value="">All Types</option>
                                            <option value="INCOME">💵 Income Only</option>
                                            <option value="EXPENSE">💸 Expense Only</option>
                                        </select>
                                    </div>

                                    <div className="col-12 col-md-6 col-lg-3">
                                        <label className="form-label small text-muted">Sort By</label>
                                        <select
                                            className="form-select"
                                            value={sortOrder}
                                            onChange={(e) => setSortOrder(e.target.value)}
                                        >
                                            <option value="newest">📅 Newest First</option>
                                            <option value="oldest">📅 Oldest First</option>
                                            <option value="high">💰 Amount: High to Low</option>
                                            <option value="low">💰 Amount: Low to High</option>
                                        </select>
                                    </div>

                                    <div className="col-12 col-md-12 col-lg-6">
                                        <div className="text-muted small">
                                            Showing <strong>{filteredTransactions.length}</strong> transaction(s)
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Transactions List */}
                        <div className="card shadow-sm border-0">
                            <div className="card-header bg-white border-bottom py-3">
                                <h5 className="mb-0 text-secondary">
                                    📋 Transaction History
                                </h5>
                            </div>
                            <div className="card-body p-0">
                                {loading ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="mt-2 text-muted">Loading transactions...</p>
                                    </div>
                                ) : filteredTransactions.length === 0 ? (
                                    <div className="text-center py-5">
                                        <p className="text-muted mb-0">No transactions found.</p>
                                        <small className="text-muted">Add your first transaction above!</small>
                                    </div>
                                ) : (
                                    <div className="list-group list-group-flush">
                                        {filteredTransactions.map((tx) => (
                                            <div key={tx.id} className="list-group-item list-group-item-action">
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <div className="flex-grow-1">
                                                        <div className="d-flex align-items-center mb-1">
                                                            <span className={`badge ${tx.type === 'INCOME' ? 'bg-success' : 'bg-danger'} me-2`}>
                                                                {tx.type === 'INCOME' ? '💵 Income' : '💸 Expense'}
                                                            </span>
                                                            <span className="badge bg-secondary">
                                                                {tx.category?.name || 'Uncategorized'}
                                                            </span>
                                                        </div>
                                                        {tx.description && (
                                                            <p className="mb-1">{tx.description}</p>
                                                        )}
                                                        <small className="text-muted">
                                                            📅 {new Date(tx.date).toLocaleDateString('en-IN', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </small>
                                                    </div>
                                                    <div className="text-end ms-3">
                                                        <div className="d-flex gap-2 mb-2">
                                                            <button
                                                                className="btn btn-sm btn-outline-primary"
                                                                onClick={() => startEdit(tx)}
                                                            >
                                                                Edit
                                                            </button>

                                                            <button
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => deleteTransaction(tx.id)}
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                        <h5 className={`mb-0 fw-bold ${tx.type === 'INCOME' ? 'text-success' : 'text-danger'}`}>
                                                            {tx.type === 'INCOME' ? '+' : '-'}₹{parseFloat(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </h5>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {editingTx && (
                <div className="modal show d-block bg-dark bg-opacity-50">
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content p-4">

                            <h5 className="mb-3">✏️ Edit Transaction</h5>

                            <div className="row g-3">

                                {/* Type */}
                                <div className="col-md-6">
                                    <label className="form-label">Type</label>
                                    <select
                                        className="form-select"
                                        name="type"
                                        value={editForm.type}
                                        onChange={handleEditChange}
                                    >
                                        <option value="INCOME">Income</option>
                                        <option value="EXPENSE">Expense</option>
                                    </select>
                                </div>

                                {/* Amount */}
                                <div className="col-md-6">
                                    <label className="form-label">Amount</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="amount"
                                        value={editForm.amount}
                                        onChange={handleEditChange}
                                    />
                                </div>

                                {/* Category */}
                                <div className="col-md-6">
                                    <label className="form-label">Category</label>
                                    <select
                                        className="form-select"
                                        name="category"
                                        value={editForm.category}
                                        onChange={handleEditChange}
                                    >
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Date */}
                                <div className="col-md-6">
                                    <label className="form-label">Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        name="date"
                                        value={editForm.date}
                                        onChange={handleEditChange}
                                    />
                                </div>

                                {/* Description */}
                                <div className="col-12">
                                    <label className="form-label">Description</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="description"
                                        value={editForm.description}
                                        onChange={handleEditChange}
                                    />
                                </div>

                            </div>

                            {/* Buttons */}
                            <div className="d-flex justify-content-end gap-2 mt-4">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setEditingTx(null)}
                                >
                                    Cancel
                                </button>

                                <button
                                    className="btn btn-primary"
                                    onClick={updateTransaction}
                                >
                                    Save Changes
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Transactions;