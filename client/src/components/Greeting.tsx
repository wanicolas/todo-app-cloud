import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';

export function Greeting() {
    const [greeting, setGreeting] = useState<string | null>(null);

    useEffect(() => {
        apiFetch('/api/greeting')
            .then((res) => res.json())
            .then((data) => setGreeting(data.greeting));
    }, [setGreeting]);

    if (!greeting) return null;

    return <h1 className="text-center mb-5">{greeting}</h1>;
}
