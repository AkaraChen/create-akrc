import type { IFeature } from '@/features/type';
import { Effect } from 'effect';
import { commands } from 'pm-combo';

const configFiles = 'jest.config.{js,ts,mjs,cjs}';

const scripts = {
    test: 'jest',
};

export const jest: IFeature = {
    name: 'jest',
    setup(ctx) {
        return Effect.gen(function* () {
            yield* ctx.addDeps('jest', 'typescript', 'ts-jest', '@types/jest');
            yield* ctx.addScripts(scripts);
            const exec = yield* ctx.exec;
            yield* Effect.log('Initializing jest');
            const process = yield* exec.start(
                ctx.makeCommand(
                    commands.dlx.concat(ctx.pm, {
                        package: 'ts-jest',
                        args: ['config:init'],
                    }),
                ),
            );
            yield* process.exitCode;
        });
    },
    detect(ctx) {
        return ctx
            .glob(configFiles)
            .pipe(Effect.map((files) => files.length > 0));
    },
    teardown(ctx) {
        return Effect.gen(function* () {
            yield* ctx.removeDeps('jest', 'ts-jest', '@types/jest');
            yield* ctx.removeScripts(scripts);
            const fs = yield* ctx.fs;
            const files = yield* ctx.glob(configFiles);
            yield* Effect.forEach(files, (file) => fs.remove(file));
        });
    },
};
