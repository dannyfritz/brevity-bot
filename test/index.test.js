const { Application } = require('probot')
const myProbotApp = require('..')

const statusFailurePayload = require('./fixtures/status.failure.json')
const statusSuccessPayload = require('./fixtures/status.success.json')

describe('brevity-bot integration', () => {
  let app, github

  beforeEach(() => {
    app = new Application()
    app.load(myProbotApp)
    github = {
      issues: {
        createComment: jest.fn().mockReturnValue(Promise.resolve({}))
      }
    }
    app.auth = () => Promise.resolve(github)
  })

  test('creates a comment when a PR build failed', async () => {
    await app.receive({
      event: 'status',
      payload: statusFailurePayload
    })
    expect(github.issues.createComment).toHaveBeenCalled()
  })

  test('does not create a comment when a PR build succeeds', async () => {
    await app.receive({
      event: 'status',
      payload: statusSuccessPayload
    })
    expect(github.issues.createComment).toHaveBeenCalledTimes(0)
  })
})

