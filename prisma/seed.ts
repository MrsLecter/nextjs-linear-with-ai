import prisma from "@/lib/db/prisma";
import { seedTaskPrioritizationTest } from './seeds/prioritization.seed'


async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('No seed options provided')
    return
  }

  if (args.includes('--prioritization')) {
    await seedTaskPrioritizationTest(prisma)
  }

  if (args.includes('--clear')) {
    await prisma.task.deleteMany()
    console.log('Cleared all tasks from the database.')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })