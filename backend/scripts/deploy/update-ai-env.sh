#!/usr/bin/env bash
set -euo pipefail

env_file="${1:-.env}"
ai_base_url="${AI_BASE_URL:-}"
ai_shared_secret="${AI_SHARED_SECRET:-}"
temp_file=""

fail() {
	echo "$1" >&2
	exit 1
}

cleanup() {
	if [ -n "$temp_file" ] && [ -f "$temp_file" ]; then
		rm -f -- "$temp_file"
	fi
}
trap cleanup EXIT HUP INT TERM

[ -n "$ai_base_url" ] || fail "AI_BASE_URL must be set"
[ "${#ai_shared_secret}" -eq 32 ] || fail "AI_SHARED_SECRET must be exactly 32 characters"
case "$ai_base_url" in
*$'\n'* | *$'\r'*) fail "AI_BASE_URL must be one line" ;;
esac
case "$ai_shared_secret" in
*$'\n'* | *$'\r'*) fail "AI_SHARED_SECRET must be exactly 32 characters" ;;
esac

env_directory="$(dirname "$env_file")"
env_name="$(basename "$env_file")"

[ -d "$env_directory" ] || fail "env file directory does not exist"
[ "$env_name" != "." ] && [ "$env_name" != "/" ] || fail "env file must be a file path"

if [ -e "$env_file" ] && { [ ! -f "$env_file" ] || [ -L "$env_file" ]; }; then
	fail "env file must be a regular file"
fi

umask 077
temp_file="$(mktemp "$env_directory/.${env_name}.tmp.XXXXXX")"

if [ -f "$env_file" ]; then
	while IFS= read -r line || [ -n "$line" ]; do
		case "$line" in
		AI_BASE_URL=* | AI_SHARED_SECRET=*) continue ;;
		esac
		printf '%s\n' "$line" >>"$temp_file"
	done <"$env_file"
fi

printf '%s\n' "AI_BASE_URL=$ai_base_url" "AI_SHARED_SECRET=$ai_shared_secret" >>"$temp_file"
chmod 600 "$temp_file"
mv -f -- "$temp_file" "$env_file"
temp_file=""
