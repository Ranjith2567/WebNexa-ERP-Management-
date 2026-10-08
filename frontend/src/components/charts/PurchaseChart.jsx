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
    { month: "Jan", purchases: 0 },
    { month: "Feb", purchases: 0 },
    { month: "Mar", purchases: 0 },
    { month: "Apr", purchases: 0 },
    { month: "May", purchases: 0 },
    { month: "Jun", purchases: 0 },
    { month: "Jul", purchases: 0 },
    { month: "Aug", purchases: 0 },
    { month: "Sep", purchases: 0 },
    { month: "Oct", purchases: 0 },
    { month: "Nov", purchases: 0 },
    { month: "Dec", purchases: 0 },
];

const PurchaseChart = ({
    data = defaultData,
    title = "Purchase Overview",
    height = 320,
}) => {
    return (
        <div className="purchase-chart">
            <div className="purchase-chart-header">
                <div>
                    <h3>{title}</h3>
                    <p>Monthly purchase performance</p>
                </div>
            </div>

            <div className="purchase-chart-body">
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
                                "Purchases",
                            ]}
                        />

                        <Bar
                            dataKey="purchases"
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

export default PurchaseChart;