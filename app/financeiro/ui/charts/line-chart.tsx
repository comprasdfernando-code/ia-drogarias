"use client";

import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type Props = {
  data: { [key: string]: any }[];
  dataKey: string;  // ex: "valor"
  nameKey: string;  // ex: "mes"
};

export default function LineChart({ data, dataKey, nameKey }: Props) {
  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <ReLineChart data={data}>
          <CartesianGrid stroke="#222" strokeDasharray="3 3" />

          <XAxis
            dataKey={nameKey}
            stroke="#888"
            tick={{ fill: "#999", fontSize: 12 }}
          />

          <YAxis
            stroke="#888"
            tick={{ fill: "#999", fontSize: 12 }}
          />

          <Tooltip
            contentStyle={{
              background: "#111",
              border: "1px solid #333",
              color: "#fff",
            }}
            itemStyle={{ color: "#fff" }}
          />

          <Line
            type="monotone"
            dataKey={dataKey}
            stroke="#4ab1ff"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6 }}
          />
        </ReLineChart>
      </ResponsiveContainer>
    </div>
  );
}
