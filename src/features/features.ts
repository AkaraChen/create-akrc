import { biome } from './quality/biome';
import { lefthook } from './quality/lefthook';
import { prettier } from './quality/prettier';
import { monorepo } from './repo/monorepo';
import { jest } from './testing/jest';
import { vitest } from './testing/vitest';

export const features = [biome, monorepo, vitest, prettier, jest, lefthook];
