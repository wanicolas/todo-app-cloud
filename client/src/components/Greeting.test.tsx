import { render, screen, waitFor } from '@testing-library/react';
import { Greeting } from './Greeting';
import { apiFetch } from '../api/client';

vi.mock('../api/client', () => ({ apiFetch: vi.fn() }));

beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
});

test('renders greeting after fetch', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
        json: () => Promise.resolve({ greeting: 'Hello world!' }),
    } as Response);

    render(<Greeting />);

    await waitFor(() => {
        expect(screen.getByText('Hello world!')).toBeInTheDocument();
    });

    expect(apiFetch).toHaveBeenCalledWith('/api/greeting');
});

test('renders nothing before fetch completes', () => {
    vi.mocked(apiFetch).mockReturnValue(new Promise(() => {}));
    const { container } = render(<Greeting />);
    expect(container.querySelector('h1')).toBeNull();
});
