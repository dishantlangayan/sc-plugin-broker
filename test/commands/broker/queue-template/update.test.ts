import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('broker:queue-template:update', () => {
  it('runs broker:queue-template:update --help', async () => {
    const {stdout} = await runCommand('broker:queue-template:update --help')
    expect(stdout).to.contain('queue-template-name')
    expect(stdout).to.contain('access-type')
    expect(stdout).to.contain('permission')
  })
})
