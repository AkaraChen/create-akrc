import { prompt } from '@/core/utils';
import { Effect } from 'effect';
import type { IFeature } from '../type';

const config = '.gitignore';

interface GitIgnore {
    name: string;
    content: string;
}

export const gitignore: IFeature<GitIgnore> = {
    name: 'gitignore',
    options: Effect.gen(function* () {
        const data = yield* Effect.tryPromise(async () => {
            const res = await fetch(
                'https://www.toptal.com/developers/gitignore/api/list?format=json',
            );
            const json = await res.json();
            return json as Record<string, GitIgnore>;
        }).pipe(
            Effect.catchAll(() =>
                Effect.dieMessage('Failed to fetch gitignore templates'),
            ),
        );
        const { selected } = yield* prompt<{
            selected: keyof typeof data;
        }>({
            name: 'selected',
            type: 'autocomplete',
            multiple: true,
            message: 'Select a gitignore template',
            choices: Object.keys(data),
        });
        return data[selected] as GitIgnore;
    }),
    setup(ctx, options) {
        return Effect.gen(function* () {
            yield* ctx.addGitignore(options.name, options.content.split('\n'));
        });
    },
    detect(ctx) {
        return Effect.gen(function* () {
            const fs = yield* ctx.fs;
            return yield* fs.exists(yield* ctx.join(config));
        });
    },
};
