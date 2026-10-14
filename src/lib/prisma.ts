import { PrismaClient } from '@prisma/client';

const prismaGlobal = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = prismaGlobal.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'prod') prismaGlobal.prisma = prisma;

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
