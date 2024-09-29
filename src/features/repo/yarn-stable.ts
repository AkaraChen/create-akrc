import { prompt } from '@/core/utils';
import type { IFeature } from '@/features/type';
import { Effect } from 'effect';

type NodeLinker = 'node-modules' | 'pnp' | 'pnpm';
const nodeLinkers = ['node-modules', 'pnp', 'pnpm'] as NodeLinker[];

export const yarnStable: IFeature<{
    nodeLinker: NodeLinker;
}> = {
    name: 'yarn-stable',
    options: prompt<{
        nodeLinker: NodeLinker;
    }>({
        type: 'select',
        name: 'nodeLinker',
        message: 'Select a node linker',
        choices: nodeLinkers,
    }),
    setup(ctx, options) {
        const { nodeLinker } = options;
        return Effect.gen(function* () {
            const exec = yield* ctx.exec;
            yield* Effect.log('Setting yarn to stable');
            const process = yield* exec.start(
                ctx.makeCommand(['yarn', 'set', 'version', 'stable']),
            );
            yield* process.exitCode;
            const template = yield* ctx.template('yarnrc');
            const fs = yield* ctx.fs;
            const configPath = yield* ctx.join('.yarnrc.yml');
            yield* fs.writeFileString(configPath, template({ nodeLinker }));
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
            const fs = yield* ctx.fs;
            const configPath = yield* ctx.join('.yarnrc.yml');
            yield* fs.remove(configPath);
            yield* ctx.updatePackage(async (pkg) => {
                pkg.packageManager = undefined;
                return pkg;
            });
        });
    },
};
