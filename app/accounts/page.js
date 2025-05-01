"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useAccounts } from "@/lib/accounts-context";
import { AccountService } from "@/lib/trading-service";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";

export default function Accounts() {
  const [openAddAccountDialog, setOpenAddAccountDialog] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [broker, setBroker] = useState("");
  const { accounts, localAccounts, createAccount } = useAccounts();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      console.log("Intentando crear cuenta con:", {
        accountName,
        accountNumber,
        broker,
      });

      // Crear cuenta en localStorage
      await createAccount({
        accountNumber,
        name: accountName,
        broker,
      });

      // Cerrar diálogo y limpiar formulario
      setOpenAddAccountDialog(false);
      setAccountName("");
      setAccountNumber("");
      setBroker("");

      // Mostrar mensaje de éxito
      toast({
        title: "Cuenta añadida",
        description: "La cuenta ha sido añadida correctamente",
        variant: "default",
      });
    } catch (error) {
      console.error("Error al crear cuenta:", error);
      // Mostrar mensaje de error
      toast({
        title: "Error",
        description: "No se pudo añadir la cuenta. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col p-8 gap-4">
      <div className="text-2xl font-bold flex justify-between items-center">
        <h1>Cuentas</h1>
        <Button onClick={() => setOpenAddAccountDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Añadir cuenta
        </Button>
      </div>
      <hr className="w-full" />

      <Dialog
        open={openAddAccountDialog}
        onOpenChange={setOpenAddAccountDialog}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Añadir nueva cuenta</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="accountName">Nombre de la cuenta</Label>
              <Input
                id="accountName"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Darwinex Demo"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="accountNumber">Número de cuenta</Label>
              <Input
                id="accountNumber"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="123456"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="broker">Broker</Label>
              <Input
                id="broker"
                value={broker}
                onChange={(e) => setBroker(e.target.value)}
                placeholder="Darwinex"
                required
              />
            </div>
            <div className="grid gap-2">
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {localAccounts.map((localAccount) => {
            const acct = accounts[localAccount.accountNumber];
            const balance = acct?.balance || 0;
            const equity = acct?.equity || 0;
            const margin = acct?.margin || 0;
            const pnl = equity - balance;
            const positions = acct?.positions || [];

            return (
              <Link
                href={`/accounts/${localAccount.accountNumber}`}
                key={localAccount.id}
                className="block transition-transform hover:scale-105"
              >
                <Card className="hover:border-primary">
                  <CardHeader className="text-xl font-bold">
                    {localAccount.name}
                    <div className="text-sm font-normal text-muted-foreground">
                      {localAccount.broker} - {localAccount.accountNumber}
                    </div>
                  </CardHeader>
                  <CardContent className="text-xl flex flex-col gap-2">
                    <div className="flex-1 flex justify-between items-center">
                      <h2 className="text-lg font-bold">Balance</h2>
                      <h2 className="text-lg">
                        {acct ? `${balance.toFixed(2)}$` : "Cargando..."}
                      </h2>
                    </div>
                    <hr className="flex-1" />
                    <div className="flex-1 flex justify-between items-center">
                      <h2 className="text-lg font-bold">PnL</h2>
                      <h2
                        className={`text-lg ${
                          acct && pnl >= 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {acct ? `${pnl.toFixed(2)}$` : ""}
                      </h2>
                    </div>
                    <hr className="flex-1" />
                    <div className="flex-1 flex justify-between items-center">
                      <h2 className="text-lg font-bold">Margen en uso</h2>
                      <h2 className="text-lg">
                        {acct ? `${margin.toFixed(2)}$` : ""}
                      </h2>
                    </div>
                    <hr className="flex-1" />
                    <div className="flex-1 flex justify-between items-center">
                      <h2 className="text-lg font-bold">
                        Operaciones abiertas
                      </h2>
                      <h2 className="text-lg">{positions.length}</h2>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
