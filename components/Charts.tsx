"use client"

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts"

interface BarData { name: string; count: number }

export function CallsBarChart({ data }: { data: BarData[] }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} barSize={20}>
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "#888", fontFamily: "Helvetica Neue" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide />
        <Tooltip
          contentStyle={{ fontSize: 12, border: "1px solid #e0e0e0", fontFamily: "Helvetica Neue", borderRadius: 0 }}
          cursor={{ fill: "#f5f5f5" }}
        />
        <Bar dataKey="count" fill="#0a0a0a" radius={0} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function IndustryBarChart({ data }: { data: { name: string; closed: number; interested: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" barSize={14}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: "#555", fontFamily: "Helvetica Neue" }}
          axisLine={false}
          tickLine={false}
          width={120}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, border: "1px solid #e0e0e0", fontFamily: "Helvetica Neue", borderRadius: 0 }}
          cursor={{ fill: "#f5f5f5" }}
        />
        <Bar dataKey="interested" fill="#e5e5e5" name="Interessiert" radius={0} />
        <Bar dataKey="closed"     fill="#0a0a0a"  name="Abgeschlossen" radius={0} />
      </BarChart>
    </ResponsiveContainer>
  )
}
