// ==UserScript==
// @name         Gitiles: copy commit reference
// @namespace    https://andrybak.dev
// @version      2
// @license      AGPL-3.0-only
// @author       Andrei Rybak
// @description  Adds a "Copy commit reference" button to every commit page on Gitiles websites.
// @homepageURL  https://github.com/rybak/copy-commit-reference-userscript
// @supportURL   https://github.com/rybak/copy-commit-reference-userscript/issues
// @match        https://*.googlesource.com/*/+/*
// @match        https://gerrit.wikimedia.org/r/plugins/gitiles/*/+/*
// @match        https://gerrit.wikimedia.org/g/*/+/*
// @require      https://cdn.jsdelivr.net/gh/rybak/userscript-libs@e86c722f2c9cc2a96298c8511028f15c45180185/waitForElement.js
// @require      https://cdn.jsdelivr.net/gh/rybak/copy-commit-reference-userscript@c7f2c3b96fd199ceee46de4ba7eb6315659b34e3/copy-commit-reference-lib.js
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

(function () {
	'use strict';

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
		static #getMetadataSelector() {
			if (document.location.pathname.includes('/+/refs/tags/')) {
				return '.Site .Site-content .Container .Metadata:nth-child(4)';
			}
			return '.Site .Site-content .Container .Metadata';
		}

		getTargetSelector() {
			return `${Gitiles.#getMetadataSelector()} table tr:nth-child(1) td:nth-child(3)`;
		}

		wrapButtonContainer(innerContainer) {
			const container = document.createElement('span');
			container.append(" [", innerContainer, "]");
			return container;
		}

		getButtonText() {
			// TODO: maybe shorter "copy reference" would be better?
			// use all lowercase for consistency with the rest of the UI
			return "copy commit reference";
		}

		getFullHash() {
			const cell = document.querySelector(`${Gitiles.#getMetadataSelector()} table tr:nth-child(1) td:nth-child(2)`);
			return cell.innerText;
		}

		getDateIso(hash) {
			const cell = document.querySelector(`${Gitiles.#getMetadataSelector()} table tr:nth-child(2) td:nth-child(3)`);
			const s = cell.innerText;
			const d = new Date(s);
			return d.toISOString().slice(0, 'YYYY-MM-DD'.length);
		}

		getCommitMessage(hash) {
			return document.querySelector(`${Gitiles.#getMetadataSelector()} + .MetadataMessage`).innerText;
		}
	}

	CopyCommitReference.runForGitHostings(new Gitiles());
})();
