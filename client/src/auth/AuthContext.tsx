import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from 'react';
import {
    apiFetch,
    getToken,
    setToken,
    UNAUTHORIZED_EVENT,
} from '../api/client';

export interface User {
    id: string;
    email: string;
}

interface AuthContextValue {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    updateProfile: (data: {
        email?: string;
        password?: string;
    }) => Promise<void>;
    deleteAccount: () => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function authenticate(
    path: string,
    email: string,
    password: string,
): Promise<{ user: User; token: string }> {
    const res = await apiFetch(path, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
    }
    return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
    }, []);

    // Restore the session from a stored token on first load.
    useEffect(() => {
        if (!getToken()) {
            setLoading(false);
            return;
        }
        apiFetch('/api/auth/me')
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => setUser(data))
            .finally(() => setLoading(false));
    }, []);

    // A rejected token anywhere in the app logs the user out.
    useEffect(() => {
        const onUnauthorized = () => setUser(null);
        window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
        return () =>
            window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const { user, token } = await authenticate(
            '/api/auth/login',
            email,
            password,
        );
        setToken(token);
        setUser(user);
    }, []);

    const register = useCallback(async (email: string, password: string) => {
        const { user, token } = await authenticate(
            '/api/auth/register',
            email,
            password,
        );
        setToken(token);
        setUser(user);
    }, []);

    const updateProfile = useCallback(
        async (data: { email?: string; password?: string }) => {
            const res = await apiFetch('/api/auth/me', {
                method: 'PUT',
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' },
            });
            const body = await res.json();
            if (!res.ok) {
                throw new Error(body.error || 'Update failed');
            }
            setUser(body);
        },
        [],
    );

    const deleteAccount = useCallback(async () => {
        // RGPD erasure: purge the user's todos (backend) before deleting the
        // account itself (auth), so no orphaned data is left behind.
        await apiFetch('/api/items', { method: 'DELETE' });
        const res = await apiFetch('/api/auth/me', { method: 'DELETE' });
        if (!res.ok && res.status !== 204) {
            throw new Error('Account deletion failed');
        }
        logout();
    }, [logout]);

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                register,
                updateProfile,
                deleteAccount,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return ctx;
}
