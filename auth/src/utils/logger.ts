export const logger = {
    info(message: string, meta?: Record<string, unknown>) {
        console.log(
            JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'INFO',
                message,
                ...meta,
            }),
        );
    },
    warn(message: string, meta?: Record<string, unknown>) {
        console.warn(
            JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'WARN',
                message,
                ...meta,
            }),
        );
    },
    error(message: string, err?: unknown, meta?: Record<string, unknown>) {
        const errorDetail =
            err instanceof Error
                ? {
                      errorName: err.name,
                      errorMessage: err.message,
                      stack: err.stack,
                  }
                : err !== undefined
                  ? { errorDetail: err }
                  : {};

        console.error(
            JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'ERROR',
                message,
                ...errorDetail,
                ...meta,
            }),
        );
    },
};
