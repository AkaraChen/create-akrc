import { ParserError } from '@/errors/schema';
import { type PM, detectPM } from '@akrc/monorepo-tools';
import { Command, CommandExecutor, FileSystem, Path } from '@effect/platform';
import { Effect, Option, pipe } from 'effect';
import enquirer from 'enquirer';
import { getDep } from 'fnpm-toolkit';
import Handlebars from 'handlebars';
import { packageDirectory } from 'pkg-dir';
import { commands } from 'pm-combo';
import { omit } from 'radash';
import { glob } from 'tinyglobby';
import type { PackageJson } from 'type-fest';
import { getLatestVersion } from './utils';

const decoder = new TextDecoder();
const encoder = new TextEncoder();

type DepInput = {
    name: string;
    version?: string;
    field?: 'dependencies' | 'devDependencies';
};

export class Context {
    constructor(
        public readonly root: string,
        public readonly pm: PM,
    ) {}

    json<T>(path: string) {
        return Effect.gen(function* () {
            const fs = yield* FileSystem.FileSystem;
            const content = yield* fs.readFile(path);
            const str = decoder.decode(content);
            const json = yield* Effect.try<T, ParserError>({
                try: () => JSON.parse(str),
                catch: () => new ParserError(path),
            });
            return json;
        }).pipe(
            Effect.catchIf(
                (err): err is ParserError => err instanceof ParserError,
                () => Effect.die(new Error(`Failed to parse JSON in ${path}`)),
            ),
        );
    }

    writeJson<T>(path: string, json: T | string) {
        return Effect.gen(function* () {
            const fs = yield* FileSystem.FileSystem;
            yield* fs.writeFile(
                path,
                encoder.encode(
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

    addDeps(...inputDeps: Array<DepInput | string>) {
        const deps = inputDeps.map((dep) =>
            typeof dep === 'string' ? { name: dep } : dep,
        );
        return pipe(
            Effect.log(
                `Add dependencies: ${deps.map((dep) => dep.name).join(', ')}`,
            ),
            Effect.andThen(this.package),
            Effect.andThen((pkg) =>
                Effect.gen(function* () {
                    yield* Effect.forEach(deps, (dep) => {
                        return Effect.gen(function* () {
                            const { name, field = 'devDependencies' } = dep;
                            if (getDep(pkg, name)) {
                                yield* Effect.log(
                                    `Dependency ${name} already exists, skippping`,
                                );
                                return;
                            }
                            const version = dep.version
                                ? dep.version
                                : yield* getLatestVersion(name).pipe(
                                      Effect.catchAll(Effect.die),
                                  );
                            pkg[field] = {
                                ...pkg[field],
                                [name]: version,
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
            Effect.andThen(this.package),
            Effect.andThen((pkg) =>
                Effect.gen(function* () {
                    for (const [name, script] of Object.entries(scripts)) {
                        if (pkg.scripts?.[name]) {
                            const { confirmed } = yield* Effect.promise<{
                                confirmed: boolean;
                            }>(() =>
                                enquirer.prompt({
                                    type: 'confirm',
                                    name: 'confirmed',
                                    message: `Script ${name} already exists. Do you want to overwrite it?`,
                                }),
                            );
                            if (!confirmed) {
                                continue;
                            }
                        }
                        pkg.scripts = {
                            ...pkg.scripts,
                            [name]: script,
                        };
                    }
                    return pkg;
                }),
            ),
            Effect.andThen((pkg) => this.writeJson('package.json', pkg)),
        );
    }

    removeDeps(...deps: string[]) {
        return pipe(
            Effect.log(`Remove dependencies: ${deps.join(', ')}`),
            Effect.andThen(
                this.updateJson<PackageJson>('package.json', async (pkg) => {
                    for (const dep of deps) {
                        pkg.dependencies &&= omit(pkg.dependencies, [dep]);
                        pkg.devDependencies &&= omit(pkg.devDependencies, [
                            dep,
                        ]);
                    }
                    return pkg;
                }),
            ),
        );
    }

    removeScripts(scripts: Record<string, string>) {
        return pipe(
            Effect.log(`Remove scripts: ${Object.keys(scripts).join(', ')}`),
            Effect.andThen(this.package),
            Effect.andThen((pkg) => {
                return Effect.gen(function* () {
                    for (const script of Object.keys(scripts)) {
                        if (pkg.scripts?.[script] === scripts[script]) {
                            pkg.scripts = omit(pkg.scripts!, [script]);
                        } else {
                            yield* Effect.log(
                                `Script ${script} has manually modified, skipping`,
                            );
                        }
                        return pkg;
                    }
                });
            }),
            Effect.andThen((pkg) =>
                this.updatePackage(async () => pkg as PackageJson),
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
                .pipe(Effect.andThen((content) => decoder.decode(content)));
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

    encoder = encoder;
    decoder = decoder;

    addGitignore(label: string, patterns: string[]) {
        return pipe(
            Effect.log(`Add ${label} to .gitignore`),
            Effect.andThen(this.join('.gitignore')),
            Effect.andThen((filePath) => {
                return Effect.gen(function* () {
                    const fs = yield* FileSystem.FileSystem;
                    const content = `# ${label}\n${patterns.join('\n')}\n`;
                    const exists = yield* fs.exists(filePath);
                    if (!exists) {
                        yield* fs.writeFile(filePath, encoder.encode(content));
                        return;
                    }
                    const oldContent = yield* fs
                        .readFile(filePath)
                        .pipe(
                            Effect.andThen((content) =>
                                decoder.decode(content),
                            ),
                        );
                    const newContent = `${oldContent}\n${content}`;
                    yield* fs.writeFile(filePath, encoder.encode(newContent));
                });
            }),
        );
    }
}

const selectPM = Effect.promise(() =>
    enquirer.prompt<{
        pm: PM;
    }>({
        type: 'select',
        name: 'pm',
        message: 'Select package manager',
        choices: ['npm', 'yarn', 'pnpm'],
    }),
).pipe(Effect.map((result) => result.pm));

export const createContext = Effect.gen(function* () {
    const cwd = process.cwd();
    const root = yield* Effect.promise(() => packageDirectory({ cwd }));
    if (!root) {
        const { confirmed } = yield* Effect.promise(() =>
            enquirer.prompt<{
                confirmed: boolean;
            }>({
                type: 'confirm',
                name: 'confirmed',
                message:
                    'Cannot find package directory. Do you want to use current directory as root?',
            }),
        );
        if (confirmed) {
            const pm = yield* selectPM;
            const exec = yield* CommandExecutor.CommandExecutor;
            const [command, ...args] = commands.init.concat(pm, {
                interactively: false,
            });
            yield* Effect.log('Initializing package');
            const process = yield* exec.start(
                pipe(Command.make(command!, ...args)),
            );
            yield* process.exitCode;
            return new Context(cwd, pm);
        }
        yield* Effect.die(new Error('Cannot find package directory'));
    }
    const pm = yield* Effect.try(() => detectPM(root!)).pipe(
        Effect.map((pm) => Option.fromNullable(pm.value as PM)),
        Effect.andThen((pm) =>
            Effect.gen(function* () {
                if (Option.isSome(pm)) {
                    return Option.getOrThrow(pm);
                }
                return yield* selectPM;
            }),
        ),
    );
    yield* Effect.log(`Using ${pm} as package manager`);
    return new Context(root!, pm);
});
