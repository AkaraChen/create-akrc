import type { Context } from '@/core/core';
import { FileSystem, Path } from '@effect/platform';
import { Effect, Option } from 'effect';
import { isNoSuchElementException } from 'effect/Cause';
import enquirer from 'enquirer';
import { tryFile } from 'try-files';

const ext = ['ts', 'js'];
const files = ['index', 'src/index'];
const entries = ext.flatMap((lang) => files.map((file) => `${file}.${lang}`));

export const createEntry = (root: string) =>
    Effect.promise(() =>
        enquirer.prompt<{ entry: string }>({
            type: 'select',
            name: 'entry',
            message: 'Choose an entry file',
            choices: entries,
        }),
    ).pipe(
        Effect.map((answer) => answer.entry),
        Effect.tap((entry) =>
            Effect.gen(function* () {
                const content = '';
                const fs = yield* FileSystem.FileSystem;
                const path = yield* Path.Path;
                const filePath = path.join(root, entry);
                yield* fs.writeFileString(filePath, content);
            }),
        ),
    );

export const detectEntry = (root: string) => {
    return Effect.sync(() => tryFile(entries, { root })).pipe(
        Effect.map((entry) => Option.fromNullable(entry)),
    );
};

export const ensureEntry = (root: string) => {
    return detectEntry(root).pipe(
        Effect.andThen((entry) => (entry ? entry : createEntry(root))),
        Effect.catchIf(isNoSuchElementException, Effect.die),
    );
};

export const switchToModule = (ctx: Context) => {
    return Effect.gen(function* () {
        const json = yield* ctx.package;
        if (json.type || json.type === 'commonjs') return;
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
