import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from './generated/prisma/client.ts';

const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({
    adapter,
});

async function main() {
    const newLink = await prisma.link.create({
        data: {
            description: 'Fullstack tutorial for GraphQL',
            url: 'www.howtographql.com',
        },
    });
    console.log(newLink);

    const allLinks = await prisma.link.findMany();
    console.log(allLinks);
}

main()
    .catch((e) => {
        throw e;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
