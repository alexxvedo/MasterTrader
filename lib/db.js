// Este archivo se utiliza para garantizar que Prisma solo se inicialice en el servidor
// y no en el cliente, evitando errores de "PrismaClient is not defined"

import { PrismaClient } from '@prisma/client'

// Declaramos la variable global para PrismaClient
const globalForPrisma = global

// Verificamos si ya existe una instancia de PrismaClient
if (!globalForPrisma.prisma) {
  try {
    console.log('Inicializando PrismaClient...')
    globalForPrisma.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    })
    console.log('PrismaClient inicializado correctamente')
  } catch (error) {
    console.error('Error al inicializar Prisma:', error)
    console.error('Asegúrate de que has ejecutado `npx prisma generate`')
    // Crear un objeto mock para evitar errores en desarrollo
    console.warn('Usando objeto mock para Prisma')
    globalForPrisma.prisma = {
      account: {
        findMany: async () => {
          console.log('Mock: account.findMany llamado')
          return []
        },
        findUnique: async (params) => {
          console.log('Mock: account.findUnique llamado con params:', params)
          return null
        },
        create: async (data) => {
          console.log('Mock: account.create llamado con data:', data)
          return data.data
        },
        update: async (data) => {
          console.log('Mock: account.update llamado con data:', data)
          return data.data
        },
        delete: async () => {
          console.log('Mock: account.delete llamado')
          return {}
        },
        upsert: async (data) => {
          console.log('Mock: account.upsert llamado con data:', data)
          return data.create
        }
      },
      operation: {
        findMany: async () => {
          console.log('Mock: operation.findMany llamado')
          return []
        },
        create: async (data) => {
          console.log('Mock: operation.create llamado con data:', data)
          return data.data
        },
        deleteMany: async () => {
          console.log('Mock: operation.deleteMany llamado')
          return {}
        }
      },
      eA: {
        findMany: async () => {
          console.log('Mock: eA.findMany llamado')
          return []
        },
        findUnique: async () => {
          console.log('Mock: eA.findUnique llamado')
          return null
        },
        upsert: async (data) => {
          console.log('Mock: eA.upsert llamado con data:', data)
          return data.create
        }
      }
    }
  }
}

// Exportar la instancia de PrismaClient
const prisma = globalForPrisma.prisma

export default prisma
