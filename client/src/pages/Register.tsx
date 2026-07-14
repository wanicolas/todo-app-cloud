import { FormEvent, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [consent, setConsent] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!consent) {
            setError(
                'You must consent to the processing of your data to register.',
            );
            return;
        }
        setError(null);
        setSubmitting(true);
        try {
            await register(email, password);
            navigate('/');
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Card className="mt-5">
            <Card.Body>
                <Card.Title as="h1" className="text-center h3 mb-4">
                    Register
                </Card.Title>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={onSubmit}>
                    <Form.Group className="mb-3" controlId="register-email">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="register-password">
                        <Form.Label>Password</Form.Label>
                        <Form.Control
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={8}
                            required
                        />
                        <Form.Text muted>At least 8 characters.</Form.Text>
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="register-consent">
                        <Form.Check
                            type="checkbox"
                            label="I consent to the collection and processing of my personal data (email) in accordance with the GDPR."
                            checked={consent}
                            onChange={(e) => setConsent(e.target.checked)}
                            required
                        />
                    </Form.Group>
                    <Button
                        type="submit"
                        variant="success"
                        className="w-100"
                        disabled={submitting}
                    >
                        {submitting ? 'Creating account...' : 'Register'}
                    </Button>
                </Form>
                <p className="text-center mt-3 mb-0">
                    Already have an account? <Link to="/login">Log in</Link>
                </p>
            </Card.Body>
        </Card>
    );
}
