// Centralized API access: sends credentials (HttpOnly cookie) on every
// request and signals the app to log out when the token is rejected (401).

export const UNAUTHORIZED_EVENT = 'auth:unauthorized';

export async function apiFetch(
    path: string,
    options: RequestInit = {},
): Promise<Response> {
    const headers = new Headers(options.headers || {});

    const response = await fetch(path, { ...options, headers, credentials: 'include' });

    if (response.status === 401) {
        window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }

    return response;
}
