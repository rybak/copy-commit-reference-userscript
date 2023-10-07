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

## Install

All userscripts are available on [Greasy Fork][GreasyForkSet]. Just click
"Install this script" on the page of the individual userscript.

| <img src="https://git-scm.com/favicon.ico" height=16 /> Hosting                                                                                              | Screenshot                                     | ![][GreasyForkIcon] Greasy Fork                                                            |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------|--------------------------------------------------------------------------------------------|
| [<img src="https://github.githubassets.com/favicons/favicon-dark.svg" width=16 height=16 /> GitHub][GitHub]                                                  | [GitHub.png](./Documentation/GitHub.png)       | [![][GitHubVersion]][GitHubGreasyFork]       [![][GitHubInstalls]][GitHubGreasyFork]       |
| [<img src="https://bitbucket.org/favicon.ico?v=2" height=16 width=16 /> Bitbucket][Bitbucket]                                                                | [Bitbucket.png](./Documentation/Bitbucket.png) | [![][BitbucketVersion]][BitbucketGreasyFork] [![][BitbucketInstalls]][BitbucketGreasyFork] |
| [<img src="https://gitlab.com/assets/favicon-72a2cad5025aa931d6ea56c3201d1f18e68a8cd39788c7c80d5b2b82aa5143ef.png" width=16 height=16 /> GitLab][GitLab]     | [GitLab.png](./Documentation/GitLab.png)       | [![][GitLabVersion]][GitLabGreasyFork] [![][GitLabInstalls]][GitLabGreasyFork]             |
| [<img src="https://gitea.com/assets/img/favicon.png" height=16 /> Gitea][Gitea] / [<img src="https://forgejo.org/favicon.ico" height=16 /> Forgejo][Forgejo] | [Gitea.png](./Documentation/Gitea.png)         | [![][GiteaVersion]][GiteaGreasyFork] [![][GiteaInstalls]][GiteaGreasyFork]                 |
| [<img src="https://git.zx2c4.com/cgit/plain/cgit.png" height=16 /> Cgit][Cgit]                                                                               | [Cgit.png](./Documentation/Cgit.png)           | [![][CgitVersion]][CgitGreasyFork] [![][CgitInstalls]][CgitGreasyFork]                     |
| [<img src="https://repo.or.cz/favicon.ico" width=16 height=16 /> GitWeb][GitWeb]                                                                             | [GitWeb.png](./Documentation/GitWeb.png)       | [![][GitWebVersion]][GitWebGreasyFork] [![][GitWebInstalls]][GitWebGreasyFork]             |
| [Gitiles][Gitiles]                                                                                                                                           | [Gitiles.png](./Documentation/Gitiles.png)     | [![][GitilesVersion]][GitilesGreasyFork] [![][GitilesInstalls]][GitilesGreasyFork]         |
| [<img src="https://try.gogs.io/img/favicon.png" width=16 /> Gogs][Gogs]                                                                                      | [Gogs.png](./Documentation/Gogs.png)           | [![][GogsVersion]][GogsGreasyFork] [![][GogsInstalls]][GogsGreasyFork]                     |

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

## Repository mirrors

Code of the userscripts is available on the following mirrors:

- <https://github.com/rybak/copy-commit-reference-userscript>
- <https://gitlab.com/andrybak/copy-commit-reference-userscript>
- <https://bitbucket.org/andreyrybak/copy-commit-reference-userscript>
- <https://try.gogs.io/andrybak/copy-commit-reference-userscript> (registration
  required for read access)
- <https://next.forgejo.org/andrybak/copy-commit-reference-userscript>
- <https://gitea.com/andrybak/copy-commit-reference-userscript>

