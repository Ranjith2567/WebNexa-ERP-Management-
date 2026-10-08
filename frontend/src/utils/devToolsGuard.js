const startDevToolsGuard = () => {
    let triggered = false;

    const checkDevTools = () => {
        const widthDiff = window.outerWidth - window.innerWidth;
        const heightDiff = window.outerHeight - window.innerHeight;

        const isDevToolsOpen =
            widthDiff > 160 || heightDiff > 160;

        if (isDevToolsOpen && !triggered) {
            triggered = true;

            window.location.reload();
        }

        if (!isDevToolsOpen) {
            triggered = false;
        }
    };

    const interval = setInterval(checkDevTools, 1000);

    return () => {
        clearInterval(interval);
    };
};

export default startDevToolsGuard;