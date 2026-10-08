import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {

    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem("webnexa-theme");

        return savedTheme || "dark";
    });


    /* =========================================
       APPLY THEME
    ========================================= */

    useEffect(() => {

        const root = document.documentElement;

        root.classList.remove("dark-theme", "light-theme");

        root.classList.add(`${theme}-theme`);

        localStorage.setItem(
            "webnexa-theme",
            theme
        );

    }, [theme]);


    /* =========================================
       TOGGLE THEME
    ========================================= */

    const toggleTheme = () => {

        setTheme((currentTheme) =>
            currentTheme === "dark"
                ? "light"
                : "dark"
        );

    };


    /* =========================================
       VALUES
    ========================================= */

    const value = {
        theme,
        setTheme,
        toggleTheme,
        isDark: theme === "dark",
        isLight: theme === "light",
    };


    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};


export const useTheme = () => {

    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error(
            "useTheme must be used inside ThemeProvider"
        );
    }

    return context;
};