"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function BalanceChart({ data, title = "Evolución del Balance" }) {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (!data || data.length === 0) {
      setChartData([]);
      return;
    }

    // Procesar los datos para el gráfico
    try {
      // Verificar el formato de los datos
      const processedData = data.map((item) => {
        // Si el item ya tiene una propiedad 'date' que es un objeto Date, usarla directamente
        if (item.date instanceof Date) {
          return {
            ...item,
            value: parseFloat(item.balance) || 0,
          };
        }
        
        // Si el item tiene timestamp (formato antiguo)
        if (item.timestamp) {
          const date = new Date(item.timestamp);
          return {
            ...item,
            date: date,
            value: parseFloat(item.cumulativePL) || 0,
          };
        }
        
        // Intentar crear una fecha a partir de time o timestamp
        let date;
        if (item.time) {
          const timeValue = typeof item.time === 'number' ? item.time : parseInt(item.time);
          date = new Date(timeValue * 1000);
        } else {
          date = new Date(item.timestamp || item.date);
        }

        // Verificar que la fecha sea válida
        if (isNaN(date.getTime())) {
          console.warn("Fecha inválida encontrada:", item);
          date = new Date(); // Usar fecha actual como fallback
        }

        return {
          ...item,
          date: date, // Guardar el objeto Date
          value: parseFloat(item.balance || item.cumulativePL || 0),
        };
      })
      .sort((a, b) => {
        // Ordenar por fecha
        return a.date - b.date;
      });

      setChartData(processedData);
    } catch (error) {
      console.error("Error al procesar datos para el gráfico:", error);
      setChartData([]);
    }
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-muted-foreground">No hay datos suficientes para mostrar el gráfico</p>
      </div>
    );
  }

  const formatXAxis = (tickItem) => {
    const date = new Date(tickItem);
    return date.toLocaleDateString();
  };

  const formatCurrency = (value) => {
    return `$${value.toFixed(2)}`;
  };

  const formatTooltipDate = (label) => {
    const date = new Date(label);
    return date.toLocaleDateString();
  };

  const formatDateRange = (startDate, endDate) => {
    const start = startDate.toLocaleDateString();
    const end = endDate.toLocaleDateString();
    return `${start} - ${end}`;
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{
              top: 10,
              right: 10,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              tick={{ fontSize: 10 }}
            />
            <YAxis
              tickFormatter={(value) => formatCurrency(value)}
              tick={{ fontSize: 10 }}
              width={60}
            />
            <Tooltip
              formatter={(value) => [formatCurrency(value), "Balance"]}
              labelFormatter={(label) => formatTooltipDate(label)}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-background border rounded p-2 shadow-md text-sm">
                      <p className="font-medium">Fecha: {formatTooltipDate(label)}</p>
                      <p className="text-primary">Balance: {formatCurrency(data.value)}</p>
                      {data.symbol && <p>Símbolo: {data.symbol}</p>}
                      {data.type && <p>Operación: {data.type}</p>}
                      {data.profit !== undefined && (
                        <p className={`font-semibold ${data.profit >= 0 ? "text-green-500" : "text-red-500"}`}>
                          Beneficio: {formatCurrency(data.profit)}
                        </p>
                      )}
                      {data.ticket && <p>Ticket: {data.ticket}</p>}
                      {data.accountNumber && <p>Cuenta: {data.accountNumber}</p>}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#8884d8"
              fill="url(#colorBalance)"
              isAnimationActive={false}
            />
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {title && (
        <div className="text-center mt-2">
          <h3 className="text-sm font-medium">{title}</h3>
          {chartData.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {formatDateRange(chartData[0].date, chartData[chartData.length - 1].date)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default BalanceChart;
