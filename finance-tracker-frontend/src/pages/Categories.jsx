import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const { register, handleSubmit, reset } = useForm();
    const navigate = useNavigate();

    const token = localStorage.getItem('access');

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await api.get('finance/categories/', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCategories(res.data);
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

    const onSubmit = async (data) => {
        try {
            await api.post('finance/categories/', data, {
                headers: { Authorization: `Bearer ${token}` },
            });
            reset();
            fetchCategories();
        } catch (err) {
            console.error('Error creating category:', err.response?.data || err.message);
        }
    };

    const deleteCategory = async (id) => {
        if (!window.confirm('Are you sure you want to delete this category?')) return;
        try {
            await api.delete(`finance/categories/${id}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchCategories();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to delete category.");
        }
    };

    const defaultCategories = categories.filter(cat => cat.is_default);
    const customCategories = categories.filter(cat => !cat.is_default);

    return (
        <div className="container mt-4">
            <h2>Manage Categories</h2>

            <button
                className="btn btn-outline-secondary btn-sm mb-2"
                onClick={() => navigate('/dashboard')}
            >
                ← Back to Dashboard
            </button>

            <form onSubmit={handleSubmit(onSubmit)} className="mb-3 d-flex gap-2">

                <input
                    className="form-control"
                    placeholder="Category Name"
                    {...register('name')}
                    required
                />

                <select
                    className="form-select"
                    {...register('type')}
                    required
                >
                    <option value="">Select Type</option>
                    <option value="INCOME">Income</option>
                    <option value="EXPENSE">Expense</option>
                </select>

                <button type="submit" className="btn btn-success">
                    Add
                </button>
            </form>

            {categories.length === 0 ? (
                <p>No categories found.</p>
            ) : (
                <>
                    {/* Default Categories */}
                    <h4 className="mt-4 mb-3">Default Categories</h4>

                    <ul className="list-group mb-4">
                        {defaultCategories.map(cat => (
                            <li
                                key={cat.id}
                                className="list-group-item d-flex justify-content-between align-items-center"
                            >
                                <div>
                                    <strong>{cat.name}</strong>

                                    <span
                                        className={`badge ms-2 ${cat.type === "INCOME"
                                            ? "bg-success"
                                            : "bg-danger"
                                            }`}
                                    >
                                        {cat.type}
                                    </span>

                                    <span className="badge bg-secondary ms-2">
                                        Default
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>

                    {/* User Categories */}
                    <h4 className="mb-3">My Categories</h4>

                    {customCategories.length === 0 ? (
                        <p className="text-muted">No custom categories yet.</p>
                    ) : (
                        <ul className="list-group">
                            {customCategories.map(cat => (
                                <li
                                    key={cat.id}
                                    className="list-group-item d-flex justify-content-between align-items-center"
                                >
                                    <div>
                                        <strong>{cat.name}</strong>

                                        <span
                                            className={`badge ms-2 ${cat.type === "INCOME"
                                                ? "bg-success"
                                                : "bg-danger"
                                                }`}
                                        >
                                            {cat.type}
                                        </span>
                                    </div>

                                    <button
                                        className="btn btn-sm btn-danger"
                                        onClick={() => deleteCategory(cat.id)}
                                    >
                                        Delete
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}
        </div>
    );
};

export default Categories;
