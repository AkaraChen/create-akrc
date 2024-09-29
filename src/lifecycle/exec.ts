import type { Context } from '@/core/core';
import type { IFeature, Mode } from '@/features/type';
import { Effect } from 'effect';

export const exec = <T>(
    ctx: Context,
    task: {
        mode: Mode;
        features: IFeature<T>[];
    },
) => {
    const { features, mode } = task;
    return Effect.gen(function* () {
        const result =
            mode === 'setup'
                ? yield* Effect.forEach(features, (features) => {
                      return Effect.gen(function* () {
                          const option = features.options
                              ? yield* features.options
                              : (null as T);
                          return yield* features.setup(ctx, option);
                      });
                  })
                : yield* Effect.forEach(features, (features) => {
                      return Effect.gen(function* () {
                          if (features.teardown) {
                              yield* features.teardown(ctx);
                          }
                      });
                  });
        return result.filter((x) => !!x);
    });
};
