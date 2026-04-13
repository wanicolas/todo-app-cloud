import { render, screen, waitFor } from '@testing-library/react';
import { Greeting } from './Greeting';

beforeEach(() => {
    global.fetch = vi.fn();
});

afterEach(() => {
    vi.restoreAllMocks();
});

test('renders greeting after fetch', async () => {
    fetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ greeting: 'Hello world!' }),
    });

    render(<Greeting />);

    await waitFor(() => {
        expect(screen.getByText('Hello world!')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith('/api/greeting');
});

test('renders nothing before fetch completes', () => {
    fetch.mockReturnValue(new Promise(() => {}));
    const { container } = render(<Greeting />);
    expect(container.querySelector('h1')).toBeNull();
});
