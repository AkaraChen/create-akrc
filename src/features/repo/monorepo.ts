import { FileSystem } from '@effect/platform';
import { Effect } from 'effect';
import type { IFeature } from '../type';

export const monorepo: IFeature = {
    name: 'monorepo',
    detect(ctx) {
        return Effect.gen(function* () {
            const fs = yield* FileSystem.FileSystem;
            const pnpm = yield* fs.exists(
                yield* ctx.join('pnpm-workspace.yaml'),
            );
            if (pnpm) return true;
            return false;
        });
    },
    setup(ctx) {
        return Effect.gen(function* () {
            const fs = yield* FileSystem.FileSystem;
        });
    },
};
