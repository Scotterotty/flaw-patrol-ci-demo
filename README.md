# Flaw Patrol CI demo

A tiny sample test suite that shows how automated test results get from GitHub Actions into Flaw Patrol.

- `src/cart.js` is a small shopping cart, just something to test.
- `tests/` has 10 tests. 9 pass, and 1 (**totals the subtotal**) fails on purpose so you can see what a failed test looks like in Flaw Patrol.
- `.github/workflows/tests.yml` runs the tests on every push, and on its own about every hour, and saves the results as a JUnit XML file (`junit.xml`).
- `.github/workflows/browser-tests.yml` runs browser tests that save screenshots, videos and replays (see below).

On a push, one test fails on purpose, so the run shows a red ❌ in GitHub. That's expected. The hourly runs are random instead (see below).

## Get the results file from GitHub

1. Open this repository on GitHub and click the **Actions** tab at the top.
2. Click the newest run in the list (the top one, named after the latest commit).
3. Scroll down to the **Artifacts** section at the bottom of the run's page.
4. Click **test-results-N** (N is the run number) to download it. GitHub downloads it as a .zip file.
5. Unzip it. Inside is **junit.xml**.

To make a fresh run without changing any code: on the **Actions** tab, click **Tests** on the left, then **Run workflow**, then the green **Run workflow** button.

## Upload it in Flaw Patrol

You need to be a Lead or Admin on the test cycle.

1. Open your umbrella in Flaw Patrol and click **Test runs** in the left menu.
2. Click **Upload automation results** (top right, next to **Start a run**).
3. Drop **junit.xml** onto the box, or click **pick files** and choose it.
4. Under **Which test cycle did these run on?**, pick the test cycle.
5. Check the **Build** box. Flaw Patrol fills it in with the GitHub run number from the file. Change it if you like, then click **Next: check results**.
6. Look over the list: 8 Passed and 1 Failed. The first time, all 9 show **New case**. Leave **Make Automated cases for tests with no case** ticked so Flaw Patrol makes a case for each one in the Case library's Automation folder.
7. Click **Save 10 results**. The new run opens, showing the failed test first.

Upload a later run's file and the results go onto the same cases, so you can follow each test's history.

## Run the tests on your own computer

Needs Node.js 22 or newer.

```
npm ci
npm test
```

`npm run test:ci` also writes `test-results/junit.xml`, the same file GitHub saves.

## Tying a test to an existing case

Flaw Patrol matches each test by its Automation ID (`<describe name>.<test name>`, such as `Cart.adds an item`). If a test's name has a case key in it, such as `ABC-12 adds an item`, Flaw Patrol links it to case ABC-12 the first time it's uploaded.

## Simulate a broken build

On GitHub, open **Actions → Tests → Run workflow** and pick one option in **Make part of the build fail**:

- **nothing fails (normal run)**: the same as a push (1 test still fails on purpose).
- **random (like the hourly runs)**: the outcome is picked at random, the same way as the hourly runs.
- **everything passes**: all 10 tests pass and the run goes green.
- **packaging fails after the tests**: the build works, the tests run and save their results file, then the Package step fails. Flaw Patrol still gets all 10 results.
- **build fails before the tests**: the Build step fails, so the tests never run and there's no results file. Flaw Patrol shows the run as failed with no results to pull.

## Hourly random runs

So there's always a fresh run to pull into Flaw Patrol, GitHub runs the workflow on its own about every hour (at 17 minutes past). Each of these runs goes a random way, like a real team's CI:

- **Most runs are green**: all 10 tests pass.
- **A bad change** lands now and then: 1 or 2 tests start failing and keep failing, with the same error, for a few runs in a row until it's "fixed".
- **A bad merge** (rare): several tests fail in just that run.
- **Flaky tests**: *takes 10 percent off* and *removing one item keeps the others* sometimes time out for no reason, then pass on the next run.
- **Broken builds** (rare): Install fails (npm registry times out), Build fails (no tests run, so there's no results file), or Package fails after the tests (results are still saved).
- Test times vary from run to run.

The odds live in `ci/pick-outcome.js` and the test failures in `ci/jest-setup.js`. Neither changes anything on a push or a manual run (except **random**).

Good to know:

- It's free because this repository is public.
- GitHub sometimes starts scheduled runs late (by several minutes, now and then longer) or skips one when it's busy.
- GitHub turns the hourly runs off after 60 days with no commits to the repository. To turn them back on, open **Actions → Tests** and click **Enable workflow**, or push any commit.
- To stop them, open **Actions → Tests**, click **⋯** (top right), then **Disable workflow**.

## Browser tests with screenshots and replays (Playwright)

`e2e/shop.spec.js` has 6 Playwright tests of a tiny shop page (`web/shop.html`, which uses the same cart code). The **Browser tests** workflow runs them on every push and about every hour.

- 5 pass, and 1 (**applies a discount code**) fails on purpose: the shop only takes codes in capitals.
- For each failed test, Playwright saves a **screenshot**, a **video** and a **trace** (a step-by-step replay you can click through).
- On the hourly runs, **updates the total after each item** is now and then flaky: its first try fails and the retry passes.
- Pick **everything passes** in **Run workflow** to see a green run.

The results are saved as the artifact **playwright-results-N**. Inside are `results.xml` (the JUnit file Flaw Patrol reads today), `results.json`, and a `files` folder with the screenshots, videos and traces. Flaw Patrol shows pass and fail today; showing the screenshots, videos and replays next to each result is coming in a future build.

To open a trace yourself: unzip the artifact, then run `npx playwright show-trace files/<test folder>/trace.zip`, or drop the `trace.zip` file on https://trace.playwright.dev.

To run them on your own computer:

```
npm ci
npx playwright install chromium
npm run test:browser
```
