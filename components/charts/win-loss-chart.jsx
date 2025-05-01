"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";

export function WinLossChart({ winCount, lossCount, title = "Proporción Ganadas/Perdidas" }) {
  const data = [
    { name: 'Ganadas', value: winCount || 0, color: '#4ade80' },
    { name: 'Perdidas', value: lossCount || 0, color: '#f87171' },
  ];
  
  const COLORS = ['#4ade80', '#f87171'];
  
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };
  
  if (!winCount && !lossCount) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No hay datos suficientes para mostrar el gráfico</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`${value} operaciones`, '']}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex justify-center gap-8">
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">Total Operaciones</p>
            <p className="text-2xl font-bold">{winCount + lossCount}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
            <p className="text-2xl font-bold">
              {winCount + lossCount > 0 
                ? `${((winCount / (winCount + lossCount)) * 100).toFixed(1)}%` 
                : '0%'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}