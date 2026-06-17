import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SummaryPoint } from "../api/client";

type Props = {
  summary: SummaryPoint[];
};

export function AdsChart({ summary }: Props) {
  return (
    <section className="chart-section">
      <h2>Ads Over Time</h2>
      <div className="chart-frame">
        <ResponsiveContainer height="100%" width="100%">
          <AreaChart data={summary}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Area dataKey="active" fill="#7bdca9" stackId="1" stroke="#1f9d61" type="monotone" />
            <Area dataKey="inactive" fill="#ef9a9f" stackId="1" stroke="#ba3f4a" type="monotone" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
