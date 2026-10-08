import React from "react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";

const defaultData = [
    { month: "Jan", revenue: 0 },
    { month: "Feb", revenue: 0 },
    { month: "Mar", revenue: 0 },
    { month: "Apr", revenue: 0 },
    { month: "May", revenue: 0 },
    { month: "Jun", revenue: 0 },
    { month: "Jul", revenue: 0 },
    { month: "Aug", revenue: 0 },
    { month: "Sep", revenue: 0 },
    { month: "Oct", revenue: 0 },
    { month: "Nov", revenue: 0 },
    { month: "Dec", revenue: 0 },
];

const RevenueChart = ({
    data = defaultData,
    title = "Revenue Overview",
    height = 320,
}) => {
    return (
        <div className="revenue-chart">
            <div className="revenue-chart-header">
                <div>
                    <h3>{title}</h3>
                    <p>Monthly revenue performance</p>
                </div>
            </div>

            <div className="revenue-chart-body">
                <ResponsiveContainer width="100%" height={height}>
                    <LineChart
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
                                "Revenue",
                            ]}
                        />

                        <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="#2563eb"
                            strokeWidth={3}
                            dot={{
                                r: 4,
                                strokeWidth: 2,
                            }}
                            activeDot={{
                                r: 6,
                                strokeWidth: 2,
                            }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default RevenueChart;