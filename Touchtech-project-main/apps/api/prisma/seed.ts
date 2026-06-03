/* eslint-disable no-console */
import { PrismaClient, Prisma } from '../src/generated/prisma';
import * as argon2 from 'argon2';

/**
 * Idempotent seed producing realistic demo data within a single city bounding
 * box (Stockholm) so the map looks plausible. Re-running upserts the known
 * accounts and tops up requests rather than duplicating everything.
 *
 * Geography columns are written with raw ST_* statements since Prisma cannot
 * type the geography type.
 */
const prisma = new PrismaClient();

const CITY = { lat: 59.3293, lng: 18.0686 };
const DEMO_PASSWORD = 'Password123!';

const jitter = (base: number, spread = 0.05) =>
  base + (Math.random() - 0.5) * spread;

async function setPoint(table: string, idColumn: string, id: bigint, col: string, lat: number, lng: number) {
  await prisma.$executeRawUnsafe(
    `UPDATE "${table}" SET "${col}" = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography WHERE "${idColumn}" = $3`,
    lng,
    lat,
    id,
  );
}

async function main(): Promise<void> {
  const passwordHash = await argon2.hash(DEMO_PASSWORD, { type: argon2.argon2id });

  // Admin + a deterministic demo user/worker reviewers can log in with.
  const admin = await prisma.user.upsert({
    where: { email: 'admin@routeshare.dev' },
    update: {},
    create: { email: 'admin@routeshare.dev', passwordHash, role: 'admin', fullName: 'Platform Admin' },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: 'user@routeshare.dev' },
    update: {},
    create: { email: 'user@routeshare.dev', passwordHash, role: 'user', fullName: 'Demo User' },
  });

  const demoWorker = await prisma.user.upsert({
    where: { email: 'worker@routeshare.dev' },
    update: {},
    create: {
      email: 'worker@routeshare.dev',
      passwordHash,
      role: 'worker',
      fullName: 'Demo Worker',
      workerProfile: { create: { vehicle: 'car', verification: 'verified', isAvailable: true } },
    },
  });
  await setPoint('worker_profiles', 'user_id', demoWorker.id, 'current_location', jitter(CITY.lat), jitter(CITY.lng));

  // A pool of open requests so the worker "nearby" view is populated.
  const existing = await prisma.request.count({ where: { userId: demoUser.id } });
  const toCreate = Math.max(0, 15 - existing);
  for (let i = 0; i < toCreate; i++) {
    const pickup = { lat: jitter(CITY.lat), lng: jitter(CITY.lng) };
    const dropoff = { lat: jitter(CITY.lat), lng: jitter(CITY.lng) };
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO requests (
        user_id, pickup_geom, pickup_text, dropoff_geom, dropoff_text,
        recipient_name, package_size, status, price_cents, created_at, updated_at
      ) VALUES (
        ${demoUser.id},
        ST_SetSRID(ST_MakePoint(${pickup.lng}, ${pickup.lat}), 4326)::geography, ${'Pickup ' + i},
        ST_SetSRID(ST_MakePoint(${dropoff.lng}, ${dropoff.lat}), 4326)::geography, ${'Dropoff ' + i},
        ${'Recipient ' + i}, 's'::"PackageSize", 'created'::"RequestStatus",
        ${500 + i * 25}, now(), now()
      )
    `);
  }

  console.log('Seed complete:', {
    admin: admin.email,
    user: demoUser.email,
    worker: demoWorker.email,
    openRequestsCreated: toCreate,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
