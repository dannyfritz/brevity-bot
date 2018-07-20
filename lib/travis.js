const axios = require('axios')
const travisApi = axios.create({
  baseURL: 'https://api.travis-ci.com',
  headers: {'Travis-API-Version': '3'}
})

/**
 * Get Travis CI Build ID from Build URL using cache.buildUrl
 * @param {Cache} cache
 */
module.exports.getBuildIdFromUrl = (cache) => {
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

/**
 * Retrieve Travis CI Build from Build ID using cache.buildId
 * @param {Cache} cache
 */
module.exports.getBuildFromBuildId = (cache) => {
  cache.debug('getBuildFromBuildId')
  cache.debug(cache.buildId)
  return travisApi.get(`/build/${cache.buildId}`)
    .then((build) => {
      cache.build = build
      return cache
    })
}

/**
 * Retrieve Travis CI Job ID from Build using cache.build
 * @param {Cache} cache
 */
module.exports.getJobIdFromBuild = (cache) => {
  cache.debug('getJobFromBuild')
  cache.debug(cache.build.data.jobs)
  cache.jobId = cache.build.data.jobs[0].id
  return cache
}

/**
 * Retrieve Travis CI Job Log from Job ID using cache.jobId
 * @param {Cache} cache
 */
module.exports.getPrIdFromBuild = (cache) => {
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

/**
 * Retrieve Travis CI Job Log from Job ID using cache.jobId
 * @param {Cache} cache
 */
module.exports.getLogFromJobId = (cache) => {
  cache.debug('getLogFromJobId')
  cache.debug(cache.jobId)
  return travisApi.get(`/job/${cache.jobId}/log.txt`)
    .then(response => {
      cache.log = response.data
      return cache
    })
}
