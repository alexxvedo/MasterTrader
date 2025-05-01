"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  AccountService,
  EAService,
  OperationService,
} from "@/lib/trading-service";

// WebSocket URL (can be overridden via env var)
// Default to insecure WebSocket; will upgrade to WSS on HTTPS pages
const DEFAULT_WS_URL = process.env(NEXT_PUBLIC_WS_URL);

// Crear contexto
const AccountsContext = createContext();

// Hook para usar el contexto
export const useAccounts = () => useContext(AccountsContext);

// Proveedor del contexto
export const AccountsProvider = ({ children }) => {
  // Estado para almacenar datos de cuentas y operaciones
  const [accounts, setAccounts] = useState({});
  const [localAccounts, setLocalAccounts] = useState([]);
  const [localEAs, setLocalEAs] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsError, setWsError] = useState(null);

  // Función para cargar datos del localStorage
  const loadLocalData = useCallback(() => {
    try {
      // Cargar cuentas del localStorage
      const savedAccounts = localStorage.getItem("mastertrader_accounts");
      if (savedAccounts) {
        setLocalAccounts(JSON.parse(savedAccounts));
      }

      // Cargar EAs del localStorage
      const savedEAs = localStorage.getItem("mastertrader_eas");
      if (savedEAs) {
        setLocalEAs(JSON.parse(savedEAs));
      }
    } catch (error) {
      console.error("Error al cargar datos del localStorage:", error);
    }
  }, []);

  // Función para guardar cuentas en localStorage
  const saveAccountsToLocalStorage = useCallback((accounts) => {
    try {
      localStorage.setItem("mastertrader_accounts", JSON.stringify(accounts));
      setLocalAccounts(accounts);
    } catch (error) {
      console.error("Error al guardar cuentas en localStorage:", error);
    }
  }, []);

  // Función para guardar EAs en localStorage
  const saveEAsToLocalStorage = useCallback((eas) => {
    try {
      localStorage.setItem("mastertrader_eas", JSON.stringify(eas));
      setLocalEAs(eas);
    } catch (error) {
      console.error("Error al guardar EAs en localStorage:", error);
    }
  }, []);

  // Función para crear una cuenta
  const createAccount = useCallback(
    async (accountData) => {
      try {
        // Usar el número de cuenta como ID
        const newAccount = {
          id: accountData.accountNumber, // Usar el número de cuenta como ID
          ...accountData,
          createdAt: new Date().toISOString(),
        };

        // Verificar si la cuenta ya existe
        const existingAccountIndex = localAccounts.findIndex(
          (acc) => acc.accountNumber === accountData.accountNumber
        );

        let updatedAccounts;
        if (existingAccountIndex >= 0) {
          // Actualizar la cuenta existente
          updatedAccounts = [...localAccounts];
          updatedAccounts[existingAccountIndex] = newAccount;
        } else {
          // Agregar nueva cuenta
          updatedAccounts = [...localAccounts, newAccount];
        }

        saveAccountsToLocalStorage(updatedAccounts);

        console.log("Cuenta creada/actualizada:", newAccount);
        console.log("Cuentas actualizadas:", updatedAccounts);

        return newAccount;
      } catch (error) {
        console.error("Error al crear cuenta:", error);
        throw error;
      }
    },
    [localAccounts, saveAccountsToLocalStorage]
  );

  // Función para crear un EA
  const createEA = useCallback(
    async (eaData) => {
      try {
        // Usar una combinación de nombre y magic number como ID único
        const eaId = `${eaData.name}-${eaData.magic}`;
        const newEA = {
          id: eaId,
          ...eaData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Verificar si el EA ya existe
        const existingEAIndex = localEAs.findIndex(
          (ea) =>
            ea.name === eaData.name &&
            ea.magic === eaData.magic &&
            ea.accountId === eaData.accountId
        );

        let updatedEAs;
        if (existingEAIndex >= 0) {
          // Actualizar el EA existente
          updatedEAs = [...localEAs];
          updatedEAs[existingEAIndex] = newEA;
        } else {
          // Agregar nuevo EA
          updatedEAs = [...localEAs, newEA];
        }

        saveEAsToLocalStorage(updatedEAs);

        console.log("EA creado/actualizado:", newEA);
        console.log("EAs actualizados:", updatedEAs);

        return newEA;
      } catch (error) {
        console.error("Error al crear EA:", error);
        throw error;
      }
    },
    [localEAs, saveEAsToLocalStorage]
  );

  // Función para obtener EAs de una cuenta
  const getAccountEAs = useCallback(
    (accountId) => {
      console.log("Buscando EAs para la cuenta ID:", accountId);
      console.log("Tipo de accountId:", typeof accountId);
      console.log("EAs disponibles:", localEAs);

      // Convertir accountId a string para comparación consistente
      const accountIdStr = accountId.toString();

      const filteredEAs = localEAs.filter((ea) => {
        const eaAccountId = ea.accountId.toString();
        const match = eaAccountId === accountIdStr;
        console.log(
          `Comparando EA accountId: ${eaAccountId} con ${accountIdStr}, coincide: ${match}`
        );
        return match;
      });

      console.log("EAs filtrados:", filteredEAs);
      return filteredEAs;
    },
    [localEAs]
  );

  // Eliminar un EA
  const deleteEA = useCallback((eaId) => {
    setLocalEAs((prevEAs) => {
      const updatedEAs = prevEAs.filter((ea) => ea.id !== eaId);
      localStorage.setItem("mastertrader_eas", JSON.stringify(updatedEAs));
      return updatedEAs;
    });
  }, []);

  // Eliminar una cuenta guardada
  const deleteAccount = useCallback((accountId) => {
    setLocalAccounts((prevAccounts) => {
      const updatedAccounts = prevAccounts.filter(
        (account) => account.id !== accountId
      );
      localStorage.setItem(
        "mastertrader_accounts",
        JSON.stringify(updatedAccounts)
      );
      return updatedAccounts;
    });
  }, []);

  // Conectar al WebSocket
  useEffect(() => {
    let ws = null;
    let reconnectTimer = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 3000; // 3 segundos

    const connectWebSocket = () => {
      if (reconnectAttempts >= maxReconnectAttempts) {
        setWsError(
          `Máximo número de intentos de reconexión (${maxReconnectAttempts}) alcanzado.`
        );
        return;
      }

      // Limpiar cualquier temporizador existente
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }

      // Obtener URL del WebSocket
      const socketUrl = localStorage.getItem("wsUrl") || DEFAULT_WS_URL;

      try {
        console.log("[AccountsContext] Connecting to WebSocket at:", socketUrl);

        // Crear conexión WebSocket
        ws = new WebSocket(socketUrl);

        // Evento de conexión establecida
        ws.onopen = () => {
          console.log("[AccountsContext] WebSocket connected to", socketUrl);
          setWsConnected(true);
          setWsError(null);
          reconnectAttempts = 0; // Resetear contador de intentos
        };

        // Evento de conexión cerrada
        ws.onclose = (event) => {
          console.log(
            "[AccountsContext] WebSocket disconnected from",
            socketUrl,
            event.code,
            event.reason
          );
          setWsConnected(false);

          // Intentar reconectar después de un tiempo
          reconnectAttempts++;
          console.log(
            `[AccountsContext] Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts}) in ${reconnectDelay}ms`
          );
          reconnectTimer = setTimeout(() => {
            connectWebSocket();
          }, reconnectDelay);
        };

        // Evento de error
        ws.onerror = (error) => {
          console.error(
            "[AccountsContext] WebSocket error connecting to",
            socketUrl,
            error
          );
          setWsError(`Error de conexión: ${error.message || "Desconocido"}`);
        };

        // Evento de mensaje recibido
        ws.onmessage = (event) => {
          try {
            processWebSocketMessage(event.data);
          } catch (error) {
            console.error(
              "[AccountsContext] Error al procesar mensaje del WebSocket:",
              error
            );
          }
        };
      } catch (error) {
        console.error("[AccountsContext] Error al conectar WebSocket:", error);
        setWsError(`Error de conexión: ${error.message}`);

        // Intentar reconectar después de un tiempo
        reconnectAttempts++;
        reconnectTimer = setTimeout(() => {
          connectWebSocket();
        }, reconnectDelay);
      }
    };

    // Solo conectar WebSocket en el cliente
    if (typeof window !== "undefined") {
      connectWebSocket();
    }

    // Limpiar al desmontar
    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, []);

  // Procesar mensaje del WebSocket
  const processWebSocketMessage = useCallback(
    async (message) => {
      try {
        const data = JSON.parse(message);
        console.log("Mensaje WebSocket recibido:", data.type);

        if (!data || !data.type || !data.account) {
          console.warn("Mensaje WebSocket inválido:", data);
          return;
        }

        const accountNumber = data.account.toString();

        // Actualizar datos en memoria para todos los accounts
        setAccounts((prevData) => {
          const newData = { ...prevData };

          if (!newData[accountNumber]) {
            newData[accountNumber] = { positions: [], deals: [] };
          }

          if (data.type === "positions") {
            // Actualizar información de la cuenta
            newData[accountNumber] = {
              ...newData[accountNumber],
              balance: data.balance,
              equity: data.equity,
              margin: data.margin,
              freeMargin: data.free_margin,
              marginLevel: data.margin_level,
              positions: data.data || [],
            };
          } else if (data.type === "full_history") {
            // Actualizar historial de operaciones en memoria
            newData[accountNumber] = {
              ...newData[accountNumber],
              deals: data.data || [],
            };
          }

          return newData;
        });

        // IMPORTANTE: No crear automáticamente cuentas que ya existen en localStorage
        // Verificar si la cuenta ya existe en localStorage
        const existingAccount = localAccounts.find(
          (acc) => acc.accountNumber === accountNumber
        );

        // Solo crear la cuenta automáticamente si NO existe en localStorage
        if (!existingAccount && data.type === "positions") {
          console.log(
            `Cuenta ${accountNumber} no está guardada en localStorage. No se creará automáticamente.`
          );
          // No hacemos nada, esperamos a que el usuario guarde la cuenta manualmente
        }
      } catch (error) {
        console.error("Error al procesar mensaje WebSocket:", error);
      }
    },
    [localAccounts, saveAccountsToLocalStorage]
  );

  // Generar datos de prueba
  const generateMockData = () => {
    // Crear cuentas de ejemplo
    const mockAccounts = [
      {
        id: 1,
        name: "Cuenta Demo 1",
        accountNumber: "12345",
        broker: "MetaTrader 5",
      },
      {
        id: 2,
        name: "Cuenta Demo 2",
        accountNumber: "67890",
        broker: "MetaTrader 4",
      },
    ];

    // Crear EAs de ejemplo
    const mockEAs = [
      {
        id: 1,
        name: "EA Test 1",
        magic: 12345,
        accountId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 2,
        name: "EA Test 2",
        magic: 67890,
        accountId: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // Guardar en localStorage
    saveAccountsToLocalStorage(mockAccounts);
    saveEAsToLocalStorage(mockEAs);

    console.log("Datos de prueba generados y guardados en localStorage");
    return { accounts: mockAccounts, eas: mockEAs };
  };

  // Cargar datos al inicio
  useEffect(() => {
    if (typeof window !== "undefined") {
      loadLocalData();
    }
  }, [loadLocalData]);

  // Efecto para guardar datos cuando cambian
  useEffect(() => {
    if (typeof window !== "undefined" && localAccounts.length > 0) {
      localStorage.setItem(
        "mastertrader_accounts",
        JSON.stringify(localAccounts)
      );
    }
  }, [localAccounts]);

  useEffect(() => {
    if (typeof window !== "undefined" && localEAs.length > 0) {
      localStorage.setItem("mastertrader_eas", JSON.stringify(localEAs));
    }
  }, [localEAs]);

  return (
    <AccountsContext.Provider
      value={{
        accounts,
        localAccounts,
        localEAs,
        wsConnected,
        wsError,
        createAccount,
        createEA,
        deleteEA,
        deleteAccount,
        getAccountEAs,
        generateMockData,
      }}
    >
      {children}
    </AccountsContext.Provider>
  );
};
