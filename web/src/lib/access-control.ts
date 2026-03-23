import { NextRequest } from "next/server";

import { getAuthUser } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

export async function requireAdmin(request: NextRequest) {
  const user = await getAuthUser(request);

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return user;
}

export async function hasPermission(userId: number, resource: string, action: "VIEW" | "CREATE" | "EDIT" | "DELETE") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!user) {
    return false;
  }

  const permission = await db.permission.findFirst({
    where: {
      resource,
      action,
      active: true,
    },
    select: { id: true },
  });

  if (!permission) {
    return false;
  }

  const userOverride = await db.userPermission.findUnique({
    where: {
      userId_permissionId: {
        userId,
        permissionId: permission.id,
      },
    },
    select: { canAccess: true },
  });

  if (userOverride) {
    return userOverride.canAccess;
  }

  const rolePermission = await db.rolePermission.findUnique({
    where: {
      roleId_permissionId: {
        roleId: user.role.id,
        permissionId: permission.id,
      },
    },
    select: { canAccess: true },
  });

  return Boolean(rolePermission?.canAccess);
}

export async function getUserMenus(userId: number) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        select: { id: true },
      },
    },
  });

  if (!user) {
    return [];
  }

  const roleMenus = await db.roleMenuAccess.findMany({
    where: {
      roleId: user.role.id,
      canView: true,
      menu: { active: true },
    },
    include: {
      menu: true,
    },
  });

  const userOverrides = await db.userMenuAccess.findMany({
    where: { userId },
    include: { menu: true },
  });

  const menuMap = new Map();

  for (const rm of roleMenus) {
    menuMap.set(rm.menu.id, rm.menu);
  }

  for (const um of userOverrides) {
    if (!um.menu?.active) continue;

    if (um.canView) {
      menuMap.set(um.menu.id, um.menu);
    } else {
      menuMap.delete(um.menu.id);
    }
  }

  return Array.from(menuMap.values()).sort((a, b) => a.sortOrder - b.sortOrder);
}
