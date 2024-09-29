import type { IFeature } from '@/features/type';
import { Effect } from 'effect';

const configFiles = [
    '.lintstagedrc',
    '.lintstagedrc.{yml,yaml,json}',
    '.lintstagedrc.{mjs,cjs,js}',
    'lint-staged.config.{mjs,cjs,js}',
];
const deps = ['lint-staged'];

export const lintStaged: IFeature = {
    name: 'lint-staged',
    setup(ctx) {
        return Effect.gen(function* () {
            yield* ctx.addDeps(...deps);
            const fs = yield* ctx.fs;
            const template = yield* ctx.template('lint-staged');
            yield* fs.writeFileString('.lintstagedrc', template(null));
            return {
                afterTeardown: Effect.log(
                    'lint-staged setup finished, you may want to see documention at https://github.com/lint-staged/lint-staged#configuration',
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
            yield* ctx.removeDeps(...deps);
            const fs = yield* ctx.fs;
            const files = yield* ctx.glob(configFiles);
            yield* Effect.forEach(files, (file) => fs.remove(file));
        });
    },
};
