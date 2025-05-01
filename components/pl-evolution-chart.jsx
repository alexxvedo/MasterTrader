"use client";

import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

export function PLEvolutionChart({ data }) {
  // Si no hay datos, mostrar mensaje
  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-muted-foreground">
        No hay datos suficientes para mostrar la evolución
      </div>
    );
  }

  // Formatear fecha para el tooltip
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Formatear fecha para el eje X
  const formatXAxis = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  // Personalizar tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-3 rounded-md shadow-md">
          <p className="font-medium">{formatDate(label)}</p>
          <p className="text-green-500">
            P/L Acumulado: {payload[0].value.toFixed(2)}$
          </p>
          <p className={payload[1].value >= 0 ? "text-green-500" : "text-red-500"}>
            P/L Operación: {payload[1].value.toFixed(2)}$
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={formatXAxis} 
            tick={{ fontSize: 12 }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="cumulativePL"
            name="P/L Acumulado"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="pl"
            name="P/L Operación"
            stroke="#6366f1"
            strokeWidth={1}
            dot={{ r: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
