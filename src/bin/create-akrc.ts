import { createContext } from '@/core/core';
import type { IFeature, Mode } from '@/features/type';
import { exec } from '@/lifecycle/exec';
import { init } from '@/lifecycle/init';
import { teardown } from '@/lifecycle/teardown';
import {
    NodeCommandExecutor,
    NodeFileSystem,
    NodePath,
    NodeRuntime,
} from '@effect/platform-node';
import { Effect, Layer } from 'effect';

const Live = NodeCommandExecutor.layer.pipe(
    Layer.provideMerge(NodeFileSystem.layer),
    Layer.provideMerge(NodePath.layer),
);

const program = Effect.gen(function* () {
    const context = yield* createContext;
    const tasks = yield* init(context);
    const result = yield* exec(
        context,
        tasks as {
            mode: Mode;
            features: Array<IFeature<unknown>>;
        },
    );
    yield* teardown(context, result);
}).pipe(Effect.provide(Live), Effect.catchAll(Effect.logFatal));

const runnable = Effect.scoped(program);

NodeRuntime.runMain(runnable);
