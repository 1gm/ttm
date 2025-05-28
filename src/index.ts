import { Octokit } from "octokit";

if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_OWNER || !process.env.GITHUB_REPO) {
    throw new Error('GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO must be set');
}

const githubAccessToken = process.env.GITHUB_TOKEN;
const githubOwner = process.env.GITHUB_OWNER;
const githubRepo = process.env.GITHUB_REPO;
const targetBranch = process.env.TARGET_BRANCH;
const numberClosedPullRequestsToEvaluate = process.env.NUMBER_CLOSED_PULL_REQUESTS_TO_EVALUATE ? Number(process.env.NUMBER_CLOSED_PULL_REQUESTS_TO_EVALUATE) : 50;

const toMsDiff = (t1?: string | null, t2?: string | null): number => {
    if (!t1 || !t2) {
        return 0;
    }
    return Math.abs(new Date(t2).getTime() - new Date(t1).getTime());
};

function msToReadableTimeDelta(ms: number): string {
    let seconds = (ms / 1000).toFixed(1);
    let minutes = (ms / (1000 * 60)).toFixed(1);
    let hours = (ms / (1000 * 60 * 60)).toFixed(1);
    let days = (ms / (1000 * 60 * 60 * 24)).toFixed(1);
    if (Number(seconds) < 60)
        return seconds + " Sec";
    if (Number(minutes) < 60)
        return minutes + " Min";
    if (Number(hours) < 24)
        return hours + " Hrs";
    return days + " Days";
}

function toReadableTimeDelta(t1?: string | null, t2?: string | null): string {
    if (!t1 || !t2) {
        return 'N/A';
    }
    return msToReadableTimeDelta(toMsDiff(t1, t2));
}


(async () => {

    const octokit = new Octokit({
        auth: githubAccessToken,
    });

    const closedPullRequests = await octokit.rest.pulls.list({
        owner: githubOwner,
        repo: githubRepo,
        state: 'closed',
        sort: 'created',
        direction: 'desc',
        per_page: numberClosedPullRequestsToEvaluate,
    });

    let totalPullRequestsEvaluated = 0;
    let averageTimeToMerge = 0;
    let averageTimeToFirstReview = 0;
    let averageTimeToSecondReview = 0;
    let averageLinesAdded = 0;
    let averageLinesRemoved = 0;

    for (const pullRequest of closedPullRequests.data) {
        const details = await octokit.rest.pulls.get({
            owner: githubOwner,
            repo: githubRepo,
            pull_number: pullRequest.number,
        });

        // if not merged or not targeting dev branch, skip
        if (!details.data.merged || details.data.base.ref !== targetBranch) {
            continue;
        }

        totalPullRequestsEvaluated++;

        const reviews = await octokit.rest.pulls.listReviews({
            owner: githubOwner,
            repo: githubRepo,
            pull_number: pullRequest.number,
        });

        const firstReview = reviews.data[0]?.submitted_at;
        const firstReviewer = reviews.data[0]?.user?.login;
        const ttfr = toReadableTimeDelta(details.data.created_at, firstReview);
        averageTimeToFirstReview += toMsDiff(details.data.created_at, firstReview);


        const secondReview = reviews.data[1]?.submitted_at;
        const secondReviewer = reviews.data[1]?.user?.login;
        const ttsr = toReadableTimeDelta(details.data.created_at, secondReview);
        averageTimeToSecondReview += toMsDiff(details.data.created_at, secondReview);

        const by = details.data.user?.login;
        const title = details.data.title;
        const mergedAt = details.data.merged_at;
        const ttm = toReadableTimeDelta(mergedAt, details.data.created_at);
        averageTimeToMerge += toMsDiff(mergedAt, details.data.created_at);

        const linesAdded = details.data.additions;
        const linesRemoved = details.data.deletions;
        averageLinesAdded += linesAdded;
        averageLinesRemoved += linesRemoved;

        console.log(`${title}
Author: ${by}
Time to merge: ${ttm}
First review time: ${ttfr} (${firstReviewer})
Second review time: ${ttsr} (${secondReviewer})
Code changes: +${linesAdded}, -${linesRemoved}
`);
    }

    console.log(`Total pull requests evaluated: ${totalPullRequestsEvaluated}`);
    console.log(`Average time to merge: ${msToReadableTimeDelta(averageTimeToMerge / totalPullRequestsEvaluated)}`);
    console.log(`Average time to first review: ${msToReadableTimeDelta(averageTimeToFirstReview / totalPullRequestsEvaluated)}`);
    console.log(`Average time to second review: ${msToReadableTimeDelta(averageTimeToSecondReview / totalPullRequestsEvaluated)}`);
    console.log(`Average lines added: ${Math.round(averageLinesAdded / totalPullRequestsEvaluated)}`);
    console.log(`Average lines removed: ${Math.round(averageLinesRemoved / totalPullRequestsEvaluated)}`);
})(); 