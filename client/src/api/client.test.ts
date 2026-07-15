import { apiFetch, UNAUTHORIZED_EVENT } from './client';

beforeEach(() => {
    global.fetch = vi.fn();
});

afterEach(() => {
    vi.restoreAllMocks();
});

test('adds credentials include option to fetch', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, status: 200 } as Response);

    await apiFetch('/api/items');

    const [, options] = vi.mocked(fetch).mock.calls[0];
    expect(options!.credentials).toBe('include');
});

test('emits an event on 401', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 401 } as Response);
    const onUnauthorized = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);

    try {
        await apiFetch('/api/items');
    } catch {
        // ignore expected error
    }

    expect(onUnauthorized).toHaveBeenCalled();
    window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
});

