import type {
    CommandExecutor,
    FileSystem,
    Path,
    Error as PlatformError,
} from '@effect/platform';
import type { Effect, Encoding, Scope } from 'effect';
import type { Context } from '../core/core';
import type { ParserError } from '../errors/schema';

export type Mode = 'setup' | 'teardown';

export interface ILifecycle {
    afterTeardown?: Task<void>;
}

type Task<T> = Effect.Effect<
    T,
    ParserError | PlatformError.PlatformError | Encoding.DecodeException,
    | CommandExecutor.CommandExecutor
    | Scope.Scope
    | FileSystem.FileSystem
    | Path.Path
>;

export interface IFeature<T = undefined> {
    name: string;
    options?: Effect.Effect<T>;
    // biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
    setup(ctx: Context, options: T): Task<ILifecycle | void>;
    detect(ctx: Context): Task<boolean>;
    // biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
    teardown?(ctx: Context): Task<ILifecycle | void>;
}
