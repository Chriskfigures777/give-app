"use client";

import { useRef } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "motion/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const CHART_COLORS = [
  "#10b981", "#06b6d4", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899",
  "#14b8a6", "#6366f1", "#f97316", "#84cc16",
];

const ease = [0.22, 1, 0.36, 1] as const;

const TOOLTIP_STYLE = {
  backgroundColor: "hsl(217 33% 17%)",
  border: "1px solid hsl(217 33% 25%)",
  borderRadius: "12px",
  padding: "8px 12px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
};
const TOOLTIP_LABEL_STYLE = { color: "hsl(215 20% 65%)", fontSize: 11, marginBottom: 4 };
const TOOLTIP_ITEM_STYLE = { color: "#10b981", fontSize: 13, fontWeight: 600 };

type NameValue = { name: string; value: number };
type DateCount = { date: string; count: number };

export function SurveyDonutChart({ data, title }: { data: NameValue[]; title: string }) {
  if (data.length === 0) return <EmptyChart title={title} />;
  return (
    <ChartCard title={title}>
      <ResponsiveContainer width="100%" height={256}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={78}
            paddingAngle={4}
            cornerRadius={4}
            isAnimationActive
            animationDuration={900}
            animationBegin={200}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={TOOLTIP_LABEL_STYLE}
            itemStyle={TOOLTIP_ITEM_STYLE}
            formatter={(value: number) => [`${value}`, "Responses"]}
          />
          <Legend
            wrapperStyle={{ color: "hsl(215 20% 65%)", fontSize: 12 }}
            iconType="circle"
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function SurveyBarChart({ data, title }: { data: NameValue[]; title: string }) {
  if (data.length === 0) return <EmptyChart title={title} />;
  return (
    <ChartCard title={title}>
      <ResponsiveContainer width="100%" height={Math.max(200, data.length * 44)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 20% 65% / 0.15)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "hsl(215 20% 65%)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={160}
            tick={{ fontSize: 11, fill: "hsl(215 20% 65%)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={TOOLTIP_LABEL_STYLE}
            itemStyle={TOOLTIP_ITEM_STYLE}
            formatter={(value: number) => [`${value}`, "Responses"]}
          />
          <Bar
            dataKey="value"
            radius={[0, 6, 6, 0]}
            isAnimationActive
            animationDuration={700}
            animationBegin={100}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function SurveyAreaChart({ data, title }: { data: DateCount[]; title: string }) {
  if (data.length === 0) return <EmptyChart title={title} />;
  return (
    <ChartCard title={title}>
      <ResponsiveContainer width="100%" height={256}>
        <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="surveyAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 20% 65% / 0.15)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "hsl(215 20% 65%)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(215 20% 65%)" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={TOOLTIP_LABEL_STYLE}
            itemStyle={TOOLTIP_ITEM_STYLE}
            formatter={(value: number) => [`${value}`, "Responses"]}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#10b981"
            strokeWidth={2.5}
            fill="url(#surveyAreaGrad)"
            dot={false}
            activeDot={{ r: 6, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
            isAnimationActive
            animationDuration={800}
            animationBegin={200}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [3, -3]), { stiffness: 200, damping: 25 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-3, 3]), { stiffness: 200, damping: 25 });

  function handleMouseMove(e: React.MouseEvent) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      className="survey-chart-card survey-chart-card-animated group"
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, ease }}
      whileHover={{
        scale: 1.02,
        y: -6,
        transition: { duration: 0.25, ease },
      }}
      whileTap={{ scale: 0.98 }}
    >
      <h3 className="mb-4 text-sm font-semibold text-dashboard-text">{title}</h3>
      {children}
    </motion.div>
  );
}

function EmptyChart({ title }: { title: string }) {
  return (
    <motion.div
      className="survey-chart-card"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <h3 className="mb-4 text-sm font-semibold text-dashboard-text">{title}</h3>
      <div className="flex h-48 items-center justify-center">
        <p className="text-sm text-dashboard-text-muted">No data yet</p>
      </div>
    </motion.div>
  );
}
