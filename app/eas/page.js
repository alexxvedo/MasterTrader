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
  BarChart3
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

export default function EAsPage() {
  const { localEAs, localAccounts, accounts, deleteEA } = useAccounts();
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eaToDelete, setEaToDelete] = useState(null);

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
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Expert Advisors</h1>
          <p className="text-muted-foreground">
            Gestione sus estrategias automatizadas
          </p>
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
    </div>
  );
}
