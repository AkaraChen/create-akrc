import type { IFeature } from '@/features/type';
import { Command, CommandExecutor, FileSystem } from '@effect/platform';
import { Effect, pipe } from 'effect';
import { commands } from 'pm-combo';

const configFiles = ['playwright.config.ts', 'playwright.config.js'];
const otherFiles = ['.github/workflows/playwright.yml'];
const scripts = {
    'test:e2e': 'playwright test',
};

export const playwright: IFeature = {
    name: 'playwright',
    setup(ctx) {
        return Effect.gen(function* () {
            const exec = yield* CommandExecutor.CommandExecutor;
            const process = yield* exec.start(
                pipe(
                    ctx.makeCommand(
                        commands.create.concat(ctx.pm, {
                            name: 'playwright',
                            args: [],
                        }),
                    ),
                    Command.stdout('inherit'),
                    Command.stderr('inherit'),
                    Command.stdin('inherit'),
                ),
            );
            yield* process.exitCode;
            yield* ctx.addScripts(scripts);
        });
    },
    detect(ctx) {
        return ctx
            .glob(configFiles)
            .pipe(Effect.map((files) => files.length > 0));
    },
    teardown(ctx) {
        return Effect.gen(function* () {
            const fs = yield* FileSystem.FileSystem;
            const files = yield* ctx.glob([...configFiles, ...otherFiles]);
            yield* Effect.forEach(files, (file) => fs.remove(file));
            yield* ctx.removeDeps('@playwright/test');
            yield* ctx.removeScripts(scripts);
            return {
                afterTeardown: Effect.log(
                    'Playwright has been removed, and you may want to remove the e2e test files.',
                ),
            };
        });
    },
};