[GreasyForkSet]: https://greasyfork.org/en/scripts?set=588773
[GreasyForkIcon]: https://greasyfork.org/vite/assets/blacklogo16-bc64b9f7.png
[GitHub]: https://github.com
[GitHubGreasyFork]: https://greasyfork.org/en/scripts/472870-github-copy-commit-reference
[GitHubInstalls]: https://img.shields.io/badge/dynamic/json?style=flat&color=670000&label=Installs&query=total_installs&url=https%3A%2F%2Fgreasyfork.org%2Fscripts%2F472870.json
[GitHubVersion]: https://img.shields.io/badge/dynamic/json?style=flat&color=670000&label=Version&query=version&url=https%3A%2F%2Fgreasyfork.org%2Fscripts%2F472870.json
[Bitbucket]: https://www.atlassian.com/software/bitbucket
[BitbucketGreasyFork]: https://greasyfork.org/en/scripts/470667-bitbucket-copy-commit-reference
[BitbucketInstalls]: https://img.shields.io/badge/dynamic/json?style=flat&color=670000&label=Installs&query=total_installs&url=https%3A%2F%2Fgreasyfork.org%2Fscripts%2F470667.json
[BitbucketVersion]: https://img.shields.io/badge/dynamic/json?style=flat&color=670000&label=Version&query=version&url=https%3A%2F%2Fgreasyfork.org%2Fscripts%2F470667.json
[GitWeb]: https://git-scm.com/docs/gitweb
[GitWebBook]: https://git-scm.com/book/en/v2/Git-on-the-Server-GitWeb
[GitWebGreasyFork]: https://greasyfork.org/en/scripts/476739-gitweb-copy-commit-reference
[GitWebInstalls]: https://img.shields.io/badge/dynamic/json?style=flat&color=670000&label=Installs&query=total_installs&url=https%3A%2F%2Fgreasyfork.org%2Fscripts%2F476739.json
[GitWebVersion]: https://img.shields.io/badge/dynamic/json?style=flat&color=670000&label=Version&query=version&url=https%3A%2F%2Fgreasyfork.org%2Fscripts%2F476739.json
[GitLab]: https://gitlab.com
[GitLabGreasyFork]: https://greasyfork.org/en/scripts/476738-gitlab-copy-commit-reference
[GitLabInstalls]: https://img.shields.io/badge/dynamic/json?style=flat&color=670000&label=Installs&query=total_installs&url=https%3A%2F%2Fgreasyfork.org%2Fscripts%2F476738.json
[GitLabVersion]: https://img.shields.io/badge/dynamic/json?style=flat&color=670000&label=Version&query=version&url=https%3A%2F%2Fgreasyfork.org%2Fscripts%2F476738.json
[Gitiles]: https://gerrit.googlesource.com/gitiles/
[GitilesGreasyFork]: https://greasyfork.org/en/scripts/476737-gitiles-copy-commit-reference
[GitilesInstalls]: https://img.shields.io/badge/dynamic/json?style=flat&color=670000&label=Installs&query=total_installs&url=https%3A%2F%2Fgreasyfork.org%2Fscripts%2F476737.json
[GitilesVersion]: https://img.shields.io/badge/dynamic/json?style=flat&color=670000&label=Version&query=version&url=https%3A%2F%2Fgreasyfork.org%2Fscripts%2F476737.json
[Cgit]: https://git.zx2c4.com/cgit/about/
[CgitGreasyFork]: https://greasyfork.org/en/scripts/476735-cgit-copy-commit-reference
[CgitInstalls]: https://img.shields.io/badge/dynamic/json?style=flat&color=670000&label=Installs&query=total_installs&url=https%3A%2F%2Fgreasyfork.org%2Fscripts%2F476735.json
[CgitVersion]: https://img.shields.io/badge/dynamic/json?style=flat&color=670000&label=Version&query=version&url=https%3A%2F%2Fgreasyfork.org%2Fscripts%2F476735.json
[Gitea]: https://gitea.com
[GiteaGreasyFork]: https://greasyfork.org/en/scripts/476736-gitea-copy-commit-reference
[GiteaInstalls]: https://img.shields.io/badge/dynamic/json?style=flat&color=670000&label=Installs&query=total_installs&url=https%3A%2F%2Fgreasyfork.org%2Fscripts%2F476736.json
[GiteaVersion]: https://img.shields.io/badge/dynamic/json?style=flat&color=670000&label=Version&query=version&url=https%3A%2F%2Fgreasyfork.org%2Fscripts%2F476736.json
[Gogs]: https://gogs.io
[GogsGreasyFork]: https://greasyfork.org/en/scripts/476791-gogs-copy-commit-reference
[GogsInstalls]: https://img.shields.io/badge/dynamic/json?style=flat&color=670000&label=Installs&query=total_installs&url=https%3A%2F%2Fgreasyfork.org%2Fscripts%2F476791.json
[GogsVersion]: https://img.shields.io/badge/dynamic/json?style=flat&color=670000&label=Version&query=version&url=https%3A%2F%2Fgreasyfork.org%2Fscripts%2F476791.json
[Forgejo]: https://forgejo.org/ "Forgejo is a fork of Gitea"
