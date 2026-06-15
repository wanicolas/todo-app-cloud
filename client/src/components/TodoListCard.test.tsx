import { render, screen, waitFor } from '@testing-library/react';
import { TodoListCard } from './TodoListCard';
import { apiFetch } from '../api/client';

vi.mock('../api/client', () => ({ apiFetch: vi.fn() }));

beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
});

test('shows Loading... initially', () => {
    vi.mocked(apiFetch).mockReturnValue(new Promise(() => {}));
    render(<TodoListCard />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
});

test('shows empty state when no items', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
        json: () => Promise.resolve([]),
    } as Response);

    render(<TodoListCard />);

    await waitFor(() => {
        expect(
            screen.getByText('No items yet! Add one above!'),
        ).toBeInTheDocument();
    });
});

test('renders items after fetch', async () => {
    const items = [
        { id: '1', name: 'Buy milk', completed: false },
        { id: '2', name: 'Walk the dog', completed: true },
    ];

    vi.mocked(apiFetch).mockResolvedValueOnce({
        json: () => Promise.resolve(items),
    } as Response);

    render(<TodoListCard />);

    await waitFor(() => {
        expect(screen.getByText('Buy milk')).toBeInTheDocument();
    });
    expect(screen.getByText('Walk the dog')).toBeInTheDocument();
});
