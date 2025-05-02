"use client";

import { useEffect, useState } from "react";
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
    // Verificar si data es undefined o null
    if (!data) {
      setChartData([]);
      return;
    }
    
    // Si recibimos un array, lo usamos directamente
    if (Array.isArray(data)) {
      if (data.length === 0) {
        setChartData([]);
        return;
      }
      setChartData(data.slice(0, 10));
    } else {
      // Si recibimos un objeto, lo convertimos a array
      // Verificar si el objeto tiene entradas
      if (typeof data !== 'object' || Object.keys(data).length === 0) {
        setChartData([]);
        return;
      }
      
      const formattedData = Object.entries(data).map(([symbol, stats]) => ({
        name: symbol,
        profit: stats && typeof stats.profit === 'number' ? stats.profit : 0,
        count: stats && typeof stats.count === 'number' ? stats.count : 0
      }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10); // Mostrar solo los 10 mejores
      
      setChartData(formattedData);
    }
  }, [data]);
  
  if (!data || !chartData || chartData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-muted-foreground">No hay datos suficientes para mostrar el gráfico</p>
      </div>
    );
  }
  
  const formatCurrency = (value) => {
    return `$${value.toFixed(2)}`;
  };

  // Calcular el valor máximo y mínimo para determinar la escala de colores
  const maxProfit = Math.max(...chartData.map(item => item.profit));
  const minProfit = Math.min(...chartData.map(item => item.profit));
  const absMaxProfit = Math.max(Math.abs(maxProfit), Math.abs(minProfit));
  
  // Función para generar colores basados en el valor de profit
  const getBarColor = (profit) => {
    if (profit > 0) {
      // Escala de verdes para valores positivos
      const intensity = Math.min(1, profit / absMaxProfit);
      return `rgba(74, 222, 128, ${0.3 + intensity * 0.7})`; // Verde con opacidad variable
    } else {
      // Escala de rojos para valores negativos
      const intensity = Math.min(1, Math.abs(profit) / absMaxProfit);
      return `rgba(248, 113, 113, ${0.3 + intensity * 0.7})`; // Rojo con opacidad variable
    }
  };
  
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 5,
              right: 10,
              left: 0,
              bottom: 5,
            }}
            barSize={20}
            barGap={2}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => {
                if (typeof value === 'string' && value.length > 6) {
                  return value.substring(0, 6) + '...';
                }
                return value;
              }}
              axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
              tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
            />
            <YAxis 
              tickFormatter={(value) => formatCurrency(value)}
              tick={{ fontSize: 10 }}
              width={60}
              axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
              tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
            />
            <Tooltip 
              formatter={(value, name) => [
                formatCurrency(value), 
                name === 'profit' ? 'Beneficio' : 'Operaciones'
              ]}
              labelFormatter={(label) => `Símbolo: ${label}`}
              contentStyle={{ 
                backgroundColor: 'rgba(24, 24, 27, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                padding: '8px'
              }}
            />
            <Bar 
              dataKey="profit" 
              name="Beneficio"
              radius={[4, 4, 0, 0]}
              animationDuration={1000}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getBarColor(entry.profit)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {title && (
        <div className="text-center mt-2">
          <h3 className="text-sm font-medium">{title}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Top {chartData.length} símbolos por rendimiento
          </p>
        </div>
      )}
    </div>
  );
}