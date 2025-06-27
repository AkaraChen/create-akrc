import type { Context } from '@/core/core';
import type { IFeature, Mode } from '@/features/type';
import { Effect } from 'effect';

export const exec = (
    ctx: Context,
    task: {
        mode: Mode;
        features: Array<IFeature>;
    },
) => {
    const { features, mode } = task;
    return Effect.gen(function* () {
        const result = yield* Effect.forEach(features, (feature) => {
            return Effect.gen(function* () {
                switch (mode) {
                    case 'setup': {
                        const options = feature.options
                            ? yield* feature.options
                            : undefined;
                        return yield* feature.setup(ctx, options);
                    }
                    case 'teardown':
                        if (feature.teardown) {
                            return yield* feature.teardown(ctx);
                        }
                }
            }).pipe(Effect.withLogSpan(feature.name));
        });
        return result.filter((x) => !!x);
    });
};
