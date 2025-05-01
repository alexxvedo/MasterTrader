"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useAccounts } from "@/lib/accounts-context";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, ArrowDown, ArrowUp, Bot, Clock, DollarSign, Percent, TrendingDown, TrendingUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BalanceChart } from "@/components/charts/balance-chart";
import { WinLossChart } from "@/components/charts/win-loss-chart";
import { PerformanceChart } from "@/components/charts/performance-chart";

export default function EADetail() {
  const params = useParams();
  const eaName = decodeURIComponent(params.name);
  const { localEAs, localAccounts, deleteEA } = useAccounts();
  const [ea, setEA] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accountsUsingEA, setAccountsUsingEA] = useState([]);
  const [eaDeals, setEADeals] = useState([]);
  const [eaPositions, setEAPositions] = useState([]);
  const [deleteEADialog, setDeleteEADialog] = useState(false);

  // Cargar datos del EA
  useEffect(() => {
    const fetchEADetails = async () => {
      try {
        setLoading(true);
        
        // Buscar el EA por nombre
        const foundEA = localEAs.find(ea => ea.name === eaName);
        setEA(foundEA);
        
        if (foundEA) {
          // Buscar cuentas que usan este EA
          const accounts = localAccounts.filter(acc => {
            const accountEAs = localEAs.filter(ea => ea.accountId === acc.id);
            return accountEAs.some(ea => ea.name === eaName);
          });
          setAccountsUsingEA(accounts);
          
          // Recopilar operaciones y posiciones de este EA
          const magic = parseInt(foundEA.magic);
          let allDeals = [];
          let allPositions = [];
          
          accounts.forEach(account => {
            if (account.deals) {
              const deals = account.deals.filter(deal => parseInt(deal.magic) === magic);
              allDeals = [...allDeals, ...deals];
            }
            
            if (account.positions) {
              const positions = account.positions.filter(pos => parseInt(pos.magic) === magic);
              allPositions = [...allPositions, ...positions];
            }
          });
          
          setEADeals(allDeals);
          setEAPositions(allPositions);
        }
      } catch (error) {
        console.error("Error al cargar detalles del EA:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEADetails();
  }, [eaName, localEAs, localAccounts]);

  // Calcular estadísticas del EA
  const stats = useMemo(() => {
    if (!eaDeals || eaDeals.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        totalProfit: 0,
        averageProfit: 0,
        averageLoss: 0,
        profitFactor: 0,
        largestWin: 0,
        largestLoss: 0,
        averageTradeDuration: 0,
        consecutiveWins: 0,
        consecutiveLosses: 0
      };
    }
    
    const winningTrades = eaDeals.filter(deal => deal.profit > 0);
    const losingTrades = eaDeals.filter(deal => deal.profit < 0);
    
    const totalProfit = eaDeals.reduce((sum, deal) => sum + deal.profit, 0);
    const totalWinnings = winningTrades.reduce((sum, deal) => sum + deal.profit, 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, deal) => sum + deal.profit, 0));
    
    // Encontrar rachas consecutivas
    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;
    let currentWins = 0;
    let currentLosses = 0;
    
    // Ordenar por tiempo
    const sortedDeals = [...eaDeals].sort((a, b) => new Date(a.time) - new Date(b.time));
    
    sortedDeals.forEach(deal => {
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
    
    // Calcular duración promedio de operaciones
    let avgDuration = 0;
    try {
      const dealsWithDuration = eaDeals.filter(deal => deal.time_close && deal.time);
      if (dealsWithDuration.length > 0) {
        const totalDuration = dealsWithDuration.reduce((sum, deal) => {
          const openTime = new Date(deal.time);
          const closeTime = new Date(deal.time_close);
          return sum + (closeTime - openTime);
        }, 0);
        avgDuration = totalDuration / dealsWithDuration.length / (1000 * 60 * 60); // en horas
      }
    } catch (error) {
      console.error("Error calculando duración promedio:", error);
    }
    
    // Calcular ganancia actual de posiciones abiertas
    const currentProfit = eaPositions.reduce((sum, pos) => sum + pos.profit, 0);
    
    return {
      totalTrades: eaDeals.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: (winningTrades.length / eaDeals.length) * 100,
      totalProfit: totalProfit,
      currentProfit: currentProfit,
      totalProfitWithOpen: totalProfit + currentProfit,
      averageProfit: winningTrades.length > 0 ? totalWinnings / winningTrades.length : 0,
      averageLoss: losingTrades.length > 0 ? totalLosses / losingTrades.length : 0,
      profitFactor: totalLosses > 0 ? totalWinnings / totalLosses : totalWinnings > 0 ? Infinity : 0,
      largestWin: winningTrades.length > 0 ? Math.max(...winningTrades.map(deal => deal.profit)) : 0,
      largestLoss: losingTrades.length > 0 ? Math.min(...losingTrades.map(deal => deal.profit)) : 0,
      averageTradeDuration: avgDuration,
      consecutiveWins: maxConsecutiveWins,
      consecutiveLosses: maxConsecutiveLosses,
      openPositions: eaPositions.length
    };
  }, [eaDeals, eaPositions]);

  // Preparar datos para gráficos
  const chartData = useMemo(() => {
    if (!eaDeals || eaDeals.length === 0) {
      return {
        balanceData: [],
        winLossData: { wins: 0, losses: 0 },
        performanceData: []
      };
    }
    
    // Datos para el gráfico de balance
    const balanceData = [];
    let runningBalance = 0;
    
    // Ordenar el historial por fecha (de más antiguo a más reciente)
    const sortedDeals = [...eaDeals].sort((a, b) => {
      const dateA = new Date(a.time);
      const dateB = new Date(b.time);
      return dateA - dateB;
    });
    
    // Añadir punto inicial
    balanceData.push({
      date: sortedDeals.length > 0 ? new Date(sortedDeals[0].time) : new Date(),
      balance: runningBalance
    });
    
    // Calcular balance para cada operación cerrada
    sortedDeals.forEach(deal => {
      if (deal.profit) {
        runningBalance += deal.profit;
        balanceData.push({
          date: new Date(deal.time),
          balance: runningBalance
        });
      }
    });
    
    // Añadir balance actual con las posiciones abiertas
    const currentProfit = eaPositions.reduce((sum, pos) => sum + pos.profit, 0);
    balanceData.push({
      date: new Date(),
      balance: runningBalance + currentProfit
    });
    
    // Datos para el gráfico de ganadoras/perdedoras
    const winLossData = {
      wins: eaDeals.filter(deal => deal.profit > 0).length,
      losses: eaDeals.filter(deal => deal.profit < 0).length
    };
    
    // Datos para el gráfico de rendimiento por símbolo
    const symbolPerformance = {};
    eaDeals.forEach(deal => {
      if (!symbolPerformance[deal.symbol]) {
        symbolPerformance[deal.symbol] = 0;
      }
      symbolPerformance[deal.symbol] += deal.profit;
    });
    
    const performanceData = Object.entries(symbolPerformance).map(([symbol, profit]) => ({
      symbol,
      profit
    })).sort((a, b) => b.profit - a.profit);
    
    return {
      balanceData,
      winLossData,
      performanceData
    };
  }, [eaDeals, eaPositions]);

  // Manejar la eliminación del EA
  const handleDeleteEA = () => {
    if (ea) {
      deleteEA(ea.id);
      setDeleteEADialog(false);
      // Redirigir al usuario a la página de EAs
      window.location.href = "/eas";
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 md:p-8 space-y-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!ea) {
    return (
      <div className="flex-1 p-6 md:p-8 space-y-6">
        <div className="text-2xl font-bold">
          Expert Advisor no encontrado
        </div>
        <p className="text-muted-foreground">
          No se ha encontrado ningún EA con el nombre "{eaName}".
        </p>
        <Button asChild>
          <Link href="/eas">Volver a EAs</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {ea.name}
          </h1>
          <p className="text-muted-foreground">
            Magic Number: {ea.magic}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => setDeleteEADialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar EA
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="positions">Posiciones Abiertas ({eaPositions.length})</TabsTrigger>
          <TabsTrigger value="history">Historial de Operaciones ({eaDeals.length})</TabsTrigger>
          <TabsTrigger value="accounts">Cuentas ({accountsUsingEA.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">P/L Total</CardTitle>
                {stats.totalProfit >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stats.totalProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
                  ${stats.totalProfit.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.openPositions > 0 && `+$${stats.currentProfit.toFixed(2)} en posiciones abiertas`}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Operaciones</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalTrades}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.winningTrades} ganadas / {stats.losingTrades} perdidas
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Porcentaje de Acierto</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.winRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Factor de beneficio: {stats.profitFactor.toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Gráficos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Gráfico de balance */}
            <Card className="col-span-1 md:col-span-2">
              <CardHeader>
                <CardTitle>Evolución del Balance</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                {loading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : (
                  <BalanceChart data={chartData.balanceData} />
                )}
              </CardContent>
            </Card>
            
            {/* Gráfico de operaciones ganadoras/perdedoras */}
            <Card>
              <CardHeader>
                <CardTitle>Operaciones Ganadoras/Perdedoras</CardTitle>
              </CardHeader>
              <CardContent className="h-60">
                {loading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : (
                  <WinLossChart data={chartData.winLossData} />
                )}
              </CardContent>
            </Card>
            
            {/* Gráfico de rendimiento por símbolo */}
            <Card>
              <CardHeader>
                <CardTitle>Rendimiento por Símbolo</CardTitle>
              </CardHeader>
              <CardContent className="h-60">
                {loading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : (
                  <PerformanceChart data={chartData.performanceData.slice(0, 5)} />
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Estadísticas adicionales */}
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas Detalladas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="flex flex-col p-4 border rounded-lg">
                  <span className="text-sm text-muted-foreground">Ganancia Media</span>
                  <span className="text-2xl font-bold text-green-500">${stats.averageProfit.toFixed(2)}</span>
                </div>
                
                <div className="flex flex-col p-4 border rounded-lg">
                  <span className="text-sm text-muted-foreground">Pérdida Media</span>
                  <span className="text-2xl font-bold text-red-500">${stats.averageLoss.toFixed(2)}</span>
                </div>
                
                <div className="flex flex-col p-4 border rounded-lg">
                  <span className="text-sm text-muted-foreground">Mayor Ganancia</span>
                  <span className="text-2xl font-bold text-green-500">${stats.largestWin.toFixed(2)}</span>
                </div>
                
                <div className="flex flex-col p-4 border rounded-lg">
                  <span className="text-sm text-muted-foreground">Mayor Pérdida</span>
                  <span className="text-2xl font-bold text-red-500">${Math.abs(stats.largestLoss).toFixed(2)}</span>
                </div>
                
                <div className="flex flex-col p-4 border rounded-lg">
                  <span className="text-sm text-muted-foreground">Duración Media</span>
                  <span className="text-2xl font-bold">{stats.averageTradeDuration.toFixed(1)} h</span>
                </div>
                
                <div className="flex flex-col p-4 border rounded-lg">
                  <span className="text-sm text-muted-foreground">Rachas Ganadoras</span>
                  <span className="text-2xl font-bold text-green-500">{stats.consecutiveWins}</span>
                </div>
                
                <div className="flex flex-col p-4 border rounded-lg">
                  <span className="text-sm text-muted-foreground">Rachas Perdedoras</span>
                  <span className="text-2xl font-bold text-red-500">{stats.consecutiveLosses}</span>
                </div>
                
                <div className="flex flex-col p-4 border rounded-lg">
                  <span className="text-sm text-muted-foreground">Posiciones Abiertas</span>
                  <span className="text-2xl font-bold">{stats.openPositions}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="positions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Posiciones Abiertas ({eaPositions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {eaPositions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay posiciones abiertas para este EA
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Ticket</th>
                        <th className="text-left py-3 px-4">Símbolo</th>
                        <th className="text-left py-3 px-4">Tipo</th>
                        <th className="text-left py-3 px-4">Volumen</th>
                        <th className="text-left py-3 px-4">Precio Apertura</th>
                        <th className="text-left py-3 px-4">Precio Actual</th>
                        <th className="text-right py-3 px-4">P/L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eaPositions.map((position) => (
                        <tr key={position.ticket} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">{position.ticket}</td>
                          <td className="py-3 px-4">{position.symbol}</td>
                          <td className="py-3 px-4">
                            {position.type === 0 ? (
                              <Badge className="bg-green-500">Compra</Badge>
                            ) : (
                              <Badge className="bg-red-500">Venta</Badge>
                            )}
                          </td>
                          <td className="py-3 px-4">{position.volume}</td>
                          <td className="py-3 px-4">{position.open_price}</td>
                          <td className="py-3 px-4">{position.current_price}</td>
                          <td className={`py-3 px-4 text-right ${position.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {position.profit.toFixed(2)}$
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
              <CardTitle>Historial de Operaciones ({eaDeals.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {eaDeals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay historial de operaciones para este EA
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Ticket</th>
                        <th className="text-left py-3 px-4">Símbolo</th>
                        <th className="text-left py-3 px-4">Tipo</th>
                        <th className="text-left py-3 px-4">Volumen</th>
                        <th className="text-left py-3 px-4">Precio</th>
                        <th className="text-left py-3 px-4">Fecha</th>
                        <th className="text-right py-3 px-4">P/L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...eaDeals]
                        .sort((a, b) => new Date(b.time) - new Date(a.time))
                        .map((deal) => (
                          <tr key={deal.ticket} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4">{deal.ticket}</td>
                            <td className="py-3 px-4">{deal.symbol}</td>
                            <td className="py-3 px-4">
                              {deal.type === 0 ? (
                                <Badge className="bg-green-500">Compra</Badge>
                              ) : (
                                <Badge className="bg-red-500">Venta</Badge>
                              )}
                            </td>
                            <td className="py-3 px-4">{deal.volume}</td>
                            <td className="py-3 px-4">{deal.price}</td>
                            <td className="py-3 px-4">
                              {new Date(deal.time).toLocaleString()}
                            </td>
                            <td className={`py-3 px-4 text-right ${deal.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {deal.profit.toFixed(2)}$
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
        
        <TabsContent value="accounts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cuentas que usan este EA ({accountsUsingEA.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {accountsUsingEA.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay cuentas utilizando este EA
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Cuenta</th>
                        <th className="text-left py-3 px-4">Broker</th>
                        <th className="text-left py-3 px-4">Número</th>
                        <th className="text-right py-3 px-4">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accountsUsingEA.map((account) => (
                        <tr key={account.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{account.name}</td>
                          <td className="py-3 px-4">{account.broker}</td>
                          <td className="py-3 px-4">{account.accountNumber}</td>
                          <td className="py-3 px-4 text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/accounts/${account.accountNumber}`}>
                                Ver Detalles
                              </Link>
                            </Button>
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
      </Tabs>

      {/* Diálogo para eliminar EA */}
      <Dialog open={deleteEADialog} onOpenChange={setDeleteEADialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Expert Advisor</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea eliminar el EA "{ea.name}"? Esta acción no se puede deshacer.
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
