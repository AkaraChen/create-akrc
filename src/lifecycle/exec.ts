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
        const result =
            mode === 'setup'
                ? yield* Effect.forEach(features, (features) => {
                      return Effect.gen(function* () {
                          return yield* features
                              .setup(ctx, features.options)
                              .pipe(Effect.withLogSpan(features.name));
                      });
                  })
                : yield* Effect.forEach(features, (features) => {
                      return Effect.gen(function* () {
                          if (features.teardown) {
                              yield* features
                                  .teardown(ctx)
                                  .pipe(Effect.withLogSpan(features.name));
                          }
                      });
                  });
        return result.filter((x) => !!x);
    });
};
