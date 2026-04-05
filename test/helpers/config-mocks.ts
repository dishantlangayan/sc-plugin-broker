import type {Config} from '@oclif/core'
import type {SinonSandbox} from 'sinon'

/**
 * Create a mock oclif Config object for command instantiation
 *
 * @param sandbox - Sinon sandbox for creating stubs
 * @param options - Optional configuration overrides
 * @param options.bin - CLI binary name (default: 'sc')
 * @param options.version - CLI version (default: '0.0.0')
 * @returns A mock Config object
 *
 * @example
 * const config = createMockConfig(sandbox)
 * const command = new BrokerLoginBasic(['--broker-name=test'], config)
 *
 * @example
 * const config = createMockConfig(sandbox, { bin: 'my-cli', version: '1.0.0' })
 */
export function createMockConfig(
  sandbox: SinonSandbox,
  options: {
    bin?: string
    version?: string
  } = {},
): Config {
  return {
    bin: options.bin ?? 'sc',
    commands: [],
    plugins: new Map(),
    runHook: sandbox.stub().resolves({failures: [], successes: []}),
    version: options.version ?? '0.0.0',
  } as unknown as Config
}
