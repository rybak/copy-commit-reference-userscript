// ==UserScript==
// @name         GitHub: Copy Commit Reference
// @namespace    https://github.com/rybak
// @license      MIT
// @version      2-alpha
// @description  Adds a "Copy commit reference" link to every commit page.
// @author       Andrei Rybak
// @include      https://*github*/*/commit/*
// @match        https://github.example.com/*/commit/*
// @match        https://github.com/*/commit/*
// @icon         https://github.githubassets.com/favicons/favicon-dark.png
// @grant        none
// @downloadURL none
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

(function() {
	'use strict';

	const LOG_PREFIX = '[GitHub: copy commit reference]:';
	const CONTAINER_ID = "GHCCR_container";
	const CHECKMARK_ID = "GHCCR_checkmark";
	let inProgress = false;

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
		 * The `if`s below handle weird commit messages I have
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
		debug(`plainTextCommitReference("${commitId}", "${subject}", "${dateIso}")`);
		const abbrev = abbreviateCommitId(commitId);
		return `${abbrev} (${subject}, ${dateIso})`;
	}

	/*
	 * Inserts an HTML anchor to link to the pull requests, which are
	 * mentioned in the provided `text` in the format that is used by
	 * GitHub's default automatic merge commit messages.
	 */
	async function insertPrLinks(text, commitId) {
		if (!text.toLowerCase().includes('pull request')) {
			return text;
		}
		try {
			// a hack: just get the existing HTML from the GUI
			// the hack probably doesn't work very well with overly long subject lines
			// TODO: proper conversion of `text`
			return document.querySelector('.commit-title.markdown-title').innerHTML.trim();
		} catch (e) {
			error("Cannot insert pull request links", e);
			return text;
		}
	}

	/*
	 * Renders given commit that has the provided subject line and date
	 * in reference format as HTML content, which includes a clickable
	 * link to the commit.
	 *
	 * Documentation of formats: https://git-scm.com/docs/git-log#_pretty_formats
	 */
	async function htmlSyntaxLink(commitId, subject, dateIso) {
		const url = document.location.href;
		const abbrev = abbreviateCommitId(commitId);
		let subjectHtml;
		subjectHtml = await insertPrLinks(subject, commitId);
		debug("subjectHtml", subjectHtml);
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

	function getApiHostUrl() {
		const host = document.location.host;
		return `https://api.${host}`;
	}

	function getFullCommitId() {
		const path = document.querySelector('a.js-permalink-shortcut').getAttribute('href');
		const parts = path.split('/');
		if (parts.length < 5) {
			throw new Error("Cannot find commit hash in the URL");
		}
		const commitId = parts[4];
		return commitId;
	}

	function getCommitRestApiUrl(commitId) {
		// /repos/{owner}/{repo}/commits/{ref}
		// e.g. https://api.github.com/repos/rybak/atlassian-tweaks/commits/a76a9a6e993a7a0e48efabdd36f4c893317f1387
		// NOTE: plural "commits" in the URL!!!
		const apiHostUrl = getApiHostUrl();
		const path = document.querySelector('a.js-permalink-shortcut').getAttribute('href');
		const parts = path.split('/');
		if (parts.length < 5) {
			throw new Error("Cannot find commit hash in the URL");
		}
		const owner = parts[1];
		const repo = parts[2];
		return `${apiHostUrl}/repos/${owner}/${repo}/commits/${commitId}`;
	}

	function getRestApiOptions() {
		const myHeaders = new Headers();
		myHeaders.append("Accept", "application/vnd.github+json");
		const myInit = {
			headers: myHeaders,
		};
		return myInit;
	}

	/*
	 * Generates the content and passes it to the clipboard.
	 *
	 * Async, because we need to access Jira integration via REST API
	 * to generate the fancy HTML, with links to Jira.
	 */
	async function copyClickAction(event) {
		event.preventDefault();
		try {
			/*
			 * Extract metadata about the commit from the UI.
			 */
			let commitJson;
			const commitId = getFullCommitId();

			try {
				const commitRestUrl = getCommitRestApiUrl(commitId);
				info(`Fetching "${commitRestUrl}"...`);
				const commitResponse = await fetch(commitRestUrl, getRestApiOptions());
				commitJson = await commitResponse.json();
			} catch (e) {
				error("Cannot fetch commit JSON from REST API", e);
			}
			/*
			 * If loaded successfully, extract particular parts of
			 * the JSON that we are interested in.
			 */
			const dateIso = commitJson.commit.author.date.slice(0, 'YYYY-MM-DD'.length);
			const commitMessage = commitJson.commit.message;
			const subject = commitMessageToSubject(commitMessage);

			const plainText = plainTextCommitReference(commitId, subject, dateIso);
			const html = await htmlSyntaxLink(commitId, subject, dateIso);
			info("plain text:", plainText);
			info("HTML:", html);

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

	function createCopyLink() {
		const onclick = (event) => {
			showCheckmark();
			copyClickAction(event);
			setTimeout(hideCheckmark, 2000);
		}

		const linkText = "Copy commit reference";
		const style = 'margin-left: 1em;';
		const anchor = htmlToElement(`<a href="#" style="${style}" class="Link--onHover color-fg-muted"></a>`);
		const icon = document.querySelector('.octicon-copy').cloneNode(true);
		icon.classList.remove('color-fg-muted');
		anchor.append(icon);
		anchor.append(` ${linkText}`);
		anchor.onclick = onclick;
		return anchor;
	}

	function createCheckmark() {
		const container = document.createElement('span');
		container.id = CHECKMARK_ID;
		container.style.display = 'none';
		container.innerHTML = " ✅ Copied!";
		return container;
	}

	function doAddLink() {
		waitForElement('.commit.full-commit .commit-meta div.flex-self-start.flex-content-center').then(target => {
			debug('target', target);
			const container = htmlToElement(`<span id="${CONTAINER_ID}"></span>`);
			target.append(container);
			const link = createCopyLink();
			container.append(' ');
			container.appendChild(link);
			container.append(createCheckmark());
		});
	}

	function removeExistingContainer() {
		const container = document.getElementById(CONTAINER_ID);
		if (!container) {
			return;
		}
		container.parentNode.removeChild(container);
	}

	function ensureLink() {
		if (inProgress) {
			return;
		}
		inProgress = true;
		try {
			removeExistingContainer();
			/*
			 * Need this tag to have parent for the container.
			 */
			waitForElement('.commit.full-commit .commit-meta').then(loadedBody => {
				doAddLink();
				if (document.getElementById(CONTAINER_ID) == null) {
					ensureLink();
				}
			});
		} catch (e) {
			error('Could not create the button', e);
		} finally {
			inProgress = false;
		}
	}

	ensureLink();

	/*
	 * Handling of on-the-fly page loading.
	 *
	 *   - The usual MutationObserver on <title> doesn't work.
	 *   - None of the below event listeners work:
	 *     - https://developer.mozilla.org/en-US/docs/Web/API/Window/popstate_event
	 *     - https://developer.mozilla.org/en-US/docs/Web/API/Window/hashchange_event
	 *     - https://developer.mozilla.org/en-US/docs/Web/API/Window/load_event
	 *
	 * I found 'soft-nav:progress-bar:start' in a call stack in GitHub's own JS,
	 * and just tried replacing "start" with "end".  So far, seems to work fine.
	 */
	document.addEventListener('soft-nav:progress-bar:end', (event) => {
		info("progress-bar:end", event);
		ensureLink();
	});
})();
