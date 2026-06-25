import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddItemForm } from './AddNewItemForm';
import { apiFetch } from '../api/client';

vi.mock('../api/client', () => ({ apiFetch: vi.fn() }));

beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
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

    vi.mocked(apiFetch).mockResolvedValueOnce({
        json: () => Promise.resolve(mockItem),
    } as Response);

    render(<AddItemForm onNewItem={onNewItem} />);

    await user.type(screen.getByPlaceholderText('New Item'), 'Test');
    await user.click(screen.getByRole('button', { name: /add item/i }));

    await waitFor(() => {
        expect(onNewItem).toHaveBeenCalledWith(mockItem);
    });
    expect(screen.getByPlaceholderText('New Item')).toHaveValue('');
});
