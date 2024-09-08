import { bunchee } from './bundler/bunchee';
import { rslib } from './bundler/rslib';
import { tsup } from './bundler/tsup';
import { typedoc } from './documention/typedoc';
import { vitepress } from './documention/vitepress';
import { biome } from './quality/biome';
import { editorconfig } from './quality/editorconfig';
import { eslintv9 } from './quality/eslintv9';
import { husky } from './quality/husky';
import { knip } from './quality/knip';
import { lefthook } from './quality/lefthook';
import { lintStaged } from './quality/lint-staged';
import { prettier } from './quality/prettier';
import { skott } from './quality/skott';
import { syncpack } from './quality/syncpack';
import { tsconfig } from './quality/tsconfig';
import { monorepo } from './repo/monorepo';
import { turbo } from './repo/turbo';
import { yarnStable } from './repo/yarn-stable';
import { cypress } from './testing/cypress';
import { jest } from './testing/jest';
import { playwright } from './testing/playwright';
import { vitest } from './testing/vitest';
import { vitestWorkspace } from './testing/vitest-workspace';
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
    playwright,
    cypress,
    turbo,
    vitestWorkspace,
    lintStaged,
    husky,
    editorconfig,
    eslintv9,
];
