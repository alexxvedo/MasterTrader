"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";

export function PerformanceChart({ data, title = "Rendimiento por Símbolo" }) {
  const [chartData, setChartData] = useState([]);
  
  useEffect(() => {
    if (!data || Object.keys(data).length === 0) return;
    
    // Preparar datos para el gráfico
    const formattedData = Object.entries(data).map(([symbol, stats]) => ({
      name: symbol,
      profit: stats.profit || 0,
      count: stats.count || 0
    }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 10); // Mostrar solo los 10 mejores
    
    setChartData(formattedData);
  }, [data]);
  
  if (!data || Object.keys(data).length === 0) {
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
            <BarChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  `${value.toFixed(2)}$`, 
                  name === 'profit' ? 'Beneficio' : 'Operaciones'
                ]}
                labelFormatter={(label) => `Símbolo: ${label}`}
              />
              <Bar dataKey="profit" fill="#8884d8" name="Beneficio">
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.profit >= 0 ? '#4ade80' : '#f87171'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}