import { FileSystem } from '@effect/platform';
import { Effect, Encoding } from 'effect';
import type { IFeature } from '../type';
import { entryDetect, switchToModule } from './utils';

const configFiles = ['tsup.config.ts', 'tsup.config.js', 'tsup.config.cjs'];

const scripts = {
    build: 'tsup',
    dev: 'tsup --watch',
};

export const tsup: IFeature = {
    name: 'tsup',
    setup(ctx) {
        return Effect.gen(function* () {
            yield* switchToModule(ctx);
            yield* ctx.addDeps({
                name: 'tsup',
                field: 'devDependencies',
            });
            const config = yield* ctx.join('tsup.config.ts');
            const template = yield* ctx.template('tsup');
            const fs = yield* FileSystem.FileSystem;
            const entry = yield* entryDetect(ctx.root);
            const format = yield* ctx.package.pipe(
                Effect.map((json) => (json.type === 'module' ? 'esm' : 'cjs')),
            );
            const content = yield* Encoding.decodeHex(
                template({
                    entry,
                    format,
                }),
            );
            yield* fs.writeFile(config, content);
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
        });
    },
};
