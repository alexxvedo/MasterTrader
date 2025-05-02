"use client";

import { useAccounts } from "@/lib/accounts-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Trash2, 
  AlertCircle,
  BarChart3,
  FileSpreadsheet,
  Calendar
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

export default function EAsPage() {
  const { localEAs, localAccounts, accounts, deleteEA } = useAccounts();
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eaToDelete, setEaToDelete] = useState(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Primer día del mes actual
    to: new Date()
  });
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Simular carga inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Abrir diálogo de confirmación para eliminar EA
  const openDeleteDialog = (ea) => {
    setEaToDelete(ea);
    setDeleteDialogOpen(true);
  };

  // Eliminar EA
  const handleDeleteEA = () => {
    if (eaToDelete) {
      deleteEA(eaToDelete.id);
      setDeleteDialogOpen(false);
      setEaToDelete(null);
    }
  };

  // Abrir diálogo para generar informe
  const openReportDialog = () => {
    setReportDialogOpen(true);
  };

  // Generar informe de EAs
  const generateEAReport = () => {
    setIsGeneratingReport(true);
    
    try {
      // Obtener todas las operaciones de todas las cuentas
      const allDeals = {};
      
      // Recopilar operaciones de todas las cuentas
      Object.keys(accounts).forEach(accountNumber => {
        const accountDeals = accounts[accountNumber]?.deals || [];
        if (accountDeals.length > 0) {
          allDeals[accountNumber] = accountDeals;
        }
      });
      
      // Crear mapa de magic numbers a EAs
      const magicToEA = {};
      localEAs.forEach(ea => {
        magicToEA[ea.magic.toString()] = ea;
      });
      
      // Procesar operaciones para cada EA
      const eaStats = {};
      
      // Inicializar estadísticas para cada EA
      localEAs.forEach(ea => {
        eaStats[ea.name] = {
          name: ea.name,
          buyWins: 0,
          buyLosses: 0,
          sellWins: 0,
          sellLosses: 0,
          totalWins: 0,
          totalLosses: 0,
          totalTrades: 0,
          profit: 0,
          monthlyStats: {}
        };
      });
      
      // Procesar todas las operaciones
      Object.keys(allDeals).forEach(accountNumber => {
        const deals = allDeals[accountNumber];
        
        deals.forEach(deal => {
          // Verificar si la operación está dentro del rango de fechas seleccionado
          const dealDate = new Date(deal.time_open * 1000 || deal.time * 1000);
          if (dealDate < dateRange.from || dealDate > dateRange.to) {
            return; // Omitir operaciones fuera del rango de fechas
          }
          
          // Obtener magic number y verificar si pertenece a alguna EA
          const magic = (deal.magic || 0).toString();
          const ea = magicToEA[magic];
          
          if (!ea) return; // Omitir operaciones que no pertenecen a ninguna EA
          
          // Determinar si es compra o venta
          const isBuy = deal.side === "LONG" || deal.side === "BUY" || (deal.side !== "SHORT" && deal.side !== "SELL");
          
          // Determinar si es ganancia o pérdida
          const isWin = deal.profit > 0;
          
          // Obtener el mes y año de la operación para estadísticas mensuales
          const month = dealDate.getMonth();
          const year = dealDate.getFullYear();
          const monthKey = `${year}-${month + 1}`;
          
          // Inicializar estadísticas mensuales si no existen
          if (!eaStats[ea.name].monthlyStats[monthKey]) {
            eaStats[ea.name].monthlyStats[monthKey] = {
              month: monthKey,
              buyWins: 0,
              buyLosses: 0,
              sellWins: 0,
              sellLosses: 0,
              totalWins: 0,
              totalLosses: 0,
              totalTrades: 0,
              profit: 0
            };
          }
          
          // Actualizar estadísticas globales
          if (isBuy) {
            if (isWin) {
              eaStats[ea.name].buyWins++;
              eaStats[ea.name].monthlyStats[monthKey].buyWins++;
            } else {
              eaStats[ea.name].buyLosses++;
              eaStats[ea.name].monthlyStats[monthKey].buyLosses++;
            }
          } else {
            if (isWin) {
              eaStats[ea.name].sellWins++;
              eaStats[ea.name].monthlyStats[monthKey].sellWins++;
            } else {
              eaStats[ea.name].sellLosses++;
              eaStats[ea.name].monthlyStats[monthKey].sellLosses++;
            }
          }
          
          if (isWin) {
            eaStats[ea.name].totalWins++;
            eaStats[ea.name].monthlyStats[monthKey].totalWins++;
          } else {
            eaStats[ea.name].totalLosses++;
            eaStats[ea.name].monthlyStats[monthKey].totalLosses++;
          }
          
          eaStats[ea.name].totalTrades++;
          eaStats[ea.name].profit += deal.profit;
          
          eaStats[ea.name].monthlyStats[monthKey].totalTrades++;
          eaStats[ea.name].monthlyStats[monthKey].profit += deal.profit;
        });
      });
      
      // Convertir a formato para exportar a Excel
      const eaReportData = Object.values(eaStats);
      
      // Generar datos para el informe mensual
      const monthlyReportData = [];
      
      // Obtener todos los meses únicos
      const allMonths = new Set();
      eaReportData.forEach(ea => {
        Object.keys(ea.monthlyStats).forEach(month => {
          allMonths.add(month);
        });
      });
      
      // Ordenar meses cronológicamente
      const sortedMonths = Array.from(allMonths).sort();
      
      // Generar datos mensuales
      sortedMonths.forEach(month => {
        const monthData = {
          month: format(new Date(month.split('-')[0], month.split('-')[1] - 1, 1), 'MMMM yyyy', { locale: es }),
          eas: []
        };
        
        eaReportData.forEach(ea => {
          if (ea.monthlyStats[month]) {
            monthData.eas.push({
              name: ea.name,
              ...ea.monthlyStats[month]
            });
          }
        });
        
        monthlyReportData.push(monthData);
      });
      
      // Exportar a Excel
      exportToExcel(eaReportData, monthlyReportData);
      
      setIsGeneratingReport(false);
      setReportDialogOpen(false);
    } catch (error) {
      console.error("Error al generar informe:", error);
      setIsGeneratingReport(false);
    }
  };
  
  // Función para exportar datos a Excel
  const exportToExcel = (eaData, monthlyData) => {
    // Importar dinámicamente xlsx para evitar problemas con SSR
    import('xlsx').then(XLSX => {
      // Crear libro de Excel
      const wb = XLSX.utils.book_new();
      
      // Crear hoja para el resumen general
      const summaryData = eaData.map(ea => ({
        'Nombre': ea.name,
        'Operaciones Compra Ganadas': ea.buyWins,
        'Operaciones Compra Perdidas': ea.buyLosses,
        'Operaciones Venta Ganadas': ea.sellWins,
        'Operaciones Venta Perdidas': ea.sellLosses,
        'Operaciones Totales Ganadas': ea.totalWins,
        'Operaciones Totales Perdidas': ea.totalLosses,
        'Operaciones Totales': ea.totalTrades,
        'Profit Final': ea.profit.toFixed(2) + '$'
      }));
      
      const summaryWs = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen General');
      
      // Crear hojas para cada mes
      monthlyData.forEach(month => {
        const monthData = month.eas.map(ea => ({
          'Nombre': ea.name,
          'Operaciones Compra Ganadas': ea.buyWins,
          'Operaciones Compra Perdidas': ea.buyLosses,
          'Operaciones Venta Ganadas': ea.sellWins,
          'Operaciones Venta Perdidas': ea.sellLosses,
          'Operaciones Totales Ganadas': ea.totalWins,
          'Operaciones Totales Perdidas': ea.totalLosses,
          'Operaciones Totales': ea.totalTrades,
          'Profit Final': ea.profit.toFixed(2) + '$'
        }));
        
        const monthWs = XLSX.utils.json_to_sheet(monthData);
        XLSX.utils.book_append_sheet(wb, monthWs, month.month);
      });
      
      // Generar archivo y descargarlo
      const dateRangeStr = `${format(dateRange.from, 'yyyyMMdd')}_${format(dateRange.to, 'yyyyMMdd')}`;
      XLSX.writeFile(wb, `Informe_EAs_${dateRangeStr}.xlsx`);
    }).catch(error => {
      console.error("Error al cargar la librería xlsx:", error);
      alert("Error al generar el archivo Excel. Por favor, inténtelo de nuevo.");
    });
  };

  // Calcular estadísticas para cada EA
  const easWithStats = useMemo(() => {
    return localEAs.map(ea => {
      // Encontrar la cuenta asociada
      const account = localAccounts.find(acc => acc.id.toString() === ea.accountId.toString());
      const accountNumber = account?.accountNumber;
      
      // Datos en tiempo real de la cuenta
      const liveAccountData = accountNumber ? accounts[accountNumber] : null;
      
      // Estadísticas por defecto
      let stats = {
        totalPL: 0,
        winCount: 0,
        lossCount: 0,
        winRate: 0,
        averageWin: 0,
        averageLoss: 0,
        openPositions: 0,
        isActive: false
      };
      
      if (liveAccountData) {
        // Filtrar operaciones por magic number
        const eaMagic = parseInt(ea.magic);
        
        // Contar posiciones abiertas
        const openPositions = liveAccountData.positions?.filter(
          pos => parseInt(pos.magic) === eaMagic
        ) || [];
        
        // Analizar historial de operaciones
        const eaDeals = liveAccountData.deals?.filter(
          deal => parseInt(deal.magic) === eaMagic
        ) || [];
        
        // Calcular estadísticas
        let totalWinAmount = 0;
        let totalLossAmount = 0;
        
        eaDeals.forEach(deal => {
          if (deal.profit > 0) {
            stats.winCount++;
            totalWinAmount += deal.profit;
          } else if (deal.profit < 0) {
            stats.lossCount++;
            totalLossAmount += deal.profit;
          }
        });
        
        // Calcular P/L total (historial + posiciones abiertas)
        stats.totalPL = eaDeals.reduce((sum, deal) => sum + deal.profit, 0) + 
                        openPositions.reduce((sum, pos) => sum + pos.profit, 0);
        
        // Calcular promedios y win rate
        stats.averageWin = stats.winCount > 0 ? totalWinAmount / stats.winCount : 0;
        stats.averageLoss = stats.lossCount > 0 ? totalLossAmount / stats.lossCount : 0;
        stats.winRate = (stats.winCount + stats.lossCount) > 0 
          ? (stats.winCount / (stats.winCount + stats.lossCount)) * 100 
          : 0;
        
        stats.openPositions = openPositions.length;
        stats.isActive = openPositions.length > 0;
      }
      
      return {
        ...ea,
        stats,
        accountName: account?.name || `Cuenta ${ea.accountId}`
      };
    });
  }, [localEAs, localAccounts, accounts]);

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expert Advisors</h1>
          <p className="text-muted-foreground">
            Gestiona tus EAs y visualiza su rendimiento
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={openReportDialog}
            className="flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Generar Informe
          </Button>
          <Link href="/accounts">
            <Button variant="default">Crear EA</Button>
          </Link>
        </div>
      </div>

      {localEAs.length === 0 ? (
        <Card className="w-full">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <BarChart3 className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No hay Expert Advisors configurados</p>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Los Expert Advisors (EAs) son estrategias automatizadas que operan en sus cuentas.
              Puede crear un EA desde la página de detalle de una cuenta.
            </p>
            <Link href="/accounts">
              <Button>Ver Cuentas</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {easWithStats.map((ea) => (
            <Card key={ea.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {ea.name}
                      {ea.stats.isActive && (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                          Activo
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {ea.accountName} • Magic: {ea.magic}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openDeleteDialog(ea);
                    }}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : (
                  <Link href={`/eas/${encodeURIComponent(ea.name)}`}>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">P/L Total:</span>
                        <span className={`font-bold ${ea.stats.totalPL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {ea.stats.totalPL.toFixed(2)}$
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-muted/50 p-2 rounded-md">
                          <p className="text-xs text-muted-foreground">Win Rate</p>
                          <p className="font-medium">{ea.stats.winRate.toFixed(1)}%</p>
                        </div>
                        <div className="bg-muted/50 p-2 rounded-md">
                          <p className="text-xs text-muted-foreground">Operaciones</p>
                          <p className="font-medium">{ea.stats.winCount + ea.stats.lossCount}</p>
                        </div>
                        <div className="bg-muted/50 p-2 rounded-md">
                          <p className="text-xs text-muted-foreground">Posiciones</p>
                          <p className="font-medium">{ea.stats.openPositions}</p>
                        </div>
                        <div className="bg-muted/50 p-2 rounded-md">
                          <p className="text-xs text-muted-foreground">Ratio G/P</p>
                          <p className="font-medium">
                            {ea.stats.winCount}:{ea.stats.lossCount}
                          </p>
                        </div>
                      </div>
                      
                      <Button className="w-full" variant="outline">
                        Ver Detalles
                      </Button>
                    </div>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Diálogo de confirmación para eliminar EA */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Expert Advisor</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea eliminar el EA "{eaToDelete?.name}"? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteEA}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para generar informe */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar Informe de EAs</DialogTitle>
            <DialogDescription>
              Seleccione el rango de fechas para generar el informe de rendimiento de todas las EAs.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="from">Fecha Inicio</Label>
                <Input 
                  id="from"
                  type="date" 
                  value={dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : new Date();
                    setDateRange(prev => ({ ...prev, from: date }));
                  }}
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="to">Fecha Fin</Label>
                <Input 
                  id="to"
                  type="date" 
                  value={dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : new Date();
                    setDateRange(prev => ({ ...prev, to: date }));
                  }}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={generateEAReport} 
              disabled={isGeneratingReport}
            >
              {isGeneratingReport ? "Generando..." : "Generar Informe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
