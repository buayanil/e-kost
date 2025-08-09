import { createContext, useContext, useEffect, useState } from "react";
import  { api }  from "../services/api";

type User = { id: number; username: string; /* ... */ };

type AuthCtx = {
    user: User | null;
    token: string | null;
    ready: boolean;            // <- important to avoid flicker
    login: (newToken: string) => Promise<void>;
    logout: () => void;
};

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [ready, setReady] = useState(false);

    // 1) Rehydrate token on first mount, verify with /me
    useEffect(() => {
        const saved = localStorage.getItem("token");
        if (!saved) {
            setReady(true);
            return;
        }
        // attach once so the /me call includes it
        api.defaults.headers.common.Authorization = `Bearer ${saved}`;
        setToken(saved);

        api.get<User>("/me")
            .then(({ data }) => setUser(data))
            .catch(() => {
                // invalid/expired token
                localStorage.removeItem("token");
                setToken(null);
                setUser(null);
                delete api.defaults.headers.common.Authorization;
            })
            .finally(() => setReady(true));
    }, []);

    // 2) Login: save token, set header, fetch /me
    // AuthContext login()
    const normalize = (t: string) => t.startsWith("Bearer ") ? t.slice(7) : t;

    const login = async (newToken: string) => {
        const bare = normalize(newToken);
        localStorage.setItem("token", bare);
        api.defaults.headers.common.Authorization = `Bearer ${bare}`;

        const { data } = await api.get("/me"); // should now succeed
        setUser(data); // see type below
    };


    // 3) Logout: clear everything
    const logout = () => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        delete api.defaults.headers.common.Authorization;
    };

    return (
        <AuthContext.Provider value={{ user, token, ready, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};
