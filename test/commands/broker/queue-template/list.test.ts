import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('broker:queue-template:list', () => {
  it('runs broker:queue-template:list --help', async () => {
    const {stdout} = await runCommand('broker:queue-template:list --help')
    expect(stdout).to.contain('queue-template-name')
    expect(stdout).to.contain('count')
    expect(stdout).to.contain('select')
    expect(stdout).to.contain('all')
  })
})
