import { Effect } from 'effect';
import { getPackument } from 'query-registry';
import { ZodValidationError } from '../errors/schema';

export function getLatestVersion(name: string) {
    return Effect.tryPromise({
        async try() {
            const packument = await getPackument(name);
            return packument['dist-tags'].latest;
        },
        catch() {
            return new ZodValidationError('Failed to get latest version');
        },
    });
}
