// Servicios para operaciones de trading

// Extraer el nombre del EA basado en el comentario
export function extractEAName(comment) {
  if (!comment) return null;
  
  // Buscar patrones como "EA: NombreEA" o similares
  const match = comment.match(/EA:\s*([^\s,;]+)/i);
  return match ? match[1] : null;
}

// Servicios para cuentas
export const AccountService = {
  // Obtener todas las cuentas
  async getAllAccounts() {
    try {
      // Obtener cuentas del localStorage
      const accounts = localStorage.getItem('mastertrader_accounts');
      return accounts ? JSON.parse(accounts) : [];
    } catch (error) {
      console.error('Error al obtener cuentas:', error);
      return [];
    }
  },

  // Obtener una cuenta por ID
  async getAccountById(id) {
    try {
      const accounts = await this.getAllAccounts();
      return accounts.find(account => account.id === parseInt(id)) || null;
    } catch (error) {
      console.error(`Error al obtener cuenta con ID ${id}:`, error);
      return null;
    }
  },

  // Crear o actualizar una cuenta
  async createOrUpdateAccount(accountData) {
    try {
      const accounts = await this.getAllAccounts();
      
      // Verificar si la cuenta ya existe
      const existingIndex = accounts.findIndex(
        acc => acc.accountNumber === accountData.accountNumber
      );
      
      if (existingIndex >= 0) {
        // Actualizar cuenta existente
        const updatedAccount = {
          ...accounts[existingIndex],
          ...accountData,
          updatedAt: new Date().toISOString()
        };
        
        accounts[existingIndex] = updatedAccount;
        localStorage.setItem('mastertrader_accounts', JSON.stringify(accounts));
        
        return updatedAccount;
      } else {
        // Crear nueva cuenta
        const newAccount = {
          id: Date.now(),
          ...accountData,
          createdAt: new Date().toISOString()
        };
        
        accounts.push(newAccount);
        localStorage.setItem('mastertrader_accounts', JSON.stringify(accounts));
        
        return newAccount;
      }
    } catch (error) {
      console.error('Error al crear/actualizar cuenta:', error);
      throw error;
    }
  },

  // Eliminar una cuenta
  async deleteAccount(id) {
    try {
      const accounts = await this.getAllAccounts();
      const filteredAccounts = accounts.filter(account => account.id !== parseInt(id));
      
      localStorage.setItem('mastertrader_accounts', JSON.stringify(filteredAccounts));
      
      return { success: true };
    } catch (error) {
      console.error(`Error al eliminar cuenta con ID ${id}:`, error);
      throw error;
    }
  }
};

