// ==UserScript==
// @name         Example: copy commit reference
// @namespace    https://andrybak.dev
// @license      AGPL-3.0-only
// @version      1
// @description  Adds a "Copy commit reference" button to every commit page on Example.
// @homepageURL  https://github.com/rybak/copy-commit-reference-userscript
// @supportURL   https://github.com/rybak/copy-commit-reference-userscript/issues
// @author       Andrei Rybak
// @match        https://example.org/*/commit/*
// @icon         https://example.org/favicon.ico
// @require      https://cdn.jsdelivr.net/gh/rybak/userscript-libs@e86c722f2c9cc2a96298c8511028f15c45180185/waitForElement.js
// @require      https://cdn.jsdelivr.net/gh/rybak/copy-commit-reference-userscript@deadbeef/copy-commit-reference-lib.js
// @grant        none
// ==/UserScript==

/*
 * Copyright (C) 2024 Andrei Rybak
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

	const LOG_PREFIX = '[Example: copy commit reference]:';

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
	 * Implementation for Example.org.
	 */
	class Example extends GitHosting {
		/*
		 * CSS selector to use to find the element, to which the button
		 * will be added.
		 */
		getTargetSelector() {
			throw new Error("Not implemented in " + this.constructor.name);
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
		 * See class documentation of class GitHosting for other methods that can be
		 * optionally overridden.
		 */
	}

	CopyCommitReference.runForGitHostings(new Example());
})();
