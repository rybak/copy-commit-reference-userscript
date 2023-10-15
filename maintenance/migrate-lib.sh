#!/bin/bash

# Script to update `@require` entry in userscripts to a new hash of the
# library copy-commit-reference-lib.js.
#
# Usage
#
#	./maintenance/migrate-lib.sh <commit> <files>...

if [[ $# -lt 1 ]]
then
	echo "Missing commit hash"
	exit 1
fi

commit_hash=$1
shift

if ! git rev-parse --quiet --verify $commit_hash
then
	echo "Cannot find commit $commit_hash"
	exit 2
fi
# expand shortened hash to full hash
# https://stackoverflow.com/a/41717108/1083697
commit_hash=$(git rev-parse "$commit_hash")

path_before_hash='gh/rybak/copy-commit-reference-userscript@'
old_lib_regex="\\(// @require  *\\)https://cdn[.]jsdelivr[.]net/${path_before_hash}.*/copy-commit-reference-lib[.]js"
base_url="https://cdn.jsdelivr.net/${path_before_hash}"

while [[ $# -gt 0 ]]
do
	file=$1
	shift
	sed -i -e "s_${old_lib_regex}_\\1${base_url}${commit_hash}/copy-commit-reference-lib.js_" "$file"
done
