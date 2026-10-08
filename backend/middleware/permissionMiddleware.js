const requirePermission = (requiredPermission) => {
    return (req, res, next) => {
        // User authenticate aagirukkanuma?
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        // SUPER_ADMIN-ku full access
        if (req.user.role === "SUPER_ADMIN") {
            return next();
        }

        // User permissions check
        const hasPermission = req.user.permissions.includes(
            requiredPermission
        );

        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to perform this action.",
                requiredPermission,
            });
        }

        next();
    };
};

module.exports = {
    requirePermission,
};