import type { Context } from '@/core/core';
import type { ILifecycle } from '@/features/type';
import { Effect, pipe } from 'effect';
import { commands } from 'pm-combo';

export const teardown = (ctx: Context, result: ILifecycle[]) => {
    return Effect.gen(function* () {
        yield* Effect.log('Execution completed, reinstall packages');
        const exec = yield* ctx.exec;
        const process = yield* exec.start(
            pipe(ctx.makeCommand(commands.install.concat(ctx.pm, {}))),
        );
        yield* process.exitCode;
        yield* Effect.log('Packages reinstalled');
        for (const lifecycle of result) {
            if (lifecycle.afterTeardown) {
                yield* lifecycle.afterTeardown;
            }
        }
    });
};
