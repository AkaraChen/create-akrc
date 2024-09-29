import type { IFeature } from '@/features/type';
import { Effect } from 'effect';

const deps = ['syncpack'];
const scripts = {
    syncpack: 'syncpack',
};
const configFiles = [
    '.syncpackrc',
    '.syncpackrc.{json,yaml,yml,js,cjs}',
    'syncpack.config.{js,cjs}',
];

export const syncpack: IFeature = {
    name: 'syncpack',
    setup(ctx) {
        return Effect.gen(function* () {
            yield* ctx.addDeps(...deps.map((dep) => ({ name: dep })));
            yield* ctx.addScripts(scripts);
            const fs = yield* ctx.fs;
            const template = yield* ctx.template('syncpackrc');
            yield* fs.writeFileString(
                yield* ctx.join('.syncpackrc'),
                template(null),
            );
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
            yield* ctx.removeScripts(scripts);
            const fs = yield* ctx.fs;
            const files = yield* ctx.glob(configFiles);
            yield* Effect.forEach(files, (file) => fs.remove(file));
        });
    },
};
