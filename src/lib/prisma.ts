import { PrismaClient } from '@prisma/client'

//Exportando o objeto prisma, passando o log das query do DB
export const prisma = new PrismaClient({
    log: ['query'],
})