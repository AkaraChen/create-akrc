import { createContext } from '@/core/core';
import { exec } from '@/lifecycle/exec';
import { init } from '@/lifecycle/init';
import { teardown } from '@/lifecycle/teardown';
import * as NodeCommandExecutor from '@effect/platform-node/NodeCommandExecutor';
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem';
import * as NodePath from '@effect/platform-node/NodePath';
import * as NodeRuntime from '@effect/platform-node/NodeRuntime';
import { Effect, Layer } from 'effect';

const Live = NodeCommandExecutor.layer.pipe(
    Layer.provideMerge(NodeFileSystem.layer),
    Layer.provideMerge(NodePath.layer),
);

const program = Effect.gen(function* () {
    const context = yield* createContext;
    const tasks = yield* init(context);
    const result = yield* exec(context, tasks);
    yield* teardown(context, result);
}).pipe(Effect.provide(Live), Effect.catchAll(Effect.logFatal));

const runnable = Effect.scoped(program);

NodeRuntime.runMain(runnable);
