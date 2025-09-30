import React, {createContext, useContext, useEffect, useState} from "react";

type UIContextType = {
    sidebarOpen: boolean;
    openSidebar: () => void;
    closeSidebar: () => void;
    toggleSidebar: () => void;
};

const UIContext = createContext<UIContextType | null>(null);

export const UIProvider: React.FC<React.PropsWithChildren> = ({children}) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        document.body.classList.toggle("overflow-hidden", sidebarOpen);
        return () => document.body.classList.remove("overflow-hidden");
    }, [sidebarOpen]);

    const value: UIContextType = {
        sidebarOpen,
        openSidebar: () => setSidebarOpen(true),
        closeSidebar: () => setSidebarOpen(false),
        toggleSidebar: () => setSidebarOpen(s => !s),
    };
    return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = (): UIContextType => {
    const ctx = useContext(UIContext);
    if (!ctx) throw new Error("useUI must be used within UIProvider");
    return ctx;
};
