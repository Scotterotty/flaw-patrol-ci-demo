# Flaw Patrol CI demo

A tiny sample test suite that shows how automated test results get from GitHub Actions into Flaw Patrol.

- `src/cart.js` is a small shopping cart, just something to test.
- `tests/` has 9 tests. 8 pass, and 1 (**takes 25 percent off (fails on purpose)**) fails on purpose so you can see what a failed test looks like in Flaw Patrol.
- `.github/workflows/tests.yml` runs the tests on every push and saves the results as a JUnit XML file (`junit.xml`).

Because one test fails on purpose, every run shows a red ❌ in GitHub. That's expected.

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
7. Click **Save 9 results**. The new run opens, showing the failed test first.

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
