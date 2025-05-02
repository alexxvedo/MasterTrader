"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAccounts } from "@/lib/accounts-context";
import {
  AccountService,
  EAService,
  OperationService,
} from "@/lib/trading-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  DollarSign,
  Percent,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreateEAForm } from "@/components/create-ea-form";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import {
  ModernBalanceChart,
  ModernWinLossChart,
  ModernPerformanceChart,
} from "@/components/ui/modern-charts";

export default function AccountDetail() {
  const params = useParams();
  const accountNumber = params.id;
  const {
    accounts,
    localAccounts,
    localEAs,
    getAccountEAs,
    deleteAccount,
    deleteEA,
  } = useAccounts();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [positions, setPositions] = useState([]);
  const [history, setHistory] = useState([]);
  const itemsPerPage = 10;
  const [showCreateEAForm, setShowCreateEAForm] = useState(false);
  const [deleteAccountDialog, setDeleteAccountDialog] = useState(false);
  const [deleteEADialog, setDeleteEADialog] = useState(false);
  const [eaToDelete, setEaToDelete] = useState(null);
  const [accountEAs, setAccountEAs] = useState([]);
  const [accountData, setAccountData] = useState(null);

  useEffect(() => {
    async function fetchAccountDetails() {
      try {
        // Buscar la cuenta por número de cuenta en lugar de por ID
        const accountData = localAccounts.find(
          (acc) => acc.accountNumber === accountNumber
        );
        setAccountData(accountData);

        if (accountData) {
          // Cargar EAs asociados a esta cuenta usando el número de cuenta
          const accountEAs = getAccountEAs(accountData.accountNumber);
          setAccountEAs(accountEAs);
          console.log("EAs cargados:", accountEAs);
        }
      } catch (error) {
        console.error("Error al cargar detalles de la cuenta:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAccountDetails();
  }, [accountNumber, localAccounts, getAccountEAs]);

  // Obtener datos en tiempo real del WebSocket
  const liveData = accounts[accountNumber] || {
    positions: [],
    deals: [],
    balance: 0,
    equity: 0,
    margin: 0,
    freeMargin: 0,
    marginLevel: 0,
  };

  // Acceder directamente a las propiedades del objeto liveData
  const balance = liveData.balance || 0;
  const equity = liveData.equity || 0;
  const margin = liveData.margin || 0;
  const freeMargin = liveData.freeMargin || 0;
  const marginLevel = liveData.marginLevel || 0;

  // Función para extraer el nombre del EA del comentario
  const extractEAName = (comment) => {
    if (!comment) return null;

    // Patrones para detectar nombres de EA en los comentarios
    const eaPatterns = [
      /EA:\s*([a-zA-Z0-9_\s]+)/i,
      /\[([a-zA-Z0-9_\s]+)\]/,
      /(Compra|Venta) con SL, TP y ([a-zA-Z0-9_\s]+)/i,
      /(Compra|Venta) con ([a-zA-Z0-9_\s]+)/i,
    ];

    for (const pattern of eaPatterns) {
      const match = comment.match(pattern);
      if (match && match[1]) {
        // Si el patrón tiene dos grupos de captura y el segundo es el EA
        if (
          match[2] &&
          (pattern.toString().includes("SL, TP") ||
            pattern.toString().includes("con ("))
        ) {
          return match[2].trim();
        }
        return match[1].trim();
      }
    }

    // Si no se encuentra un patrón específico pero contiene "MACD"
    if (comment.includes("MACD")) {
      return "MACD";
    }

    return null;
  };

  // Función para procesar los deals del WebSocket
  const processDeals = (deals) => {
    if (!deals || !Array.isArray(deals)) return [];

    // Crear un mapa de magic numbers a nombres de EA para búsqueda rápida
    const eaMagicMap = {};
    if (accountEAs && accountEAs.length > 0) {
      accountEAs.forEach((ea) => {
        // Asegurarse de que el magic number se almacene como string para comparaciones consistentes
        eaMagicMap[ea.magic.toString()] = ea.name;
      });
    }

    console.log("EA Magic Map:", eaMagicMap);

    return deals.map((deal) => {
      // Determinar si es un mensaje del nuevo formato (con positionId, price_open, etc.)
      const isNewFormat = deal.hasOwnProperty("positionId");

      let magic = 0;
      let eaName = "Manual";

      if (isNewFormat) {
        // Obtener el magic number de la operación
        magic = deal.magic || 0;

        // Buscar si el magic number coincide con alguna EA registrada
        // Ahora comprobamos todos los magic numbers, incluido el 0
        const matchedEAName = eaMagicMap[magic.toString()];
        if (matchedEAName) {
          eaName = matchedEAName;
        } else if (magic !== 0) {
          // Solo si no es 0 y no coincide con ninguna EA, intentamos extraer del comentario
          const extractedName = extractEAName(deal.comment);
          eaName = extractedName || "EA Desconocida";
        }
        // Si es 0 y no hay EA registrada con magic 0, se queda como "Manual"

        // Determinar correctamente si es compra o venta
        // En el nuevo formato, LONG es compra y SHORT es venta
        const side = deal.side === "SHORT" ? "Venta" : "Compra";

        // Nuevo formato
        return {
          ticket: deal.positionId,
          symbol: deal.symbol,
          side: side,
          volume: deal.volume,
          entryPrice: deal.price_open,
          exitPrice: deal.price_close,
          entryTime: deal.time_open,
          exitTime: deal.time_close,
          profit: deal.profit,
          completed: true,
          comment: deal.comment || "",
          magic: magic,
          eaName: eaName,
        };
      } else {
        // Formato anterior
        const isEntry = deal.side === "IN";

        // En el formato anterior, intentar obtener el magic number si está disponible
        magic = deal.magic || 0;

        // Buscar si el magic number coincide con alguna EA registrada
        // Ahora comprobamos todos los magic numbers, incluido el 0
        const matchedEAName = eaMagicMap[magic.toString()];
        if (matchedEAName) {
          eaName = matchedEAName;
        }

        // Determinar correctamente si es compra o venta
        // En el formato anterior, necesitamos verificar el tipo real de operación
        // Asumimos que es compra a menos que se indique explícitamente como venta
        const side = deal.type === "SELL" ? "Venta" : "Compra";

        return {
          ticket: deal.ticket,
          symbol: deal.symbol,
          side: side,
          volume: deal.volume,
          entryPrice: deal.price,
          exitPrice: 0,
          entryTime: deal.time,
          exitTime: 0,
          profit: deal.profit,
          completed: !isEntry,
          comment: "",
          magic: magic,
          eaName: eaName,
        };
      }
    });
  };

  // Procesar operaciones para combinar entradas y salidas
  const processedDeals = useMemo(() => {
    if (!history || history.length === 0) return [];

    return processDeals(history);
  }, [history, accountEAs]);

  // Calcular PnL
  const pnl = useMemo(() => {
    if (accountData?.operations && accountData.operations.length > 0) {
      return accountData.operations.reduce((acc, op) => acc + op.profitLoss, 0);
    }
    return processedDeals.reduce((acc, deal) => acc + deal.profit, 0);
  }, [accountData, processedDeals]);

  // Cargar EAs de la cuenta
  const loadEAs = useCallback(async () => {
    try {
      if (accountData) {
        // Usar el número de cuenta como ID
        const accountNumber = accountData.accountNumber;
        console.log("Cargando EAs para la cuenta:", accountNumber);

        // Obtener EAs por el número de cuenta
        const accountEAs = getAccountEAs(accountNumber);
        console.log("EAs encontrados:", accountEAs);

        setAccountEAs(accountEAs);
      }
    } catch (error) {
      console.error("Error al cargar EAs:", error);
    }
  }, [getAccountEAs, accountData]);

  // Manejar la creación de un nuevo EA
  const handleEACreated = useCallback(
    async (newEA) => {
      console.log("Nuevo EA creado, actualizando lista:", newEA);
      await loadEAs();
    },
    [loadEAs]
  );

  // Manejar la eliminación de la cuenta
  const handleDeleteAccount = () => {
    if (accountData) {
      deleteAccount(accountData.id);
      setDeleteAccountDialog(false);
      // Redirigir al usuario a la página principal
      window.location.href = "/";
    }
  };

  // Manejar la eliminación de un EA
  const openDeleteEADialog = (ea) => {
    setEaToDelete(ea);
    setDeleteEADialog(true);
  };

  const handleDeleteEA = () => {
    if (eaToDelete) {
      deleteEA(eaToDelete.id);
      setDeleteEADialog(false);
      setEaToDelete(null);
    }
  };

  // Efecto para cargar datos iniciales
  useEffect(() => {
    async function fetchAccountDetails() {
      try {
        // Buscar la cuenta por número de cuenta en lugar de por ID
        const accountData = localAccounts.find(
          (acc) => acc.accountNumber === accountNumber
        );
        setAccountData(accountData);

        if (accountData) {
          // Cargar EAs asociados a esta cuenta usando el número de cuenta
          const accountEAs = getAccountEAs(accountData.accountNumber);
          setAccountEAs(accountEAs);
          console.log("EAs cargados:", accountEAs);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error al cargar detalles de la cuenta:", error);
        setLoading(false);
      }
    }

    if (accountNumber) {
      fetchAccountDetails();
    }
  }, [accountNumber, localAccounts, getAccountEAs]);

  // Efecto para recargar EAs cuando cambian
  useEffect(() => {
    if (accountData) {
      loadEAs();
    }
  }, [accountData, loadEAs, localEAs]);

  // Efecto para actualizar los datos en tiempo real
  useEffect(() => {
    if (params.id && accounts[params.id]) {
      const liveData = accounts[params.id];

      // Actualizar posiciones
      if (liveData.positions) {
        setPositions(liveData.positions);
      }

      // Actualizar historial
      if (liveData.deals) {
        setHistory(liveData.deals);
      }
    }
  }, [params.id, accounts]);

  // Calcular estadísticas de drawdown
  const calculateDrawdown = () => {
    if (!accountData?.operations || accountData.operations.length === 0)
      return { maxDrawdown: 0, currentDrawdown: 0 };

    // Ordenar operaciones por fecha
    const sortedOps = [...accountData.operations].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    let peak = 0;
    let maxDrawdown = 0;
    let currentBalance = 0;

    sortedOps.forEach((op) => {
      currentBalance += op.profitLoss;

      if (currentBalance > peak) {
        peak = currentBalance;
      }

      const drawdown = peak - currentBalance;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });

    const currentDrawdown = peak - currentBalance;

    return {
      maxDrawdown,
      currentDrawdown,
    };
  };

  const { maxDrawdown, currentDrawdown } = calculateDrawdown();

  // Calcular páginas para la paginación
  const totalOperations = accountData?.operations?.length || 0;
  const calculatedTotalPages = Math.ceil(totalOperations / itemsPerPage);

  // Obtener operaciones para la página actual
  const paginatedOperations =
    accountData?.operations
      ?.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      ?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) ||
    [];

  // Formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Calcular estadísticas para las EAs basadas en el historial de operaciones
  const eaStats = useMemo(() => {
    if (
      !accountEAs ||
      accountEAs.length === 0 ||
      !history ||
      history.length === 0
    ) {
      return {};
    }

    // Crear un objeto para almacenar estadísticas por magic number
    const statsByMagic = {};

    // Inicializar estadísticas para cada EA
    accountEAs.forEach((ea) => {
      statsByMagic[ea.magic] = {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        totalProfit: 0,
        successRate: 0,
      };
    });

    // Calcular estadísticas basadas en el historial
    history.forEach((deal) => {
      const magic = deal.magic || 0;

      // Si tenemos una EA con este magic number
      if (statsByMagic[magic]) {
        statsByMagic[magic].totalTrades++;

        // Determinar si es una operación ganadora o perdedora
        if (deal.profit > 0) {
          statsByMagic[magic].winningTrades++;
          statsByMagic[magic].totalProfit += deal.profit;
        } else if (deal.profit < 0) {
          statsByMagic[magic].losingTrades++;
          statsByMagic[magic].totalProfit += deal.profit;
        }

        // Calcular porcentaje de acierto
        if (statsByMagic[magic].totalTrades > 0) {
          statsByMagic[magic].successRate =
            (statsByMagic[magic].winningTrades /
              statsByMagic[magic].totalTrades) *
            100;
        }
      }
    });

    return statsByMagic;
  }, [accountEAs, history]);

  // Preparar datos para gráficos
  const chartData = useMemo(() => {
    if (!accountData || !history || history.length === 0) {
      return {
        balanceData: [],
        winLossData: { wins: 0, losses: 0 },
        performanceData: [],
      };
    }

    // Datos para el gráfico de balance
    const balanceData = [];

    // Comenzar con balance inicial (no restar las ganancias actuales)
    // Ya que solo queremos mostrar el historial, no las posiciones abiertas
    let runningBalance = 0; // Comenzar desde cero y acumular ganancias/pérdidas

    // Ordenar el historial por fecha (de más antiguo a más reciente)
    const sortedHistory = [...history].sort((a, b) => {
      try {
        // Asegurarse de que las fechas sean válidas
        const dateA = new Date(a.time);
        const dateB = new Date(b.time);

        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
          console.log("Fecha inválida detectada:", a.time, b.time);
          return 0;
        }

        return dateA - dateB;
      } catch (error) {
        console.error("Error al ordenar fechas:", error);
        return 0;
      }
    });

    console.log("Historial ordenado:", sortedHistory.length, "operaciones");

    // Si no hay operaciones, mostrar una línea plana con varios puntos
    if (sortedHistory.length === 0) {
      const today = new Date();

      // Generar 5 puntos en los últimos 5 días para mostrar un gráfico más representativo
      for (let i = 4; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        balanceData.push({
          date: date,
          balance: 0,
        });
      }
    } else {
      // Añadir punto inicial con fecha válida
      const initialDate = new Date(sortedHistory[0].time);

      // Verificar que la fecha inicial sea válida
      const validInitialDate = !isNaN(initialDate.getTime())
        ? initialDate
        : new Date();

      balanceData.push({
        date: validInitialDate,
        balance: runningBalance,
      });

      // Calcular balance para cada operación cerrada
      sortedHistory.forEach((deal) => {
        if (deal.profit !== undefined) {
          runningBalance += parseFloat(deal.profit);

          // Crear y validar la fecha
          let dealDate;
          try {
            dealDate = new Date(deal.time);
            if (isNaN(dealDate.getTime())) {
              console.log("Fecha inválida en operación:", deal.time);
              dealDate = new Date(); // Usar fecha actual como fallback
            }
          } catch (error) {
            console.error("Error al procesar fecha de operación:", error);
            dealDate = new Date(); // Usar fecha actual como fallback
          }

          balanceData.push({
            date: dealDate,
            balance: runningBalance,
            ticket: deal.ticket,
            symbol: deal.symbol,
            type: deal.side,
            profit: deal.profit,
          });
        }
      });
    }

    console.log("Datos de balance generados:", balanceData.length, "puntos");

    // Datos para el gráfico de ganadoras/perdedoras
    const winLossData = {
      wins: history.filter((deal) => deal.profit > 0).length,
      losses: history.filter((deal) => deal.profit < 0).length,
    };

    // Datos para el gráfico de rendimiento por símbolo
    const symbolPerformance = {};
    history.forEach((deal) => {
      if (!symbolPerformance[deal.symbol]) {
        symbolPerformance[deal.symbol] = 0;
      }
      symbolPerformance[deal.symbol] += deal.profit;
    });

    const performanceData = Object.entries(symbolPerformance)
      .map(([symbol, profit]) => ({
        symbol,
        profit,
      }))
      .sort((a, b) => b.profit - a.profit);

    return {
      balanceData,
      winLossData,
      performanceData,
    };
  }, [accountData, history]);

  // Calcular estadísticas adicionales
  const additionalStats = useMemo(() => {
    if (!history || history.length === 0) {
      return {
        totalTrades: 0,
        winRate: 0,
        averageWin: 0,
        averageLoss: 0,
        profitFactor: 0,
        largestWin: 0,
        largestLoss: 0,
        averageTradeDuration: 0,
        consecutiveWins: 0,
        consecutiveLosses: 0,
      };
    }

    const wins = history.filter((deal) => deal.profit > 0);
    const losses = history.filter((deal) => deal.profit < 0);

    const totalWins = wins.reduce((sum, deal) => sum + deal.profit, 0);
    const totalLosses = Math.abs(
      losses.reduce((sum, deal) => sum + deal.profit, 0)
    );

    // Encontrar rachas consecutivas
    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;
    let currentWins = 0;
    let currentLosses = 0;

    // Ordenar por tiempo
    const sortedDeals = [...history].sort(
      (a, b) => new Date(a.time) - new Date(b.time)
    );

    sortedDeals.forEach((deal) => {
      if (deal.profit > 0) {
        currentWins++;
        currentLosses = 0;
        maxConsecutiveWins = Math.max(maxConsecutiveWins, currentWins);
      } else if (deal.profit < 0) {
        currentLosses++;
        currentWins = 0;
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLosses);
      }
    });

    // Calcular duración promedio de operaciones (si hay timestamps disponibles)
    let avgDuration = 0;
    try {
      const dealsWithDuration = history.filter(
        (deal) => deal.time_close && deal.time
      );
      if (dealsWithDuration.length > 0) {
        const totalDuration = dealsWithDuration.reduce((sum, deal) => {
          const openTime = new Date(deal.time);
          const closeTime = new Date(deal.time_close);
          return sum + (closeTime - openTime);
        }, 0);
        avgDuration =
          totalDuration / dealsWithDuration.length / (1000 * 60 * 60); // en horas
      }
    } catch (error) {
      console.error("Error calculando duración promedio:", error);
    }

    return {
      totalTrades: history.length,
      winRate: (wins.length / history.length) * 100,
      averageWin: wins.length > 0 ? totalWins / wins.length : 0,
      averageLoss: losses.length > 0 ? totalLosses / losses.length : 0,
      profitFactor:
        totalLosses > 0
          ? totalWins / totalLosses
          : totalWins > 0
          ? Infinity
          : 0,
      largestWin:
        wins.length > 0 ? Math.max(...wins.map((deal) => deal.profit)) : 0,
      largestLoss:
        losses.length > 0 ? Math.min(...losses.map((deal) => deal.profit)) : 0,
      averageTradeDuration: avgDuration,
      consecutiveWins: maxConsecutiveWins,
      consecutiveLosses: maxConsecutiveLosses,
    };
  }, [history]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col p-8 gap-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
        </div>
        <hr className="w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!accountData) {
    return (
      <div className="flex-1 flex flex-col p-8 gap-4">
        <div className="text-2xl font-bold">
          <h1>Cuenta no encontrada</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6 space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {accountData ? accountData.name : `Cuenta ${accountNumber}`}
          </h1>
          <p className="text-muted-foreground">
            {accountData
              ? `${accountData.broker} - #${accountData.accountNumber}`
              : "Cargando..."}
          </p>
        </div>

        {accountData && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateEAForm(true)}
            >
              Crear EA
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteAccountDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Dejar de guardar
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="positions">Posiciones Abiertas</TabsTrigger>
          <TabsTrigger value="history">Historial de Operaciones</TabsTrigger>
          <TabsTrigger value="eas">EAs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Resumen de la cuenta */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen de la Cuenta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Balance
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {balance ? `${balance.toFixed(2)}$` : "Cargando..."}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      P/L Actual
                    </CardTitle>
                    {equity > balance ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : equity < balance ? (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    ) : (
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    )}
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold ${
                        equity > balance
                          ? "text-green-500"
                          : equity < balance
                          ? "text-red-500"
                          : ""
                      }`}
                    >
                      {equity && balance
                        ? `${(equity - balance).toFixed(2)}$`
                        : "Cargando..."}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Margen en Uso
                    </CardTitle>
                    <Percent className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {margin ? `${margin.toFixed(2)}$` : "Cargando..."}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Margen Libre
                    </CardTitle>
                    <Percent className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {freeMargin ? `${freeMargin.toFixed(2)}$` : "Cargando..."}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Nivel de Margen
                    </CardTitle>
                    <Percent className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {marginLevel
                        ? `${marginLevel.toFixed(2)}%`
                        : "Cargando..."}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Drawdown Máximo
                    </CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-500">
                      {`${maxDrawdown.toFixed(2)}$`}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Gráficos */}
          <div className="space-y-4">
            {/* Gráfico de balance */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Evolución del Balance</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-[300px]">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : (
                  <div className="h-auto">
                    <ModernBalanceChart
                      data={chartData.balanceData}
                      title="Evolución del Balance"
                      description={`${chartData.balanceData.length} operaciones procesadas`}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 col-span-3">
              {/* Gráfico de operaciones ganadoras/perdedoras */}
              <Card>
                <CardHeader>
                  <CardTitle>Proporción Ganadas/Perdidas</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-[350px]">
                      <Skeleton className="h-full w-full" />
                    </div>
                  ) : (
                    <div className="h-auto">
                      <ModernWinLossChart
                        data={chartData.winLossData}
                        title="Proporción Ganadas/Perdidas"
                        description={`${chartData.winLossData.length} operaciones cerradas`}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Gráfico de rendimiento por símbolo */}
              <Card>
                <CardHeader>
                  <CardTitle>Rendimiento por Símbolo</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-[350px]">
                      <Skeleton className="h-full w-full" />
                    </div>
                  ) : (
                    <div className="h-auto">
                      <ModernPerformanceChart
                        data={chartData.performanceData}
                        title="Rendimiento por Símbolo"
                        description={`Top ${Math.min(
                          chartData.performanceData.length,
                          10
                        )} símbolos`}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Estadísticas adicionales */}
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas de Trading</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col p-4 border rounded-lg">
                  <span className="text-sm text-muted-foreground">
                    Operaciones Totales
                  </span>
                  <span className="text-2xl font-bold">
                    {additionalStats.totalTrades}
                  </span>
                </div>

                <div className="flex flex-col p-4 border rounded-lg">
                  <span className="text-sm text-muted-foreground">
                    Porcentaje de Acierto
                  </span>
                  <span className="text-2xl font-bold">
                    {additionalStats.winRate.toFixed(1)}%
                  </span>
                </div>

                <div className="flex flex-col p-4 border rounded-lg">
                  <span className="text-sm text-muted-foreground">
                    Ganancia Media
                  </span>
                  <span className="text-2xl font-bold text-green-500">
                    ${additionalStats.averageWin.toFixed(2)}
                  </span>
                </div>

                <div className="flex flex-col p-4 border rounded-lg">
                  <span className="text-sm text-muted-foreground">
                    Pérdida Media
                  </span>
                  <span className="text-2xl font-bold text-red-500">
                    ${additionalStats.averageLoss.toFixed(2)}
                  </span>
                </div>

                <div className="flex flex-col p-4 border rounded-lg">
                  <span className="text-sm text-muted-foreground">
                    Factor de Beneficio
                  </span>
                  <span className="text-2xl font-bold">
                    {additionalStats.profitFactor.toFixed(2)}
                  </span>
                </div>

                <div className="flex flex-col p-4 border rounded-lg">
                  <span className="text-sm text-muted-foreground">
                    Mayor Ganancia
                  </span>
                  <span className="text-2xl font-bold text-green-500">
                    ${additionalStats.largestWin.toFixed(2)}
                  </span>
                </div>

                <div className="flex flex-col p-4 border rounded-lg">
                  <span className="text-sm text-muted-foreground">
                    Mayor Pérdida
                  </span>
                  <span className="text-2xl font-bold text-red-500">
                    ${Math.abs(additionalStats.largestLoss).toFixed(2)}
                  </span>
                </div>

                <div className="flex flex-col p-4 border rounded-lg">
                  <span className="text-sm text-muted-foreground">
                    Duración Media
                  </span>
                  <span className="text-2xl font-bold">
                    {additionalStats.averageTradeDuration.toFixed(1)} h
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="positions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Posiciones Abiertas ({positions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {positions.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  No hay posiciones abiertas
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Fecha</th>

                        <th className="text-left py-3 px-4">Símbolo</th>
                        <th className="text-left py-3 px-4">Tipo</th>
                        <th className="text-left py-3 px-4">Volumen</th>
                        <th className="text-left py-3 px-4">Precio Apertura</th>
                        <th className="text-left py-3 px-4">Magic</th>

                        <th className="text-right py-3 px-4">P/L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {positions.map((position, index) => (
                        <tr
                          key={`pos-${position.ticket || position.id || index}`}
                          className="border-b hover:bg-muted/50"
                        >
                          <td className="py-3 px-4">
                            {position.time ? (
                              <span className="block font-medium">
                                {new Date(position.time * 1000).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                                {', '}
                                {new Date(position.time * 1000).toLocaleTimeString('es-ES', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                  hour12: false
                                })}
                              </span>
                            ) : (
                              "Fecha no disponible"
                            )}
                          </td>
                          <td className="py-3 px-4">{position.symbol}</td>
                          <td className="py-3 px-4">
                            {position.side === "BUY" || position.side === "LONG" ? (
                              <Badge className="bg-green-500">Compra</Badge>
                            ) : (
                              <Badge className="bg-red-500">Venta</Badge>
                            )}
                          </td>
                          <td className="py-3 px-4">{position.volume}</td>
                          <td className="py-3 px-4">
                            {parseFloat(position.open_price || position.price_open).toFixed(5)}
                          </td>
                          <td className="py-3 px-4">{position.magic}</td>

                          <td
                            className={`py-3 px-4 text-right font-medium ${
                              parseFloat(position.profit) >= 0
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                          >
                            {parseFloat(position.profit) > 0 ? "+" : ""}
                            {parseFloat(position.profit).toFixed(2)}$
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                Historial de Operaciones ({totalOperations})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {totalOperations === 0 && history.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  No hay operaciones en el historial
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Símbolo</TableHead>
                          <TableHead>Volumen</TableHead>
                          <TableHead>Precio</TableHead>
                          <TableHead>P/L</TableHead>
                          <TableHead>EA</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Mostrar primero las operaciones de la base de datos */}
                        {paginatedOperations.map((operation) => (
                          <TableRow key={`db-${operation.id}`}>
                            <TableCell>
                              {formatDate(operation.timestamp)}
                            </TableCell>
                            <TableCell>
                              {operation.type === "buy" ? "Compra" : "Venta"}
                            </TableCell>
                            <TableCell>{operation.symbol}</TableCell>
                            <TableCell>{operation.volume}</TableCell>
                            <TableCell>{operation.price}</TableCell>
                            <TableCell
                              className={
                                operation.profitLoss >= 0
                                  ? "text-green-500"
                                  : "text-red-500"
                              }
                            >
                              {operation.profitLoss.toFixed(2)}$
                            </TableCell>
                            <TableCell>{operation.eaName || "-"}</TableCell>
                          </TableRow>
                        ))}

                        {/* Mostrar las operaciones del WebSocket si no hay operaciones en la base de datos */}
                        {paginatedOperations.length === 0 &&
                          processedDeals.slice(0, 20).map((deal, index) => (
                            <TableRow key={`ws-${deal.ticket || index}`}>
                              <TableCell>
                                {formatDate(new Date(deal.entryTime * 1000))}
                                {deal.completed && (
                                  <div className="text-xs text-muted-foreground">
                                    Cerrada:{" "}
                                    {formatDate(new Date(deal.exitTime * 1000))}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                {deal.side === "Compra" ? (
                                  <Badge className="bg-green-500">Compra</Badge>
                                ) : (
                                  <Badge className="bg-red-500">Venta</Badge>
                                )}
                              </TableCell>
                              <TableCell>{deal.symbol}</TableCell>
                              <TableCell>{deal.volume.toFixed(2)}</TableCell>
                              <TableCell>
                                {deal.entryPrice.toFixed(5)}
                                {deal.completed && (
                                  <div className="text-xs text-muted-foreground">
                                    → {deal.exitPrice.toFixed(5)}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell
                                className={
                                  deal.profit >= 0
                                    ? "text-green-500"
                                    : "text-red-500"
                                }
                              >
                                {deal.profit.toFixed(2)}$
                              </TableCell>
                              <TableCell>{deal.eaName || "-"}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>

                  {calculatedTotalPages > 1 && (
                    <Pagination className="mt-4">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() =>
                              setCurrentPage((prev) => Math.max(prev - 1, 1))
                            }
                            disabled={currentPage === 1}
                          />
                        </PaginationItem>

                        {Array.from(
                          { length: Math.min(5, calculatedTotalPages) },
                          (_, i) => {
                            const pageNumber =
                              currentPage <= 3
                                ? i + 1
                                : currentPage >= calculatedTotalPages - 2
                                ? calculatedTotalPages - 4 + i
                                : currentPage - 2 + i;

                            if (
                              pageNumber <= 0 ||
                              pageNumber > calculatedTotalPages
                            )
                              return null;

                            return (
                              <PaginationItem key={pageNumber}>
                                <PaginationLink
                                  isActive={currentPage === pageNumber}
                                  onClick={() => setCurrentPage(pageNumber)}
                                >
                                  {pageNumber}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          }
                        )}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              setCurrentPage((prev) =>
                                Math.min(prev + 1, calculatedTotalPages)
                              )
                            }
                            disabled={currentPage === calculatedTotalPages}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eas" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Expert Advisors</CardTitle>
              <CreateEAForm
                accountId={accountData?.id || ""}
                onSuccess={() => {
                  setShowCreateEAForm(false);
                  loadEAs();
                }}
              />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : accountEAs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Nombre</th>
                        <th className="text-left py-3 px-4">Magic</th>
                        <th className="text-left py-3 px-4">P/L</th>
                        <th className="text-right py-3 px-4">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accountEAs.map((ea) => {
                        // Calcular P/L para este EA
                        const eaMagic = parseInt(ea.magic);
                        console.log(
                          `Calculando P/L para EA: ${ea.name}, Magic: ${eaMagic}`
                        );

                        // Obtener posiciones del WebSocket (datos en tiempo real)
                        const livePositions =
                          accounts[accountNumber]?.positions || [];
                        const eaPositions = livePositions.filter(
                          (pos) => parseInt(pos.magic || 0) === eaMagic
                        );

                        // Obtener operaciones históricas del WebSocket
                        const liveDeals = accounts[accountNumber]?.deals || [];
                        const eaDeals = liveDeals.filter(
                          (deal) => parseInt(deal.magic || 0) === eaMagic
                        );

                        console.log(
                          `EA ${ea.name}: ${eaPositions.length} posiciones, ${eaDeals.length} operaciones históricas`
                        );

                        // Calcular P/L total (operaciones cerradas + posiciones abiertas)
                        let dealsProfit = 0;
                        let positionsProfit = 0;

                        if (eaDeals.length > 0) {
                          dealsProfit = eaDeals.reduce((sum, deal) => {
                            const profit = parseFloat(deal.profit || 0);
                            return sum + profit;
                          }, 0);
                        }

                        if (eaPositions.length > 0) {
                          positionsProfit = eaPositions.reduce((sum, pos) => {
                            const profit = parseFloat(pos.profit || 0);
                            return sum + profit;
                          }, 0);
                        }

                        const totalPL = dealsProfit + positionsProfit;
                        console.log(
                          `EA ${ea.name} P/L: ${totalPL.toFixed(
                            2
                          )}$ (Deals: ${dealsProfit.toFixed(
                            2
                          )}$, Positions: ${positionsProfit.toFixed(2)}$)`
                        );

                        return (
                          <tr
                            key={ea.id}
                            className="border-b hover:bg-muted/50"
                          >
                            <td className="py-3 px-4 font-medium">
                              <Link
                                href={`/eas/${encodeURIComponent(ea.name)}`}
                                className="hover:underline"
                              >
                                {ea.name}
                              </Link>
                            </td>
                            <td className="py-3 px-4">{ea.magic}</td>
                            <td
                              className={`py-3 px-4 ${
                                totalPL >= 0 ? "text-green-500" : "text-red-500"
                              }`}
                            >
                              {totalPL.toFixed(2)}$
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Link
                                  href={`/eas/${encodeURIComponent(ea.name)}`}
                                >
                                  <Button variant="ghost" size="sm">
                                    Ver Detalles
                                  </Button>
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:bg-destructive/10"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    openDeleteEADialog(ea);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-4">
                    No hay EAs configurados para esta cuenta
                  </p>
                  <CreateEAForm
                    accountId={accountData?.id || ""}
                    onSuccess={() => {
                      setShowCreateEAForm(false);
                      loadEAs();
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo para eliminar cuenta */}
      <Dialog open={deleteAccountDialog} onOpenChange={setDeleteAccountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dejar de guardar cuenta</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea dejar de guardar la cuenta "
              {accountData?.name}"? Esta acción eliminará la cuenta de su lista
              de cuentas guardadas, pero no afectará a la cuenta real. Los
              Expert Advisors asociados a esta cuenta también serán eliminados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteAccountDialog(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para eliminar EA */}
      <Dialog open={deleteEADialog} onOpenChange={setDeleteEADialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Expert Advisor</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea eliminar el EA "{eaToDelete?.name}"?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteEADialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteEA}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
