import type { IFeature } from '@/features/type';
import { Effect, pipe } from 'effect';
import { commands } from 'pm-combo';

const configFiles = [
    'lefthook.{yml,yaml,json,toml}',
    '.lefthook.{yml,yaml,json,toml}',
];

const scripts = {
    prepare: 'lefthook install',
};

export const lefthook: IFeature = {
    name: 'lefthook',
    setup(ctx) {
        return Effect.gen(function* () {
            yield* ctx.addDeps({ name: 'lefthook' });
            yield* ctx.addScripts(scripts);
            const fs = yield* ctx.fs;
            yield* fs.writeFile('lefthook.toml', new Uint8Array());
            return {
                afterTeardown: Effect.log(
                    'Lefthook setup finished, you may want to see documention at https://github.com/evilmartians/lefthook/blob/master/docs/configuration.md',
                ),
            };
        });
    },
    detect(ctx) {
        return ctx
            .glob(configFiles)
            .pipe(Effect.map((files) => files.length > 0));
    },
    teardown(ctx) {
        return Effect.gen(function* () {
            const exec = yield* ctx.exec;
            yield* Effect.log('Uninstalling lefthook');
            const process = yield* exec.start(
                pipe(
                    ctx.makeCommand(
                        commands.dlx.concat(ctx.pm, {
                            package: 'lefthook',
                            args: ['uninstall'],
                        }),
                    ),
                ),
            );
            yield* process.exitCode;
            yield* ctx.removeDeps('lefthook');
            yield* ctx.removeScripts(scripts);
            const fs = yield* ctx.fs;
            const files = yield* ctx.glob(configFiles);
            yield* Effect.forEach(files, (file) => fs.remove(file));
        });
    },
};
