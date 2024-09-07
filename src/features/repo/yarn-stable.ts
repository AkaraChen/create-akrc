import { CommandExecutor, FileSystem } from '@effect/platform';
import { Effect } from 'effect';
import enquirer from 'enquirer';
import type { IFeature } from '../type';

type NodeLinker = 'node-modules' | 'pnp' | 'pnpm';
const nodeLinkers = ['node-modules', 'pnp', 'pnpm'] as NodeLinker[];

export const yarnStable: IFeature<{
    nodeLinker: NodeLinker;
}> = {
    name: 'yarn-stable',
    options: Effect.promise(() =>
        enquirer.prompt<{
            nodeLinker: NodeLinker;
        }>({
            type: 'select',
            name: 'nodeLinker',
            message: 'Select a node linker',
            choices: nodeLinkers,
        }),
    ),
    setup(ctx, options) {
        const { nodeLinker } = options;
        return Effect.gen(function* () {
            const exec = yield* CommandExecutor.CommandExecutor;
            const process = yield* exec.start(
                ctx.makeCommand(['yarn', 'set', 'version', 'stable']),
            );
            yield* process.exitCode;
            const template = yield* ctx.template('yarnrc');
            const content = ctx.encoder.encode(template({ nodeLinker }));
            const fs = yield* FileSystem.FileSystem;
            const configPath = yield* ctx.join('.yarnrc.yml');
            yield* fs.writeFile(configPath, content);
        });
    },
    detect(ctx) {
        return Effect.gen(function* () {
            const pkg = yield* ctx.package;
            return pkg.packageManager
                ? pkg.packageManager.startsWith('yarn')
                : false;
        });
    },
    teardown(ctx) {
        return Effect.gen(function* () {
            const fs = yield* FileSystem.FileSystem;
            const configPath = yield* ctx.join('.yarnrc.yml');
            yield* fs.remove(configPath);
            yield* ctx.updatePackage(async (pkg) => {
                pkg.packageManager = undefined;
                return pkg;
            });
        });
    },
};
