const {createComment} = require("./lib")
const {getBuildIdFromUrl, getBuildFromBuildId, getPrIdFromBuild, getJobIdFromBuild, getLogFromJobId} = require("./lib/travis.js")

/**
 * This is the entry point for brevity-bot.
 * @param {import('probot').Application} app - Probot's Application class.
 */
module.exports = app => {
  app.on('status', async context => {
    context.log.debug(`A ${context.payload.state} status payload arrived!`)
    if (context.payload.state !== 'failure') {
      return
    }
    /**
     * @typedef Cache
     * @type {Object}
     * @property {Function} debug - A Debug log method
     * @property {String} buildUrl - The Travis Build URL
     * @property {String} buildId - The Build ID of the Travis Build
     * @property {Object} build - The Travis Build Object
     * @property {Number} jobId - The Job ID of the Travis Job
     * @property {String} log - The Travis Log text
     * @property {String} owner - The owner of the GitHub repo
     * @property {String} repo - The name of the GitHub repo
     * @property {String} prId - The number of the GitHub Pull Request
     * @property {Object} github - The github API
     */
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
