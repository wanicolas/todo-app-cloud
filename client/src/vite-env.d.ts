/// <reference types="vite/client" />

declare module '*.scss' {
    const content: Record<string, string>;
    export default content;
}

declare module '@fortawesome/fontawesome-free-regular/faCheckSquare' {
    import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
    const faCheckSquare: IconDefinition;
    export default faCheckSquare;
}

declare module '@fortawesome/fontawesome-free-regular/faSquare' {
    import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
    const faSquare: IconDefinition;
    export default faSquare;
}
