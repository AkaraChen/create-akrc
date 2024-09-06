import { bunchee } from './bundler/bunchee';
import { tsup } from './bundler/tsup';
import { biome } from './quality/biome';
import { knip } from './quality/knip';
import { lefthook } from './quality/lefthook';
import { prettier } from './quality/prettier';
import { syncpack } from './quality/syncpack';
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
];
