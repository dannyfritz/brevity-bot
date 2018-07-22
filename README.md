# brevity-bot

> A GitHub App built with [Probot](https://github.com/probot/probot) that comments on a PR the short version of a Travis CI build failure.

![icon](./icon.png)

## Requirements

* [Node >=8.3.0](https://probot.github.io/docs/development/)
* A [TAP](https://en.wikipedia.org/wiki/Test_Anything_Protocol) producing test harness such as [`tape`](https://github.com/substack/tape)
* [Travis CI](https://github.com/marketplace/travis-ci) for your Pull Request builds

## Development Setup

```sh
# get the bot code
git clone git@github.com:dannyfritz/brevity-bot.git
cd brevity-bot
```

### Create a GitHub App

1. Follow the instructions at [probot](https://probot.github.io/docs/development/#configuring-a-github-app)
  * For permissions select:
    * `pull requests` - `read & write`
    * `commit statuses` - `read-only`
  * For webhooks select:
    * `status`

### Run the Bot

```sh
# Install dependencies
npm install

# Run the bot in watch mode
npm run dev
```

## Testing

```sh
# To run the tests
npm test
```

## Deployment

When you are done developing, you can [deploy the bot](https://probot.github.io/docs/development/).

## Contributing

If you have suggestions for how brevity-bot could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## Challenges Developing

See the [wiki challenges page](https://github.com/dannyfritz/brevity-bot/wiki/Challenges).

## License

[ISC](LICENSE) © 2018 Danny Fritz <dannyfritz@gmail.com> (https://github.com/dannyfritz/brevity-bot)
