'use client';

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ChartPoint } from '@/lib/types';
import { formatChartLabel } from '@/lib/utils/format';

export function LineChartCard({
  title,
  data,
  dataKey = 'value',
  secondaryKey,
  height = 260
}: {
  title: string;
  data: ChartPoint[];
  dataKey?: string;
  secondaryKey?: string;
  height?: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.12)" />
              <XAxis
                dataKey="label"
                stroke="rgba(148,163,184,0.7)"
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: string) => formatChartLabel(v)}
              />
              <YAxis stroke="rgba(148,163,184,0.7)" tickLine={false} axisLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey={dataKey} stroke="var(--brand)" strokeWidth={2.5} dot={false} />
              {secondaryKey ? (
                <Line type="monotone" dataKey={secondaryKey} stroke="var(--brand-2)" strokeWidth={2.5} dot={false} />
              ) : null}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
