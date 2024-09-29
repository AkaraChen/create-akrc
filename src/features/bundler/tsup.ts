import { type IFeature, Order } from '@/features/type';
import { Effect } from 'effect';
import { genArrayFromRaw, genString } from 'knitwork';
import { ensureEntry, switchToModule } from './utils';

const configFiles = ['tsup.config.ts', 'tsup.config.js', 'tsup.config.cjs'];

const scripts = {
    build: 'tsup',
    dev: 'tsup --watch',
};

export const tsup: IFeature = {
    name: 'tsup',
    order: Order.First,
    setup(ctx) {
        return Effect.gen(function* () {
            yield* switchToModule(ctx);
            yield* ctx.addDeps({ name: 'tsup' });
            const config = yield* ctx.join('tsup.config.ts');
            const template = yield* ctx.template('tsup');
            const fs = yield* ctx.fs;
            const path = yield* ctx.path;
            const entry = yield* ensureEntry(ctx.root).pipe(
                Effect.andThen((entry) => [entry]),
                Effect.andThen((entry) =>
                    entry.map((e) => path.relative(ctx.root, e)),
                ),
            );
            const format = yield* ctx.package.pipe(
                Effect.map((json) => (json.type === 'module' ? 'esm' : 'cjs')),
            );
            yield* fs.writeFileString(
                config,
                template({
                    entry: genArrayFromRaw(entry.map((e) => genString(e))),
                    format: genString(format),
                }),
            );
            yield* ctx.addScripts(scripts);
        });
    },
    detect(ctx) {
        return ctx
            .glob(configFiles)
            .pipe(Effect.map((files) => files.length > 0));
    },
    teardown(ctx) {
        return Effect.gen(function* () {
            yield* ctx.removeDeps('tsup');
            yield* ctx.removeScripts(scripts);
            const fs = yield* ctx.fs;
            const files = yield* ctx.glob(configFiles);
            yield* Effect.forEach(files, (file) => fs.remove(file));
        });
    },
};
