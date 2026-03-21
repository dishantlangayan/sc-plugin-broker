import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('broker:login:cloud', () => {
  it('runs broker:login:cloud cmd', async () => {
    const {stdout} = await runCommand('broker:login:cloud')
    expect(stdout).to.contain('hello world')
  })

  it('runs broker:login:cloud --name oclif', async () => {
    const {stdout} = await runCommand('broker:login:cloud --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
