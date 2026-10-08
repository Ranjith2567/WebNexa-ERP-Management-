export const hasPermission = (
    user,
    permission,
    allowSuperAdmin = true
) => {
    if (!user || !permission) {
        return false;
    }

    if (
        allowSuperAdmin &&
        String(user.role || "").toUpperCase() === "SUPER_ADMIN"
    ) {
        return true;
    }

    const permissions = Array.isArray(user.permissions)
        ? user.permissions
        : [];

    return permissions.includes(permission);
};

export const hasAnyPermission = (
    user,
    permissions = [],
    allowSuperAdmin = true
) => {
    if (!user || !Array.isArray(permissions) || !permissions.length) {
        return false;
    }

    if (
        allowSuperAdmin &&
        String(user.role || "").toUpperCase() === "SUPER_ADMIN"
    ) {
        return true;
    }

    return permissions.some((permission) =>
        hasPermission(user, permission, false)
    );
};

export const hasAllPermissions = (
    user,
    permissions = [],
    allowSuperAdmin = true
) => {
    if (!user || !Array.isArray(permissions) || !permissions.length) {
        return false;
    }

    if (
        allowSuperAdmin &&
        String(user.role || "").toUpperCase() === "SUPER_ADMIN"
    ) {
        return true;
    }

    return permissions.every((permission) =>
        hasPermission(user, permission, false)
    );
};

export const isSuperAdmin = (user) => {
    return (
        String(user?.role || "").toUpperCase() === "SUPER_ADMIN"
    );
};

export const canView = (user, module) => {
    if (!module) return false;

    return hasPermission(user, `${module}.view`);
};

export const canCreate = (user, module) => {
    if (!module) return false;

    return hasPermission(user, `${module}.create`);
};

export const canEdit = (user, module) => {
    if (!module) return false;

    return hasPermission(user, `${module}.edit`);
};

export const canDelete = (user, module) => {
    if (!module) return false;

    return hasPermission(user, `${module}.delete`);
};