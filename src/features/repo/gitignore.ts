import { prompt } from '@/core/utils';
import { Effect } from 'effect';
import type { IFeature } from '../type';

interface GitIgnore {
    name: string;
    contents: string;
}

export const gitignore: IFeature<Array<GitIgnore>> = {
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
            selected: Array<keyof typeof data>;
        }>({
            name: 'selected',
            type: 'autocomplete',
            multiple: true,
            message: 'Select a gitignore template',
            choices: Object.keys(data),
        });
        return selected.map(name => data[name]!)
    }),
    setup(ctx, options) {
        return Effect.gen(function* () {
            for (const option of options) {
                yield* ctx.addGitignore(option.name, option.contents.split('\n'));
            }
        });
    },
    detect() {
        return Effect.gen(function* () {
            return false;
        })
    },
};
