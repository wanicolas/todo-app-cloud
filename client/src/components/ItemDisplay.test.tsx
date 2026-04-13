import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ItemDisplay } from './ItemDisplay';

const ITEM = { id: '1', name: 'Buy milk', completed: false };
const COMPLETED_ITEM = { id: '2', name: 'Done task', completed: true };

beforeEach(() => {
    global.fetch = vi.fn();
});

afterEach(() => {
    vi.restoreAllMocks();
});

test('renders item name', () => {
    render(
        <ItemDisplay
            item={ITEM}
            onItemUpdate={vi.fn()}
            onItemRemoval={vi.fn()}
        />,
    );
    expect(screen.getByText('Buy milk')).toBeInTheDocument();
});

test('shows "Mark item as complete" for incomplete item', () => {
    render(
        <ItemDisplay
            item={ITEM}
            onItemUpdate={vi.fn()}
            onItemRemoval={vi.fn()}
        />,
    );
    expect(
        screen.getByRole('button', { name: 'Mark item as complete' }),
    ).toBeInTheDocument();
});

test('shows "Mark item as incomplete" for completed item', () => {
    render(
        <ItemDisplay
            item={COMPLETED_ITEM}
            onItemUpdate={vi.fn()}
            onItemRemoval={vi.fn()}
        />,
    );
    expect(
        screen.getByRole('button', { name: 'Mark item as incomplete' }),
    ).toBeInTheDocument();
});

test('toggle calls PUT and onItemUpdate', async () => {
    const user = userEvent.setup();
    const onItemUpdate = vi.fn();
    const updatedItem = { ...ITEM, completed: true };

    fetch.mockResolvedValueOnce({
        json: () => Promise.resolve(updatedItem),
    });

    render(
        <ItemDisplay
            item={ITEM}
            onItemUpdate={onItemUpdate}
            onItemRemoval={vi.fn()}
        />,
    );

    await user.click(
        screen.getByRole('button', { name: 'Mark item as complete' }),
    );

    await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
            '/api/items/1',
            expect.objectContaining({ method: 'PUT' }),
        );
    });

    await waitFor(() => {
        expect(onItemUpdate).toHaveBeenCalledWith(updatedItem);
    });
});

test('delete calls DELETE and onItemRemoval', async () => {
    const user = userEvent.setup();
    const onItemRemoval = vi.fn();

    fetch.mockResolvedValueOnce({});

    render(
        <ItemDisplay
            item={ITEM}
            onItemUpdate={vi.fn()}
            onItemRemoval={onItemRemoval}
        />,
    );

    await user.click(screen.getByRole('button', { name: 'Remove Item' }));

    await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/items/1', {
            method: 'DELETE',
        });
    });

    await waitFor(() => {
        expect(onItemRemoval).toHaveBeenCalledWith(ITEM);
    });
});
