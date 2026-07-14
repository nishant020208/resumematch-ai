import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from "recharts";
import type { CategoryScore } from "@/lib/keywords";

export function SkillRadar({ data }: { data: CategoryScore[] }) {
  const chartData = data.map(d => ({ category: d.category, Resume: d.resume, "JD demand": d.jd }));
  return (
    <div className="w-full h-72">
      <ResponsiveContainer>
        <RadarChart data={chartData} outerRadius="72%">
          <PolarGrid stroke="color-mix(in oklch, var(--foreground) 15%, transparent)" />
          <PolarAngleAxis dataKey="category" tick={{ fill: "var(--muted-foreground)", fontSize: 10, fontFamily: "var(--font-mono)" }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar name="JD demand" dataKey="JD demand" stroke="var(--muted-foreground)" fill="var(--muted-foreground)" fillOpacity={0.15} />
          <Radar name="Resume" dataKey="Resume" stroke="var(--acid)" fill="var(--acid)" fillOpacity={0.35} />
          <Legend wrapperStyle={{ fontSize: 10, fontFamily: "var(--font-mono)" }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}