import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('broker:queue-template:display', () => {
  it('runs broker:queue-template:display --help', async () => {
    const {stdout} = await runCommand('broker:queue-template:display --help')
    expect(stdout).to.contain('queue-template-name')
  })
})
