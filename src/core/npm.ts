import { Effect } from 'effect';
import latestVersion, {
    PackageNotFoundError,
    VersionNotFoundError,
} from 'latest-version';

export function getLatestVersion(name: string) {
    return Effect.tryPromise({
        async try() {
            return await latestVersion(name);
        },
        catch(error) {
            if (error instanceof PackageNotFoundError) {
                return error;
            }
            if (error instanceof VersionNotFoundError) {
                return error;
            }
            throw error;
        },
    });
}
