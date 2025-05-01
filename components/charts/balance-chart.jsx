"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from "recharts";

export function BalanceChart({ data, title = "Evolución del Balance" }) {
  const [chartData, setChartData] = useState([]);
  
  useEffect(() => {
    if (!data || data.length === 0) return;
    
    // Preparar datos para el gráfico
    const formattedData = data.map((item, index) => ({
      name: item.timestamp ? new Date(item.timestamp).toLocaleDateString() : `Operación ${index + 1}`,
      balance: item.cumulativePL || item.balance,
    }));
    
    setChartData(formattedData);
  }, [data]);
  
  if (!data || data.length === 0) {
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
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  if (typeof value === 'string' && value.length > 10) {
                    return value.substring(0, 10) + '...';
                  }
                  return value;
                }}
              />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`${value.toFixed(2)}$`, 'Balance']}
                labelFormatter={(label) => `Fecha: ${label}`}
              />
              <ReferenceLine y={0} stroke="#000" />
              <Line 
                type="monotone" 
                dataKey="balance" 
                stroke="#8884d8" 
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}