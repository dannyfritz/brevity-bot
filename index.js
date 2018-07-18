const axios = require('axios')
const iquotes = require('iquotes')
const travisApi = axios.create({
  baseURL: 'https://api.travis-ci.com',
  headers: {'Travis-API-Version': '3'}
})

const buildIdRegex = /\/builds\/(\d+)/gi

const getBuildIdFromUrl = (cache) => {
  cache.debug('getBuildIdFromUrl')
  const matches = buildIdRegex.exec(cache.buildUrl)
  console.log(matches)
  if (matches.length !== 2) {
    throw new Error(`Could not find buildId from url ${cache.buildUrl}`)
  }
  cache.buildId = matches[1]
  return cache
}

const getBuildFromBuildId = (cache) => {
  cache.debug('getBuildFromBuildId')
  return travisApi.get(`/build/${cache.buildId}`)
    .then((build) => {
      cache.build = build
      return cache
    })
}

const getJobIdFromBuild = (cache) => {
  cache.debug('getJobFromBuild')
  cache.jobId = cache.build.data.jobs[0].id
  return cache
}

const PrIdRegex = /(\d+)/gi

const getPrIdFromBuild = (cache) => {
  cache.debug('getPrFromBuild')
  cache.prId = 1
  const matches = PrIdRegex.exec(cache.build.data.commit.ref)
  if (matches.length !== 2) {
    throw new Error(`Could not find PrId from path ${cache.build.data.commit.ref}`)
  }
  cache.prId = matches[1]
  return cache
}

const getLogFromJobId = (cache) => {
  cache.debug('getLogFromJobId')
  return travisApi.get(`/job/${cache.jobId}/log.txt`)
    .then(response => {
      cache.log = response.data
      return cache
    })
}

const getBotMessage = (buildUrl) =>
`### Hi! 👋 I'm _brevity-bot_, a bot that summarizes failed CI builds!
I have analyzed the long and drawn-out [build logs](${buildUrl}) and determined the most important parts for you.`

const getQuote = () => {
  const quote = iquotes.random("dev")
  return `${quote.quote} ‒ ${quote.author}`
}

const parseTapLog = (cache) => {
  const lines = cache.log.split(/\r?\n/)
  const testLines = lines.slice(lines.findIndex((line) => line.includes('npm test')), -13)
  const logTests = testLines.join('\n').split(/\n# /).slice(1)
  const failLogTests = logTests.filter(test => /^.*\nnot ok/.test(test))
  const failOutput = failLogTests.map(t => t.split('\n')).map(test =>
`#### ${test[0]}
_${test[1]}_
\`\`\`
${test.slice(3, -1).join('\n')}
\`\`\``
    , '')
  failOutput.push(`---\n> ${getQuote()}`)
  failOutput.unshift('\n---\n')
  failOutput.unshift(getBotMessage(cache.buildUrl))
  return failOutput.join("\n")
}

const createComment = (cache) => {
  const body = parseTapLog(cache)
  const params = {body, owner: cache.owner, repo: cache.repo, number: cache.prId}
  return cache.github.issues.createComment(params)
}

/**
 * This is the entry point for your Probot App.
 * @param {import('probot').Application} app - Probot's Application class.
 */
module.exports = app => {
  app.on('status', async context => {
    context.log.debug(`A ${context.payload.state} status payload arrived!`)
    if (context.payload.state !== 'failure') {
      return
    }
    return Promise.resolve({
      debug: context.log.debug,
      buildUrl: context.payload.target_url,
      buildId: null,
      build: null,
      jobId: null,
      log: null,
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      prId: null,
      github: context.github
    })
      .then(getBuildIdFromUrl)
      .then(getBuildFromBuildId)
      .then(getPrIdFromBuild)
      .then(getJobIdFromBuild)
      .then(getLogFromJobId)
      .then(createComment)
      .catch(context.log.error)
  })
}
