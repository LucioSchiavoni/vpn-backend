import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed de la base de datos...');

    // Crear usuario SUPER_ADMIN por defecto
    const hashedPassword = await bcrypt.hash('Admin123!', 12);

    const adminUser = await prisma.systemUser.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            password: hashedPassword,
            firstName: 'Super',
            lastName: 'Admin',
            role: UserRole.SUPER_ADMIN,
            isActive: true,
        },
    });

    console.log('✅ Usuario admin creado:', {
        email: adminUser.email,
        role: adminUser.role,
    });

    console.log('\n📝 Credenciales de acceso:');
    console.log('   Email: admin@example.com');
    console.log('   Password: Admin123!');
    console.log('\n⚠️  IMPORTANTE: Cambiar estas credenciales en producción\n');
}

main()
    .catch((e) => {
        console.error('❌ Error en seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
