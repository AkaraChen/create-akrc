import {
    NodeCommandExecutor,
    NodeFileSystem,
    NodePath,
    NodeRuntime,
} from '@effect/platform-node';
import { Effect, Layer } from 'effect';
import { isDecodeException } from 'effect/Encoding';
import { createContext } from '../core/core';
import { ParserError } from '../errors/schema';
import { exec } from '../lifecycle/exec';
import { init } from '../lifecycle/init';
import { teardown } from '../lifecycle/teardown';

const Live = NodeCommandExecutor.layer.pipe(
    Layer.provideMerge(NodeFileSystem.layer),
    Layer.provideMerge(NodePath.layer),
);

const program = Effect.gen(function* () {
    const context = yield* createContext;
    const tasks = yield* init(context);
    const result = yield* exec(context, tasks);
    yield* teardown(context, result);
}).pipe(
    Effect.provide(Live),
    Effect.catchIf(isDecodeException, Effect.logFatal),
    Effect.catchIf(
        (e): e is ParserError => e instanceof ParserError,
        Effect.logFatal,
    ),
);

const runnable = Effect.scoped(program);

NodeRuntime.runMain(runnable);