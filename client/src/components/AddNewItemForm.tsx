import { FormEvent, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { apiFetch } from '../api/client';
import { toast } from 'react-toastify';

interface TodoItem {
    id: string;
    name: string;
    completed: boolean;
}

interface AddItemFormProps {
    onNewItem: (item: TodoItem) => void;
}

export function AddItemForm({ onNewItem }: AddItemFormProps) {
    const [newItem, setNewItem] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const submitNewItem = (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const options = {
            method: 'POST',
            body: JSON.stringify({ name: newItem }),
            headers: { 'Content-Type': 'application/json' },
        };

        apiFetch('/api/items', options)
            .then((r) => r.json())
            .then((item: TodoItem) => {
                onNewItem(item);
                setNewItem('');
            })
            .catch((err) => {
                console.error("Erreur d'ajout:", err);
                toast.error("Impossible d'ajouter la tâche");
            })
            .finally(() => setSubmitting(false));
    };

    return (
        <Form onSubmit={submitNewItem}>
            <Form.Label htmlFor="new-item-input" visuallyHidden>
                New item
            </Form.Label>
            <InputGroup className="mb-3">
                <Form.Control
                    id="new-item-input"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    type="text"
                    placeholder="New Item"
                    aria-label="New item"
                />
                <Button
                    type="submit"
                    variant="success"
                    disabled={!newItem.length}
                    className={submitting ? 'disabled' : ''}
                >
                    {submitting ? 'Adding...' : 'Add Item'}
                </Button>
            </InputGroup>
        </Form>
    );
}
