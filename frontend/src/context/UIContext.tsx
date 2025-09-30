// src/ui/UIContext.tsx
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

type UIContextType = {
    sidebarOpen: boolean;
    openSidebar: () => void;
    closeSidebar: () => void;
    toggleSidebar: () => void;
};

const UIContext = createContext<UIContextType | null>(null);

type Props = React.PropsWithChildren<{ initialOpen?: boolean }>;

export const UIProvider: React.FC<Props> = ({ children, initialOpen = false }) => {
    const [sidebarOpen, setSidebarOpen] = useState(initialOpen);

    // збережемо попередній overflow, щоб коректно відновити
    const prevOverflow = useRef<string | null>(null);

    // блокування скролу body
    useEffect(() => {
        if (typeof document === "undefined") return;
        const body = document.body;

        if (sidebarOpen) {
            if (prevOverflow.current == null) prevOverflow.current = body.style.overflow;
            body.style.overflow = "hidden";
        } else if (prevOverflow.current !== null) {
            if (typeof prevOverflow.current === "string") {
                body.style.overflow = prevOverflow.current;
            }
            prevOverflow.current = null;
        }

        return () => {
            // при анмаунті гарантовано відновимо
            if (prevOverflow.current !== null) {
                if (typeof prevOverflow.current === "string") {
                    body.style.overflow = prevOverflow.current;
                }
                prevOverflow.current = null;
            }
        };
    }, [sidebarOpen]);

    // закриття по Escape
    useEffect(() => {
        if (!sidebarOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setSidebarOpen(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [sidebarOpen]);

    const openSidebar = useCallback(() => setSidebarOpen(true), []);
    const closeSidebar = useCallback(() => setSidebarOpen(false), []);
    const toggleSidebar = useCallback(() => setSidebarOpen((s) => !s), []);

    const value = useMemo<UIContextType>(
        () => ({ sidebarOpen, openSidebar, closeSidebar, toggleSidebar }),
        [sidebarOpen, openSidebar, closeSidebar, toggleSidebar]
    );

    return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = (): UIContextType => {
    const ctx = useContext(UIContext);
    if (!ctx) throw new Error("useUI must be used within UIProvider");
    return ctx;
};
