"use client";

import { useState, useEffect, useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "next-themes";

// Componente de gráfico de balance moderno
export function ModernBalanceChart({ data, title, description }) {
  const { theme, systemTheme } = useTheme();
  const [chartData, setChartData] = useState([]);
  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  // Colores adaptados al tema
  const colors = useMemo(() => ({
    primary: isDark ? "#c4b5fd" : "#8b5cf6", // Violeta más claro en modo oscuro
    primaryLight: isDark ? "rgba(196, 181, 253, 0.2)" : "rgba(139, 92, 246, 0.2)",
    success: isDark ? "#86efac" : "#22c55e", // Verde más brillante en modo oscuro
    successLight: isDark ? "rgba(134, 239, 172, 0.2)" : "rgba(34, 197, 94, 0.2)",
    danger: isDark ? "#fca5a5" : "#ef4444", // Rojo más suave en modo oscuro
    dangerLight: isDark ? "rgba(252, 165, 165, 0.2)" : "rgba(239, 68, 68, 0.2)",
    warning: isDark ? "#fde68a" : "#eab308", // Amarillo más suave en modo oscuro
    info: isDark ? "#93c5fd" : "#3b82f6", // Azul más suave en modo oscuro
    background: isDark ? "#09090b" : "#ffffff",
    foreground: isDark ? "#ffffff" : "#09090b",
    muted: isDark ? "#a1a1aa" : "#71717a",
    border: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
    card: isDark ? "#18181b" : "#ffffff",
  }), [isDark]);

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

  // Formateadores
  const formatters = {
    currency: (value) => `$${parseFloat(value).toFixed(2)}`,
    date: (date) => {
      if (date instanceof Date) {
        return date.toLocaleDateString();
      }
      return new Date(date).toLocaleDateString();
    },
    percent: (value) => `${(value * 100).toFixed(1)}%`,
    number: (value) => value.toLocaleString(),
  };

  if (chartData.length === 0) {
    return (
      <Card className="w-full h-full border border-border/40 bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-2">
          {title && <CardTitle className="text-sm font-medium">{title}</CardTitle>}
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <p className="text-muted-foreground">No hay datos suficientes para mostrar el gráfico</p>
        </CardContent>
      </Card>
    );
  }

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card/90 backdrop-blur-md border border-border/50 rounded-lg p-3 shadow-lg text-sm">
          <p className="font-medium mb-1">{formatters.date(label)}</p>
          <p className="text-primary mb-1 font-semibold">Balance: {formatters.currency(data.value)}</p>
          {data.symbol && <p className="mb-1">Símbolo: {data.symbol}</p>}
          {data.type && <p className="mb-1">Operación: {data.type}</p>}
          {data.profit !== undefined && (
            <p className={`font-semibold ${data.profit >= 0 ? "text-green-500" : "text-red-500"}`}>
              Beneficio: {formatters.currency(data.profit)}
            </p>
          )}
          {data.ticket && <p className="text-xs text-muted-foreground mt-1">Ticket: {data.ticket}</p>}
          {data.accountNumber && <p className="text-xs text-muted-foreground">Cuenta: {data.accountNumber}</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full h-full border border-border/40 bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-2">
        {title && <CardTitle className="text-sm font-medium">{title}</CardTitle>}
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[300px] w-full px-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 20,
              }}
            >
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.primary} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={colors.primary} stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} opacity={0.2} />
              <XAxis
                dataKey="date"
                tickFormatter={formatters.date}
                tick={{ fontSize: 12, fill: colors.muted, fontWeight: 500 }}
                stroke={colors.border}
                tickLine={{ stroke: colors.border }}
                axisLine={{ stroke: colors.border }}
                dy={5}
                tickCount={5}
              />
              <YAxis
                tickFormatter={formatters.currency}
                tick={{ fontSize: 12, fill: colors.muted, fontWeight: 500 }}
                width={70}
                stroke={colors.border}
                tickLine={{ stroke: colors.border }}
                axisLine={{ stroke: colors.border }}
                dx={-5}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={colors.primary}
                strokeWidth={2}
                fill="url(#colorBalance)"
                isAnimationActive={true}
                animationDuration={1000}
                dot={false}
                activeDot={{ r: 6, fill: colors.primary, stroke: colors.background, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente de gráfico de rendimiento por símbolo moderno
export function ModernPerformanceChart({ data, title, description }) {
  const { theme, systemTheme } = useTheme();
  const [chartData, setChartData] = useState([]);
  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  // Colores adaptados al tema
  const colors = useMemo(() => ({
    primary: isDark ? "#c4b5fd" : "#8b5cf6", // Violeta más claro en modo oscuro
    primaryLight: isDark ? "rgba(196, 181, 253, 0.2)" : "rgba(139, 92, 246, 0.2)",
    success: isDark ? "#86efac" : "#22c55e", // Verde más brillante en modo oscuro
    successLight: isDark ? "rgba(134, 239, 172, 0.2)" : "rgba(34, 197, 94, 0.2)",
    danger: isDark ? "#fca5a5" : "#ef4444", // Rojo más suave en modo oscuro
    dangerLight: isDark ? "rgba(252, 165, 165, 0.2)" : "rgba(239, 68, 68, 0.2)",
    warning: isDark ? "#fde68a" : "#eab308", // Amarillo más suave en modo oscuro
    info: isDark ? "#93c5fd" : "#3b82f6", // Azul más suave en modo oscuro
    background: isDark ? "#09090b" : "#ffffff",
    foreground: isDark ? "#ffffff" : "#09090b",
    muted: isDark ? "#a1a1aa" : "#71717a",
    border: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
    card: isDark ? "#18181b" : "#ffffff",
  }), [isDark]);

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
  
  // Formateadores
  const formatters = {
    currency: (value) => `$${parseFloat(value).toFixed(2)}`,
    date: (date) => {
      if (date instanceof Date) {
        return date.toLocaleDateString();
      }
      return new Date(date).toLocaleDateString();
    },
    percent: (value) => `${(value * 100).toFixed(1)}%`,
    number: (value) => value.toLocaleString(),
  };

  if (!data || !chartData || chartData.length === 0) {
    return (
      <Card className="w-full h-full border border-border/40 bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-2">
          {title && <CardTitle className="text-sm font-medium">{title}</CardTitle>}
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <p className="text-muted-foreground">No hay datos suficientes para mostrar el gráfico</p>
        </CardContent>
      </Card>
    );
  }

  // Función para generar colores basados en el valor de profit
  const getBarColor = (profit, index) => {
    // Colores más vibrantes para barras positivas
    const positiveColors = [
      "#10b981", // Esmeralda
      "#06b6d4", // Cyan
      "#3b82f6", // Azul
      "#8b5cf6", // Violeta
      "#d946ef"  // Fucsia
    ];
    
    // Colores más vibrantes para barras negativas
    const negativeColors = [
      "#f43f5e", // Rosa
      "#ef4444", // Rojo
      "#f97316", // Naranja
      "#eab308", // Ámbar
      "#facc15"  // Amarillo
    ];
    
    if (profit > 0) {
      return positiveColors[index % positiveColors.length];
    } else {
      return negativeColors[index % negativeColors.length];
    }
  };

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card/90 backdrop-blur-md border border-border/50 rounded-lg p-3 shadow-lg text-sm">
          <p className="font-medium mb-1">Símbolo: {label}</p>
          <p className={`font-semibold ${data.profit >= 0 ? "text-green-500" : "text-red-500"}`}>
            Beneficio: {formatters.currency(data.profit)}
          </p>
          {data.count !== undefined && (
            <p className="text-xs text-muted-foreground mt-1">
              Operaciones: {data.count}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full h-full border border-border/40 bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-2">
        {title && <CardTitle className="text-sm font-medium">{title}</CardTitle>}
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent className="p-0 h-[300px]">
        <div className="h-full w-full px-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 40,
              }}
              barSize={18}
              barGap={6}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} opacity={0.2} horizontal={true} vertical={false} />
              <XAxis 
                type="number"
                tickFormatter={formatters.currency}
                tick={{ fontSize: 12, fill: colors.muted, fontWeight: 500 }}
                stroke={colors.border}
                tickLine={{ stroke: colors.border }}
                axisLine={{ stroke: colors.border }}
                domain={['dataMin', 'dataMax']}
                allowDecimals={false}
                tickCount={5}
                dy={5}
              />
              <YAxis 
                dataKey="name"
                type="category"
                tick={{ fontSize: 12, fill: colors.muted, fontWeight: 500 }}
                width={80}
                stroke={colors.border}
                tickLine={{ stroke: colors.border }}
                axisLine={{ stroke: colors.border }}
                tickFormatter={(value) => {
                  if (typeof value === 'string' && value.length > 6) {
                    return value.substring(0, 6) + '...';
                  }
                  return value;
                }}
                dx={-5}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="profit" 
                name="Beneficio"
                radius={[0, 4, 4, 0]}
                animationDuration={1000}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getBarColor(entry.profit, index)}
                    fillOpacity={0.8}
                    stroke={getBarColor(entry.profit, index)}
                    strokeWidth={1}
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

// Componente de gráfico de proporción ganadoras/perdedoras moderno
export function ModernWinLossChart({ data, title, description }) {
  const { theme, systemTheme } = useTheme();
  const [chartData, setChartData] = useState([]);
  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  // Colores adaptados al tema
  const colors = useMemo(() => ({
    primary: isDark ? "#c4b5fd" : "#8b5cf6", // Violeta más claro en modo oscuro
    primaryLight: isDark ? "rgba(196, 181, 253, 0.2)" : "rgba(139, 92, 246, 0.2)",
    success: isDark ? "#86efac" : "#22c55e", // Verde más brillante en modo oscuro
    successLight: isDark ? "rgba(134, 239, 172, 0.2)" : "rgba(34, 197, 94, 0.2)",
    danger: isDark ? "#fca5a5" : "#ef4444", // Rojo más suave en modo oscuro
    dangerLight: isDark ? "rgba(252, 165, 165, 0.2)" : "rgba(239, 68, 68, 0.2)",
    warning: isDark ? "#fde68a" : "#eab308", // Amarillo más suave en modo oscuro
    info: isDark ? "#93c5fd" : "#3b82f6", // Azul más suave en modo oscuro
    background: isDark ? "#09090b" : "#ffffff",
    foreground: isDark ? "#ffffff" : "#09090b",
    muted: isDark ? "#a1a1aa" : "#71717a",
    border: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
    card: isDark ? "#18181b" : "#ffffff",
  }), [isDark]);

  // Colores personalizados para el gráfico de pastel
  const pieColors = useMemo(() => [
    isDark ? "#4ade80" : "#22c55e", // Verde
    isDark ? "#f87171" : "#ef4444"  // Rojo
  ], [isDark]);

  useEffect(() => {
    let processedData = [];
    
    if (Array.isArray(data)) {
      const winCount = data.filter(item => item.profit > 0).length;
      const lossCount = data.filter(item => item.profit <= 0).length;
      processedData = [
        { name: 'Ganadas', value: winCount },
        { name: 'Perdidas', value: lossCount },
      ];
    } else if (data && typeof data === 'object') {
      processedData = [
        { name: 'Ganadas', value: data.winCount || 0 },
        { name: 'Perdidas', value: data.lossCount || 0 },
      ];
    }
    
    setChartData(processedData);
  }, [data]);

  // Verificar si hay datos suficientes para mostrar el gráfico
  if (!chartData || chartData.length === 0 || (chartData[0] && chartData[1] && chartData[0].value === 0 && chartData[1].value === 0)) {
    return (
      <Card className="w-full h-full border border-border/40 bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-2">
          {title && <CardTitle className="text-sm font-medium">{title}</CardTitle>}
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <p className="text-muted-foreground">No hay datos suficientes para mostrar el gráfico</p>
        </CardContent>
      </Card>
    );
  }

  const totalOperations = chartData[0].value + chartData[1].value;
  const winRate = totalOperations > 0 
    ? ((chartData[0].value / totalOperations) * 100).toFixed(1) 
    : 0;

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.7;
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
        fontSize={14}
        stroke={colors.background}
        strokeWidth={0.5}
        paintOrder="stroke"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card/90 backdrop-blur-md border border-border/50 rounded-lg p-3 shadow-lg text-sm">
          <p className="font-medium mb-1">{data.name}</p>
          <p className={`font-semibold ${data.name === 'Ganadas' ? "text-green-500" : "text-red-500"}`}>
            {data.value} operaciones ({(data.value / totalOperations * 100).toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full h-full border border-border/40 bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-2">
        {title && <CardTitle className="text-sm font-medium">{title}</CardTitle>}
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent className="p-0 h-[300px]">
        <div className="h-full w-full flex flex-col items-center justify-center">
          <div className="w-full h-[220px] flex items-center justify-center">
            <ResponsiveContainer width="80%" height="100%">
              <PieChart
                margin={{
                  top: 20,
                  right: 20,
                  left: 20,
                  bottom: 20,
                }}
              >
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={70}
                  innerRadius={35}
                  fill="#8884d8"
                  dataKey="value"
                  animationDuration={1000}
                  strokeWidth={1}
                  stroke={colors.background}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={pieColors[index % pieColors.length]} 
                      fillOpacity={0.9}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex items-center justify-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: pieColors[0] }}></div>
              <span className="text-sm font-medium">Ganadas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: pieColors[1] }}></div>
              <span className="text-sm font-medium">Perdidas</span>
            </div>
          </div>
          
          <div className="text-center bg-card/60 backdrop-blur-sm px-4 py-1 rounded-full border border-border/40 shadow-sm mt-2">
            <p className="text-sm font-medium">
              Win rate: <span className="font-bold text-primary">{winRate}%</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
