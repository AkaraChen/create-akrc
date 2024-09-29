import type { Context } from '@/core/core';
import type {
    CommandExecutor,
    FileSystem,
    Path,
    Error as PlatformError,
} from '@effect/platform';
import type { Effect, Scope } from 'effect';

export type Mode = 'setup' | 'teardown';

export interface ILifecycle {
    afterTeardown?: Task<void>;
}

type Task<T> = Effect.Effect<
    T,
    PlatformError.PlatformError,
    | CommandExecutor.CommandExecutor
    | Scope.Scope
    | FileSystem.FileSystem
    | Path.Path
>;

export enum Order {
    First = 0,
    Early = 1,
    Normal = 2,
    Late = 3,
    Final = 4,
}

export interface IFeature<T = null> {
    name: string;
    options?: Effect.Effect<T>;
    order?: Order;
    setup(ctx: Context, options: T): Task<ILifecycle | void>;
    detect(ctx: Context): Task<boolean>;
    teardown?(ctx: Context): Task<ILifecycle | void>;
}
