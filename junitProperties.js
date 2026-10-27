// jest-junit adds these as <property> tags in the results file.
// Flaw Patrol reads "build" and fills in the Build box for you.
module.exports = () => ({
  build: process.env.GITHUB_RUN_NUMBER || "local",
});
