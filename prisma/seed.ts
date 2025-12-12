import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not defined');
}

const adapter = new PrismaMariaDb(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Iniciando seed de la base de datos...');

    const hashedPassword = await bcrypt.hash('Admin12345678', 12);

    const adminUser = await prisma.systemUser.upsert({
        where: { email: 'admin@admin.com' },
        update: {},
        create: {
            email: 'admin@admin.com',
            password: hashedPassword,
            firstName: 'Super',
            lastName: 'Admin',
            role: UserRole.SUPER_ADMIN,
            isActive: true,
        },
    });

    console.log('Usuario admin creado:', {
        email: adminUser.email,
        role: adminUser.role,
    });

    console.log('Credenciales de acceso:');
    console.log('   Email: admin@admin.com');
    console.log('   Password: Admin12345678');
}

main()
    .catch((e) => {
        console.error('Error en seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });