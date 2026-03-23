// Real Estate Service - Database Structure Document
// Source of truth: prisma/schema.prisma

const schema = {
  database: {
    name: "real_estate_service",
    provider: "mysql",
    engine: "MariaDB (XAMPP)",
  },

  enums: {
    PropertyStatus: ["DRAFT", "PUBLISHED", "ARCHIVED"],
    ListingPurpose: ["BUY", "RENT"],
    PermissionAction: ["VIEW", "CREATE", "EDIT", "DELETE"],
  },

  tables: {
    Role: {
      columns: {
        id: "String (PK, cuid)",
        roleName: "String (UNIQUE)",
        active: "Boolean (default: true)",
        createdAt: "DateTime (default: now)",
        updatedAt: "DateTime (auto-updated)",
      },
      relations: [
        "Role 1-* User",
        "Role 1-* RolePermission",
        "Role 1-* RoleMenuAccess",
      ],
    },

    User: {
      columns: {
        id: "String (PK, cuid)",
        active: "Boolean (default: true)",
        name: "String?",
        email: "String (UNIQUE)",
        passwordHash: "String",
        roleId: "String (FK -> Role.id)",
        phone: "String?",
        createdAt: "DateTime (default: now)",
        updatedAt: "DateTime (auto-updated)",
      },
      indexes: ["INDEX(roleId)"],
      relations: [
        "User *-1 Role (onDelete: Restrict)",
        "User 1-1 AgentProfile",
        "User 1-* Property (as agent)",
        "User 1-* Favorite",
        "User 1-* Inquiry",
        "User 1-* UserPermission",
        "User 1-* UserMenuAccess",
      ],
    },

    AgentProfile: {
      columns: {
        id: "String (PK, cuid)",
        active: "Boolean (default: true)",
        userId: "String (UNIQUE, FK -> User.id)",
        companyName: "String?",
        licenseNo: "String?",
        bio: "Text?",
        createdAt: "DateTime (default: now)",
        updatedAt: "DateTime (auto-updated)",
      },
      relations: ["AgentProfile 1-1 User (onDelete: Cascade)"],
    },

    PropertyType: {
      columns: {
        id: "String (PK, cuid)",
        name: "String",
        slug: "String (UNIQUE)",
        active: "Boolean (default: true)",
        createdAt: "DateTime (default: now)",
        updatedAt: "DateTime (auto-updated)",
      },
      relations: ["PropertyType 1-* Property"],
    },

    Permission: {
      columns: {
        id: "String (PK, cuid)",
        resource: "String",
        action: "PermissionAction",
        active: "Boolean (default: true)",
        createdAt: "DateTime (default: now)",
        updatedAt: "DateTime (auto-updated)",
      },
      constraints: ["UNIQUE(resource, action)"],
      indexes: ["INDEX(resource, active)"],
      relations: [
        "Permission 1-* RolePermission",
        "Permission 1-* UserPermission",
      ],
    },

    RolePermission: {
      columns: {
        id: "String (PK, cuid)",
        active: "Boolean (default: true)",
        roleId: "String (FK -> Role.id)",
        permissionId: "String (FK -> Permission.id)",
        canAccess: "Boolean (default: true)",
        createdAt: "DateTime (default: now)",
        updatedAt: "DateTime (auto-updated)",
      },
      constraints: ["UNIQUE(roleId, permissionId)"],
      indexes: ["INDEX(roleId)", "INDEX(permissionId)"],
      relations: [
        "RolePermission *-1 Role (onDelete: Cascade)",
        "RolePermission *-1 Permission (onDelete: Cascade)",
      ],
    },

    UserPermission: {
      columns: {
        id: "String (PK, cuid)",
        active: "Boolean (default: true)",
        userId: "String (FK -> User.id)",
        permissionId: "String (FK -> Permission.id)",
        canAccess: "Boolean (default: true)",
        createdAt: "DateTime (default: now)",
        updatedAt: "DateTime (auto-updated)",
      },
      constraints: ["UNIQUE(userId, permissionId)"],
      indexes: ["INDEX(userId)", "INDEX(permissionId)"],
      relations: [
        "UserPermission *-1 User (onDelete: Cascade)",
        "UserPermission *-1 Permission (onDelete: Cascade)",
      ],
    },

    Menu: {
      columns: {
        id: "String (PK, cuid)",
        key: "String (UNIQUE)",
        title: "String",
        path: "String",
        icon: "String?",
        parentId: "String? (FK -> Menu.id)",
        sortOrder: "Int (default: 0)",
        active: "Boolean (default: true)",
        createdAt: "DateTime (default: now)",
        updatedAt: "DateTime (auto-updated)",
      },
      indexes: ["INDEX(active, sortOrder)"],
      relations: [
        "Menu self-parent (onDelete: SetNull)",
        "Menu 1-* RoleMenuAccess",
        "Menu 1-* UserMenuAccess",
      ],
    },

    RoleMenuAccess: {
      columns: {
        id: "String (PK, cuid)",
        active: "Boolean (default: true)",
        roleId: "String (FK -> Role.id)",
        menuId: "String (FK -> Menu.id)",
        canView: "Boolean (default: true)",
        createdAt: "DateTime (default: now)",
        updatedAt: "DateTime (auto-updated)",
      },
      constraints: ["UNIQUE(roleId, menuId)"],
      indexes: ["INDEX(roleId)", "INDEX(menuId)"],
      relations: [
        "RoleMenuAccess *-1 Role (onDelete: Cascade)",
        "RoleMenuAccess *-1 Menu (onDelete: Cascade)",
      ],
    },

    UserMenuAccess: {
      columns: {
        id: "String (PK, cuid)",
        active: "Boolean (default: true)",
        userId: "String (FK -> User.id)",
        menuId: "String (FK -> Menu.id)",
        canView: "Boolean (default: true)",
        createdAt: "DateTime (default: now)",
        updatedAt: "DateTime (auto-updated)",
      },
      constraints: ["UNIQUE(userId, menuId)"],
      indexes: ["INDEX(userId)", "INDEX(menuId)"],
      relations: [
        "UserMenuAccess *-1 User (onDelete: Cascade)",
        "UserMenuAccess *-1 Menu (onDelete: Cascade)",
      ],
    },

    Property: {
      columns: {
        id: "String (PK, cuid)",
        active: "Boolean (default: true)",
        agentId: "String (FK -> User.id)",
        typeId: "String (FK -> PropertyType.id)",
        listingType: "ListingPurpose (default: BUY)",
        title: "String",
        description: "Text",
        price: "Decimal(12,2)",
        city: "String",
        address: "String",
        latitude: "Decimal(10,7)?",
        longitude: "Decimal(10,7)?",
        beds: "Int",
        baths: "Int",
        areaSqft: "Int",
        status: "PropertyStatus (default: DRAFT)",
        metadataRaw: "Text? (JSON string for dynamic extra fields)",
        createdAt: "DateTime (default: now)",
        updatedAt: "DateTime (auto-updated)",
      },
      indexes: [
        "INDEX(listingType, status)",
        "INDEX(city)",
        "INDEX(latitude, longitude)",
      ],
      relations: [
        "Property *-1 User(agent) (onDelete: Cascade)",
        "Property *-1 PropertyType (onDelete: Restrict)",
        "Property 1-* PropertyImage",
        "Property 1-* PropertyVideo",
        "Property 1-* Favorite",
        "Property 1-* Inquiry",
      ],
    },

    PropertyImage: {
      columns: {
        id: "String (PK, cuid)",
        active: "Boolean (default: true)",
        propertyId: "String (FK -> Property.id)",
        url: "String",
        sortOrder: "Int (default: 0)",
        createdAt: "DateTime (default: now)",
      },
      relations: ["PropertyImage *-1 Property (onDelete: Cascade)"],
    },

    PropertyVideo: {
      columns: {
        id: "String (PK, cuid)",
        active: "Boolean (default: true)",
        propertyId: "String (FK -> Property.id)",
        playbackUrl: "String",
        posterUrl: "String?",
        durationSec: "Int?",
        status: "String (default: processing)",
        createdAt: "DateTime (default: now)",
      },
      relations: ["PropertyVideo *-1 Property (onDelete: Cascade)"],
    },

    Favorite: {
      columns: {
        id: "String (PK, cuid)",
        active: "Boolean (default: true)",
        userId: "String (FK -> User.id)",
        propertyId: "String (FK -> Property.id)",
        createdAt: "DateTime (default: now)",
      },
      constraints: ["UNIQUE(userId, propertyId)"],
      relations: [
        "Favorite *-1 User (onDelete: Cascade)",
        "Favorite *-1 Property (onDelete: Cascade)",
      ],
    },

    Inquiry: {
      columns: {
        id: "String (PK, cuid)",
        active: "Boolean (default: true)",
        propertyId: "String (FK -> Property.id)",
        userId: "String (FK -> User.id)",
        message: "Text",
        contactPhone: "String?",
        createdAt: "DateTime (default: now)",
      },
      relations: [
        "Inquiry *-1 Property (onDelete: Cascade)",
        "Inquiry *-1 User (onDelete: Cascade)",
      ],
    },
  },

  notes: {
    uploads: {
      images: "Max 3 images/property (jpg/png/webp)",
      videos: "Max 1 video/property (<= 120s)",
      storagePath: "public/uploads/properties/{propertyId}",
    },
    coordinates: "Latitude/Longitude can be passed manually, or auto-filled from image EXIF when available.",
  },
};

module.exports = schema;
