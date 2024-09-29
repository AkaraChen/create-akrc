import { Effect, pipe } from 'effect';
import enquirer, { type PromptOptions } from 'enquirer';
import latestVersion, {
    PackageNotFoundError,
    VersionNotFoundError,
} from 'latest-version';
import { packageDirectory } from 'pkg-dir';

type UnknownError = Error;
type LatestVersionError =
    | PackageNotFoundError
    | VersionNotFoundError
    | UnknownError;

export function getLatestVersion(name: string) {
    return pipe(
        Effect.log(`Getting the latest version of ${name}`),
        Effect.andThen(
            Effect.tryPromise({
                try: () => latestVersion(name),
                catch: (e) => e as LatestVersionError,
            }),
        ),
        Effect.catchAll((e) => {
            if (
                e instanceof PackageNotFoundError ||
                e instanceof VersionNotFoundError
            ) {
                return Effect.dieMessage(
                    `Failed to get the latest version of ${name}`,
                );
            }
            return Effect.die(e);
        }),
        Effect.tap((version) =>
            Effect.log(`The latest version of ${name} is ${version}`),
        ),
    );
}

export function prompt<T>(options: PromptOptions) {
    return Effect.tryPromise(() => enquirer.prompt<T>(options)).pipe(
        Effect.catchAll(() => Effect.dieMessage('Failed to prompt')),
    );
}

export function pkgDir(cwd?: string) {
    return Effect.promise(() => packageDirectory({ cwd }));
}
