import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddItemForm } from './AddNewItemForm';

beforeEach(() => {
    global.fetch = vi.fn();
});

afterEach(() => {
    vi.restoreAllMocks();
});

test('add button is disabled when input is empty', () => {
    render(<AddItemForm onNewItem={vi.fn()} />);
    expect(screen.getByRole('button', { name: /add item/i })).toBeDisabled();
});

test('add button is enabled after typing', async () => {
    const user = userEvent.setup();
    render(<AddItemForm onNewItem={vi.fn()} />);

    await user.type(screen.getByPlaceholderText('New Item'), 'Test');
    expect(
        screen.getByRole('button', { name: /add item/i }),
    ).not.toBeDisabled();
});

test('submits new item and clears input', async () => {
    const user = userEvent.setup();
    const onNewItem = vi.fn();
    const mockItem = { id: '1', name: 'Test', completed: false };

    fetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockItem),
    });

    render(<AddItemForm onNewItem={onNewItem} />);

    await user.type(screen.getByPlaceholderText('New Item'), 'Test');
    await user.click(screen.getByRole('button', { name: /add item/i }));

    await waitFor(() => {
        expect(onNewItem).toHaveBeenCalledWith(mockItem);
    });
    expect(screen.getByPlaceholderText('New Item')).toHaveValue('');
});
