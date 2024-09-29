import { getLatestVersion, prompt } from '@/core/utils';
import type { IFeature } from '@/features/type';
import { FileSystem } from '@effect/platform';
import { Effect } from 'effect';
import { genArrayFromRaw, genString } from 'knitwork';
import { PackageNotFoundError, VersionNotFoundError } from 'latest-version';

const configFiles = ['dprint.json'];
const presets = ['web', 'python', 'rust', 'markdown', 'config'] as const;
type PresetName = (typeof presets)[number];
const deps = ['dprint'];
const scripts = {
    fmt: 'dprint fmt',
};

export const dprint: IFeature<{
    presets: PresetName[];
}> = {
    name: 'dprint',
    options: prompt<{ presets: PresetName[] }>({
        type: 'multiselect',
        name: 'presets',
        message: 'Select the presets you want to use',
        choices: presets as unknown as string[],
    }),
    setup(ctx, options) {
        const presets = options.presets;
        return Effect.gen(function* () {
            yield* ctx.addDeps(...deps);
            yield* ctx.addScripts(scripts);
            const fs = yield* FileSystem.FileSystem;
            const filePath = yield* ctx.join('dprint.json');
            const template = yield* ctx.template('dprint');
            const latestVersion = yield* getLatestVersion(
                '@akrc/dprint-config',
            );
            const content = ctx.encoder.encode(
                template({
                    extends: genArrayFromRaw(
                        presets.map((preset) =>
                            genString(
                                new URL(
                                    `@akrc/dprint-config@${latestVersion}/src/${preset}.json`,
                                    'https://cdn.jsdelivr.net/npm/',
                                ).href,
                            ),
                        ),
                    ),
                }),
            );
            yield* fs.writeFile(filePath, content);
        }).pipe(
            Effect.catchIf(
                (e) =>
                    e instanceof PackageNotFoundError ||
                    e instanceof VersionNotFoundError,
                () =>
                    Effect.fail(
                        'Failed to get the latest version of @akrc/dprint-config',
                    ).pipe(Effect.die),
            ),
        );
    },
    detect(ctx) {
        return ctx
            .glob(configFiles)
            .pipe(Effect.map((files) => files.length > 0));
    },
    teardown(ctx) {
        return Effect.gen(function* () {
            const fs = yield* FileSystem.FileSystem;
            const filePath = yield* ctx.join('dprint.json');
            yield* fs.remove(filePath);
            yield* ctx.removeScripts(scripts);
            yield* ctx.removeDeps(...deps);
        });
    },
};
