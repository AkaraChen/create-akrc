import type { IFeature } from '@/features/type';
import { FileSystem } from '@effect/platform';
import { Effect } from 'effect';

const configFile = '.editorconfig';

export const editorconfig: IFeature = {
    name: 'editorconfig',
    setup(ctx) {
        return Effect.gen(function* () {
            const fs = yield* FileSystem.FileSystem;
            const template = yield* ctx.template('editorconfig');
            const content = ctx.encoder.encode(template(null));
            yield* fs.writeFile(yield* ctx.join(configFile), content);
        });
    },
    detect(ctx) {
        return ctx
            .glob(configFile)
            .pipe(Effect.map((files) => files.length > 0));
    },
    teardown(ctx) {
        return Effect.gen(function* () {
            const fs = yield* FileSystem.FileSystem;
            yield* fs.remove(yield* ctx.join(configFile));
        });
    },
};
