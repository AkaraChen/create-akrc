import { prompt } from '@/core/utils';
import type { IFeature } from '@/features/type';
import * as yaml from '@akrc/yaml';
import { isPlatformError } from '@effect/platform/Error';
import { Effect } from 'effect';

const dirs = ['packages', 'apps'];

export const monorepo: IFeature<{
    dirs: string[];
}> = {
    name: 'monorepo',
    options: prompt<{
        dirs: string[];
    }>({
        type: 'multiselect',
        name: 'dirs',
        message: 'Select directories for monorepo',
        choices: dirs,
    }),
    setup(ctx, options) {
        return Effect.gen(function* () {
            const fs = yield* ctx.fs;
            const { dirs } = options;
            yield* Effect.forEach(dirs, (dir) =>
                Effect.gen(function* () {
                    const path = yield* ctx.join(dir);
                    yield* fs
                        .makeDirectory(path)
                        .pipe(
                            Effect.catchIf(isPlatformError, () =>
                                Effect.log(`Directory ${dir} already exists`),
                            ),
                        );
                }),
            );
            if (ctx.pm === 'pnpm') {
                const filePath = yield* ctx.join('pnpm-workspace.yaml');
                yield* fs.writeFileString(
                    filePath,
                    yaml.dump({ packages: dirs }),
                );
                yield* Effect.log('pnpm-workspace.yaml created');
            } else {
                yield* ctx.updatePackage(async (pkg) => {
                    pkg.workspaces = dirs;
                    return pkg;
                });
            }
        });
    },
    detect(ctx) {
        return Effect.gen(function* () {
            const fs = yield* ctx.fs;
            const pnpm = yield* fs.exists(
                yield* ctx.join('pnpm-workspace.yaml'),
            );
            if (pnpm) return true;
            const pkg = yield* ctx.package;
            if (pkg.workspaces) return true;
            return false;
        });
    },
    teardown(ctx) {
        return Effect.gen(function* () {
            const fs = yield* ctx.fs;
            const pnpm = yield* fs.exists(
                yield* ctx.join('pnpm-workspace.yaml'),
            );
            if (pnpm) {
                yield* fs.remove(yield* ctx.join('pnpm-workspace.yaml'));
                yield* Effect.log('pnpm-workspace.yaml removed');
            } else {
                yield* ctx.updatePackage(async (pkg) => {
                    pkg.workspaces = undefined;
                    return pkg;
                });
            }
        });
    },
};
