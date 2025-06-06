import { ParserError } from '@/errors/schema';
import { type PM, detectPM } from '@akrc/monorepo-tools';
import * as Command from '@effect/platform/Command';
import * as CommandExecutor from '@effect/platform/CommandExecutor';
import * as FileSystem from '@effect/platform/FileSystem';
import * as Path from '@effect/platform/Path';
import { Effect, Option, pipe } from 'effect';
import { getDep } from 'fnpm-toolkit';
import Mustache from 'mustache';
import { commands } from 'pm-combo';
import { omit } from 'radash';
import { glob } from 'tinyglobby';
import type { PackageJson } from 'type-fest';
import { getLatestVersion, pkgDir, prompt } from './utils';

type DepInput = {
    name: string;
    version?: string;
    field?: 'dependencies' | 'devDependencies';
};

export class Context {
    public readonly root: string;
    public readonly pm: PM;

    constructor(root: string, pm: PM) {
        this.root = root;
        this.pm = pm;
    }

    fs = FileSystem.FileSystem;
    path = Path.Path;
    exec = CommandExecutor.CommandExecutor;

    json<T>(path: string) {
        return Effect.gen(function* () {
            const fs = yield* FileSystem.FileSystem;
            const content = yield* fs.readFileString(path);
            const json = yield* Effect.try<T, ParserError>({
                try: () => JSON.parse(content),
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
            yield* fs.writeFileString(
                path,
                typeof json === 'string' ? json : JSON.stringify(json, null, 2),
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
                            const { confirmed } = yield* prompt<{
                                confirmed: boolean;
                            }>({
                                type: 'confirm',
                                name: 'confirmed',
                                message: `Script ${name} already exists. Do you want to overwrite it?`,
                            });
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
            const dirname = yield* pkgDir(path.dirname(url));
            if (!dirname) {
                yield* Effect.die(new Error('Cannot find package directory'));
            }
            const filePath = path.join(
                dirname as string,
                './src/templates',
                `${name}.hbs`,
            );
            const content = yield* fs.readFileString(filePath);
            return (data: Record<string, unknown> | null) =>
                Mustache.render(content, data);
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
                        yield* fs.writeFileString(filePath, content);
                        return;
                    }
                    const oldContent = yield* fs.readFileString(filePath);
                    const newContent = `${oldContent}\n${content}`;
                    yield* fs.writeFileString(filePath, newContent);
                });
            }),
        );
    }
}

const selectPM = prompt<{
    pm: PM;
}>({
    type: 'select',
    name: 'pm',
    message: 'Select package manager',
    choices: ['npm', 'yarn', 'pnpm'],
}).pipe(Effect.map((result) => result.pm));

export const createContext = Effect.gen(function* () {
    const cwd = process.cwd();
    const root = yield* pkgDir(cwd);
    if (!root) {
        const { confirmed } = yield* prompt<{
            confirmed: boolean;
        }>({
            type: 'confirm',
            name: 'confirmed',
            message:
                'Cannot find package directory. Do you want to use current directory as root?',
        });
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
            const fs = yield* FileSystem.FileSystem;
            const path = yield* Path.Path;
            const pkgContent = JSON.parse(
                yield* fs.readFileString(path.join(cwd, 'package.json')),
            ) as PackageJson;

            if (
                pkgContent.scripts?.test ===
                'echo "Error: no test specified" && exit 1'
            ) {
                pkgContent.scripts.test = undefined;
                yield* fs.writeFileString(
                    path.join(cwd, 'package.json'),
                    JSON.stringify(pkgContent, null, 2),
                );
            }
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
