import { Effect } from 'effect';
import { getPackument } from 'query-registry';

export function getLatestVersion(name: string) {
    return Effect.promise(async () => {
        const packument = await getPackument(name);
        return packument['dist-tags'].latest;
    });
}
