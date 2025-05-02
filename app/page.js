"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccounts } from "@/lib/accounts-context";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Zap,
  Briefcase,
  Wifi,
  WifiOff,
  AlertTriangle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ModernBalanceChart,
  ModernWinLossChart,
  ModernPerformanceChart,
} from "@/components/ui/modern-charts";

export default function Home() {
  const {
    accounts,
    localAccounts,
    localEAs,
    wsConnected,
    wsError,
    createAccount,
  } = useAccounts();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [accountToSave, setAccountToSave] = useState(null);
  const [accountName, setAccountName] = useState("");
  const [brokerName, setBrokerName] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);

  // Simular carga inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Abrir diálogo para guardar cuenta
  const openSaveDialog = (accountNumber, accountData) => {
    setAccountToSave({ accountNumber, data: accountData });
    setAccountName(`Cuenta ${accountNumber}`);
    setBrokerName("Broker Desconocido");
    setSaveDialogOpen(true);
  };

  // Guardar cuenta
  const handleSaveAccount = async () => {
    if (!accountToSave) return;

    try {
      const accountData = {
        id: accountToSave.accountNumber, // Usar el número de cuenta como ID
        name: accountName,
        broker: brokerName,
        accountNumber: accountToSave.accountNumber,
        createdAt: new Date().toISOString(),
        savedManually: true, // Marcar como guardada manualmente
      };

      console.log("Guardando cuenta con datos:", accountData);

      // Verificar si la cuenta ya existe en localAccounts
      const existingAccountIndex = localAccounts.findIndex(
        (acc) => acc.accountNumber === accountToSave.accountNumber
      );

      if (existingAccountIndex >= 0) {
        console.log("La cuenta ya existe, actualizando datos");
        // Actualizar la cuenta existente conservando createdAt original
        const updatedAccounts = [...localAccounts];
        updatedAccounts[existingAccountIndex] = {
          ...accountData,
          createdAt: localAccounts[existingAccountIndex].createdAt, // Mantener la fecha original
        };
        // Guardar directamente en localStorage para evitar problemas de sincronización
        localStorage.setItem(
          "mastertrader_accounts",
          JSON.stringify(updatedAccounts)
        );
        // Actualizar el estado
        createAccount(accountData);
      } else {
        console.log("Creando nueva cuenta");
        await createAccount(accountData);
      }

      // Forzar actualización de la interfaz
      setTimeout(() => {
        setSaveDialogOpen(false);
        setAccountToSave(null);
        setAccountName("");
        setBrokerName("");
      }, 100);
    } catch (error) {
      console.error("Error al guardar cuenta:", error);
      alert("Error al guardar la cuenta. Inténtelo de nuevo.");
    }
  };

  // Calcular estadísticas globales
  const globalStats = useMemo(() => {
    let totalBalance = 0;
    let totalEquity = 0;
    let totalProfit = 0;
    let totalPositions = 0;
    let winningPositions = 0;
    let losingPositions = 0;
    let symbolStats = {};
    let balanceHistory = [];
    let totalMargin = 0;

    // Procesar todas las cuentas conectadas
    Object.values(accounts).forEach((account) => {
      if (account.balance) totalBalance += account.balance;
      if (account.equity) totalEquity += account.equity;
      if (account.info?.margin) totalMargin += account.info.margin;

      // Procesar posiciones abiertas
      if (account.positions) {
        totalPositions += account.positions.length;

        account.positions.forEach((position) => {
          if (position.profit > 0) winningPositions++;
          if (position.profit < 0) losingPositions++;
          totalProfit += position.profit;

          // Estadísticas por símbolo
          const symbol = position.symbol;
          if (!symbolStats[symbol]) {
            symbolStats[symbol] = {
              count: 0,
              profit: 0,
              winning: 0,
              losing: 0,
            };
          }

          symbolStats[symbol].count++;
          symbolStats[symbol].profit += position.profit;

          if (position.profit > 0) symbolStats[symbol].winning++;
          if (position.profit < 0) symbolStats[symbol].losing++;
        });
      }

      // Procesar historial para gráfico de balance
      if (account.deals && account.deals.length > 0) {
        // Ordenar operaciones por fecha (de más antiguo a más reciente)
        const sortedDeals = [...account.deals].sort((a, b) => {
          try {
            // Asegurarse de que las fechas sean válidas
            const timeA =
              typeof a.time === "number" ? a.time : parseInt(a.time);
            const timeB =
              typeof b.time === "number" ? b.time : parseInt(b.time);

            const dateA = new Date(timeA * 1000);
            const dateB = new Date(timeB * 1000);

            if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
              return 0;
            }

            return dateA - dateB;
          } catch (error) {
            console.error("Error al ordenar fechas:", error);
            return 0;
          }
        });

        // Calcular balance acumulativo
        let runningBalance = 0;

        // Si no hay operaciones, no añadir puntos
        if (sortedDeals.length > 0) {
          // Añadir punto inicial
          const initialTime = sortedDeals[0].time;
          const initialDate = new Date(
            typeof initialTime === "number"
              ? initialTime * 1000
              : parseInt(initialTime) * 1000
          );

          // Verificar que la fecha inicial sea válida
          const validInitialDate = !isNaN(initialDate.getTime())
            ? initialDate
            : new Date();

          balanceHistory.push({
            date: validInitialDate,
            balance: runningBalance,
            accountNumber: account.accountNumber || "unknown",
          });

          // Calcular balance para cada operación cerrada
          sortedDeals.forEach((deal) => {
            if (deal.profit !== undefined) {
              runningBalance += parseFloat(deal.profit);

              // Crear y validar la fecha
              let dealTime = deal.time;
              let dealDate;

              try {
                dealTime =
                  typeof dealTime === "number" ? dealTime : parseInt(dealTime);
                dealDate = new Date(dealTime * 1000);

                if (isNaN(dealDate.getTime())) {
                  dealDate = new Date(); // Usar fecha actual como fallback
                }
              } catch (error) {
                console.error("Error al procesar fecha de operación:", error);
                dealDate = new Date(); // Usar fecha actual como fallback
              }

              balanceHistory.push({
                date: dealDate,
                balance: runningBalance,
                ticket: deal.ticket,
                symbol: deal.symbol,
                type: deal.side,
                profit: deal.profit,
                accountNumber: account.accountNumber || "unknown",
              });
            }
          });
        }
      }
    });

    // Ordenar historial por fecha
    balanceHistory.sort((a, b) => a.date - b.date);

    return {
      totalBalance,
      totalEquity,
      totalProfit,
      totalPositions,
      winningPositions,
      losingPositions,
      symbolStats,
      balanceHistory,
      totalMargin,
    };
  }, [accounts]);

  // Calcular cuentas conectadas vs guardadas
  const accountStats = useMemo(() => {
    const connectedAccounts = Object.keys(accounts).length;
    const savedAccounts = localAccounts.length;
    const unsavedAccounts = Object.keys(accounts).filter(
      (accNum) =>
        !localAccounts.some((localAcc) => localAcc.accountNumber === accNum)
    ).length;

    return {
      connectedAccounts,
      savedAccounts,
      unsavedAccounts,
    };
  }, [accounts, localAccounts]);

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6">
      {/* Estado de conexión */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitoreo en tiempo real de sus cuentas y operaciones
          </p>
        </div>

        <div className="flex items-center gap-2">
          {wsConnected ? (
            <Badge
              variant="success"
              className="px-3 py-1 flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>WebSocket Conectado</span>
            </Badge>
          ) : (
            <Badge
              variant="destructive"
              className="px-3 py-1 flex items-center gap-2"
            >
              <AlertCircle className="h-4 w-4" />
              <span>WebSocket Desconectado</span>
            </Badge>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>
        </div>
      </div>

      {wsError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Error de conexión WebSocket: {wsError}.
            {!wsConnected && " Usando datos simulados para desarrollo."}
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs de navegación */}
      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="accounts">Cuentas</TabsTrigger>
          <TabsTrigger value="statistics">Estadísticas</TabsTrigger>
        </TabsList>

        {/* Tab: Vista General */}
        <TabsContent value="overview" className="space-y-4">
          {/* Tarjetas de estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Balance Total
                </CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <div className="text-2xl font-bold">
                    {globalStats.totalBalance.toFixed(2)}$
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Equity: {globalStats.totalEquity.toFixed(2)}$
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">P/L Total</CardTitle>
                {globalStats.totalProfit >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <div
                    className={`text-2xl font-bold ${
                      globalStats.totalProfit >= 0
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {globalStats.totalProfit.toFixed(2)}$
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  De {globalStats.totalPositions} posiciones abiertas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Cuentas</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <div className="text-2xl font-bold">
                    {accountStats.connectedAccounts}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {accountStats.savedAccounts} guardadas,{" "}
                  {accountStats.unsavedAccounts} sin guardar
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  EAs Activos
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <div className="text-2xl font-bold">{localEAs.length}</div>
                )}
                <p className="text-xs text-muted-foreground">
                  {Object.keys(globalStats.symbolStats).length} símbolos
                  operados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Margen en Uso
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <div className="text-2xl font-bold">
                    {globalStats.totalMargin.toFixed(2)}$
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Nivel de margen:{" "}
                  {globalStats.totalMargin > 0
                    ? (
                        (globalStats.totalBalance / globalStats.totalMargin) *
                        100
                      ).toFixed(2)
                    : "∞"}
                  %
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Operaciones Abiertas
                </CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <div className="text-2xl font-bold">
                    {globalStats.totalPositions}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {globalStats.winningPositions} ganando,{" "}
                  {globalStats.losingPositions} perdiendo
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Gráfico de balance */}
            <div className="h-auto">
              <ModernBalanceChart
                data={globalStats.balanceHistory}
                title="Evolución del Balance"
                description={`${globalStats.balanceHistory.length} operaciones procesadas`}
              />
            </div>

            {/* Gráfico de proporción ganadoras/perdedoras */}
            <div className="h-auto">
              <ModernWinLossChart
                data={{
                  winCount: globalStats.winningPositions,
                  lossCount: globalStats.losingPositions,
                }}
                title="Proporción Ganadas/Perdidas"
                description={`${globalStats.totalPositions} operaciones cerradas`}
              />
            </div>
          </div>

          {/* Gráfico de rendimiento por símbolo */}
          <div className="h-auto mb-6">
            <ModernPerformanceChart
              data={globalStats.symbolStats}
              title="Rendimiento por Símbolo"
              description="Top 3 símbolos"
            />
          </div>
        </TabsContent>

        {/* Tab: Cuentas */}
        <TabsContent value="accounts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Cuentas guardadas */}
            {localAccounts.map((account) => (
              <Link
                key={account.id}
                href={`/accounts/${account.accountNumber}`}
              >
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle>{account.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {account.broker} - #{account.accountNumber}
                    </p>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    ) : accounts[account.accountNumber] ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Balance:</span>
                          <span className="font-bold">
                            {accounts[account.accountNumber].balance?.toFixed(
                              2
                            ) || "0.00"}
                            $
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">P/L:</span>
                          <span
                            className={`font-bold ${
                              accounts[account.accountNumber].equity -
                                accounts[account.accountNumber].balance >=
                              0
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                          >
                            {(
                              (accounts[account.accountNumber].equity || 0) -
                              (accounts[account.accountNumber].balance || 0)
                            ).toFixed(2)}
                            $
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">
                            Posiciones:
                          </span>
                          <span>
                            {accounts[account.accountNumber].positions
                              ?.length || 0}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <p>Cuenta no conectada</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}

            {/* Cuentas conectadas pero no guardadas */}
            {Object.entries(accounts)
              .filter(
                ([accNum]) =>
                  !localAccounts.some(
                    (localAcc) => localAcc.accountNumber === accNum
                  )
              )
              .map(([accountNumber, accountData]) => (
                <Card key={accountNumber} className="h-full border-dashed">
                  <CardHeader className="pb-2">
                    <CardTitle>Cuenta {accountNumber}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Cuenta no guardada
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Balance:</span>
                        <span className="font-bold">
                          {accountData.balance?.toFixed(2) || "0.00"}$
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">P/L:</span>
                        <span
                          className={`font-bold ${
                            accountData.equity - accountData.balance >= 0
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {(
                            (accountData.equity || 0) -
                            (accountData.balance || 0)
                          ).toFixed(2)}
                          $
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Posiciones:</span>
                        <span>{accountData.positions?.length || 0}</span>
                      </div>

                      <Button
                        className="w-full mt-2"
                        onClick={(e) => {
                          e.preventDefault();
                          openSaveDialog(accountNumber, accountData);
                        }}
                      >
                        Guardar Cuenta
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

            {/* Mensaje si no hay cuentas */}
            {localAccounts.length === 0 &&
              Object.keys(accounts).length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  <Wallet className="mx-auto h-12 w-12 opacity-20" />
                  <p className="mt-2">No hay cuentas conectadas</p>
                </div>
              )}
          </div>
        </TabsContent>

        {/* Tab: Estadísticas */}
        <TabsContent value="statistics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {isLoading ? (
              <>
                <Skeleton className="h-[300px] w-full" />
                <Skeleton className="h-[300px] w-full" />
              </>
            ) : (
              <>
                <div className="h-auto">
                  <ModernBalanceChart
                    data={globalStats.balanceHistory}
                    title="Evolución del P/L"
                    description={
                      globalStats.balanceHistory.length > 0
                        ? `${globalStats.balanceHistory.length} operaciones procesadas`
                        : undefined
                    }
                  />
                </div>
                <div className="h-auto">
                  <ModernWinLossChart
                    data={{
                      winCount: globalStats.winningPositions,
                      lossCount: globalStats.losingPositions,
                    }}
                    title="Operaciones Ganadoras vs Perdedoras"
                    description={`${globalStats.totalPositions} operaciones abiertas`}
                  />
                </div>
              </>
            )}
          </div>

          {/* Gráfico de rendimiento por símbolo */}
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <div className="h-auto">
              <ModernPerformanceChart
                data={globalStats.symbolStats}
                title="Rendimiento por Símbolo"
                description={`Top ${
                  Object.keys(globalStats.symbolStats).length > 10
                    ? 10
                    : Object.keys(globalStats.symbolStats).length
                } símbolos`}
              />
            </div>
          )}

          {/* Tabla de EAs */}
          <Card>
            <CardHeader>
              <CardTitle>Expert Advisors</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : localEAs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Nombre</th>
                        <th className="text-left py-3 px-4">Magic</th>
                        <th className="text-left py-3 px-4">Cuenta</th>
                        <th className="text-right py-3 px-4">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {localEAs.map((ea) => {
                        const account = localAccounts.find(
                          (acc) => acc.id.toString() === ea.accountId.toString()
                        );
                        return (
                          <tr
                            key={ea.id}
                            className="border-b hover:bg-muted/50"
                          >
                            <td className="py-3 px-4 font-medium">{ea.name}</td>
                            <td className="py-3 px-4">{ea.magic}</td>
                            <td className="py-3 px-4">
                              {account
                                ? account.name
                                : `Cuenta ${ea.accountId}`}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Link
                                href={`/eas/${encodeURIComponent(ea.name)}`}
                              >
                                <Button variant="ghost" size="sm">
                                  Ver Detalles
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="mx-auto h-12 w-12 opacity-20" />
                  <p className="mt-2">No hay EAs configurados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo para guardar cuenta */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guardar Cuenta</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="account-number" className="text-right">
                Número
              </Label>
              <Input
                id="account-number"
                value={accountToSave?.accountNumber || ""}
                className="col-span-3"
                readOnly
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <Input
                id="name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="broker" className="text-right">
                Broker
              </Label>
              <Input
                id="broker"
                value={brokerName}
                onChange={(e) => setBrokerName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAccount}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
