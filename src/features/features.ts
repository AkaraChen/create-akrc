import { biome } from './linter/biome';
import { prettier } from './linter/prettier';
import { monorepo } from './repo/monorepo';
import { vitest } from './testing/vitest';

export const features = [biome, monorepo, vitest, prettier];
