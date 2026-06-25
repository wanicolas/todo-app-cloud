// Centralized API access: injects the JWT (kept in localStorage) on every
// request and signals the app to log out when the token is rejected (401).

const TOKEN_KEY = 'auth_token';

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
    if (token) {
        localStorage.setItem(TOKEN_KEY, token);
    } else {
        localStorage.removeItem(TOKEN_KEY);
    }
}

export const UNAUTHORIZED_EVENT = 'auth:unauthorized';

export async function apiFetch(
    path: string,
    options: RequestInit = {},
): Promise<Response> {
    const token = getToken();
    const headers = new Headers(options.headers || {});
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const response = await fetch(path, { ...options, headers });

    if (response.status === 401) {
        setToken(null);
        window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }

    return response;
}
