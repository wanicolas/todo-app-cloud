export const logger = {
    info(message: string, meta?: Record<string, any>) {
        console.log(
            JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'INFO',
                message,
                ...meta,
            }),
        );
    },
    warn(message: string, meta?: Record<string, any>) {
        console.warn(
            JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'WARN',
                message,
                ...meta,
            }),
        );
    },
    error(message: string, err?: any, meta?: Record<string, any>) {
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
