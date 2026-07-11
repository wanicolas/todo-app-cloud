import { FormEvent, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export function Account() {
    const { user, updateProfile, deleteAccount } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState(user?.email ?? '');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const onUpdate = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        setBusy(true);
        try {
            const data: { email?: string; password?: string } = {};
            if (email && email !== user?.email) data.email = email;
            if (password) data.password = password;
            if (!data.email && !data.password) {
                setMessage('Nothing to update.');
                return;
            }
            await updateProfile(data);
            setPassword('');
            setMessage('Profile updated.');
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setBusy(false);
        }
    };

    // RGPD portability: download the account profile together with its todos.
    const onExport = async () => {
        setError(null);
        setMessage(null);
        try {
            const [profileRes, todosRes] = await Promise.all([
                apiFetch('/api/auth/me/export'),
                apiFetch('/api/items'),
            ]);
            const account = await profileRes.json();
            const todos = await todosRes.json();
            const payload = JSON.stringify({ account, todos }, null, 2);

            const url = URL.createObjectURL(
                new Blob([payload], { type: 'application/json' }),
            );
            const a = document.createElement('a');
            a.href = url;
            a.download = 'my-data.json';
            a.click();
            URL.revokeObjectURL(url);
            setMessage('Your data has been exported.');
        } catch {
            setError('Export failed.');
        }
    };

    const onDelete = async () => {
        if (
            !window.confirm(
                'Delete your account and all your todos? This cannot be undone.',
            )
        ) {
            return;
        }
        setError(null);
        setBusy(true);
        try {
            await deleteAccount();
            navigate('/login');
        } catch (err) {
            setError((err as Error).message);
            setBusy(false);
        }
    };

    return (
        <Card className="mt-4">
            <Card.Body>
                <header className="d-flex justify-content-between align-items-center mb-4">
                    <Card.Title as="h1" className="h3 mb-0">My account</Card.Title>
                    <nav aria-label="Back navigation">
                        <Link to="/">← Back to todos</Link>
                    </nav>
                </header>

                {message && <Alert variant="success">{message}</Alert>}
                {error && <Alert variant="danger">{error}</Alert>}

                <Form onSubmit={onUpdate}>
                    <Form.Group className="mb-3" controlId="account-email">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="account-password">
                        <Form.Label>New password</Form.Label>
                        <Form.Control
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={8}
                            placeholder="Leave blank to keep current"
                        />
                    </Form.Group>
                    <Button type="submit" variant="primary" disabled={busy}>
                        Save changes
                    </Button>
                </Form>

                <hr className="my-4" />

                <h2 className="h6">Your data (RGPD)</h2>
                <div className="d-flex gap-2 mt-2">
                    <Button variant="outline-secondary" onClick={onExport}>
                        Export my data
                    </Button>
                    <Button
                        variant="outline-danger"
                        onClick={onDelete}
                        disabled={busy}
                    >
                        Delete my account
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
}
