import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('broker:queue-template:delete', () => {
  it('runs broker:queue-template:delete --help', async () => {
    const {stdout} = await runCommand('broker:queue-template:delete --help')
    expect(stdout).to.contain('queue-template-name')
    expect(stdout).to.contain('no-prompt')
  })
})
