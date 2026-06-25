import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Account } from './Account';
import { apiFetch } from '../api/client';

const updateProfile = vi.fn();
const deleteAccount = vi.fn();
const navigate = vi.fn();

vi.mock('../api/client', () => ({ apiFetch: vi.fn() }));

vi.mock('../auth/AuthContext', () => ({
    useAuth: () => ({
        user: { id: '1', email: 'me@example.com' },
        updateProfile,
        deleteAccount,
    }),
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => navigate };
});

beforeEach(() => {
    updateProfile.mockReset();
    deleteAccount.mockReset();
    navigate.mockReset();
    vi.mocked(apiFetch).mockReset();
});

function renderAccount() {
    render(
        <MemoryRouter>
            <Account />
        </MemoryRouter>,
    );
}

test('updates the password through updateProfile', async () => {
    const user = userEvent.setup();
    updateProfile.mockResolvedValueOnce(undefined);
    renderAccount();

    await user.type(screen.getByLabelText('New password'), 'newpassword1');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
        expect(updateProfile).toHaveBeenCalledWith({
            password: 'newpassword1',
        });
    });
    expect(screen.getByText('Profile updated.')).toBeInTheDocument();
});

test('deletes the account and redirects to login', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    deleteAccount.mockResolvedValueOnce(undefined);
    renderAccount();

    await user.click(
        screen.getByRole('button', { name: /delete my account/i }),
    );

    await waitFor(() => {
        expect(deleteAccount).toHaveBeenCalled();
    });
    expect(navigate).toHaveBeenCalledWith('/login');
});

test('does not delete when the confirmation is cancelled', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderAccount();

    await user.click(
        screen.getByRole('button', { name: /delete my account/i }),
    );

    expect(deleteAccount).not.toHaveBeenCalled();
});

test('exports profile and todos combined', async () => {
    const user = userEvent.setup();
    vi.mocked(apiFetch)
        .mockResolvedValueOnce({
            json: () => Promise.resolve({ id: '1', email: 'me@example.com' }),
        } as Response)
        .mockResolvedValueOnce({
            json: () => Promise.resolve([{ id: 't1', name: 'Task' }]),
        } as Response);
    // jsdom lacks URL.createObjectURL; stub it for the download path.
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    URL.revokeObjectURL = vi.fn();

    renderAccount();
    await user.click(screen.getByRole('button', { name: /export my data/i }));

    await waitFor(() => {
        expect(apiFetch).toHaveBeenCalledWith('/api/auth/me/export');
    });
    expect(apiFetch).toHaveBeenCalledWith('/api/items');
    await waitFor(() => {
        expect(
            screen.getByText('Your data has been exported.'),
        ).toBeInTheDocument();
    });
});
