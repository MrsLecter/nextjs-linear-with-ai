import prisma from "@/lib/db/prisma";
import { seedTaskPrioritizationTest } from './seeds/prioritization.seed'


async function main() {
  const args = process.argv.slice(2)

  const runAll = args.length === 0 || args.includes('--all')

  if (runAll || args.includes('--prioritization')) {
    await seedTaskPrioritizationTest(prisma)
  }

  if (runAll || args.includes('--clear')) {
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