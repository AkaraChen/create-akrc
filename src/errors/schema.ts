export class ParserError extends Error {
    __tag = 'ParseFailure';

    public readonly file: string;

    constructor(file: string) {
        super(`Failed to parse file: ${file}`);
        this.file = file;
    }
}
