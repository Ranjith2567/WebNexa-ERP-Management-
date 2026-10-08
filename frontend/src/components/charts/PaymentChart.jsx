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
    { month: "Jan", payments: 0 },
    { month: "Feb", payments: 0 },
    { month: "Mar", payments: 0 },
    { month: "Apr", payments: 0 },
    { month: "May", payments: 0 },
    { month: "Jun", payments: 0 },
    { month: "Jul", payments: 0 },
    { month: "Aug", payments: 0 },
    { month: "Sep", payments: 0 },
    { month: "Oct", payments: 0 },
    { month: "Nov", payments: 0 },
    { month: "Dec", payments: 0 },
];

const PaymentChart = ({
    data = defaultData,
    title = "Payment Overview",
    height = 320,
}) => {
    return (
        <div className="payment-chart">
            <div className="payment-chart-header">
                <div>
                    <h3>{title}</h3>
                    <p>Monthly payment performance</p>
                </div>
            </div>

            <div className="payment-chart-body">
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
                                "Payments",
                            ]}
                        />

                        <Line
                            type="monotone"
                            dataKey="payments"
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

export default PaymentChart;