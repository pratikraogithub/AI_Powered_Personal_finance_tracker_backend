import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#4caf50', '#f44336', '#2196f3', '#ff9800', '#9c27b0', '#00bcd4'];

const TransactionChart = ({ data }) => {
    // Group by category
    const categoryData = {};

    data
        .filter(tx => tx.type === 'EXPENSE')
        .forEach(tx => {
            const key = tx.category?.name || 'Uncategorized';

            categoryData[key] =
                (categoryData[key] || 0) + parseFloat(tx.amount);
        });

    const pieData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));

    // Group by month (e.g. "2024-05")
    const monthlyData = {};
    data.forEach(tx => {
        const month = tx.date.slice(0, 7);
        if (!monthlyData[month]) monthlyData[month] = { month, income: 0, expense: 0 };
        if (tx.type === 'INCOME') {
            monthlyData[month].income += parseFloat(tx.amount);
        } else {
            monthlyData[month].expense += parseFloat(tx.amount);
        }
    });

    const barData = Object.values(monthlyData);

    return (
        <div className="row mt-4">
            <div className="col-md-6">
                <h5>Expense Breakdown by Category</h5>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            dataKey="value"
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label
                        >
                            {pieData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="col-md-6">
                <h5>Monthly Income vs Expense</h5>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="income" fill="#4caf50" name="Income" />
                        <Bar dataKey="expense" fill="#f44336" name="Expense" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TransactionChart;
