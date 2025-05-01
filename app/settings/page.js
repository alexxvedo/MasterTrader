"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";

export default function Settings() {
  const { toast } = useToast();
  const [wsUrl, setWsUrl] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [darkMode, setDarkMode] = useState(false);

  // Cargar configuración guardada
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem("mastertrader_settings");
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setWsUrl(settings.wsUrl || "");
        setAutoRefresh(settings.autoRefresh !== undefined ? settings.autoRefresh : true);
        setRefreshInterval(settings.refreshInterval || 30);
        setDarkMode(settings.darkMode || false);
      }
    } catch (error) {
      console.error("Error al cargar configuración:", error);
    }
  }, []);

  // Guardar configuración
  const saveSettings = () => {
    try {
      const settings = {
        wsUrl,
        autoRefresh,
        refreshInterval,
        darkMode
      };
      
      localStorage.setItem("mastertrader_settings", JSON.stringify(settings));
      
      toast({
        title: "Configuración guardada",
        description: "Los cambios se aplicarán al recargar la página",
      });
    } catch (error) {
      console.error("Error al guardar configuración:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col p-8 gap-4">
      <div className="text-2xl font-bold">
        <h1>Ajustes</h1>
      </div>
      <hr className="w-full" />

      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="connection">Conexión</TabsTrigger>
          <TabsTrigger value="appearance">Apariencia</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
              <CardDescription>
                Ajustes generales de la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto-refresh">Actualización automática</Label>
                  <p className="text-sm text-muted-foreground">
                    Actualizar automáticamente los datos
                  </p>
                </div>
                <Switch
                  id="auto-refresh"
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
              </div>
              
              {autoRefresh && (
                <div className="space-y-2">
                  <Label htmlFor="refresh-interval">Intervalo de actualización (segundos)</Label>
                  <Input
                    id="refresh-interval"
                    type="number"
                    min="5"
                    max="300"
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(parseInt(e.target.value) || 30)}
                  />
                </div>
              )}
              
              <Button onClick={saveSettings}>Guardar configuración</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="connection" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Conexión</CardTitle>
              <CardDescription>
                Ajustes de conexión al servidor WebSocket
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ws-url">URL del WebSocket</Label>
                <Input
                  id="ws-url"
                  placeholder="ws://ejemplo.com:8765"
                  value={wsUrl}
                  onChange={(e) => setWsUrl(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Dejar en blanco para usar la URL por defecto
                </p>
              </div>
              
              <Button onClick={saveSettings}>Guardar configuración</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Apariencia</CardTitle>
              <CardDescription>
                Personaliza la apariencia de la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="dark-mode">Modo oscuro</Label>
                  <p className="text-sm text-muted-foreground">
                    Activar modo oscuro
                  </p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                />
              </div>
              
              <Button onClick={saveSettings}>Guardar configuración</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
