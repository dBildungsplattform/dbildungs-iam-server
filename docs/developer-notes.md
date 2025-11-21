# Developer Notes

> This site contains general advice and notes that should help developers
> during development and avoid some pitfalls with the used libraries.

## Setting up

Necessary tools:

- A Node runtime environment. Please check the [package.json](https://github.com/dBildungsplattform/dbildungs-iam-server/blob/main/package.json) to find the correct version.
- A local Kubernetes cluster, e.g. [Rancher-Desktop](https://www.rancher.com/products/rancher-desktop)

The basic developer setup consists of the client, the server and a range of other components that are provided via docker compose.

So you need to clone this repository and the [client repo](https://github.com/dBildungsplattform/schulportal-client)
Make sure that `git autorcrlf` is set to `false`. You can set this to `git config --global core.autocrlf false`. Otherwise Kafke will not run properly in the later steps.

In both repos you call <br>
`npm ci` ([What's that?](https://docs.npmjs.com/cli/v9/commands/npm-ci))

In the server you call <br>
`docker compose --profile third-party up`([What's that?](https://docs.docker.com/compose/))

To initialize the database you run in the server folder <br>
`npm run setup`

All necessary components should be ready now. You can start the server. <br>
`npm run start`

In the client folder you can start the client by running <br>
`npm run dev`
