import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS banner_cards (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      "imageUrl" TEXT,
      "linkUrl" TEXT,
      gradient TEXT DEFAULT 'from-primary-500 to-orange-400',
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('SUCCESS: banner_cards table created or verified!');
  const count = await prisma.bannerCard.count();
  console.log('Current bannerCard count:', count);
}

main()
  .catch((e) => {
    console.error('Migration error:', e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
