import { prompt } from '@/core/utils';
import type { IFeature } from '@/features/type';
import { Effect } from 'effect';

const configFiles = ['tsconfig.json', 'tsconfig.**.json'];
const deps = ['typescript', '@akrc/tsconfig'];
const scripts = {
    typecheck: 'tsc --noEmit',
};

export const tsconfig: IFeature<{
    selected: string;
}> = {
    name: 'tsconfig',
    options: prompt<{
        selected: string;
    }>({
        type: 'select',
        name: 'selected',
        message: 'Choose a tsconfig template',
        choices: ['node', 'web', 'react', 'vue'],
    }),
    setup(ctx, options) {
        const { selected } = options;
        return Effect.gen(function* () {
            yield* ctx.addDeps(...deps);
            yield* ctx.addScripts(scripts);
            const fs = yield* ctx.fs;
            const template = yield* ctx.template('tsconfig');
            yield* fs.writeFileString(
                yield* ctx.join('tsconfig.json'),
                template({ selected }),
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
            const fs = yield* ctx.fs;
            yield* fs.remove(yield* ctx.join('tsconfig.json'));
            yield* ctx.removeScripts(scripts);
            yield* ctx.removeDeps(...deps);
        });
    },
};
