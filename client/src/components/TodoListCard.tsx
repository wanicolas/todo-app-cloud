import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import { AddItemForm } from './AddNewItemForm';
import { ItemDisplay } from './ItemDisplay';
import ListGroup from 'react-bootstrap/ListGroup';
import { toast } from 'react-toastify';

interface TodoItem {
    id: string;
    name: string;
    completed: boolean;
}

export function TodoListCard() {
    const [items, setItems] = useState<TodoItem[] | null>(null);

    useEffect(() => {
        apiFetch('/api/items')
            .then((r) => r.json())
            .then(setItems)
            .catch((err) => {
                console.error(err);
                toast.error('Impossible de charger les tâches');
                setItems([]);
            });
    }, []);

    const onNewItem = useCallback(
        (newItem: TodoItem) => {
            setItems([...items!, newItem]);
        },
        [items],
    );

    const onItemUpdate = useCallback(
        (item: TodoItem) => {
            const index = items!.findIndex((i) => i.id === item.id);
            setItems([
                ...items!.slice(0, index),
                item,
                ...items!.slice(index + 1),
            ]);
        },
        [items],
    );

    const onItemRemoval = useCallback(
        (item: TodoItem) => {
            const index = items!.findIndex((i) => i.id === item.id);
            setItems([...items!.slice(0, index), ...items!.slice(index + 1)]);
        },
        [items],
    );

    if (items === null) return 'Loading...';

    return (
        <>
            <AddItemForm onNewItem={onNewItem} />
            {items.length === 0 && (
                <p className="text-center">No items yet! Add one above!</p>
            )}
            {items.length > 0 && (
                <ListGroup>
                    {items.map((item) => (
                        <ItemDisplay
                            key={item.id}
                            item={item}
                            onItemUpdate={onItemUpdate}
                            onItemRemoval={onItemRemoval}
                        />
                    ))}
                </ListGroup>
            )}
        </>
    );
}
