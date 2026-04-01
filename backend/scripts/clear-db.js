const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const txDel = await prisma.transaction.deleteMany();
    console.log(`Deleted ${txDel.count} transactions`);

    const shareDel = await prisma.share.deleteMany();
    console.log(`Deleted ${shareDel.count} shares`);

    const songDel = await prisma.song.deleteMany();
    console.log(`Deleted ${songDel.count} songs`);

    const sessDel = await prisma.generationSession.deleteMany();
    console.log(`Deleted ${sessDel.count} sessions`);

    const userUpd = await prisma.user.updateMany({
      data: { coins: 20, adUnlocksToday: 0, adUnlockDate: null },
    });
    console.log(`Reset ${userUpd.count} users to 20 coins`);

    console.log('DONE — database cleared');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
