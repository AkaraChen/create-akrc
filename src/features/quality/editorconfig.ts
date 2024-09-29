import type { IFeature } from '@/features/type';
import { Effect } from 'effect';

const configFile = '.editorconfig';

export const editorconfig: IFeature = {
    name: 'editorconfig',
    setup(ctx) {
        return Effect.gen(function* () {
            const fs = yield* ctx.fs;
            const template = yield* ctx.template('editorconfig');
            yield* fs.writeFileString(
                yield* ctx.join(configFile),
                template(null),
            );
        });
    },
    detect(ctx) {
        return ctx
            .glob(configFile)
            .pipe(Effect.map((files) => files.length > 0));
    },
    teardown(ctx) {
        return Effect.gen(function* () {
            const fs = yield* ctx.fs;
            yield* fs.remove(yield* ctx.join(configFile));
        });
    },
};
