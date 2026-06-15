import { apiFetch, getToken, setToken, UNAUTHORIZED_EVENT } from './client';

beforeEach(() => {
    localStorage.clear();
    global.fetch = vi.fn();
});

afterEach(() => {
    vi.restoreAllMocks();
});

test('stores and clears the token', () => {
    setToken('abc');
    expect(getToken()).toBe('abc');
    setToken(null);
    expect(getToken()).toBeNull();
});

test('adds the Authorization header when a token is present', async () => {
    setToken('my-token');
    vi.mocked(fetch).mockResolvedValueOnce({ status: 200 } as Response);

    await apiFetch('/api/items');

    const [, options] = vi.mocked(fetch).mock.calls[0];
    const headers = options!.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer my-token');
});

test('does not add the header without a token', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ status: 200 } as Response);

    await apiFetch('/api/greeting');

    const [, options] = vi.mocked(fetch).mock.calls[0];
    const headers = options!.headers as Headers;
    expect(headers.get('Authorization')).toBeNull();
});

test('clears the token and emits an event on 401', async () => {
    setToken('stale');
    vi.mocked(fetch).mockResolvedValueOnce({ status: 401 } as Response);
    const onUnauthorized = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);

    await apiFetch('/api/items');

    expect(getToken()).toBeNull();
    expect(onUnauthorized).toHaveBeenCalled();
    window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
});
