import { PrismaClient } from '@prisma/client';

// Create a single instance of PrismaClient to avoid connection pool issues
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Export with proper typing
export default prisma as PrismaClient;
