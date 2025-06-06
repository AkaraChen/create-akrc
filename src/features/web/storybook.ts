import type { IFeature } from '@/features/type';
import * as Command from '@effect/platform/Command';
import { Effect, pipe } from 'effect';
import { commands } from 'pm-combo';

const configFiles = '.storybook/**';
const deps = [/storybook/];

const scripts = {
    storybook: 'storybook dev -p 6006',
    'build-storybook': 'storybook build',
};

export const storybook: IFeature = {
    name: 'storybook',
    setup(ctx) {
        return Effect.gen(function* () {
            const exec = yield* ctx.exec;
            yield* Effect.log('Initializing storybook');
            const process = yield* exec.start(
                pipe(
                    ctx.makeCommand(
                        commands.dlx.concat(ctx.pm, {
                            package: 'storybook@latest',
                            args: ['init'],
                        }),
                    ),
                    Command.stdin('inherit'),
                    Command.stderr('inherit'),
                    Command.stdout('inherit'),
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
            const fs = yield* ctx.fs;
            const matchedFiles = yield* ctx.glob(configFiles);
            yield* Effect.forEach(matchedFiles, (file) => fs.remove(file));
            const devDeps = yield* ctx.package.pipe(
                Effect.map((pkg) => pkg.devDependencies),
            );
            if (devDeps) {
                const depsToRemove = Object.keys(devDeps).filter((dep) =>
                    deps.some((d) => d.test(dep)),
                );
                yield* ctx.removeDeps(...depsToRemove);
            }
            yield* ctx.removeScripts(scripts);
            return {
                afterTeardown: Effect.log(
                    'Storybook teardown complete, you may want to remove the stories manually',
                ),
            };
        });
    },
};
