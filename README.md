# Copy commit reference userscripts

This is a collection of userscripts which add a "Copy commit reference" button
to commit pages of Git hosting providers.  An example of a reference is:

> The reference format in git.git repository has been implemented in commit
> [1f0fc1d](https://github.com/git/git/commit/1f0fc1db8599f87520494ca4f0e3c1b6fabdf997)
> (pretty: implement 'reference' format, 2019-11-20).

Such references are a good way of providing context in commit messages. The
userscript supports both plain text and HTML, with clickable links to the
website. This is useful in rich text editors, e.g. in Slack and visual mode of
Jira.

The source code is distributed under the terms of the GNU Affero General Public
License, Version 3.  See [LICENSE.txt](LICENSE.txt) for details.

## Userscripts

| Hosting                                                                                                                          | Screenshot                                     | Version                                             | Greasy Fork                                                     |
|----------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------|-----------------------------------------------------|-----------------------------------------------------------------|
| [<img src="https://github.githubassets.com/favicons/favicon-dark.svg" width=16 height=16 /> GitHub](https://github.com)          | [GitHub.png](./Documentation/GitHub.png)       | [![version][GitHubVersion]][GitHubGreasyFork]       | [![Number of installs][GitHubInstalls]][GitHubGreasyFork]       |
| [<img src="https://bitbucket.org/favicon.ico?v=2" height=16 width=16 /> Bitbucket](https://www.atlassian.com/software/bitbucket) | [Bitbucket.png](./Documentation/Bitbucket.png) | [![version][BitbucketVersion]][BitbucketGreasyFork] | [![Number of installs][BitbucketInstalls]][BitbucketGreasyFork] | 

## Supported hosting providers

- [<img src="https://repo.or.cz/favicon.ico" width=16 height=16 /> GitWeb](https://git-scm.com/docs/gitweb), see also [chapter in "Pro Git" book](https://git-scm.com/book/en/v2/Git-on-the-Server-GitWeb)
- [Cgit](https://git.zx2c4.com/cgit/about/) – "A hyperfast web frontend for git repositories written in C."
- [<img src="https://gitlab.com/assets/favicon-72a2cad5025aa931d6ea56c3201d1f18e68a8cd39788c7c80d5b2b82aa5143ef.png" width=16 height=16 /> GitLab](https://gitlab.com)
- [<img src="https://bitbucket.org/favicon.ico?v=2" height=16 width=16 /> Bitbucket Server](https://support.atlassian.com/bitbucket-server/)
- [Gitiles](https://gerrit.googlesource.com/gitiles/) – "A simple JGit repository browser"
- [<img src="https://gitea.com/assets/img/favicon.png" height=16 width=16 /> Gitea](https://gitea.com)

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Goals

- Allow users of Git hosting providers to produce better commit messages by
  giving them an easy way of creating commit references from web UIs of the
  hosting providers.
- Provide a way of producing human-readable HTML links, which are paste-able in
  rich text editors of wikis and IM apps, like Confluence and Slack.
  - Where possible, support HTML links to issue trackers and pull requests.
- Use native-like UI elements (buttons, links, and tooltips) which don't look
  out of place on the websites of supported Git hostings.
- Provide an abstract class `GitHosting` which:
  - is easy to subclass
  - has just enough points of extension to facilitate other goals

## Non-goals

- Adding buttons to copy full commit hashes or other useful strings from the web
  UIs of Git hostings.
- Overwriting or replacing existing UI.  For example, native buttons to copy
  hashes of commits should continue to work.

[GitHubGreasyFork]: https://greasyfork.org/en/scripts/472870-github-copy-commit-reference
[GitHubInstalls]: https://img.shields.io/badge/dynamic/json?style=flat&color=670000&label=Installs&query=total_installs&url=https%3A%2F%2Fgreasyfork.org%2Fscripts%2F472870.json
[GitHubVersion]: https://img.shields.io/badge/dynamic/json?style=flat&color=670000&label=Version&query=version&url=https%3A%2F%2Fgreasyfork.org%2Fscripts%2F472870.json
[BitbucketGreasyFork]: https://greasyfork.org/en/scripts/470667-bitbucket-copy-commit-reference
[BitbucketInstalls]: https://img.shields.io/badge/dynamic/json?style=flat&color=670000&label=Installs&query=total_installs&url=https%3A%2F%2Fgreasyfork.org%2Fscripts%2F470667.json
[BitbucketVersion]: https://img.shields.io/badge/dynamic/json?style=flat&color=670000&label=Version&query=version&url=https%3A%2F%2Fgreasyfork.org%2Fscripts%2F470667.json
