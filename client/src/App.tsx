import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { TodoListCard } from './components/TodoListCard';
import { Greeting } from './components/Greeting';
import { useAuth } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Account } from './pages/Account';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

function TodoPage() {
    const { user, logout } = useAuth();

    return (
        <>
            <header className="d-flex justify-content-end align-items-center mt-3" role="banner">
                <span className="text-muted me-3">{user?.email}</span>
                <nav aria-label="Account navigation">
                    <Link
                        to="/account"
                        className="btn btn-outline-primary btn-sm me-2"
                    >
                        My account
                    </Link>
                    <Button variant="outline-secondary" size="sm" onClick={logout}>
                        Log out
                    </Button>
                </nav>
            </header>
            <Greeting />
            <TodoListCard />
        </>
    );
}

function App() {
    return (
        <Container as="main">
            <Row>
                <Col md={{ offset: 3, span: 6 }}>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route
                            path="/"
                            element={
                                <ProtectedRoute>
                                    <TodoPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/account"
                            element={
                                <ProtectedRoute>
                                    <Account />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Col>
            </Row>
        </Container>
    );
}

export default App;
