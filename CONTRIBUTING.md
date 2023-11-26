## How to contribute

- If anything isn't clear in the code, feel free to create an issue with a
  question on [GitHub][GitHubIssues], [GitLab][GitLabIssues],
  [Codeberg][CodebergIssues], or [Gitea][GiteaIssues].

- If you want to add support for a hosting provider which is not yet supported:

  1. Before making code changes, please create an issue to track the ongoing
     work.
  2. Follow instructions in [HowToNewHosting.md](./Documentation/HowToNewHosting.md).

- Please keep the project's [goals and non-goals](./README.md#goals) in mind.

- If your pull request requires changes in class `GitHosting` or top-level
  functions, please be aware that ensuring that the userscript still works on
  supported Git hostings is the top priority.  This may take a while to do due
  to limited access to some of the supported hostings.

[GitHubIssues]: https://github.com/rybak/copy-commit-reference-userscript/issues
[GitLabIssues]: https://gitlab.com/andrybak/copy-commit-reference-userscript/-/issues
[CodebergIssues]: https://codeberg.org/andrybak/copy-commit-reference-userscript/issues
[GiteaIssues]: https://gitea.com/andrybak/copy-commit-reference-userscript/issues
