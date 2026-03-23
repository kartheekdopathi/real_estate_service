import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const connectionUrl = process.env.DATABASE_URL;

if (!connectionUrl) {
  throw new Error("DATABASE_URL is not configured");
}

const parsed = new URL(connectionUrl);

const adapter = new PrismaMariaDb({
  host: parsed.hostname,
  port: parsed.port ? Number(parsed.port) : 3306,
  user: decodeURIComponent(parsed.username),
  password: decodeURIComponent(parsed.password),
  database: parsed.pathname.replace(/^\//, ""),
});

const prisma = new PrismaClient({ adapter });

const ROLES = [
  { roleName: "BUYER" },
  { roleName: "AGENT" },
  { roleName: "ADMIN" },
];

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

const RESOURCES = ["users", "roles", "propertyTypes", "properties", "menus", "permissions"];
const ACTIONS = ["VIEW", "CREATE", "EDIT", "DELETE"];

const MENUS = [
  { key: "dashboard", title: "Dashboard", path: "/admin", sortOrder: 1 },
  { key: "users", title: "Users", path: "/admin/users", sortOrder: 2 },
  { key: "roles", title: "Roles", path: "/admin/roles", sortOrder: 3 },
  { key: "property-types", title: "Property Types", path: "/admin/property-types", sortOrder: 4 },
  { key: "properties", title: "Properties", path: "/admin/properties", sortOrder: 5 },
  { key: "menu-settings", title: "Menu Settings", path: "/admin/menu-settings", sortOrder: 6 },
  { key: "permission-settings", title: "Permission Settings", path: "/admin/permission-settings", sortOrder: 7 },
];

async function main() {
  // Seed roles
  for (const item of ROLES) {
    await prisma.role.upsert({
      where: { roleName: item.roleName },
      update: { active: true },
      create: item,
    });
  }
  console.log(`Seeded ${ROLES.length} roles.`);

  // Seed property types
  for (const item of PROPERTY_TYPES) {
    await prisma.propertyType.upsert({
      where: { slug: item.slug },
      update: { name: item.name, active: true },
      create: item,
    });
  }
  console.log(`Seeded ${PROPERTY_TYPES.length} property types.`);

  // Seed permissions
  for (const resource of RESOURCES) {
    for (const action of ACTIONS) {
      await prisma.permission.upsert({
        where: { resource_action: { resource, action } },
        update: { active: true },
        create: { resource, action },
      });
    }
  }
  console.log(`Seeded ${RESOURCES.length * ACTIONS.length} permissions.`);

  // Seed menu master
  for (const menu of MENUS) {
    await prisma.menu.upsert({
      where: { key: menu.key },
      update: { ...menu, active: true },
      create: menu,
    });
  }
  console.log(`Seeded ${MENUS.length} menus.`);

  // Role-based default permission mapping
  const roles = await prisma.role.findMany({ where: { active: true } });
  const permissions = await prisma.permission.findMany({ where: { active: true } });

  for (const role of roles) {
    for (const permission of permissions) {
      let canAccess = false;

      if (role.roleName === "ADMIN") {
        canAccess = true;
      } else if (role.roleName === "AGENT") {
        const agentAllowed = {
          properties: ["VIEW", "CREATE", "EDIT"],
          propertyTypes: ["VIEW"],
        };
        canAccess = Boolean(agentAllowed[permission.resource]?.includes(permission.action));
      } else if (role.roleName === "BUYER") {
        const buyerAllowed = {
          properties: ["VIEW"],
          propertyTypes: ["VIEW"],
        };
        canAccess = Boolean(buyerAllowed[permission.resource]?.includes(permission.action));
      }

      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: { canAccess },
        create: { roleId: role.id, permissionId: permission.id, canAccess },
      });
    }
  }
  console.log("Seeded role permissions.");

  // Role-based default menu mapping
  const menus = await prisma.menu.findMany({ where: { active: true } });

  for (const role of roles) {
    for (const menu of menus) {
      let canView = false;

      if (role.roleName === "ADMIN") {
        canView = true;
      } else if (role.roleName === "AGENT") {
        canView = ["dashboard", "properties", "property-types"].includes(menu.key);
      } else if (role.roleName === "BUYER") {
        canView = ["dashboard", "properties"].includes(menu.key);
      }

      await prisma.roleMenuAccess.upsert({
        where: { roleId_menuId: { roleId: role.id, menuId: menu.id } },
        update: { canView },
        create: { roleId: role.id, menuId: menu.id, canView },
      });
    }
  }
  console.log("Seeded role menu access.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
