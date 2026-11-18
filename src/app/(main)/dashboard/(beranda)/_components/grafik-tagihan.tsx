"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";

import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const config = { nilai: { label: "Nilai tagihan", color: "var(--chart-2)" } } satisfies ChartConfig;

const jt = (v: number) => `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(v / 1_000_000)} jt`;

export function GrafikTagihan({ data }: { data: { label: string; nilai: number }[] }) {
  const akhir = data.length - 1;
  return (
    <figure className="flex flex-col gap-2">
      <ChartContainer config={config} className="aspect-auto h-[220px] w-full" aria-hidden="true">
        <BarChart data={data} margin={{ top: 24, left: 4, right: 4 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={jt} />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent formatter={(v) => `Rp${Number(v).toLocaleString("id-ID")}`} />}
          />
          <Bar dataKey="nilai" fill="var(--color-nilai)" radius={4} maxBarSize={48} isAnimationActive={false}>
            <LabelList
              dataKey="nilai"
              position="top"
              content={({ x, y, width, value, index }) =>
                index === akhir && Number(value) > 0 ? (
                  <text
                    x={Number(x) + Number(width) / 2}
                    y={Number(y) - 6}
                    textAnchor="middle"
                    className="fill-foreground text-xs font-medium"
                  >
                    Rp{jt(Number(value))}
                  </text>
                ) : null
              }
            />
          </Bar>
        </BarChart>
      </ChartContainer>
      {/* Versi teks grafik untuk pembaca layar. */}
      <figcaption className="sr-only">
        <table>
          <caption>Nilai Nota Faktur terbit per bulan</caption>
          <tbody>
            {data.map((d) => (
              <tr key={d.label}>
                <th scope="row">{d.label}</th>
                <td>Rp{d.nilai.toLocaleString("id-ID")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
    </figure>
  );
}
