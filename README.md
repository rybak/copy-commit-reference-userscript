# Copy commit reference userscript

Adds a "Copy commit reference" link to commit pages of Git hosting providers.
An example of a reference is:

> The reference format in git.git repository has been implemented in commit
> [1f0fc1d](https://github.com/git/git/commit/1f0fc1db8599f87520494ca4f0e3c1b6fabdf997)
> (pretty: implement 'reference' format, 2019-11-20).

Such references are a good way of providing context in commit messages. The
userscript supports both plain text and HTML, with clickable links to the
website. This is useful in rich text editors, e.g. in Slack and visual mode of
Jira.

Install the userscript via [Greasy Fork][GreasyFork].

[![Badge showing number of installs from Greasy Fork][GreasyForkInstallsBadge]][GreasyFork]

The source code is distributed under the terms of the GNU Affero General Public
License, Version 3.  See [LICENSE.txt](LICENSE.txt) for details.

### Supported hosting providers

- [<img src="https://repo.or.cz/favicon.ico" width=16 height=16 /> GitWeb](https://git-scm.com/docs/gitweb), see also [chapter in "Pro Git" book](https://git-scm.com/book/en/v2/Git-on-the-Server-GitWeb)
- [Cgit](https://git.zx2c4.com/cgit/about/) – "A hyperfast web frontend for git repositories written in C."
- [<img src="https://github.githubassets.com/favicons/favicon-dark.svg" width=16 height=16 /> GitHub](https://github.com)
- [<img src="https://gitlab.com/assets/favicon-72a2cad5025aa931d6ea56c3201d1f18e68a8cd39788c7c80d5b2b82aa5143ef.png" width=16 height=16 /> GitLab](https://gitlab.com)
- [<img src="https://bitbucket.org/favicon.ico?v=2" height=16 width=16 /> Bitbucket Cloud](https://www.atlassian.com/software/bitbucket)
- [<img src="https://bitbucket.org/favicon.ico?v=2" height=16 width=16 /> Bitbucket Server](https://support.atlassian.com/bitbucket-server/)
- [Gitiles](https://gerrit.googlesource.com/gitiles/) – "A simple JGit repository browser"

### Demo

![Demo of userscript on various hosting providers](./.github/readme/demo.png)

[GreasyForkInstallsBadge]: https://img.shields.io/badge/dynamic/json?style=flat&color=670000&label=Greasy%20Fork&query=total_installs&suffix=%20installs&url=https%3A%2F%2Fgreasyfork.org%2Fscripts%2F473195.json
[GreasyFork]: https://greasyfork.org/en/scripts/473195-git-copy-commit-reference
