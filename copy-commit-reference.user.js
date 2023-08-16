// ==UserScript==
// @name         Git: copy commit reference
// @namespace    https://github.com/rybak
// @version      0.7-alpha
// @description  "Copy commit reference" for GitWeb, Cgit, GitHub, GitLab, Bitbucket, and other Git hosting sites.
// @author       Andrei Rybak
// @license      MIT
// @include      https://*bitbucket*/*/commits/*
// @include      https://*git/*/commit/*
// @match        https://repo.or.cz/*/commit/*
// @match        https://github.com/*/commit/*
// @match        https://bitbucket.org/*/commits/*
// @match        https://*.googlesource.com/*/+/*
// @match        https://git.kernel.org/pub/scm/*/commit/*
// @match        https://gitlab.com/*/-/commit/*
// @match        https://invent.kde.org/*/-/commit/*
// @icon         https://git-scm.com/favicon.ico
// @grant        none
// ==/UserScript==

/*
 * Copyright (c) 2023 Andrei Rybak
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/*
 * TODO:
 * - See "TODO" comments in the code.
 */

(function() {
	'use strict';

	const LOG_PREFIX = '[Git: copy commit reference]:';
	const CONTAINER_ID = "CCR_container";
	const CHECKMARK_ID = "CCR_checkmark";

	function error(...toLog) {
		console.error(LOG_PREFIX, ...toLog);
	}

	function warn(...toLog) {
		console.warn(LOG_PREFIX, ...toLog);
	}

	function info(...toLog) {
		console.info(LOG_PREFIX, ...toLog);
	}

	function log(...toLog) {
		console.log(LOG_PREFIX, ...toLog);
	}

	function debug(...toLog) {
		console.debug(LOG_PREFIX, ...toLog);
	}

	class GitHosting {
		constructor() {
			if (this.constructor == GitHosting) {
				throw new Error("Abstract class cannot be instantiated.");
			}
		}

		/*
		 * CSS selector to use to wait until the webpage is considered loaded.
		 */
		getLoadedSelector() {
			throw new Error("Not implemented in " + this.constructor.name);
		}

		/*
		 * Returns true if this `GitHosting` recognizes the webpage.
		 * This method is only called when the page is loaded according
		 * to `getLoadedSelector()`.
		 */
		isRecognized() {
			return false;
		}

		/*
		 * CSS selector to use to find the element, to which the link
		 * will be added.
		 */
		getTargetSelector() {
			throw new Error("Not implemented in " + this.constructor.name);
		}

		/*
		 * Add additional HTML to wrap around the link container.
		 * This method can also be used to add CSS to the given `innerContainer`.
		 *
		 * By default just returns the given `innerContainer`, without wrapping.
		 */
		wrapLinkContainer(innerContainer) {
			return innerContainer;
		}

		getLinkText() {
			return "Copy commit reference";
		}

		/*
		 * Add additional HTML to wrap around the link itself.
		 * This method can also be used to add CSS to or alter HTML of
		 * the given `anchor`.
		 *
		 * By default just returns the given `anchor`, without wrapping.
		 */
		wrapLink(anchor) {
			return anchor;
		}

		/*
		 * Extracts ull SHA-1 object name (40-byte hexadecimal string) of the commit.
		 * Implementing classes can use both the URL (document.location) and the HTML
		 * to determine the hash.
		 */
		getFullHash() {
			throw new Error("Not implemented in " + this.constructor.name);
		}

		/*
		 * Returns author date of the commit in ISO 8601 format,
		 * i.e. YYYY-MM-DD, e.g. 2039-12-31
		 */
		async getDateIso(hash) {
			throw new Error("Not implemented in " + this.constructor.name);
		}

		/*
		 * Returns full commit message of the commit displayed on current webpage.
		 * Parameter `hash` is provided as a convenience for subclasses
		 * that need the full hash to avoid calling `getFullHash` twice.
		 */
		async getCommitMessage(hash) {
			throw new Error("Not implemented in " + this.constructor.name);
		}

		/*
		 * Converts given plain text version of subject line to HTML.
		 * Useful for Git hosting providers that have intergrations with
		 * issue trackers and code review tools.
		 *
		 * By default just returns its argument.
		 *
		 * TODO figure out how async/not-async should work
		 */
		convertPlainSubjectToHtml(plainTextSubject) {
			return plainTextSubject;
		}

		/*
		 * Adds a link to copy a commit reference to a target element.
		 * Target element is determined according to `getTargetSelector()`.
		 */
		doAddLink() {
			waitForElement(this.getTargetSelector()).then(target => {
				debug('target', target);
				const innerContainer = document.createElement('span');
				const container = this.wrapLinkContainer(innerContainer);
				container.id = CONTAINER_ID;
				target.append(container);
				const link = this.createCopyLink();
				innerContainer.appendChild(link);
				innerContainer.append(createCheckmark());
			});
		}

		/*
		 * Creates the link element to copy a commit reference to the clipboard.
		 */
		createCopyLink() {
			const linkText = this.getLinkText();
			let anchor = htmlToElement(`<a href="#">${linkText}</a>`);
			anchor = this.wrapLink(anchor);

			const onclick = (event) => {
				this.copyClickAction(event);
				showCheckmark();
				setTimeout(hideCheckmark, 2000);
			}
			anchor.onclick = onclick;
			return anchor;
		}


		/*
		 * Generates the content and passes it to the clipboard.
		 *
		 * Async, because we need to access REST APIs.
		 */
		async copyClickAction(event) {
			event.preventDefault();
			try {
				/*
				 * Extract metadata about the commit from the UI using methods from subclass.
				 */
				const commitHash = this.getFullHash();
				const dateIso = await this.getDateIso(commitHash);
				const commitMessage = await this.getCommitMessage(commitHash);

				const subject = commitMessageToSubject(commitMessage);

				const plainText = plainTextCommitReference(commitHash, subject, dateIso);
				const htmlSubject = await this.convertPlainSubjectToHtml(subject);
				const html = htmlSyntaxCommitReference(commitHash, htmlSubject, dateIso);

				log("plain text:", plainText);
				log("HTML:", html);

				const handleCopyEvent = e => {
					addLinkToClipboard(e, plainText, html);
				};
				document.addEventListener('copy', handleCopyEvent);
				document.execCommand('copy');
				document.removeEventListener('copy', handleCopyEvent);
			} catch (e) {
				error('Could not do the copying', e);
			}
		}
	}

	/*
	 * Implementation for Bitbucket Cloud.
	 *
	 * Example URLs for testing:
	 *   - Regular commit with Jira issue
	 *     https://bitbucket.org/andreyrybak/atlassian-tweaks/commits/1e7277348eb3f7b1dc07b4cc035a6d82943a410f
	 *   - Merge commit with PR mention
	 *     https://bitbucket.org/andreyrybak/atlassian-tweaks/commits/7dbe5402633c593021de6bf203278e2c6599c953
	 *   - Merge commit with mentions of Jira issue and PR
	 *     https://bitbucket.org/andreyrybak/atlassian-tweaks/commits/19ca4f537e454e15f4e3bf1f88ebc43c0e9c559a
	 *
	 * Unfortunately, some of the minified/mangled selectors are prone to bitrot.
	 */
	class BitbucketCloud extends GitHosting {
		getLoadedSelector() {
			return '[data-aui-version]';
		}

		isRecognized() {
			// can add more selectors to distriguish from Bitbucket Server, if needed
			return document.querySelector('meta[name="bb-view-name"]') != null;
		}

		getTargetSelector() {
			return '.css-tbegx5.e1tw8lnx2';
		}

		getFullHash() {
			const a = document.querySelector('a.css-1leee2m');
			const href = a.getAttribute('href');
			return href.slice(-41, -1);
		}

		async getDateIso(hash) {
			const json = await this.#downloadJson();
			return json.date.slice(0, 'YYYY-MM-DD'.length);
		}

		getCommitMessage() {
			const commitMsgContainer = document.querySelector('.css-1qa9ryl.e1tw8lnx1+div');
			return commitMsgContainer.innerText;
		}

		async convertPlainSubjectToHtml(plainTextSubject) {
			try {
				/*
				 * The argument `plainTextSubject` is ignored, because
				 * we just use JSON from REST API.
			     */
				const json = await this.#downloadJson();
				return BitbucketCloud.#firstHtmlParagraph(json.summary.html);
			} catch (e) {
				error("BitbucketCloud: cannot fetch commit JSON from REST API", e);
			}
		}

		wrapLinkContainer(container) {
			container.style = 'margin-left: 1em;';
			return container;
		}

		/*
		 * Cache of JSON loaded from REST API.
		 * Caching is needed to avoid multiple REST API requests
		 * for various methods that need access to the JSON.
		 */
		#commitJson = null;

		/*
		 * Downloads JSON object corresponding to the commit via REST API
		 * of Bitbucket Cloud.
		 */
		async #downloadJson() {
			if (this.#commitJson != null) {
				return this.#commitJson;
			}
			// TODO better way of getting projectKey and repositorySlug
			const mainSelfLink = document.querySelector('#bitbucket-navigation a');
			// slice(1, -1) is needed to cut off slashes
			const projectKeyRepoSlug = mainSelfLink.getAttribute('href').slice(1, -1);

			const commitHash = this.getFullHash();
			// TODO include a link to REST API reference documentation
			const commitRestUrl = `/!api/2.0/repositories/${projectKeyRepoSlug}/commit/${commitHash}?fields=%2B%2A.rendered.%2A`;
			info(`BitbucketCloud: Fetching "${commitRestUrl}"...`);
			const commitResponse = await fetch(commitRestUrl);
			this.#commitJson = await commitResponse.json();
			return this.#commitJson;
		}

		/*
		 * Extracts first <p> tag out of the provided `html`.
		 */
		static #firstHtmlParagraph(html) {
			const OPEN_P_TAG = '<p>';
			const CLOSE_P_TAG = '</p>';
			const startP = html.indexOf(OPEN_P_TAG);
			const endP = html.indexOf(CLOSE_P_TAG);
			if (startP < 0 || endP < 0) {
				return html;
			}
			return html.slice(startP + OPEN_P_TAG.length, endP);
		}

	}

	class BitbucketServer extends GitHosting {
		getLoadedSelector() {
			return '[data-aui-version]';
		}

		foobar() {
			// TODO split into methods of `GitHosting`
			const commitAnchor = document.querySelector('.commit-badge-oneline .commit-details .commitid');
			const commitTimeTag = document.querySelector('.commit-badge-oneline .commit-details time');
			const commitMessage = commitAnchor.getAttribute('data-commit-message');
			const dateIso = commitTimeTag.getAttribute('datetime').slice(0, 'YYYY-MM-DD'.length);
			const commitId = commitAnchor.getAttribute('data-commitid');

			// await insertPrLinks(await insertJiraLinks(subject), commitId);
		}
	}

	/*
	 * Implementation for GitHub.
	 * This was tested on https://github.com, but wasn't tested in GitHub Enterprise.
	 *
	 * Example URL for testing:
	 *   - Regular commit
	 *     https://github.com/git/git/commit/1f0fc1db8599f87520494ca4f0e3c1b6fabdf997
	 *   - Merge commit with PR mention:
	 *     https://github.com/rybak/atlassian-tweaks/commit/fbeb0e54b64c894d9ba516db3a35c10bf409bfa6
	 *   - Empty commit (no diff, i.e. no changes committed)
	 *     https://github.com/rybak/copy-commit-reference-user-js/commit/234804fac57b39dd0017bc6f63aae1c1ce503d52
	 */
	class GitHub extends GitHosting {
		getLoadedSelector() {
			return '.application-main #js-repo-pjax-container #repo-content-pjax-container .commit .commit-meta';
		}

		isRecognized() {
			/*
			 * Simple string check to avoid costly `querySelector`.
			 */
			if (document.location.host.includes('github')) {
				return true;
			}
			/*
			 * This element is definitely present in github.com.
			 * The selector might need correction for GitHub Enterprise (on-premises).
			 */
			return document.querySelector('meta[name="github-keyboard-shortcuts"]') != null;
		}

		/*
		 * CSS selector to use to find the element, to which the link
		 * will be added.
		 */
		getTargetSelector() {
			return '.commit.full-commit .commit-meta div.flex-self-start.flex-content-center';
		}

		wrapLinkContainer(container) {
			container.style = 'margin-left: 1em;';
			return container;
		}

		getFullHash() {
			/*
			 * path example: "/git/git/commit/1f0fc1db8599f87520494ca4f0e3c1b6fabdf997"
			 */
			const path = document.querySelector('a.js-permalink-shortcut').getAttribute('href');
			const parts = path.split('/');
			if (parts.length < 5) {
				throw new Error("Cannot find commit hash in the URL");
			}
			return parts[4];
		}

		async getDateIso(hash) {
			const commitJson = await this.#downloadJson(hash);
			return commitJson.commit.author.date.slice(0, 'YYYY-MM-DD'.length);
		}

		async getCommitMessage() {
			const commitJson = await this.#downloadJson();
			return commitJson.commit.message;
		}

		async convertPlainSubjectToHtml(plainTextSubject) {
			return await GitHub.#insertPrLinks(plainTextSubject);
		}

		/*
		 * Adds CSS classes and a nice icon to mimic other buttons in GitHub UI.
		 */
		wrapLink(anchor) {
			anchor.innerHTML = ""; // strip the default text to overhaul the insides
			anchor.classList.add('Link--onHover', 'color-fg-muted');
			try {
				// GitHub's .octicon-copy is present on all pages, even if commit is empty
				const icon = document.querySelector('.octicon-copy').cloneNode(true);
				icon.classList.remove('color-fg-muted');
				anchor.append(icon);
			} catch (e) {
				warn('Github: cannot find .octicon-copy');
			}
			const linkText = this.getLinkText();
			anchor.append(` ${linkText}`);
			return anchor;
		}

		/*
		 * Cache of JSON loaded from REST API.
		 * Caching is needed to avoid multiple REST API requests
		 * for various methods that need access to the JSON.
		 */
		#commitJson = null;

		/*
		 * Downloads JSON object corresponding to the commit via REST API
		 * of GitHub.
		 */
		async #downloadJson(hash) {
			if (this.#commitJson != null) {
				return this.#commitJson;
			}
			try {
				const commitRestUrl = GitHub.#getCommitRestApiUrl(hash);
				info(`GitHub: Fetching "${commitRestUrl}"...`);
				const commitResponse = await fetch(commitRestUrl, GitHub.#getRestApiOptions());
				this.#commitJson = await commitResponse.json();
				return this.#commitJson;
			} catch (e) {
				error("GitHub: cannot fetch commit JSON from REST API", e);
				return null;
			}
		}

		static #getApiHostUrl() {
			const host = document.location.host;
			return `https://api.${host}`;
		}

		static #getCommitRestApiUrl(hash) {
			/*
			 * Format: /repos/{owner}/{repo}/commits/{ref}
			 *   - NOTE: plural "commits" in the URL!!!
			 * Examples:
			 *   - https://api.github.com/repos/git/git/commits/1f0fc1db8599f87520494ca4f0e3c1b6fabdf997
			 *   - https://api.github.com/repos/rybak/atlassian-tweaks/commits/a76a9a6e993a7a0e48efabdd36f4c893317f1387
			 */
			const apiHostUrl = GitHub.#getApiHostUrl();
			const path = document.querySelector('a.js-permalink-shortcut').getAttribute('href');
			const parts = path.split('/');
			if (parts.length < 5) {
				throw new Error("GitHub: cannot find commit hash in the URL");
			}
			const owner = parts[1];
			const repo = parts[2];
			return `${apiHostUrl}/repos/${owner}/${repo}/commits/${hash}`;
		}

		static #getRestApiOptions() {
			const myHeaders = new Headers();
			myHeaders.append("Accept", "application/vnd.github+json");
			const myInit = {
				headers: myHeaders,
			};
			return myInit;
		}

		/*
		 * Inserts an HTML anchor to link to the pull requests, which are
		 * mentioned in the provided `text` in the format that is used by
		 * GitHub's default automatic merge commit messages.
		 */
		static #insertPrLinks(text) {
			if (!text.toLowerCase().includes('pull request')) {
				return text;
			}
			try {
				// a hack: just get the existing HTML from the GUI
				// the hack probably doesn't work very well with overly long subject lines
				// TODO: proper conversion of `text`
				//       though a shorter version (with ellipsis) might be better for HTML version
				return document.querySelector('.commit-title.markdown-title').innerHTML.trim();
			} catch (e) {
				error("GitHub: cannot insert pull request links", e);
				return text;
			}
		}
	}

	/*
	 * Implementation for GitWeb
	 * Documentation:
	 *   - https://git-scm.com/docs/gitweb
	 *   - https://git-scm.com/book/en/v2/Git-on-the-Server-GitWeb
	 *
	 * Example URL for userscript testing:
	 *   - https://repo.or.cz/alt-git.git/commit/1f0fc1db8599f87520494ca4f0e3c1b6fabdf997
	 *
	 * TODO maybe add support for commitdiff pages, e.g.:
	 *     https://repo.or.cz/alt-git.git/commitdiff/1f0fc1db8599f87520494ca4f0e3c1b6fabdf997
	 */
	class GitWeb extends GitHosting {
		getLoadedSelector() {
			return '.page_nav_sub';
		}

		isRecognized() {
			const g = document.querySelector('meta[name="generator"]');
			if (!g) {
				return false;
			}
			return g.content.startsWith('gitweb/');
		}

		getTargetSelector() {
			return '.page_nav_sub';
		}

		wrapLinkContainer(innerContainer) {
			const container = document.createElement('span');
			container.append(htmlToElement('<span class="barsep">&nbsp;|&nbsp;</span>'));
			const tab = document.createElement('span');
			tab.classList.add('tab');
			tab.append(innerContainer);
			container.append(tab);
			return container;
		}

		getLinkText() {
			// use all lowercase for consistency with the rest of the UI
			return "copy commit reference";
		}

		getFullHash() {
			const cell = document.querySelector('.title_text .object_header tr:nth-child(1) td.sha1');
			return cell.innerText;
		}

		async getDateIso(hash) {
			const cell = document.querySelector('.title_text .object_header tr:nth-child(3) .datetime');
			const s = cell.innerText;
			const d = new Date(s);
			return d.toISOString().slice(0, 'YYYY-MM-DD'.length);
		}

		getCommitMessage(hash) {
			return document.querySelector('.page_body').innerText;
		}
	}

	/*
	 * Implementation for Gitiles.
	 * Documentation:
	 *   - https://gerrit.googlesource.com/gitiles/ "Gitiles - A simple JGit repository browser"
	 *
	 * Example URLs for testing:
	 *   - https://kernel.googlesource.com/pub/scm/git/git/+/1f0fc1db8599f87520494ca4f0e3c1b6fabdf997
	 *   - https://code.googlesource.com/git/+/1f0fc1db8599f87520494ca4f0e3c1b6fabdf997
	 */
	class Gitiles extends GitHosting {
		getLoadedSelector() {
			return '.Site .Site-content .MetadataMessage';
		}

		isRecognized() {
			const poweredBy = document.querySelector('.Footer-poweredBy');
			if (poweredBy == null) {
				return false;
			}
			return poweredBy.innerText.includes('Gitiles');
		}

		getTargetSelector() {
			// td:nth-child(3) because tags in a row are: <th> <td> <td>
			return '.Site .Site-content .Container .Metadata table tr:nth-child(1) td:nth-child(3)';
		}

		wrapLinkContainer(innerContainer) {
			const container = document.createElement('span');
			container.append(" [", innerContainer, "]");
			return container;
		}

		getLinkText() {
			// TODO: maybe shorter "copy reference" would be better?
			// use all lowercase for consistency with the rest of the UI
			return "copy commit reference";
		}

		getFullHash() {
			const cell = document.querySelector('.Site .Site-content .Container .Metadata table tr:nth-child(1) td:nth-child(2)');
			return cell.innerText;
		}

		async getDateIso(hash) {
			const cell = document.querySelector('.Site .Site-content .Container .Metadata table tr:nth-child(2) td:nth-child(3)');
			const s = cell.innerText;
			const d = new Date(s);
			return d.toISOString().slice(0, 'YYYY-MM-DD'.length);
		}

		async getCommitMessage(hash) {
			return document.querySelector('.MetadataMessage').innerText;
		}
	}

	/*
	 * Implementation for cgit.
	 * Documentation:
	 *   - https://git.zx2c4.com/cgit/about/
	 *
	 * Example URL for testing:
	 *   - https://git.kernel.org/pub/scm/git/git.git/commit/?h=main&id=1f0fc1db8599f87520494ca4f0e3c1b6fabdf997
	 */
	class Cgit extends GitHosting {
		getLoadedSelector() {
			return 'body > #cgit > .content > .commit-msg';
		}

		isRecognized() {
			return document.getElementById('cgit') != null;
		}

		getTargetSelector() {
			return 'body > #cgit > .content > table.commit-info > tbody > tr:nth-child(3) td.sha1';
		}

		wrapLinkContainer(innerContainer) {
			const container = document.createElement('span');
			container.append(" (", innerContainer, ")");
			return container;
		}

		getLinkText() {
			// use all lowercase for consistency with the rest of the UI
			return "copy commit reference";
		}

		getFullHash() {
			const commitAnchor = document.querySelector('body > #cgit > .content > table.commit-info > tbody > tr:nth-child(3) td.sha1 a');
			return commitAnchor.innerText;
		}

		getDateIso(hash) {
			const authorDateCell = document.querySelector('body > #cgit > .content > table.commit-info > tbody > tr:nth-child(1) td:nth-child(3)');
			return authorDateCell.innerText.slice(0, 'YYYY-MM-DD'.length);
		}

		async getCommitMessage(hash) {
			/*
			 * Even though vast majority will only need `subj`, gather everything and
			 * let downstream code handle paragraph splitting.
			 */
			const subj = document.querySelector('body > #cgit > .content > .commit-subject').innerText;
			const body = document.querySelector('body > #cgit > .content > .commit-msg').innerText;
			return subj + '\n\n' + body;
		}
	}

	/*
	 * Tampermonkey's code formatting breaks for static field for some reason, weird.
	 * Therefore, keep it outside, visible, but without code formatting breakage.
	 */
	const GITLAB_HEADER_SELECTOR = 'main#content-body .page-content-header > .header-main-content';
	/*
	 * Implementation for GitLab.
	 *
	 * Example URLs for testing:
	 *   - https://gitlab.com/andrybak/resoday/-/commit/b82824ec6dc3f14c3711104bf0ffd792c86d19ba
	 *   - https://invent.kde.org/education/kturtle/-/commit/8beecff6f76a4afc74879c46517d00657d8426f9
	 *
	 * TODO:
	 *   - need new API in class GitHosting to allow putting the link *not* at the end of `target`.
	 *   - need new API in class GitHosting to change checkbox appearance on click to the GitLab's style tooltip "Copied".
	 */
	class GitLab extends GitHosting {
		getLoadedSelector() {
			// cannot use
			//    '.content-wrapper main#content-body .commit-box > .commit-description';
			// because it doesn't exist for commits without a body
			return '.content-wrapper main#content-body .commit-box';
		}

		isRecognized() {
			return document.querySelector('meta[content="GitLab"][property="og:site_name"]') != null;
		}

		getTargetSelector() {
			return GITLAB_HEADER_SELECTOR;
		}

		wrapLink(anchor) {
			const copyShaButtonIcon = document.querySelector(`${GITLAB_HEADER_SELECTOR} > button.btn-clipboard > svg`);
			const icon = copyShaButtonIcon.cloneNode(true);
			anchor.innerHTML = "";
			anchor.append(icon);
			anchor.classList.add('btn', 'btn-clipboard', 'gl-button', 'btn-default-tertiary', 'btn-icon', 'btn-sm');
			anchor.setAttribute('data-toggle', 'tooltip'); // this is needed to have a fancy tooltip in style of other UI
			anchor.setAttribute('data-placement', 'polite'); // this is needed so that the fancy tooltip appears below the button
			anchor.title = this.getLinkText() + " to clipboard";
			return anchor;
		}

		getFullHash() {
			const copyShaButton = document.querySelector(`${GITLAB_HEADER_SELECTOR} > button.btn-clipboard`);
			return copyShaButton.getAttribute('data-clipboard-text');
		}

		getDateIso(hash) {
			// careful not to select <time> tag for "Committed by"
			const authorTimeTag = document.querySelector(`${GITLAB_HEADER_SELECTOR} > .d-sm-inline + time`);
			return authorTimeTag.getAttribute('datetime').slice(0, 'YYYY-MM-DD'.length);
		}

		async getCommitMessage(hash) {
			/*
			 * Even though vast majority will only need `subj`, gather everything and
			 * let downstream code handle paragraph splitting.
			 */
			const subj = document.querySelector('.commit-box .commit-title').innerText;
			const maybeBody = document.querySelector('.commit-box .commit-description');
			if (maybeBody == null) { // some commits have only a single-line message
				return subj;
			}
			const body = maybeBody.innerText;
			return subj + '\n\n' + body;
		}
	}

	/*
	 * Detects the kind of Bitbucket, invokes corresponding function:
	 * `serverFn` or `cloudFn`, and returns result of the invocation.
	 */
	function onVersion(serverFn, cloudFn) {
		if (document.querySelector('meta[name="bb-single-page-app"]') == null) {
			return serverFn();
		}
		const b = document.body;
		const auiVersion = b.getAttribute('data-aui-version');
		if (!auiVersion) {
			return cloudFn();
		}
		if (auiVersion.startsWith('7.')) {
			/*
			 * This is weird, but unlike for Jira Server vs Jira Cloud,
			 * Bitbucket Cloud's AUI version is smaller than AUI version
			 * of current-ish Bitbucket Server.
			 */
			return cloudFn();
		}
		if (auiVersion.startsWith('9.')) {
			return serverFn();
		}
		// TODO more ways of detecting the kind of Bitbucket
		cloudFn();
	}

	/*
	 * Extracts the first line of the commit message.
	 * If the first line is too small, extracts more lines.
	 */
	function commitMessageToSubject(commitMessage) {
		const lines = commitMessage.split('\n');
		if (lines[0].length > 16) {
			/*
			 * Most common use-case: a normal commit message with
			 * a normal-ish subject line.
			 */
			return lines[0].trim();
		}
		/*
		 * The `if`s below handles weird commit messages I have
		 * encountered in the wild.
		 */
		if (lines.length < 2) {
			return lines[0].trim();
		}
		if (lines[1].length == 0) {
			return lines[0].trim();
		}
		// sometimes subject is weirdly split across two lines
		return lines[0].trim() + " " + lines[1].trim();
	}

	function abbreviateCommitId(commitId) {
		return commitId.slice(0, 7)
	}

	/*
	 * Formats given commit metadata as a commit reference according
	 * to `git log --format=reference`.  See format descriptions at
	 * https://git-scm.com/docs/git-log#_pretty_formats
	 */
	function plainTextCommitReference(commitId, subject, dateIso) {
		const abbrev = abbreviateCommitId(commitId);
		return `${abbrev} (${subject}, ${dateIso})`;
	}

	/*
	 * Extracts Jira issue keys from the Bitbucket UI.
	 * Works only in Bitbucket Server so far.
	 * Not needed for Bitbucket Cloud, which uses a separate REST API
	 * request to provide the HTML content for the clipboard.
	 */
	function getIssueKeys() {
		const issuesElem = document.querySelector('.plugin-section-primary .commit-issues-trigger');
		if (!issuesElem) {
			return [];
		}
		const issueKeys = issuesElem.getAttribute('data-issue-keys').split(',');
		return issueKeys;
	}

	/*
	 * Returns the URL to a Jira issue for given key of the Jira issue.
	 * Uses Bitbucket's REST API for Jira integration (not Jira API).
	 * A Bitbucket instance may be connected to several Jira instances
	 * and Bitbucket doesn't know for which Jira instance a particular
	 * issue mentioned in the commit belongs.
	 */
	async function getIssueUrl(issueKey) {
		const projectKey = document.querySelector('[data-projectkey]').getAttribute('data-projectkey');
		/*
		 * This URL for REST API doesn't seem to be documented.
		 * For example, `jira-integration` isn't mentioned in
		 * https://docs.atlassian.com/bitbucket-server/rest/7.21.0/bitbucket-jira-rest.html
		 *
		 * I've found out about it by checking what Bitbucket
		 * Server's web UI does when clicking on the Jira
		 * integration link on a commit's page.
		 */
		const response = await fetch(`${document.location.origin}/rest/jira-integration/latest/issues?issueKey=${issueKey}&entityKey=${projectKey}&fields=url&minimum=10`);
		const data = await response.json();
		return data[0].url;
	}

	async function insertJiraLinks(text) {
		const issueKeys = getIssueKeys();
		if (issueKeys.length == 0) {
			return text;
		}
		debug("issueKeys:", issueKeys);
		for (const issueKey of issueKeys) {
			if (text.includes(issueKey)) {
				try {
					const issueUrl = await getIssueUrl(issueKey);
					text = text.replace(issueKey, `<a href="${issueUrl}">${issueKey}</a>`);
				} catch(e) {
					warn(`Cannot load Jira URL from REST API for issue ${issueKey}`, e);
				}
			}
		}
		return text;
	}

	function getProjectKey() {
		return document.querySelector('[data-project-key]').getAttribute('data-project-key');
	}

	function getRepositorySlug() {
		return document.querySelector('[data-repository-slug]').getAttribute('data-repository-slug');
	}

	/*
	 * Loads from REST API the pull requests, which involve the given commit.
	 *
	 * Tested only on Bitbucket Server.
	 * Shouldn't be used on Bitbucket Cloud, because of the extra request
	 * for HTML of the commit message.
	 */
	async function getPullRequests(commitId) {
		const projectKey = getProjectKey();
		const repoSlug = getRepositorySlug();
		const url = `/rest/api/latest/projects/${projectKey}/repos/${repoSlug}/commits/${commitId}/pull-requests?start=0&limit=25`;
		try {
			const response = await fetch(url);
			const obj = await response.json();
			return obj.values;
		} catch (e) {
			error(`Cannot getPullRequests url="${url}"`, e);
			return [];
		}
	}

	/*
	 * Inserts an HTML anchor to link to the pull requests, which are
	 * mentioned in the provided `text` in the format that is used by
	 * Bitbucket's default automatic merge commit messages.
	 *
	 * Tested only on Bitbucket Server.
	 * Shouldn't be used on Bitbucket Cloud, because of the extra request
	 * for HTML of the commit message.
	 */
	async function insertPrLinks(text, commitId) {
		if (!text.toLowerCase().includes('pull request')) {
			return text;
		}
		try {
			const prs = await getPullRequests(commitId);
			/*
			 * Find the PR ID in the text.
			 * Assume that there should be only one.
			 */
			const m = new RegExp('pull request [#](\\d+)', 'gmi').exec(text);
			if (m.length != 2) {
				return text;
			}
			const linkText = m[0];
			const id = parseInt(m[1]);
			for (const pr of prs) {
				if (pr.id == id) {
					const prUrl = pr.links.self[0].href;
					text = text.replace(linkText, `<a href="${prUrl}">${linkText}</a>`);
					break;
				}
			}
			return text;
		} catch (e) {
			error("Cannot insert pull request links", e);
			return text;
		}
	}

	/*
	 * Renders given commit that has the provided subject line and date
	 * in reference format as HTML content.  Returned HTML includes
	 * a clickable link to the commit, and may include links to issue
	 * trackers, code review tools, etc.
	 *
	 * Parameter `subject`:
	 *     Pre-rendered HTML of the subject line of the commit.
	 *
	 * Documentation of formats: https://git-scm.com/docs/git-log#_pretty_formats
	 */
	function htmlSyntaxCommitReference(commitHash, subjectHtml, dateIso) {
		const url = document.location.href;
		const abbrev = abbreviateCommitId(commitHash);
		const html = `<a href="${url}">${abbrev}</a> (${subjectHtml}, ${dateIso})`;
		return html;
	}

	function addLinkToClipboard(event, plainText, html) {
		event.stopPropagation();
		event.preventDefault();

		let clipboardData = event.clipboardData || window.clipboardData;
		clipboardData.setData('text/plain', plainText);
		clipboardData.setData('text/html', html);
	}


	// from https://stackoverflow.com/a/61511955/1083697 by Yong Wang
	function waitForElement(selector) {
		return new Promise(resolve => {
			if (document.querySelector(selector)) {
				return resolve(document.querySelector(selector));
			}
			const observer = new MutationObserver(mutations => {
				if (document.querySelector(selector)) {
					resolve(document.querySelector(selector));
					observer.disconnect();
				}
			});

			observer.observe(document.body, {
				childList: true,
				subtree: true
			});
		});
	}

	// adapted from https://stackoverflow.com/a/35385518/1083697 by Mark Amery
	function htmlToElement(html) {
		const template = document.createElement('template');
		template.innerHTML = html.trim();
		return template.content.firstChild;
	}

	function showCheckmark() {
		const checkmark = document.getElementById(CHECKMARK_ID);
		checkmark.style.display = 'inline';
	}

	function hideCheckmark() {
		const checkmark = document.getElementById(CHECKMARK_ID);
		checkmark.style.display = 'none';
	}

	function createCheckmark() {
		const container = document.createElement('span');
		container.id = CHECKMARK_ID;
		container.style.display = 'none';
		container.innerHTML = " ✅ Copied to clipboard";
		return container;
	}

	function removeExistingContainer() {
		const container = document.getElementById(CONTAINER_ID);
		if (!container) {
			return;
		}
		container.parentNode.removeChild(container);
	}

	function doEnsureLink() {
		/*
		 * Fresh copy of each object is created to avoid leaking memory
		 * for any caching that each implementation might want to do.
		 *
		 * TODO: sort in order of popularity
		 */
		const gitHostings = [
			new BitbucketCloud(),
			new BitbucketServer(), // TODO implement Bitbucket Server
			new GitHub(),
			new GitWeb(),
			new Gitiles(),
			new Cgit(),
			new GitLab()
		];
		removeExistingContainer();
		let loadedSelector = gitHostings.map(h => h.getLoadedSelector()).join(", ");
		info("loadedSelector =", `'${loadedSelector}'`);
		waitForElement(loadedSelector).then(loadedBody => {
			info("Loaded from selector ", loadedSelector);
			for (const hosting of gitHostings) {
				if (hosting.isRecognized()) {
					info("Recognized", hosting.constructor.name);
					hosting.doAddLink();
					return;
				}
			}
			warn("Cannot recognize any hosting");
		});
	}

	function ensureLink() {
		try {
			doEnsureLink();
		} catch (e) {
			error('Could not create the button', e);
		}
	}
	ensureLink();

	/*
	 * Clicking on a commit link on Bitbucket Cloud doesn't trigger a page load
	 * (sometimes, at least).  To cover such cases, we need to automatically
	 * detect that the commit in the URL has changed.
	 *
	 * For whatever reason listener for popstate events doesn't work to
	 * detect a change in the URL.
	 * https://developer.mozilla.org/en-US/docs/Web/API/Window/popstate_event
	 *
	 * As a workaround, observe the changes in the <title> tag, since commits
	 * will have different <title>s.
	 */
	let currentUrl = document.location.href;
	const observer = new MutationObserver((mutationsList) => {
		const maybeNewUrl = document.location.href;
		log('Mutation to', maybeNewUrl);
		if (maybeNewUrl != currentUrl) {
			currentUrl = maybeNewUrl;
			log('MutationObserver: URL has changed:', currentUrl);
			ensureLink();
		}
	});
	observer.observe(document.querySelector('title'), { subtree: true, characterData: true, childList: true });
	log('Added MutationObserver');
})();
