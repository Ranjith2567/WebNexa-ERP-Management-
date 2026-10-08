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
    { category: "Jan", stock: 0 },
    { category: "Feb", stock: 0 },
    { category: "Mar", stock: 0 },
    { category: "Apr", stock: 0 },
    { category: "May", stock: 0 },
    { category: "Jun", stock: 0 },
    { category: "Jul", stock: 0 },
    { category: "Aug", stock: 0 },
    { category: "Sep", stock: 0 },
    { category: "Oct", stock: 0 },
    { category: "Nov", stock: 0 },
    { category: "Dec", stock: 0 },
];

const StockChart = ({
    data = defaultData,
    title = "Stock Overview",
    height = 320,
}) => {
    return (
        <div className="stock-chart">
            <div className="stock-chart-header">
                <div>
                    <h3>{title}</h3>
                    <p>Monthly inventory stock overview</p>
                </div>
            </div>

            <div className="stock-chart-body">
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
                            dataKey="category"
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
                                Number(value).toLocaleString("en-IN"),
                                "Stock",
                            ]}
                        />

                        <Bar
                            dataKey="stock"
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

export default StockChart;