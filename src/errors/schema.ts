export class ParserError extends Error {
    __tag = 'ParseFailure';

    constructor(public readonly file: string) {
        super(`Failed to parse file: ${file}`);
    }
}
