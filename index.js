const axios = require('axios')
const travisApi = axios.create({
  baseURL: 'https://api.travis-ci.com',
  headers: {'Travis-API-Version': '3'}
})

const buildIdRegex = /\/builds\/(\d+)/gi

const getBuildIdFromUrl = (context) => {
  context.debug('getBuildIdFromUrl')
  const matches = buildIdRegex.exec(context.buildUrl)
  if (matches.length !== 2) {
    throw new Error(`Could not find buildId from url ${context.buildUrl}`)
  }
  context.buildId = matches[1]
  return context
}

const getBuildFromBuildId = (context) => {
  context.debug('getBuildFromBuildId')
  return travisApi.get(`/build/${context.buildId}`)
    .then((build) => {
      context.build = build
      return context
    })
}

const getJobIdFromBuild = (context) => {
  context.debug('getJobFromBuild')
  context.jobId = context.build.data.jobs[0].id
  return context
}

const PrIdRegex = /(\d+)/gi

const getPrIdFromBuild = (context) => {
  context.debug('getPrFromBuild')
  context.prId = 1
  const matches = PrIdRegex.exec(context.build.data.commit.ref)
  if (matches.length !== 2) {
    throw new Error(`Could not find PrId from path ${context.build.data.commit.ref}`)
  }
  context.prId = matches[1]
  return context
}

const getLogFromJobId = (context) => {
  context.debug('getLogFromJobId')
  return travisApi.get(`/job/${context.jobId}/log`)
    .then((response) => {
      context.log = response.data.content
      return context
    })
}

const parseLog = (context) => {
  return context.log
}

const createComment = (context) => {
  const body = parseLog(context)
  const params = {body, owner: context.owner, repo: context.repo, number: context.prId}
  return context.github.issues.createComment(params)
}

/**
 * This is the entry point for your Probot App.
 * @param {import('probot').Application} app - Probot's Application class.
 */
module.exports = app => {
  app.on('status', async context => {
    context.log.debug(`a ${context.payload.state} status payload arrived!`)
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
      .then((log) => createComment(log, context.github))
      .catch(context.log.error)
  })
}