// Servicios para EAs
export const EAService = {
  // Obtener todos los EAs
  async getAllEAs() {
    try {
      const eas = localStorage.getItem('mastertrader_eas');
      return eas ? JSON.parse(eas) : [];
    } catch (error) {
      console.error('Error al obtener EAs:', error);
      return [];
    }
  },

  // Obtener EAs por cuenta
  async getEAsByAccount(accountId) {
    try {
      const eas = await this.getAllEAs();
      return eas.filter(ea => ea.accountId === parseInt(accountId));
    } catch (error) {
      console.error(`Error al obtener EAs para cuenta ${accountId}:`, error);
      return [];
    }
  },

  // Obtener un EA por ID
  async getEAById(id) {
    try {
      const eas = await this.getAllEAs();
      return eas.find(ea => ea.id === parseInt(id)) || null;
    } catch (error) {
      console.error(`Error al obtener EA con ID ${id}:`, error);
      return null;
    }
  },

  // Crear o actualizar un EA
  async createOrUpdateEA(eaData) {
    try {
      const eas = await this.getAllEAs();
      
      // Verificar si el EA ya existe
      const existingIndex = eas.findIndex(
        ea => ea.id === eaData.id || (ea.magic === eaData.magic && ea.accountId === eaData.accountId)
      );
      
      if (existingIndex >= 0) {
        // Actualizar EA existente
        const updatedEA = {
          ...eas[existingIndex],
          ...eaData,
          updatedAt: new Date().toISOString()
        };
        
        eas[existingIndex] = updatedEA;
        localStorage.setItem('mastertrader_eas', JSON.stringify(eas));
        
        return updatedEA;
      } else {
        // Crear nuevo EA
        const newEA = {
          id: Date.now(),
          ...eaData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        eas.push(newEA);
        localStorage.setItem('mastertrader_eas', JSON.stringify(eas));
        
        return newEA;
      }
    } catch (error) {
      console.error('Error al crear/actualizar EA:', error);
      throw error;
    }
  },

  // Eliminar un EA
  async deleteEA(id) {
    try {
      const eas = await this.getAllEAs();
      const filteredEAs = eas.filter(ea => ea.id !== parseInt(id));
      
      localStorage.setItem('mastertrader_eas', JSON.stringify(filteredEAs));
      
      return { success: true };
    } catch (error) {
      console.error(`Error al eliminar EA con ID ${id}:`, error);
      throw error;
    }
  }
};

// Servicios para operaciones
export const OperationService = {
  // Obtener operaciones por cuenta
  async getOperationsByAccount(accountId) {
    try {
      // Obtener operaciones del localStorage
      const operations = localStorage.getItem(`mastertrader_operations_${accountId}`);
      return operations ? JSON.parse(operations) : [];
    } catch (error) {
      console.error(`Error al obtener operaciones para cuenta ${accountId}:`, error);
      return [];
    }
  },

  // Crear o actualizar una operación
  async createOrUpdateOperation(operationData, accountId) {
    try {
      const operations = await this.getOperationsByAccount(accountId);
      
      // Generar un ID único para la operación basado en sus datos clave
      const operationKey = `${operationData.timestamp}-${operationData.symbol}-${operationData.volume}-${operationData.magic || 0}`;
      
      // Verificar si la operación ya existe
      const existingIndex = operations.findIndex(op => 
        op.key === operationKey ||
        (new Date(op.timestamp).getTime() === new Date(operationData.timestamp).getTime() &&
         op.symbol === operationData.symbol &&
         op.volume === operationData.volume &&
         (op.magic || 0) === (operationData.magic || 0))
      );
      
      if (existingIndex >= 0) {
        // Actualizar operación existente
        const updatedOperation = {
          ...operations[existingIndex],
          ...operationData,
          key: operationKey,
          updatedAt: new Date().toISOString()
        };
        
        operations[existingIndex] = updatedOperation;
      } else {
        // Crear nueva operación
        const newOperation = {
          id: Date.now(),
          ...operationData,
          key: operationKey,
          createdAt: new Date().toISOString()
        };
        
        operations.push(newOperation);
      }
      
      // Guardar en localStorage
      localStorage.setItem(`mastertrader_operations_${accountId}`, JSON.stringify(operations));
      
      return { success: true };
    } catch (error) {
      console.error('Error al crear/actualizar operación:', error);
      throw error;
    }
  },

  // Obtener estadísticas de EAs
  async getEAStats() {
    try {
      const eas = await EAService.getAllEAs();
      const stats = [];
      
      for (const ea of eas) {
        const operations = await this.getOperationsByEA(ea.accountId, ea.magic);
        
        // Calcular estadísticas
        let totalProfit = 0;
        let winCount = 0;
        let lossCount = 0;
        
        operations.forEach(op => {
          const profit = parseFloat(op.profitLoss);
          totalProfit += profit;
          
          if (profit > 0) winCount++;
          else if (profit < 0) lossCount++;
        });
        
        stats.push({
          id: ea.id,
          name: ea.name,
          magic: ea.magic,
          accountId: ea.accountId,
          totalOperations: operations.length,
          totalProfit,
          winCount,
          lossCount,
          winRate: operations.length > 0 ? (winCount / operations.length) * 100 : 0
        });
      }
      
      return stats;
    } catch (error) {
      console.error('Error al obtener estadísticas de EAs:', error);
      return [];
    }
  },

  // Obtener operaciones por EA
  async getOperationsByEA(accountId, magic) {
    try {
      const operations = await this.getOperationsByAccount(accountId);
      return operations.filter(op => (op.magic || 0) === magic);
    } catch (error) {
      console.error(`Error al obtener operaciones para EA con magic ${magic}:`, error);
      return [];
    }
  },

  // Obtener detalles de un EA
  async getEADetails(eaName) {
    try {
      const eas = await EAService.getAllEAs();
      const ea = eas.find(e => e.name === eaName);
      
      if (!ea) return null;
      
      const operations = await this.getOperationsByEA(ea.accountId, ea.magic);
      
      // Calcular estadísticas
      let totalProfit = 0;
      let winCount = 0;
      let lossCount = 0;
      let symbols = {};
      
      operations.forEach(op => {
        const profit = parseFloat(op.profitLoss);
        totalProfit += profit;
        
        if (profit > 0) winCount++;
        else if (profit < 0) lossCount++;
        
        // Contar operaciones por símbolo
        if (!symbols[op.symbol]) {
          symbols[op.symbol] = {
            count: 0,
            profit: 0
          };
        }
        
        symbols[op.symbol].count++;
        symbols[op.symbol].profit += profit;
      });
      
      return {
        ...ea,
        totalOperations: operations.length,
        totalProfit,
        winCount,
        lossCount,
        winRate: operations.length > 0 ? (winCount / operations.length) * 100 : 0,
        symbols,
        operations
      };
    } catch (error) {
      console.error(`Error al obtener detalles del EA ${eaName}:`, error);
      return null;
    }
  }
};
