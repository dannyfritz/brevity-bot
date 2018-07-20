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

describe('brevity-bot unit', () => {
  let input, output
  beforeEach(() => {
    input = {
      debug: () => {}
    }
    output = Object.assign({}, input)
  })
  
  describe('getBuildIdFromUrl', () => {
    const {getBuildIdFromUrl} = require("../lib/travis.js")
    
    test('gets build id from valid build url', () => {
      input.buildUrl = "https://travis-ci.com/dannyfritz/brevitybot-test/builds/79275674?utm_source=github_status&utm_medium=notification",
      output = Object.assign({}, input)
      output.buildId = "79275674"
      expect(getBuildIdFromUrl(input)).toMatchObject(output)
    })
    
    test('throws error from invalid build url', () => {
      input.buildUrl = "https://probot.github.io/docs/testing/",
      expect(() => getBuildIdFromUrl(input)).toThrow()
    })
    test('throws error from missing build url', () => {
      input.buildUrl = "",
      expect(() => getBuildIdFromUrl(input)).toThrow()
    })
    test('throws error from undefined build url', () => {
      expect(() => getBuildIdFromUrl(input)).toThrow()
    })
  })
  
  describe('getJobIdFromBuild', () => {
    const {getJobIdFromBuild} = require("../lib/travis.js")
    const build = require("./fixtures/build.json")
    
    test('gets job id from valid build', () => {
      input.build = build
      output = Object.assign({}, input)
      output.jobId = 135238040
      expect(getJobIdFromBuild(input)).toMatchObject(output)
    })
    
    test('throws error from invalid build', () => {
      input.build = {}
      expect(() => getJobIdFromBuild(input)).toThrow()
    })
    test('throws error from undefined build', () => {
      expect(() => getJobIdFromBuild(input)).toThrow()
    })
  })
  
  describe('getPrIdFromBuild', () => {
    const {getPrIdFromBuild} = require("../lib/travis.js")
    const build = require("./fixtures/build.json")
    
    test('gets job id from valid build', () => {
      input.build = build
      output = Object.assign({}, input)
      output.prId = "4"
      expect(getPrIdFromBuild(input)).toMatchObject(output)
    })
    
    test('throws error from invalid build', () => {
      input.build = {}
      expect(() => getPrIdFromBuild(input)).toThrow()
    })
    test('throws error from undefined build', () => {
      expect(() => getPrIdFromBuild(input)).toThrow()
    })
  })
  
  describe('parseTapLog', () => {
    const fs = require('fs')
    const path = require('path')
    const {parseTapLog} = require("../lib")
    
    test('gets tests from valid log', () => {
      const log = fs.readFileSync(path.join(__dirname, "./fixtures/log.txt"), {encoding: "utf8"})
      input.log = log
      expect(parseTapLog(input)).toHaveLength(2)
      expect(parseTapLog(input)[0].includes("npm test")).toBe(false)
      expect(parseTapLog(input)[0].includes("```")).toBe(true)
      expect(parseTapLog(input)[1].includes("```")).toBe(true)
    })
    test('gets tests from valid log with syntax error', () => {
      const log = fs.readFileSync(path.join(__dirname, "./fixtures/syntaxlog.txt"), {encoding: "utf8"})
      input.log = log
      expect(parseTapLog(input)).toHaveLength(1)
      expect(parseTapLog(input)[0].includes("npm test")).toBe(true)
    })
    
    test('throws error from invalid log', () => {
      input.log = ""
      expect(() => parseTapLog(input)).toThrow()
    })
    test('throws error from undefined log', () => {
      expect(() => parseTapLog(input)).toThrow()
    })
  })
})
