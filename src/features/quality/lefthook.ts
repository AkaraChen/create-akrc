import { FileSystem } from '@effect/platform';
import { Effect } from 'effect';
import type { IFeature } from '../type';

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
            const fs = yield* FileSystem.FileSystem;
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
            yield* ctx.removeDeps('lefthook');
            yield* ctx.removeScripts(scripts);
            const fs = yield* FileSystem.FileSystem;
            const files = yield* ctx.glob(configFiles);
            yield* Effect.forEach(files, (file) => fs.remove(file));
        });
    },
};
