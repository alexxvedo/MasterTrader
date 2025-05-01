"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAccounts } from "@/lib/accounts-context";
import {
  Home,
  Wallet,
  Settings,
  ChevronRight,
  BarChart3,
  Menu,
  X,
  BarChart2,
  CreditCard,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";

export function Sidebar() {
  const pathname = usePathname();
  const { localAccounts, localEAs, wsConnected } = useAccounts();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Sidebar para escritorio - siempre visible */}
      <div className="hidden md:flex h-screen w-64 flex-col fixed left-0 top-0 border-r bg-background z-40">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <BarChart2 className="h-6 w-6" />
            <span className="text-xl font-bold">MasterTrader</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-auto p-3">
          <ul className="space-y-1">
            <li>
              <Link
                href="/"
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                  pathname === "/" ? "bg-accent text-accent-foreground" : "transparent"
                )}
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                href="/accounts"
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                  pathname === "/accounts" || pathname.startsWith("/accounts/")
                    ? "bg-accent text-accent-foreground"
                    : "transparent"
                )}
              >
                <CreditCard className="h-4 w-4" />
                Cuentas
              </Link>
            </li>
            <li>
              <Link
                href="/eas"
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                  pathname === "/eas" || pathname.startsWith("/eas/")
                    ? "bg-accent text-accent-foreground"
                    : "transparent"
                )}
              >
                <Bot className="h-4 w-4" />
                Expert Advisors
              </Link>
            </li>
            <li>
              <Link
                href="/settings"
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                  pathname === "/settings"
                    ? "bg-accent text-accent-foreground"
                    : "transparent"
                )}
              >
                <Settings className="h-4 w-4" />
                Configuración
              </Link>
            </li>
          </ul>
        </nav>
        <div className="mt-auto p-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={wsConnected ? "success" : "destructive"} className="h-2 w-2 rounded-full p-0" />
              <span className="text-xs text-muted-foreground">
                {wsConnected ? "Conectado" : "Desconectado"}
              </span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Botón de menú móvil */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-40 md:hidden"
        onClick={() => setIsMobileMenuOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Barra lateral para móvil (drawer) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 bg-background border-r shadow-lg flex flex-col">
            <div className="p-6 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 font-semibold">
                <BarChart2 className="h-6 w-6" />
                <span className="text-xl font-bold">MasterTrader</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <nav className="flex-1 overflow-auto p-3">
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/"
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                      pathname === "/" ? "bg-accent text-accent-foreground" : "transparent"
                    )}
                  >
                    <Home className="h-4 w-4" />
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/accounts"
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                      pathname === "/accounts" || pathname.startsWith("/accounts/")
                        ? "bg-accent text-accent-foreground"
                        : "transparent"
                    )}
                  >
                    <CreditCard className="h-4 w-4" />
                    Cuentas
                  </Link>
                </li>
                <li>
                  <Link
                    href="/eas"
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                      pathname === "/eas" || pathname.startsWith("/eas/")
                        ? "bg-accent text-accent-foreground"
                        : "transparent"
                    )}
                  >
                    <Bot className="h-4 w-4" />
                    Expert Advisors
                  </Link>
                </li>
                <li>
                  <Link
                    href="/settings"
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                      pathname === "/settings"
                        ? "bg-accent text-accent-foreground"
                        : "transparent"
                    )}
                  >
                    <Settings className="h-4 w-4" />
                    Configuración
                  </Link>
                </li>
              </ul>
            </nav>
            <div className="mt-auto p-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={wsConnected ? "success" : "destructive"} className="h-2 w-2 rounded-full p-0" />
                  <span className="text-xs text-muted-foreground">
                    {wsConnected ? "Conectado" : "Desconectado"}
                  </span>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
