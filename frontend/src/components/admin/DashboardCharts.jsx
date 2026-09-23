import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useChartColors } from "../../hooks/useChartColors";
import { formatPrice } from "../../utils/format";

const STATUS_COLOR_VAR = {
  pending: "warning",
  paid: "success",
  shipped: "info",
  delivered: "success",
  failed: "error",
  cancelled: "error",
  refunded: "base-content",
};

function ChartCard({ title, action, children }) {
  return (
    <div className="card border border-base-300 bg-base-100">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <h2 className="card-title text-base">{title}</h2>
          {action}
        </div>
        {children}
      </div>
    </div>
  );
}

function tooltipStyle(colors) {
  return {
    contentStyle: {
      background: colors["base-100"] || "#fff",
      border: `1px solid ${colors["base-300"]}`,
      borderRadius: "0.75rem",
      fontSize: "0.8rem",
    },
    labelStyle: { color: colors["base-content"] },
    itemStyle: { color: colors["base-content"] },
  };
}

function formatDayLabel(day) {
  const d = new Date(`${day}T00:00:00Z`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}

export function RevenueChart({ data }) {
  const colors = useChartColors();
  const hasSales = data.some((d) => d.totalPounds > 0);

  return (
    <ChartCard title="Revenue, last 30 days">
      {!hasSales ? (
        <p className="py-8 text-center text-sm text-base-content/60">No sales in this window yet.</p>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.primary} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={colors["base-300"]} vertical={false} />
              <XAxis
                dataKey="day"
                tickFormatter={formatDayLabel}
                tick={{ fill: colors["base-content"], fontSize: 11 }}
                interval="preserveStartEnd"
                axisLine={{ stroke: colors["base-300"] }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: colors["base-content"], fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={56}
                tickFormatter={(v) => formatPrice(v, "egp")}
              />
              <Tooltip
                {...tooltipStyle(colors)}
                labelFormatter={formatDayLabel}
                formatter={(value) => [formatPrice(value, "egp"), "Revenue"]}
              />
              <Area
                type="monotone"
                dataKey="totalPounds"
                stroke={colors.primary}
                strokeWidth={2}
                fill="url(#revenueFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}

export function OrdersByStatusChart({ ordersByStatus }) {
  const colors = useChartColors();
  const entries = Object.entries(ordersByStatus).filter(([, count]) => count > 0);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <ChartCard title="Orders by status">
      {entries.length === 0 ? (
        <p className="py-8 text-center text-sm text-base-content/60">No orders yet.</p>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={entries.map(([status, count]) => ({ status, count }))}
                dataKey="count"
                nameKey="status"
                innerRadius="55%"
                outerRadius="80%"
                paddingAngle={2}
              >
                {entries.map(([status]) => (
                  <Cell key={status} fill={colors[STATUS_COLOR_VAR[status] ?? "base-content"]} />
                ))}
              </Pie>
              <Tooltip
                {...tooltipStyle(colors)}
                formatter={(value, name) => [`${value} (${Math.round((value / total) * 100)}%)`, name]}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span className="text-xs capitalize text-base-content/80">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}

export function TopProductsChart({ topProducts }) {
  const colors = useChartColors();

  return (
    <ChartCard title="Top products">
      {topProducts.length === 0 ? (
        <p className="py-8 text-center text-sm text-base-content/60">No sales yet.</p>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topProducts}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={colors["base-300"]} horizontal={false} />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fill: colors["base-content"], fontSize: 11 }}
                axisLine={{ stroke: colors["base-300"] }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fill: colors["base-content"], fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(name) => (name.length > 16 ? `${name.slice(0, 15)}…` : name)}
              />
              <Tooltip {...tooltipStyle(colors)} formatter={(value) => [value, "Units sold"]} />
              <Bar dataKey="totalQuantity" fill={colors.primary} radius={[0, 6, 6, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}
