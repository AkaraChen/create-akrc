import { bunchee } from './bundler/bunchee';
import { rslib } from './bundler/rslib';
import { tsup } from './bundler/tsup';
import { typedoc } from './documention/typedoc';
import { vitepress } from './documention/vitepress';
import { biome } from './quality/biome';
import { knip } from './quality/knip';
import { lefthook } from './quality/lefthook';
import { prettier } from './quality/prettier';
import { skott } from './quality/skott';
import { syncpack } from './quality/syncpack';
import { tsconfig } from './quality/tsconfig';
import { monorepo } from './repo/monorepo';
import { yarnStable } from './repo/yarn-stable';
import { jest } from './testing/jest';
import { vitest } from './testing/vitest';
import { storybook } from './web/storybook';
import { tailwind } from './web/tailwind';

export const features = [
	biome,
	monorepo,
	vitest,
	prettier,
	jest,
	lefthook,
	bunchee,
	tsup,
	storybook,
	tailwind,
	knip,
	yarnStable,
	syncpack,
	rslib,
	vitepress,
	typedoc,
	skott,
	tsconfig,
];
