import { Effect } from 'effect';
import type { IFeature } from '../type';
import { FileSystem } from '@effect/platform';
import enquirer from 'enquirer';

const configFiles = ['tsconfig.json', 'tsconfig.**.json'];
const deps = ['typescript'];
const scripts = {
    typecheck: 'tsc --noEmit',
};

export const tsconfig: IFeature<{
    selected: string;
}> = {
    name: 'tsconfig',
    options: Effect.promise(() =>
        enquirer.prompt<{
            selected: string;
        }>({
            type: 'select',
            name: 'selected',
            message: 'Choose a tsconfig template',
            choices: ['node', 'web', 'react', 'vue'],
        }),
    ),
    setup(ctx, options) {
        const { selected } = options;
        return Effect.gen(function* () {
            yield* ctx.addDeps(...deps);
            yield* ctx.addScripts(scripts);
            const fs = yield* FileSystem.FileSystem;
            const template = yield* ctx.template('tsconfig');
            const content = ctx.encoder.encode(template({ selected }));
            yield* fs.writeFile(yield* ctx.join('tsconfig.json'), content);
        });
    },
    detect(ctx) {
        return ctx
            .glob(configFiles)
            .pipe(Effect.map((files) => files.length > 0));
    },
    teardown(ctx) {
        return Effect.gen(function* () {
            const fs = yield* FileSystem.FileSystem;
            yield* fs.remove(yield* ctx.join('tsconfig.json'));
            yield* ctx.removeScripts(scripts);
            yield* ctx.removeDeps(...deps);
        });
    },
};
