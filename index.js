const axios = require('axios')
const iquotes = require('iquotes')
const travisApi = axios.create({
  baseURL: 'https://api.travis-ci.com',
  headers: {'Travis-API-Version': '3'}
})

const getBuildIdFromUrl = (cache) => {
  cache.debug('getBuildIdFromUrl')
  cache.debug(cache.buildUrl)
  if (!cache.buildUrl.includes('https://travis-ci')) {
    throw new Error(`This is not a Travis CI status: ${cache.buildUrl}`)
  }
  const buildIdRegex = /\/builds\/(\d+)/gi
  const matches = buildIdRegex.exec(cache.buildUrl)
  if (matches == null || matches.length !== 2) {
    throw new Error(`Could not find buildId from url ${cache.buildUrl}`)
  }
  cache.buildId = matches[1]
  return cache
}

const getBuildFromBuildId = (cache) => {
  cache.debug('getBuildFromBuildId')
  cache.debug(cache.buildId)
  return travisApi.get(`/build/${cache.buildId}`)
    .then((build) => {
      cache.build = build
      return cache
    })
}

const getJobIdFromBuild = (cache) => {
  cache.debug('getJobFromBuild')
  cache.debug(cache.build.data.jobs)
  cache.jobId = cache.build.data.jobs[0].id
  return cache
}

const getPrIdFromBuild = (cache) => {
  cache.debug('getPrFromBuild')
  cache.debug(cache.build.data.commit)
  const PrIdRegex = /(\d+)/gi
  const matches = PrIdRegex.exec(cache.build.data.commit.ref)
  if (matches === null || matches.length !== 2) {
    throw new Error(`Could not find PrId from path ${cache.build.data.commit.ref}`)
  }
  cache.prId = matches[1]
  return cache
}

const getLogFromJobId = (cache) => {
  cache.debug('getLogFromJobId')
  cache.debug(cache.jobId)
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
  const quote = iquotes.random('dev')
  return `${quote.quote} ‒ ${quote.author}`
}

const parseTapLog = (cache) => {
  cache.debug(cache.log)
  // Travis CI logs include lots of capture sequences to make the logs look pretty
  // in terminals, but makes processing harder.
  const sections = cache.log.replace(/\r\n/g, '\n').replace(/\u001b\[0K/g, '').split(/\s*\$\s*/)
  cache.debug(sections)
  const testSection = sections.find(section => section.startsWith('npm test'))
  if (testSection === undefined) {
    throw new Error(`could not find \`npm test\` inside of log`)
  }
  cache.debug(testSection)
  const logTests = testSection.split(/\n# /)
  cache.debug(logTests)
  const failLogTests = logTests.filter(test => /.*\nnot ok/.test(test))
  cache.debug(failLogTests)
  if (failLogTests.length > 0) {
    return failLogTests.map(t => t.split('\n')).map(test =>
`#### ${test[0]}
\`\`\`
${test.slice(3, -1).join('\n')}
\`\`\``
        , '')
  } else {
    return [`\`\`\`
${logTests.join('\n')}
\`\`\``]
  }
}

const createComment = (cache) => {
  cache.debug('parseTapLog')
  let body = parseTapLog(cache)
  body.push(`---\n> ${getQuote()}`)
  body.unshift('\n---\n')
  body.unshift(getBotMessage(cache.buildUrl))
  body = body.join('\n')
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
