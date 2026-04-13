import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('broker:queue-template:create', () => {
  it('runs broker:queue-template:create --help', async () => {
    const {stdout} = await runCommand('broker:queue-template:create --help')
    expect(stdout).to.contain('queue-template-name')
    expect(stdout).to.contain('access-type')
    expect(stdout).to.contain('permission')
  })
})
