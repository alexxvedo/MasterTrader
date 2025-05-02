"use client";

import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";

export function WinLossChart({ data, title = "Proporción Ganadas/Perdidas" }) {
  // Si recibimos un array, asumimos que es un array de operaciones
  // Si recibimos winCount y lossCount directamente, los usamos
  let chartData = [];
  
  if (Array.isArray(data)) {
    const winCount = data.filter(item => item.profit > 0).length;
    const lossCount = data.filter(item => item.profit <= 0).length;
    chartData = [
      { name: 'Ganadas', value: winCount, color: '#4ade80' },
      { name: 'Perdidas', value: lossCount, color: '#f87171' },
    ];
  } else if (data && typeof data === 'object') {
    chartData = [
      { name: 'Ganadas', value: data.winCount || 0, color: '#4ade80' },
      { name: 'Perdidas', value: data.lossCount || 0, color: '#f87171' },
    ];
  }
  
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
  
  // Verificar si hay datos suficientes para mostrar el gráfico
  if (!chartData || chartData.length === 0 || (chartData[0] && chartData[1] && chartData[0].value === 0 && chartData[1].value === 0)) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-muted-foreground">No hay datos suficientes para mostrar el gráfico</p>
      </div>
    );
  }
  
  const totalOperations = chartData[0].value + chartData[1].value;
  const winRate = totalOperations > 0 
    ? ((chartData[0].value / totalOperations) * 100).toFixed(1) 
    : 0;
  
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [`${value} operaciones`, '']}
            />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {title && (
        <div className="text-center mt-2">
          <h3 className="text-sm font-medium">{title}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Win rate: {totalOperations > 0 
              ? ((chartData[0].value / totalOperations) * 100).toFixed(1) 
              : 0}%
          </p>
        </div>
      )}
    </div>
  );
}