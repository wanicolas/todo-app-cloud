import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons/faTrash';
import faCheckSquare from '@fortawesome/fontawesome-free-regular/faCheckSquare';
import faSquare from '@fortawesome/fontawesome-free-regular/faSquare';
import { apiFetch } from '../api/client';
import { toast } from 'react-toastify';
import './ItemDisplay.scss';

interface TodoItem {
    id: string;
    name: string;
    completed: boolean;
}

interface ItemDisplayProps {
    item: TodoItem;
    onItemUpdate: (item: TodoItem) => void;
    onItemRemoval: (item: TodoItem) => void;
}

export function ItemDisplay({
    item,
    onItemUpdate,
    onItemRemoval,
}: ItemDisplayProps) {
    const toggleCompletion = () => {
        apiFetch(`/api/items/${item.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                name: item.name,
                completed: !item.completed,
            }),
            headers: { 'Content-Type': 'application/json' },
        })
            .then((r) => r.json())
            .then((updatedItem) => {
                if (updatedItem) {
                    onItemUpdate(updatedItem);
                }
            })
            .catch((err) => {
                console.error(err);
                toast.error('Erreur de mise à jour');
            });
    };

    const removeItem = () => {
        apiFetch(`/api/items/${item.id}`, { method: 'DELETE' })
            .then(() => onItemRemoval(item))
            .catch((err) => {
                console.error(err);
                toast.error('Erreur de suppression');
            });
    };

    return (
        <ListGroup.Item
            className={`item ${item.completed ? 'completed' : ''} p-0`}
        >
            <Container fluid>
                <Row>
                    <Col xs={2} className="text-center">
                        <Button
                            className="toggles"
                            size="sm"
                            variant="link"
                            onClick={toggleCompletion}
                            aria-label={
                                item.completed
                                    ? 'Mark item as incomplete'
                                    : 'Mark item as complete'
                            }
                        >
                            <FontAwesomeIcon
                                icon={item.completed ? faCheckSquare : faSquare}
                                aria-hidden="true"
                            />
                        </Button>
                    </Col>
                    <Col xs={8} className="name">
                        {item.name}
                    </Col>
                    <Col xs={2} className="text-center remove">
                        <Button
                            size="sm"
                            variant="link"
                            onClick={removeItem}
                            aria-label="Remove Item"
                        >
                            <FontAwesomeIcon
                                icon={faTrash}
                                className="text-danger"
                                aria-hidden="true"
                            />
                        </Button>
                    </Col>
                </Row>
            </Container>
        </ListGroup.Item>
    );
}
