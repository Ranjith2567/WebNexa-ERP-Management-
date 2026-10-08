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
    { month: "Jan", sales: 0 },
    { month: "Feb", sales: 0 },
    { month: "Mar", sales: 0 },
    { month: "Apr", sales: 0 },
    { month: "May", sales: 0 },
    { month: "Jun", sales: 0 },
    { month: "Jul", sales: 0 },
    { month: "Aug", sales: 0 },
    { month: "Sep", sales: 0 },
    { month: "Oct", sales: 0 },
    { month: "Nov", sales: 0 },
    { month: "Dec", sales: 0 },
];

const SalesChart = ({
    data = defaultData,
    title = "Sales Overview",
    height = 320,
}) => {
    return (
        <div className="sales-chart">
            <div className="sales-chart-header">
                <div>
                    <h3>{title}</h3>
                    <p>Monthly sales performance</p>
                </div>
            </div>

            <div className="sales-chart-body">
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
                                "Sales",
                            ]}
                        />

                        <Bar
                            dataKey="sales"
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

export default SalesChart;