import { Effect, pipe } from 'effect';
import latestVersion, {
    PackageNotFoundError,
    VersionNotFoundError,
} from 'latest-version';

export function getLatestVersion(name: string) {
    return pipe(
        Effect.log(`Getting the latest version of ${name}`),
        Effect.andThen(
            Effect.tryPromise({
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
            }),
        ),
        Effect.tap((version) =>
            Effect.log(`The latest version of ${name} is ${version}`),
        ),
    );
}