# ttm

A utility for calculating time to merge and other minor statistics for a branch on a Github repository.

It will calculate information about each pr merged into the target branch including author, time to merge, first review time, second review time, and code changes.

```
...


[search] blah blah blah, this is my pr title
Author: 1gm
Time to merge: 14.0 Min
First review time: 6.7 Min (1gm's girlfriend)
Second review time: 10.8 Min (1gm's wife)
Code changes: +20, -4

Total pull requests evaluated: 28
Average time to merge: 1.6 Days
Average time to first review: 6.1 Hrs
Average time to second review: 14.9 Hrs
Average lines added: 208
Average lines removed: 63
```

### Setup

Install NPM dependencies with `npm install` and then create a `.env` file with the following variables set:

```
GITHUB_OWNER=my-org
GITHUB_REPO=my-repo
GITHUB_TOKEN=my-github-token
TARGET_BRANCH=main
# default is 50
NUMBER_CLOSED_PULL_REQUESTS_TO_EVALUATE=50
# Minimum lines changed (added + removed) to be considered for evaluation
MINIMUM_LINES_CHANGED=50
```

Ensure you have the latest version of node (or at least v24, since that's what I tested it with!)

### Running

After setup you can execute `npx env-cmd -f .env npm run start`

