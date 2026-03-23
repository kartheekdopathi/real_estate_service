import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PROPERTY_TYPES = [
  { name: "Apartment / Flat", slug: "apartment-flat" },
  { name: "House", slug: "house" },
  { name: "Villa", slug: "villa" },
  { name: "Building", slug: "building" },
  { name: "Plot / Land", slug: "plot-land" },
  { name: "Office", slug: "office" },
  { name: "Shop", slug: "shop" },
  { name: "Warehouse", slug: "warehouse" },
  { name: "Farm Land", slug: "farm-land" },
];

async function main() {
  for (const item of PROPERTY_TYPES) {
    await prisma.propertyType.upsert({
      where: { slug: item.slug },
      update: { name: item.name, isActive: true },
      create: item,
    });
  }

  console.log(`Seeded ${PROPERTY_TYPES.length} property types.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
