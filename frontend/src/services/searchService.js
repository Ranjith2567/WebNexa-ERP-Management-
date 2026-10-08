import api from "./api";

const search = async ({
    q,
    page = 1,
    limit = 10,
    type = "all",
    sort = "relevance",
} = {}) => {
    const params = {
        q,
        page,
        limit,
        sort,
    };

    // Backend does not accept "all" as a search type.
    // When type is "all", omit it so backend searches all modules.
    if (type && type !== "all") {
        params.type = type;
    }

    const response = await api.get("/search", {
        params,
    });

    return response.data;
};

const searchService = {
    search,
};

export default searchService;