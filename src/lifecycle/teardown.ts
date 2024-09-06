import { CommandExecutor } from '@effect/platform';
import { Effect, pipe } from 'effect';
import { commands } from 'pm-combo';
import type { Context } from '../core/core';
import type { ILifecycle } from '../features/type';

export const teardown = (ctx: Context, _result: ILifecycle[]) => {
    return Effect.gen(function* () {
        const exec = yield* CommandExecutor.CommandExecutor;
        yield* exec.start(
            pipe(ctx.makeCommand(commands.install.concat(ctx.pm, {}))),
        );
    });
};
