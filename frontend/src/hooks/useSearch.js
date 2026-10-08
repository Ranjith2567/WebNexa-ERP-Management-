import { useMemo, useState } from "react";

const useSearch = (
    data = [],
    fields = []
) => {
    const [search, setSearch] = useState("");

    const filteredData = useMemo(() => {
        const keyword = search
            .trim()
            .toLowerCase();

        if (!keyword) {
            return data;
        }

        return data.filter((item) =>
            fields.some((field) => {
                const value = item?.[field];

                if (
                    value === null ||
                    value === undefined
                ) {
                    return false;
                }

                return String(value)
                    .toLowerCase()
                    .includes(keyword);
            })
        );
    }, [data, fields, search]);

    const clearSearch = () => {
        setSearch("");
    };

    return {
        search,
        setSearch,
        filteredData,
        clearSearch,
    };
};

export default useSearch;