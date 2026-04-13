import { render, screen, waitFor } from '@testing-library/react';
import { TodoListCard } from './TodoListCard';

beforeEach(() => {
    global.fetch = vi.fn();
});

afterEach(() => {
    vi.restoreAllMocks();
});

test('shows Loading... initially', () => {
    fetch.mockReturnValue(new Promise(() => {}));
    render(<TodoListCard />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
});

test('shows empty state when no items', async () => {
    fetch.mockResolvedValueOnce({
        json: () => Promise.resolve([]),
    });

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

    fetch.mockResolvedValueOnce({
        json: () => Promise.resolve(items),
    });

    render(<TodoListCard />);

    await waitFor(() => {
        expect(screen.getByText('Buy milk')).toBeInTheDocument();
    });
    expect(screen.getByText('Walk the dog')).toBeInTheDocument();
});
