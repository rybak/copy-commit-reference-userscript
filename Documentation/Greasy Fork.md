<!--

This file is used as description on Greasy Fork by all userscripts.

-->
Adds a "Copy commit reference" button to every commit page. An example of a
commit reference is:

> The reference format in git.git repository has been implemented in commit [1f0fc1d](https://github.com/git/git/commit/1f0fc1db8599f87520494ca4f0e3c1b6fabdf997) (pretty: implement 'reference' format, 2019-11-20).

Such references are a good way of providing context in commit messages.

### 📋 Features

The userscript puts both plain text and HTML content to the clipboard. The HTML
version of the commit reference includes clickable links to the website.  This
is useful in rich text editors, e.g. in Slack and visual mode of Jira.

If you use IntelliJ-based IDEs (IDEA, PyCharm, CLion, Goland, etc), you might
also find plugin [Copy Commit Reference](https://plugins.jetbrains.com/plugin/22138-copy-commit-reference)
useful.

### 🛠️ Custom domain instructions

The userscript is set up with `@match` rules for public hostings. You might have
to manually add your URL as a "User match" in the settings of the userscript.

<details>
<summary><img src="https://www.tampermonkey.net/images/icon.png" width=16 height=16 /> Tampermonkey instructions</summary>
<ol>
<li>Go to Dashboard in the extension menu</li>
<li>Click &quot;Edit&quot; button in the line of the userscript that you&#39;ve just installed</li>
<li>Copy the value from <code>@match</code> field of the metadata</li>
<li>Go to the tab &quot;Settings&quot;</li>
<li>Click &quot;Add...&quot; under &quot;User matches&quot;</li>
<li>Paste the copied value</li>
<li>Replace the original domain with the domain of website that you use</li>
<li>Click &quot;OK&quot;</li>
</ol>
</details>

### See also

Same userscripts for other Git hosting providers are available in set
[Git: copy commit reference](https://greasyfork.org/en/scripts?set=588773).

### 🤝 Contributing

Feel free to leave feedback on Greasy Fork,
[GitHub](https://github.com/rybak/copy-commit-reference-userscript/issues),
[GitLab](https://gitlab.com/andrybak/copy-commit-reference-userscript/-/issues),
[Forgejo](https://next.forgejo.org/andrybak/copy-commit-reference-userscript/issues),
or [Gitea](https://gitea.com/andrybak/copy-commit-reference-userscript/issues).

Source code of the userscript is available on
[GitHub](https://github.com/rybak/copy-commit-reference-userscript),
[GitLab](https://gitlab.com/andrybak/copy-commit-reference-userscript),
[Bitbucket](https://bitbucket.org/andreyrybak/copy-commit-reference-userscript),
[Gogs](https://try.gogs.io/andrybak/copy-commit-reference-userscript),
[Forgejo](https://next.forgejo.org/andrybak/copy-commit-reference-userscript),
and [Gitea](https://gitea.com/andrybak/copy-commit-reference-userscript).
Pull requests are welcome, see details in file `CONTRIBUTING.md`.
