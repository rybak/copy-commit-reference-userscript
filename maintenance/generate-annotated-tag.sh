#!/bin/bash

# Produces a Git tag for this repository
#

if [[ $# -ne 2 ]]
then
	# TODO: add support for multiple files
	echo "Two arguments are required: commit and filepath"
	exit 1
fi

commit=$1
file=$2

RED_FG="$(tput setaf 1)"
GREEN_FG="$(tput setaf 2)"
BLUE_FG="$(tput setaf 4)"
RESET_FONT="\e[0m"
echo -e "Generating tag for commit ${BLUE_FG}$commit${RESET_FONT} and file '${BLUE_FG}$file${RESET_FONT}'"

name=$(git show $commit:$file \
	| grep --color=never '@name  ' \
	| sed -e 's_// [@]name * __')

prefix=unknown
if [[ "$file" == 'copy-commit-reference-lib.js' ]]
then
	prefix='lib'
else
	prefix=$(git show $commit:$file \
		| grep --color=never '@name  ' \
		| sed -e 's_// [@]name  *__' -e 's/:.*$//' \
		| tr '[:upper:]' '[:lower:]')
fi

version=$(git show $commit:$file \
	| grep --color=never '@version ' \
	| sed -e 's_// [@]version  *__')

tag="$prefix-$version"
echo -e "Tag = '${GREEN_FG}$tag${RESET_FONT}'"
message="$name $version"
echo -e "Message = '${GREEN_FG}$message${RESET_FONT}'"

git tag --annotate --message "$message" "$tag" "$commit" ||
	echo -e "${RED_FG}ERROR${RESET_FONT}"

git show --no-patch "$tag"
