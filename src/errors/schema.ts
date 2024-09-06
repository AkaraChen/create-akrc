export class ParserError extends Error {
    __tag = 'ParseFailure';

    constructor(public readonly file: string) {
        super(`Failed to parse file: ${file}`);
    }
}

export class ZodValidationError extends Error {
    __tag = 'ZodValidationError';

    constructor(public readonly errors: any) {
        super('Validation failed');
    }
}
