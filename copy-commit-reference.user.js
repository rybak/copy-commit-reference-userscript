// ==UserScript==
// @name         Git: copy commit reference
// @namespace    https://github.com/rybak
// @version      1.3
// @description  "Copy commit reference" for GitWeb, Cgit, GitHub, GitLab, Bitbucket, and other Git hosting sites.
// @author       Andrei Rybak
// @license      AGPL-3.0-only
// @include      https://*bitbucket*/*/commits/*
// @include      https://*git/*/commit/*
// @match        https://github.com/*
// @match        https://bitbucket.org/*/commits/*
// @match        https://gitlab.com/*/-/commit/*
// @match        https://*.googlesource.com/*/+/*
// @match        https://repo.or.cz/*/commit/*
// @match        https://git.kernel.org/pub/scm/*/commit/*
// @match        https://git.zx2c4.com/*/commit/*
// @match        https://invent.kde.org/*/-/commit/*
// @icon         https://git-scm.com/favicon.ico
// @grant        none
// ==/UserScript==

/*
 * Copyright (C) 2023 Andrei Rybak
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/*
 * TODO:
 * - See "TODO" and "FIXME" comments in the code.
 */

(function () {
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

	function debug(...toLog) {
		console.debug(LOG_PREFIX, ...toLog);
	}

	/**
	 * TODO: document and move out to a separate library for re-use.
	 *
	 * Avoid calling this function twice for the same `selector`,
	 * unless you can reasonably guarantee that the {@link Promise}
	 * returned by the previous invocation has been resolved.
	 *
	 * Adapted from [a Stack Overflow answer](https://stackoverflow.com/a/61511955/1083697)
	 * by Yong Wang.
	 *
	 * @param {string} selector a CSS query selector for the required
	 * element
	 * @returns {Promise<HTMLElement>} a {@link Promise} that resolves with the
	 * {@link HTMLElement} that the the given `selector` correpsonds to
	 * according to the function {@link Document.querySelector}.
	 */
	function waitForElement(selector) {
		return new Promise(resolve => {
			const queryResult = document.querySelector(selector);
			if (queryResult) {
				return resolve(queryResult);
			}
			const observer = new MutationObserver(mutations => {
				const queryResult = document.querySelector(selector);
				if (queryResult) {
					observer.disconnect();
					resolve(queryResult);
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

	/*
	 * Abstract class corresponding to a Git hosting provider.
	 *
	 * When subclassing each method that throws an `Error` must be implemented.
	 * See subclasses below for examples.
	 * An instance of each subclass must be added to the list `gitHostings` below.
	 */
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
			throw new Error("Not implemented in " + this.constructor.name);
		}

		/**
		 * CSS selector to use to find the element, to which the link
		 * will be added.
		 *
		 * @returns {string}
		 */
		getTargetSelector() {
			throw new Error("Not implemented in " + this.constructor.name);
		}

		/**
		 * Add additional HTML to wrap around the link container.
		 * This method can also be used to add CSS to the given `innerContainer`.
		 *
		 * By default just returns the given `innerContainer`, without wrapping.
		 *
		 * @param {HTMLElement} innerContainer see usage of {@link wrapLinkContainer} in {@link doAddLink}.
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

		/**
		 * Extracts full SHA-1 object name (40-digit hexadecimal string) of the commit.
		 * Implementing classes can use both the URL (document.location) and the HTML
		 * to determine the hash.
		 *
		 * @returns {string} full SHA-1 hash of the commit of the current page
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
		 */
		async convertPlainSubjectToHtml(plainTextSubject) {
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
				const linkContainer = this.wrapLinkContainer(innerContainer);
				linkContainer.id = CONTAINER_ID;
				this.addLinkContainerToTarget(target, linkContainer);
				const link = this.createCopyLink();
				innerContainer.appendChild(link);
				innerContainer.append(this.createCheckmark());
			});
		}

		/**
		 * Adds the `linkContainer` (see `CONTAINER_ID`) element to the `target`
		 * (see `getTargetSelector()`) element.
		 *
		 * Override this method, if your need customize where the copy link gets
		 * put in the interface.
		 *
		 * By default just appends the `linkContainer` to the end of `target`.
		 *
		 * @param {HTMLElement} target element in the native UI of this hosting
		 * website, where the userscript puts the "Copy commit reference" link.
		 * @param {HTMLElement} linkContainer the wrapper element around the
		 * "Copy commit reference" {@link createCopyLink link} and the
		 * checkmark (see method {@link createCheckmark})
		 */
		addLinkContainerToTarget(target, linkContainer) {
			target.append(linkContainer);
		}

		/*
		 * Creates the link element to copy a commit reference to the clipboard.
		 */
		createCopyLink() {
			const linkText = this.getLinkText();
			let anchor = htmlToElement(`<a href="#">${linkText}</a>`);
			anchor = this.wrapLink(anchor);

			const onclick = (event) => {
				this.#copyClickAction(event);
			}
			anchor.onclick = onclick;
			return anchor;
		}

		/*
		 * The more fancy Git hostings have on-the-fly page reloads,
		 * which aren't proper page reloads.  Clicking on a commit
		 * link on these sites doesn't trigger re-running of the
		 * userscript (sometimes, at least).  This means that the
		 * link that we've added (see `addLinkContainerToTarget()`)
		 * will disappear from the page.  To cover such cases, we
		 * need to automatically detect that the commit in the
		 * URL has changed and _re-add_ the link again.
		 *
		 * Method `setUpReadder()` is called once during userscript's
		 * lifecycle on a webpage.
		 *
		 * Subclasses can override this method with their own
		 * implementation of an "re-adder".  Re-adders must clear
		 * any caches specific to a particular commit.  Re-adders
		 * must call `ensureLink()` only on webpages that are
		 * definitely pages for a singular commit.
		 */
		setUpReadder() {
		}

		/**
		 * Extracts the first line of the commit message.
		 * If the first line is too small, extracts more lines.
		 *
		 * @param {string} commitMessage the full commit message (subject and body)
		 * taken from the webpage. See {@link getCommitMessage} and its
		 * implementations in subclasses.
		 * @returns {string} subject, extracted from the commit message,
		 * Usually, it is the first line of the commit message.
		 */
		#commitMessageToSubject(commitMessage) {
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

		/**
		 * @param {string} commitHash a hash of a commit, usually SHA1 hash
		 * of 40 hexacedimal digits
		 * @returns abbreviated hash
		 */
		#abbreviateCommitHash(commitHash) {
			return commitHash.slice(0, 7)
		}

		/**
		 * Formats given commit metadata as a commit reference according
		 * to `git log --format=reference`.  See format descriptions at
		 * https://git-scm.com/docs/git-log#_pretty_formats
		 *
		 * @param {string} commitHash {@link getFullHash hash} of the commit
		 * @param {string} subject subject line of the commit message
		 * @param {string} dateIso author date of commit in ISO 8601 format
		 * @returns {string} a commit reference
		 */
		#plainTextCommitReference(commitHash, subject, dateIso) {
			const abbrev = this.#abbreviateCommitHash(commitHash);
			return `${abbrev} (${subject}, ${dateIso})`;
		}

		/**
		 * Renders given commit that has the provided subject line and date
		 * in reference format as HTML content.  Returned HTML includes
		 * a clickable link to the commit, and may include links to issue
		 * trackers, code review tools, etc.
		 *
		 * Documentation of formats: https://git-scm.com/docs/git-log#_pretty_formats
		 *
		 * @param {string} commitHash {@link getFullHash hash} of the commit
		 * @param {string} subjectHtml HTML of pre-rendered subject line of
		 * the commit message. See {@link convertPlainSubjectToHtml}.
		 * @param {string} dateIso author date of commit in ISO 8601 format
		 * @returns {string} HTML code of the commit reference
		 */
		#htmlSyntaxCommitReference(commitHash, subjectHtml, dateIso) {
			const url = document.location.href;
			const abbrev = this.#abbreviateCommitHash(commitHash);
			const html = `<a href="${url}">${abbrev}</a> (${subjectHtml}, ${dateIso})`;
			return html;
		}

		#addLinkToClipboard(event, plainText, html) {
			event.stopPropagation();
			event.preventDefault();

			let clipboardData = event.clipboardData || window.clipboardData;
			clipboardData.setData('text/plain', plainText);
			clipboardData.setData('text/html', html);
			this.#showCheckmark();
			setTimeout(() => this.#hideCheckmark(), 2000);
		}

		#showCheckmark() {
			const checkmark = document.getElementById(CHECKMARK_ID);
			checkmark.style.display = 'inline';
		}

		#hideCheckmark() {
			const checkmark = document.getElementById(CHECKMARK_ID);
			checkmark.style.display = 'none';
		}

		/**
		 * @returns {HTMLElement}
		 */
		createCheckmark() {
			const container = document.createElement('span');
			container.id = CHECKMARK_ID;
			container.style.display = 'none';
			container.append(" ✅ Copied to clipboard");
			return container;
		}

		/*
		 * Generates the content and passes it to the clipboard.
		 *
		 * Async, because we need to access REST APIs.
		 */
		async #copyClickAction(event) {
			event.preventDefault();
			try {
				/*
				 * Extract metadata about the commit from the UI using methods from subclass.
				 */
				const commitHash = this.getFullHash();
				const dateIso = await this.getDateIso(commitHash);
				const commitMessage = await this.getCommitMessage(commitHash);

				const subject = this.#commitMessageToSubject(commitMessage);

				const plainText = this.#plainTextCommitReference(commitHash, subject, dateIso);
				const htmlSubject = await this.convertPlainSubjectToHtml(subject, commitHash);
				const html = this.#htmlSyntaxCommitReference(commitHash, htmlSubject, dateIso);

				info("plain text:", plainText);
				info("HTML:", html);

				const handleCopyEvent = e => {
					this.#addLinkToClipboard(e, plainText, html);
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
			// can add more selectors to distinguish from Bitbucket Server, if needed
			return document.querySelector('meta[name="bb-view-name"]') != null;
		}

		getTargetSelector() {
			/*
			 * Box with "Jane Doe authored and John Doe committed deadbeef"
			 *          "YYYY-MM-DD"
			 */
			return '.css-tbegx5.e1tw8lnx2';
		}

		getFullHash() {
			/*
			 * "View source" button on the right.
			 */
			const a = document.querySelector('div.css-1oy5iav a.css-1leee2m');
			const href = a.getAttribute('href');
			debug("BitbucketCloud:", href);
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
			/*
			 * The argument `plainTextSubject` is ignored, because
			 * we just use JSON from REST API.
			 */
			const json = await this.#downloadJson();
			return BitbucketCloud.#firstHtmlParagraph(json.summary.html);
		}

		wrapLinkContainer(container) {
			container.style = 'margin-left: 1em;';
			return container;
		}

		wrapLink(anchor) {
			try {
				const icon = document.querySelector('[aria-label="copy commit hash"] svg').cloneNode(true);
				icon.classList.add('css-bwxjrz', 'css-snhnyn');
				const linkText = this.getLinkText();
				anchor.replaceChildren(icon, document.createTextNode(` ${linkText}`));
				anchor.classList.add('css-1leee2m');
			} catch (e) {
				warn('BitbucketCloud: cannot find icon of "copy commit hash"');
			}
			anchor.title = "Copy commit reference to clipboard";
			return anchor;
		}

		static #isABitbucketCommitPage() {
			const p = document.location.pathname;
			if (p.endsWith("commits") || p.endsWith("commits/")) {
				info('BitbucketCloud: MutationObserver <title>: this URL does not need the copy link');
				return false;
			}
			return true;
		}

		/*
		 * For whatever reason listener for popstate events doesn't
		 * work to detect a change in the URL on Bitbucket Cloud.
		 * https://developer.mozilla.org/en-US/docs/Web/API/Window/popstate_event
		 *
		 * As a workaround, observe the changes in the <title> tag,
		 * webpages of the commits include the abbreviated SHA1 hash
		 * in the <title>, which guarantees different <title>s.
		 */
		setUpReadder() {
			let currentUrl = document.location.href;
			const observer = new MutationObserver((mutationsList) => {
				const maybeNewUrl = document.location.href;
				info('BitbucketCloud: MutationObserver <title>: mutation to', maybeNewUrl);
				if (maybeNewUrl != currentUrl) {
					currentUrl = maybeNewUrl;
					info('BitbucketCloud: MutationObserver <title>: URL has changed:', currentUrl);
					this.#onPageChange();
					if (BitbucketCloud.#isABitbucketCommitPage()) {
						ensureLink();
					}
				}
			});
			observer.observe(document.querySelector('head'), { subtree: true, characterData: true, childList: true });
			info('BitbucketCloud: MutationObserver <title>: added');
		}

		/*
		 * Cache of JSON loaded from REST API.
		 * Caching is needed to avoid multiple REST API requests
		 * for various methods that need access to the JSON.
		 */
		#commitJson = null;

		#onPageChange() {
			this.#commitJson = null;
		}

		/*
		 * Downloads JSON object corresponding to the commit via REST API
		 * of Bitbucket Cloud.
		 */
		async #downloadJson() {
			if (this.#commitJson != null) {
				return this.#commitJson;
			}
			try {
				// TODO better way of getting projectKey and repositorySlug
				const mainSelfLink = document.querySelector('#bitbucket-navigation a');
				// slice(1, -1) is needed to cut off slashes
				const projectKeyRepoSlug = mainSelfLink.getAttribute('href').slice(1, -1);

				const commitHash = this.getFullHash();
				/*
				 * REST API reference documentation:
				 * https://developer.atlassian.com/cloud/bitbucket/rest/api-group-commits/#api-repositories-workspace-repo-slug-commit-commit-get
				 */
				const commitRestUrl = `/!api/2.0/repositories/${projectKeyRepoSlug}/commit/${commitHash}?fields=%2B%2A.rendered.%2A`;
				info(`BitbucketCloud: Fetching "${commitRestUrl}"...`);
				const commitResponse = await fetch(commitRestUrl);
				this.#commitJson = await commitResponse.json();
				return this.#commitJson;
			} catch (e) {
				error("BitbucketCloud: cannot fetch commit JSON from REST API", e);
			}
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

	/*
	 * Implementation for Bitbucket Server.
	 */
	class BitbucketServer extends GitHosting {
		/**
		 * This selector is used for {@link isRecognized}.  It is fine to
		 * use a selector specific to commit pages for recognition of
		 * BitbucketServer, because it does full page reloads when
		 * clicking to a commit page.
		 */
		static #SHA_LINK_SELECTOR = '.commit-badge-oneline .commit-details .commitid';

		getLoadedSelector() {
			/*
			 * Same as in BitbucketCloud, but that's fine.  Their
			 * implementations of `isRecognized` are different and
			 * that will allow the script to distinguish them.
			 */
			return '[data-aui-version]';
		}

		isRecognized() {
			return document.querySelector(BitbucketServer.#SHA_LINK_SELECTOR) != null;
		}

		getTargetSelector() {
			return '.plugin-section-secondary';
		}

		wrapLinkContainer(container) {
			container.classList.add('plugin-item');
			return container;
		}

		wrapLink(anchor) {
			const icon = document.createElement('span');
			icon.classList.add('aui-icon', 'aui-icon-small', 'aui-iconfont-copy');
			const linkText = this.getLinkText();
			anchor.replaceChildren(icon, document.createTextNode(` ${linkText}`));
			anchor.title = "Copy commit reference to clipboard";
			return anchor;
		}

		getFullHash() {
			const commitAnchor = document.querySelector(BitbucketServer.#SHA_LINK_SELECTOR);
			const commitHash = commitAnchor.getAttribute('data-commitid');
			return commitHash;
		}

		getDateIso(hash) {
			const commitTimeTag = document.querySelector('.commit-badge-oneline .commit-details time');
			const dateIso = commitTimeTag.getAttribute('datetime').slice(0, 'YYYY-MM-DD'.length);
			return dateIso;
		}

		getCommitMessage(hash) {
			const commitAnchor = document.querySelector(BitbucketServer.#SHA_LINK_SELECTOR);
			const commitMessage = commitAnchor.getAttribute('data-commit-message');
			return commitMessage;
		}

		async convertPlainSubjectToHtml(plainTextSubject, commitHash) {
			return await this.#insertPrLinks(await this.#insertJiraLinks(plainTextSubject), commitHash);
		}

		/*
		 * Extracts Jira issue keys from the Bitbucket UI.
		 * Works only in Bitbucket Server so far.
		 * Not needed for Bitbucket Cloud, which uses a separate REST API
		 * request to provide the HTML content for the clipboard.
		 */
		#getIssueKeys() {
			const issuesElem = document.querySelector('.plugin-section-primary .commit-issues-trigger');
			if (!issuesElem) {
				warn("Cannot find issues element");
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
		async #getIssueUrl(issueKey) {
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

		async #insertJiraLinks(text) {
			const issueKeys = this.#getIssueKeys();
			if (issueKeys.length == 0) {
				debug("Found zero issue keys.");
				return text;
			}
			debug("issueKeys:", issueKeys);
			for (const issueKey of issueKeys) {
				if (text.includes(issueKey)) {
					try {
						const issueUrl = await this.#getIssueUrl(issueKey);
						text = text.replace(issueKey, `<a href="${issueUrl}">${issueKey}</a>`);
					} catch (e) {
						warn(`Cannot load Jira URL from REST API for issue ${issueKey}`, e);
					}
				}
			}
			return text;
		}

		#getProjectKey() {
			return document.querySelector('[data-project-key]').getAttribute('data-project-key');
		}

		#getRepositorySlug() {
			return document.querySelector('[data-repository-slug]').getAttribute('data-repository-slug');
		}

		/*
		 * Loads from REST API the pull requests, which involve the given commit.
		 *
		 * Tested only on Bitbucket Server.
		 * Shouldn't be used on Bitbucket Cloud, because of the extra request
		 * for HTML of the commit message.
		 */
		async #getPullRequests(commitHash) {
			const projectKey = this.#getProjectKey();
			const repoSlug = this.#getRepositorySlug();
			const url = `/rest/api/latest/projects/${projectKey}/repos/${repoSlug}/commits/${commitHash}/pull-requests?start=0&limit=25`;
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
		async #insertPrLinks(text, commitHash) {
			if (!text.toLowerCase().includes('pull request')) {
				return text;
			}
			try {
				const prs = await this.#getPullRequests(commitHash);
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
			return '.application-main .commit .commit-meta';
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
			anchor.classList.add('Link--onHover', 'color-fg-muted');
			try {
				// GitHub's .octicon-copy is present on all pages, even if commit is empty
				const icon = document.querySelector('.octicon-copy').cloneNode(true);
				icon.classList.remove('color-fg-muted');
				anchor.append(icon);
				const linkText = this.getLinkText();
				anchor.replaceChildren(icon, document.createTextNode(` ${linkText}`));
			} catch (e) {
				warn('Github: cannot find .octicon-copy');
			}
			return anchor;
		}

		static #isAGitHubCommitPage() {
			const p = document.location.pathname;
			/*
			 * Note that `pathname` doesn't include slashes from
			 * repository's directory structure.
			 */
			const slashIndex = p.lastIndexOf('/');
			if (slashIndex <= 7) {
				info('GitHub: not enough characters to be a commit page');
				return false;
			}
			const maybeSlashCommit = p.slice(slashIndex - 7, slashIndex);
			if (maybeSlashCommit != '/commit') {
				info('GitHub: missing "/commit" in the URL');
				return false;
			}
			// https://stackoverflow.com/a/10671743/1083697
			const numberOfSlashes = (p.match(/\//g) || []).length;
			if (numberOfSlashes != 4) {
				info('GitHub: This URL does not look like a commit page: not enough slashes');
				return false;
			}
			return true;
		}

		/*
		 * Handling of on-the-fly page loading.
		 *
		 *   - The usual MutationObserver on <title> doesn't work.
		 *   - None of the below event listeners work:
		 *     - https://developer.mozilla.org/en-US/docs/Web/API/Window/popstate_event
		 *     - https://developer.mozilla.org/en-US/docs/Web/API/Window/hashchange_event
		 *     - https://developer.mozilla.org/en-US/docs/Web/API/Window/load_event
		 *
		 * I found 'soft-nav:progress-bar:start' in a call stack in GitHub's
		 * own JS, and just tried replacing "start" with "end".  So far, seems
		 * to work fine.
		 */
		setUpReadder() {
			document.addEventListener('soft-nav:progress-bar:end', (event) => {
				info("GitHub: triggered progress-bar:end");
				this.#onPageChange();
				if (GitHub.#isAGitHubCommitPage()) {
					info('GitHub: this URL needs a copy link');
					ensureLink();
				}
			});
			info("GitHub: added re-adder listener");
		}

		/*
		 * Cache of JSON loaded from REST API.
		 * Caching is needed to avoid multiple REST API requests
		 * for various methods that need access to the JSON.
		 */
		#commitJson = null;

		#onPageChange() {
			this.#commitJson = null;
		}

		/*
		 * Downloads JSON object corresponding to the commit via REST API
		 * of GitHub.  Reference documentation:
		 * https://docs.github.com/en/rest/commits/commits?apiVersion=2022-11-28#get-a-commit
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

		getDateIso(hash) {
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
	 *   - https://gerrit.googlesource.com/gitiles/+/refs/tags/v1.2.0
	 *   - https://gerrit.googlesource.com/gitiles/+/refs/heads/master
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
			if (document.location.pathname.includes('/+/refs/tags/')) {
				// special case for tag pages
				return '.Site .Site-content .Container .Metadata:nth-child(4) table tr:nth-child(1) td:nth-child(3)';
			}
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

		getDateIso(hash) {
			const cell = document.querySelector('.Site .Site-content .Container .Metadata table tr:nth-child(2) td:nth-child(3)');
			const s = cell.innerText;
			const d = new Date(s);
			return d.toISOString().slice(0, 'YYYY-MM-DD'.length);
		}

		getCommitMessage(hash) {
			return document.querySelector('.MetadataMessage').innerText;
		}
	}

	/*
	 * Implementation for cgit.
	 * Documentation:
	 *   - https://git.zx2c4.com/cgit/about/
	 *
	 * Example URLs for testing:
	 *   - https://git.kernel.org/pub/scm/git/git.git/commit/?h=main&id=1f0fc1db8599f87520494ca4f0e3c1b6fabdf997
	 *   - https://git.kernel.org/pub/scm/git/git.git/commit/?h=v2.42.0&id=43c8a30d150ecede9709c1f2527c8fba92c65f40
	 */
	class Cgit extends GitHosting {
		getLoadedSelector() {
			return 'body > #cgit > .content > .commit-msg';
		}

		isRecognized() {
			return document.getElementById('cgit') != null;
		}

		getTargetSelector() {
			return 'body > #cgit > .content > table.commit-info > tbody > tr:nth-child(3) td.sha1, body > #cgit > .content > table.commit-info > tbody > tr:nth-child(3) td.oid';
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
			const commitAnchor = document.querySelector('body > #cgit > .content > table.commit-info > tbody > tr:nth-child(3) td.sha1 a, body > #cgit > .content > table.commit-info > tbody > tr:nth-child(3) td.oid a');
			return commitAnchor.innerText;
		}

		getDateIso(hash) {
			const authorDateCell = document.querySelector('body > #cgit > .content > table.commit-info > tbody > tr:nth-child(1) td:nth-child(3)');
			return authorDateCell.innerText.slice(0, 'YYYY-MM-DD'.length);
		}

		getCommitMessage(hash) {
			const subjElem = document.querySelector('body > #cgit > .content > .commit-subject');
			/*
			 * Sometimes `subjElem` contains a `<span class="decoration">`,
			 * most notably, on tagged commits.  Avoid including the contents
			 * of this <span> tag by just taking the text of the first node,
			 * which is a text node.
			 */
			const subj = subjElem.childNodes[0].textContent;
			const body = document.querySelector('body > #cgit > .content > .commit-msg').innerText;
			/*
			 * Even though vast majority will only need `subj`, gather everything and
			 * let downstream code handle paragraph splitting.
			 */
			return subj + '\n\n' + body;
		}

		createCheckmark() {
			const checkmark = super.createCheckmark();
			checkmark.style.position = 'absolute';
			checkmark.style.left = 'calc(100% + 0.5rem)';
			checkmark.style.whiteSpace = 'nowrap';
			const container = document.createElement('span');
			container.style.position = 'relative';
			container.appendChild(checkmark);
			return container;
		}
	}

	/*
	 * Implementation for GitLab.
	 *
	 * Example URLs for testing:
	 *   - https://gitlab.com/andrybak/resoday/-/commit/b82824ec6dc3f14c3711104bf0ffd792c86d19ba
	 *   - https://invent.kde.org/education/kturtle/-/commit/8beecff6f76a4afc74879c46517d00657d8426f9
	 */
	class GitLab extends GitHosting {
		static #HEADER_SELECTOR = 'main#content-body .page-content-header > .header-main-content';

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
			return GitLab.#HEADER_SELECTOR;
		}

		wrapLink(anchor) {
			const copyShaButtonIcon = document.querySelector(`${GitLab.#HEADER_SELECTOR} > button > svg[data-testid="copy-to-clipboard-icon"]`);
			const icon = copyShaButtonIcon.cloneNode(true);
			anchor.replaceChildren(icon); // is just icon enough?
			anchor.classList.add('btn-sm', 'btn-default', 'btn-default-tertiary', 'btn-icon', 'btn', 'btn-clipboard', 'gl-button');
			anchor.setAttribute('data-toggle', 'tooltip'); // this is needed to have a fancy tooltip in style of other UI
			anchor.setAttribute('data-placement', 'bottom'); // this is needed so that the fancy tooltip appears below the button
			anchor.style = 'border: 1px solid darkgray;';
			anchor.title = this.getLinkText() + " to clipboard";
			return anchor;
		}

		getFullHash() {
			const copyShaButton = document.querySelector(`${GitLab.#HEADER_SELECTOR} > button`);
			return copyShaButton.getAttribute('data-clipboard-text');
		}

		getDateIso(hash) {
			// careful not to select <time> tag for "Committed by"
			const authorTimeTag = document.querySelector(`${GitLab.#HEADER_SELECTOR} > .d-sm-inline + time`);
			return authorTimeTag.getAttribute('datetime').slice(0, 'YYYY-MM-DD'.length);
		}

		getCommitMessage(hash) {
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

		addLinkContainerToTarget(target, linkContainer) {
			const authoredSpanTag = target.querySelector('span.d-sm-inline');
			target.insertBefore(linkContainer, authoredSpanTag);
			// add spacer to make text "authored" not stick to the button
			target.insertBefore(document.createTextNode(" "), authoredSpanTag);
		}

		/*
		 * GitLab has a complex interaction with library ClipboardJS:
		 *
		 *   - https://gitlab.com/gitlab-org/gitlab/-/blob/master/app/helpers/button_helper.rb#L31-68
		 *   - https://gitlab.com/gitlab-org/gitlab/-/blob/master/app/assets/javascripts/behaviors/copy_to_clipboard.js#L63-94
		 *
		 *  and the native tooltips are even more complicated.
		 */
		createCheckmark() {
			const checkmark = super.createCheckmark();
			checkmark.style.position = 'absolute';
			checkmark.style.left = 'calc(100% + 0.3rem)';
			checkmark.style.lineHeight = '1.5';
			checkmark.style.padding = '0.5rem 1.5rem';
			checkmark.style.textAlign = 'center';
			checkmark.style.width = 'auto';
			checkmark.style.whiteSpace = 'nowrap';
			checkmark.style.borderRadius = '3px';
			checkmark.style.fontSize = '0.75rem';
			checkmark.style.fontFamily = '"Segoe UI", Roboto, "Noto Sans", Ubuntu, Cantarell, "Helvetica Neue", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"';
			if (document.body.classList.contains('gl-dark')) {
				checkmark.style.backgroundColor = '#dcdcde';
				checkmark.style.color = '#1f1e24';
			} else {
				checkmark.style.backgroundColor = '#000';
				checkmark.style.color = '#fff';
			}
			const container = document.createElement('span');
			container.style.position = 'relative';
			container.appendChild(checkmark);
			return container;
		}
	}

	function removeExistingContainer() {
		const container = document.getElementById(CONTAINER_ID);
		if (!container) {
			return;
		}
		container.parentNode.removeChild(container);
	}

	/*
	 * An instance of each subclass of `GitHosting` is created,
	 * but only one of them gets "recognized".
	 */
	const gitHostings = [
		new GitHub(),
		new GitLab(),
		new BitbucketCloud(),
		new BitbucketServer(),
		new GitWeb(),
		new Cgit(),
		new Gitiles(),
	];
	/**
	 * @type {GitHosting}
	 */
	let recognizedGitHosting = null;

	/**
	 * @returns {GitHosting}
	 */
	function getReconizedGitHosting() {
		if (recognizedGitHosting != null) {
			return recognizedGitHosting;
		}
		for (const hosting of gitHostings) {
			if (hosting.isRecognized()) {
				info("Recognized", hosting.constructor.name);
				recognizedGitHosting = hosting;
				waitForElement(`#${CONTAINER_ID}`).then(added => {
					info("Link has been added. Can setup re-adder now.");
					hosting.setUpReadder();
				});
				return recognizedGitHosting;
			}
		}
		warn("Cannot recognize any hosting");
		return null;
	}

	/**
	 * An optimization: for sites, which do page reloads on the fly,
	 * we don't need to use selectors from all hostings.  Just using
	 * the selector for the recognized hosting should do the trick.
	 *
	 * @returns {string} a selector for waiting for loading
	 */
	function getLoadedSelector() {
		if (recognizedGitHosting != null) {
			return recognizedGitHosting.getLoadedSelector();
		}
		return gitHostings.map(h => h.getLoadedSelector()).join(", ");
	}

	function doEnsureLink() {
		removeExistingContainer();
		const loadedSelector = getLoadedSelector();
		info("loadedSelector =", `'${loadedSelector}'`);
		waitForElement(loadedSelector).then(loadedBody => {
			info("Loaded from selector ", loadedSelector);
			const hosting = getReconizedGitHosting();
			if (hosting != null) {
				hosting.doAddLink();
			}
		});
	}

	/**
	 * On pages that are not for a singular commit, function
	 * ensureLink() must be called exactly once, at the
	 * bottom of the enclosing function.
	 *
	 * Re-adders must take care to avoid several `observer`s
	 * from a call to `waitForElement()` to be in flight.
	 */
	function ensureLink() {
		try {
			doEnsureLink();
		} catch (e) {
			error('Could not create the button', e);
		}
	}
	ensureLink();
})();
