import { Effect } from 'effect';
import type { IFeature } from '../type';

const deps = ['typedoc', 'typedoc-material-theme'];

const scripts = {
	doc: "typedoc src --plugin typedoc-material-theme  --themeColor '#1C6EF3'",
};

export const typedoc: IFeature = {
	name: 'typedoc',
	setup(ctx) {
		return Effect.gen(function* () {
			yield* ctx.addDeps(...deps);
			yield* ctx.addScripts(scripts);
			yield* ctx.addGitignore('typedoc', ['/docs']);
		});
	},
	detect(ctx) {
		return ctx.hasDep('typedoc');
	},
	teardown(ctx) {
		return Effect.gen(function* () {
			yield* ctx.removeDeps(...deps);
			yield* ctx.removeScripts(scripts);
		});
	},
};
