import { Effect } from 'effect';
import enquirer from 'enquirer';
import type { Context } from '../core/core';
import { features } from '../features/features';
import type { Mode } from '../features/type';

export const init = (ctx: Context) => {
    return Effect.gen(function* () {
        const { mode } = yield* Effect.promise<{ mode: Mode }>(() =>
            enquirer.prompt({
                type: 'select',
                name: 'mode',
                message: 'Choose a mode',
                choices: ['setup', 'teardown'] as Mode[],
            }),
        );
        const detection = yield* Effect.forEach(features, (feature) =>
            Effect.gen(function* () {
                const detected = yield* feature.detect(ctx);
                return {
                    name: feature.name,
                    detected,
                };
            }),
        ).pipe(
            Effect.andThen((detection) =>
                detection.filter((feature) => feature.detected),
            ),
            Effect.andThen((detection) =>
                detection.map((feature) => feature.name),
            ),
        );

        if (mode === 'setup') {
            const nonEnabled = features
                .filter((feature) => !detection.includes(feature.name))
                .map((feature) => feature.name);
            const selected = yield* Effect.promise(() =>
                enquirer.prompt<{
                    selected: string[];
                }>({
                    type: 'multiselect',
                    name: 'selected',
                    message: 'Select features to setup',
                    choices: nonEnabled,
                }),
            ).pipe(
                Effect.andThen((selected) =>
                    selected.selected.map((name) =>
                        features.find((feature) => feature.name === name),
                    ),
                ),
                Effect.andThen((selected) => selected.filter((x) => !!x)),
            );
            return {
                mode,
                features: selected,
            };
        }

        const selected = yield* Effect.promise(() =>
            enquirer.prompt<{
                features: string[];
            }>({
                type: 'multiselect',
                name: 'features',
                message: 'Select features to teardown',
                choices: detection,
            }),
        ).pipe(
            Effect.andThen((selected) =>
                selected.features.map((name) =>
                    features.find((feature) => feature.name === name),
                ),
            ),
            Effect.andThen((selected) => selected.filter((x) => !!x)),
        );

        return {
            mode,
            features: selected,
        };
    });
};
