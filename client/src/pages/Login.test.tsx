import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Login } from './Login';

const login = vi.fn();
const navigate = vi.fn();

vi.mock('../auth/AuthContext', () => ({
    useAuth: () => ({ login }),
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => navigate };
});

beforeEach(() => {
    login.mockReset();
    navigate.mockReset();
});

function renderLogin() {
    render(
        <MemoryRouter>
            <Login />
        </MemoryRouter>,
    );
}

test('logs in and navigates home on success', async () => {
    const user = userEvent.setup();
    login.mockResolvedValueOnce(undefined);
    renderLogin();

    await user.type(screen.getByLabelText('Email'), 'a@b.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
        expect(login).toHaveBeenCalledWith('a@b.com', 'password123');
    });
    expect(navigate).toHaveBeenCalledWith('/');
});

test('shows an error message on failure', async () => {
    const user = userEvent.setup();
    login.mockRejectedValueOnce(new Error('Invalid email or password'));
    renderLogin();

    await user.type(screen.getByLabelText('Email'), 'a@b.com');
    await user.type(screen.getByLabelText('Password'), 'wrongpass1');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
        expect(
            screen.getByText('Invalid email or password'),
        ).toBeInTheDocument();
    });
    expect(navigate).not.toHaveBeenCalled();
});
