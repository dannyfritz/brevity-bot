const iquotes = require('iquotes')

/**
 * Gets standard greeting for the bot
 * @param {String} buildUrl - The Travis CI Build URL
 */
const getBotMessage = (buildUrl) =>
`### Hi! 👋 I'm _brevity-bot_, a bot that summarizes failed CI builds!
I have analyzed the long and drawn-out [build logs](${buildUrl}) and determined the most important parts for you.`

/**
 * Gets a random quote
 */
const getQuote = () => {
  const quote = iquotes.random('dev')
  return `${quote.quote} ‒ ${quote.author}`
}

/**
 * Creates a PR comment using cache.owner, cache.repo, cache.prId, cache.github, and cache.log
 * @param {Cache} cache
 */
module.exports.createComment = (cache) => {
  cache.debug('parseTapLog')
  const body = parseTapLog(cache)
  body.push(`---\n> ${getQuote()}`)
  body.unshift('\n---\n')
  body.unshift(getBotMessage(cache.buildUrl))
  const params = {body: body.join('\n'), owner: cache.owner, repo: cache.repo, number: cache.prId}
  return cache.github.issues.createComment(params)
}

/**
 * Parses a Travis CI log for TAP output using cache.log
 * @param {Cache} cache
 */
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
