"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
import { Sheet, SheetContent, SheetClose } from "@/components/ui/sheet";

const routes = [
  {
    href: "/",
    label: "Dashboard",
    icon: <Home className="h-4 w-4" />,
  },
  {
    href: "/accounts",
    label: "Cuentas",
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    href: "/eas",
    label: "Expert Advisors",
    icon: <Bot className="h-4 w-4" />,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { localAccounts, localEAs, wsConnected } = useAccounts();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Sidebar para escritorio - fijo */}
      <div className="fixed top-0 left-0 bottom-0 w-[240px] border-r bg-background z-40 hidden md:block">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-6 w-6" />
              <span className="font-bold text-lg">MasterTrader</span>
            </div>
          </div>
          <div className="flex-1 py-4 overflow-y-auto">
            <nav className="space-y-1 px-2">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                    pathname === route.href
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {route.icon}
                  {route.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-auto p-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge
                  variant={wsConnected ? "success" : "destructive"}
                  className="h-2 w-2 rounded-full p-0"
                />
                <span className="text-xs text-muted-foreground">
                  {wsConnected ? "Conectado" : "Desconectado"}
                </span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Botón de menú móvil */}
      <button
        className="fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md md:hidden"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Sidebar para móvil - drawer */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="p-0 w-[240px]">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-6 w-6" />
                  <span className="font-bold text-lg">MasterTrader</span>
                </div>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon">
                    <X className="h-4 w-4" />
                  </Button>
                </SheetClose>
              </div>
            </div>
            <div className="flex-1 py-4 overflow-y-auto">
              <nav className="space-y-1 px-2">
                {routes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                      pathname === route.href
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    {route.icon}
                    {route.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="mt-auto p-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={wsConnected ? "success" : "destructive"}
                    className="h-2 w-2 rounded-full p-0"
                  />
                  <span className="text-xs text-muted-foreground">
                    {wsConnected ? "Conectado" : "Desconectado"}
                  </span>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
