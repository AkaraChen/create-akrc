import type { Context } from '@/core/core';
import { Effect, Option } from 'effect';
import enquirer from 'enquirer';
import { tryFile } from 'try-files';

export const entryDetect = (root: string) => {
    return Effect.sync(() =>
        tryFile(['index.ts', './src/index.ts'], { root }),
    ).pipe(Effect.map((entry) => Option.fromNullable(entry)));
};

export const switchToModule = (ctx: Context) => {
    return Effect.gen(function* () {
        const json = yield* ctx.package;
        if (json.type) return;
        const { confirmed } = yield* Effect.promise(() =>
            enquirer.prompt<{
                confirmed: boolean;
            }>({
                type: 'confirm',
                name: 'confirmed',
                message: 'Switch to "type": "module" in package.json?',
            }),
        );
        if (confirmed) {
            yield* ctx.updatePackage(async (json) => {
                json.type = 'module';
                return json;
            });
        }
    });
};
