import { type PM, detectPM, findRepoRoot } from '@akrc/monorepo-tools';
import { Command, Path } from '@effect/platform';
import { FileSystem } from '@effect/platform';
import { Effect, pipe } from 'effect';
import enquirer from 'enquirer';
import { getDep } from 'fnpm-toolkit';
import Handlebars from 'handlebars';
import { packageDirectory } from 'pkg-dir';
import { omit } from 'radash';
import { glob } from 'tinyglobby';
import type { PackageJson } from 'type-fest';
import { ParserError } from '../errors/schema';
import { getLatestVersion } from './npm';

export class Context {
    constructor(
        public readonly root: string,
        public readonly pm: PM,
    ) {}

    json<T>(path: string) {
        return Effect.gen(function* () {
            const fs = yield* FileSystem.FileSystem;
            const content = yield* fs.readFile(path);
            const str = content.toString();
            const json = yield* Effect.try<T, ParserError>({
                try: () => JSON.parse(str),
                catch: () => new ParserError(path),
            });
            return json;
        });
    }

    writeJson<T>(path: string, json: T | string) {
        return Effect.gen(function* () {
            const fs = yield* FileSystem.FileSystem;
            yield* fs.writeFile(
                path,
                new TextEncoder().encode(
                    typeof json === 'string'
                        ? json
                        : JSON.stringify(json, null, 2),
                ),
            );
        }).pipe(Effect.catchAll(Effect.logFatal));
    }

    updateJson<T>(path: string, updater: (json: T) => Promise<T>) {
        return pipe(
            this.json<T>(path),
            Effect.andThen((json) => Effect.promise(() => updater(json))),
            Effect.andThen((json) => this.writeJson(path, json)),
        );
    }

    package = this.json<PackageJson>('package.json');

    updatePackage(updator: (pkg: PackageJson) => Promise<PackageJson>) {
        return this.updateJson<PackageJson>('package.json', updator);
    }

    hasDep(name: string) {
        return pipe(
            this.package,
            Effect.andThen((pkg) => getDep(pkg, name)),
            Effect.map((dep) => Boolean(dep)),
        );
    }

    addDeps(
        ...deps: Array<{
            name: string;
            version?: string;
            field: 'dependencies' | 'devDependencies';
        }>
    ) {
        return pipe(
            Effect.log(
                `Add dependencies: ${deps.map((dep) => dep.name).join(', ')}`,
            ),
            Effect.andThen(this.package),
            Effect.andThen((pkg) =>
                Effect.gen(function* () {
                    yield* Effect.forEach(deps, (dep) => {
                        return Effect.gen(function* () {
                            if (getDep(pkg, dep.name)) {
                                return;
                            }
                            const version = dep.version
                                ? dep.version
                                : yield* getLatestVersion(dep.name);
                            pkg[dep.field] = {
                                ...pkg[dep.field],
                                [dep.name]: version,
                            };
                        });
                    });
                    return pkg;
                }),
            ),
            Effect.andThen((pkg) => this.updatePackage(async () => pkg)),
        );
    }

    addScripts(scripts: Record<string, string>) {
        return pipe(
            Effect.log(`Add scripts: ${Object.keys(scripts).join(', ')}`),
            Effect.andThen(
                this.updateJson<PackageJson>('package.json', async (pkg) => {
                    pkg.scripts = {
                        ...pkg.scripts,
                        ...scripts,
                    };
                    return pkg;
                }),
            ),
        );
    }

    removeDeps(...deps: string[]) {
        return pipe(
            Effect.log(`Remove dependencies: ${deps.join(', ')}`),
            Effect.andThen(
                this.updateJson<PackageJson>('package.json', async (pkg) => {
                    for (const dep of deps) {
                        if (pkg.dependencies) {
                            pkg.dependencies = omit(pkg.dependencies, [dep]);
                        }
                        if (pkg.devDependencies) {
                            pkg.devDependencies = omit(pkg.devDependencies, [
                                dep,
                            ]);
                        }
                    }
                    return pkg;
                }),
            ),
        );
    }

    removeScripts(scripts: Record<string, string>) {
        return pipe(
            Effect.andThen(
                Effect.log(
                    `Remove scripts: ${Object.keys(scripts).join(', ')}`,
                ),
                this.updateJson<PackageJson>('package.json', async (pkg) => {
                    for (const script of Object.keys(scripts)) {
                        if (pkg.scripts?.[script] === scripts[script]) {
                            pkg.scripts = omit(pkg.scripts!, [script]);
                        }
                    }
                    return pkg;
                }),
            ),
        );
    }

    makeCommand(strings: string[]) {
        return pipe(
            Command.make(strings.at(0)!, ...strings.slice(1)),
            Command.workingDirectory(this.root),
        );
    }

    join(...paths: string[]) {
        return pipe(
            Effect.gen(function* () {
                return yield* Path.Path;
            }),
            Effect.andThen((path) => path.join(this.root, ...paths)),
        );
    }

    template(name: string) {
        return Effect.gen(function* () {
            const path = yield* Path.Path;
            const fs = yield* FileSystem.FileSystem;
            const url = yield* path.fromFileUrl(new URL(import.meta.url));
            const dirname = yield* Effect.promise(() =>
                packageDirectory({
                    cwd: path.dirname(url),
                }),
            );
            if (!dirname) {
                throw new Error('Cannot find package directory');
            }
            const filePath = path.join(
                dirname,
                './src/templates',
                `${name}.hbs`,
            );
            const content = yield* fs
                .readFile(filePath)
                .pipe(Effect.andThen((buffer) => buffer.toString()));
            return Handlebars.compile(content);
        });
    }

    glob(pattern: string | string[]) {
        const patterns = Array.isArray(pattern) ? pattern : [pattern];
        return Effect.promise(() =>
            glob(patterns, {
                cwd: this.root,
                absolute: false,
            }),
        );
    }
}

export const createContext = Effect.gen(function* () {
    const cwd = process.cwd();
    const root = yield* Effect.tryPromise(() => findRepoRoot(cwd));
    const pm = yield* Effect.tryPromise(async () =>
        detectPM(root).unwrapOr(
            await enquirer
                .prompt<{
                    pm: PM;
                }>({
                    type: 'select',
                    name: 'pm',
                    message: 'Select package manager',
                    choices: ['npm', 'yarn', 'pnpm'] as PM[],
                })
                .then((res) => res.pm),
        ),
    );
    return new Context(root, pm);
});
