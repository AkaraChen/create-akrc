import { findRepoRoot } from '@akrc/monorepo-tools';
import jfs from '@akrc/just-fs'

export class Context extends jfs.Context {
    static async resolve(): Promise<Context> {
        const cwd = process.cwd();
        const root = await findRepoRoot(cwd);
        return new Context(root);
    }
}
