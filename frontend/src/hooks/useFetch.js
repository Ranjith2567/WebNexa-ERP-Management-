import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

const useFetch = (url, options = {}) => {
    const {
        params = {},
        enabled = true,
        immediate = true,
    } = options;

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(immediate && enabled);
    const [error, setError] = useState(null);

    const fetchData = useCallback(
        async (customParams = params) => {
            if (!url) return;

            try {
                setLoading(true);
                setError(null);

                const response = await api.get(url, {
                    params: customParams,
                });

                setData(response.data);

                return response.data;
            } catch (err) {
                const message =
                    err?.response?.data?.message ||
                    err?.message ||
                    "Something went wrong.";

                setError(message);

                throw err;
            } finally {
                setLoading(false);
            }
        },
        [url, JSON.stringify(params)]
    );

    useEffect(() => {
        if (enabled && immediate) {
            fetchData();
        }
    }, [enabled, immediate, fetchData]);

    return {
        data,
        loading,
        error,
        refetch: fetchData,
        setData,
    };
};

export default useFetch;