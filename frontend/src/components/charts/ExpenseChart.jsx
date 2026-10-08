import React from "react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";

const defaultData = [
    { month: "Jan", expenses: 0 },
    { month: "Feb", expenses: 0 },
    { month: "Mar", expenses: 0 },
    { month: "Apr", expenses: 0 },
    { month: "May", expenses: 0 },
    { month: "Jun", expenses: 0 },
    { month: "Jul", expenses: 0 },
    { month: "Aug", expenses: 0 },
    { month: "Sep", expenses: 0 },
    { month: "Oct", expenses: 0 },
    { month: "Nov", expenses: 0 },
    { month: "Dec", expenses: 0 },
];

const ExpenseChart = ({
    data = defaultData,
    title = "Expense Overview",
    height = 320,
}) => {
    return (
        <div className="expense-chart">
            <div className="expense-chart-header">
                <div>
                    <h3>{title}</h3>
                    <p>Monthly expense performance</p>
                </div>
            </div>

            <div className="expense-chart-body">
                <ResponsiveContainer width="100%" height={height}>
                    <BarChart
                        data={data}
                        margin={{
                            top: 10,
                            right: 20,
                            left: 0,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(148, 163, 184, 0.10)"
                        />

                        <XAxis
                            dataKey="month"
                            tick={{
                                fill: "#94a3b8",
                                fontSize: 12,
                            }}
                            axisLine={{
                                stroke: "rgba(148, 163, 184, 0.12)",
                            }}
                            tickLine={false}
                        />

                        <YAxis
                            tick={{
                                fill: "#94a3b8",
                                fontSize: 12,
                            }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) =>
                                `₹${Number(value).toLocaleString("en-IN")}`
                            }
                        />

                        <Tooltip
                            cursor={{
                                fill: "rgba(148, 163, 184, 0.05)",
                            }}
                            contentStyle={{
                                background: "#0f172a",
                                border: "1px solid rgba(148, 163, 184, 0.15)",
                                borderRadius: "10px",
                                color: "#ffffff",
                            }}
                            labelStyle={{
                                color: "#ffffff",
                                marginBottom: "5px",
                            }}
                            formatter={(value) => [
                                `₹${Number(value).toLocaleString("en-IN")}`,
                                "Expenses",
                            ]}
                        />

                        <Bar
                            dataKey="expenses"
                            fill="#2563eb"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={45}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ExpenseChart;