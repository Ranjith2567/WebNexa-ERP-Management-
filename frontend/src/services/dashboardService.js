import api from "./api";

export const getDashboardData = async (
    companyId,
    branchId = null,
    year = null
) => {
    const params = {
        company: companyId,
    };

    if (branchId) {
        params.branch = branchId;
    }

    if (year) {
        params.year = year;
    }

    const response = await api.get(
        "/dashboard/summary",
        {
            params,
        }
    );

    return response.data;
};