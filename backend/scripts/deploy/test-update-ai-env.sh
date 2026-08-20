#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UPDATER="$SCRIPT_DIR/update-ai-env.sh"
TEST_DIR="$(mktemp -d "${TMPDIR:-/tmp}/mallo-update-ai-env.XXXXXX")"
TEST_SECRET="0123456789abcdef0123456789abcdef"
TEST_URL="https://mallo-ai.example.test"

cleanup() {
	rm -rf "$TEST_DIR"
}
trap cleanup EXIT HUP INT TERM

fail() {
	echo "FAIL: $1" >&2
	exit 1
}

assert_file_mode_600() {
	local mode
	if mode="$(stat -f %Lp "$1" 2>/dev/null)"; then
		:
	else
		mode="$(stat -c %a "$1")"
	fi
	[ "$mode" = "600" ] || fail "expected mode 600, got $mode"
}

assert_no_sensitive_output() {
	local output_file="$1"
	! grep -F "$TEST_SECRET" "$output_file" >/dev/null || fail "secret leaked to output"
	! grep -F "$TEST_URL" "$output_file" >/dev/null || fail "URL leaked to output"
}

export AI_BASE_URL="$TEST_URL"
export AI_SHARED_SECRET="$TEST_SECRET"

new_env="$TEST_DIR/new.env"
bash "$UPDATER" "$new_env" >"$TEST_DIR/create.stdout" 2>"$TEST_DIR/create.stderr"
[ "$(grep -c '^AI_BASE_URL=' "$new_env")" -eq 1 ] || fail "expected one AI_BASE_URL"
[ "$(grep -c '^AI_SHARED_SECRET=' "$new_env")" -eq 1 ] || fail "expected one AI_SHARED_SECRET"
grep -Fx "AI_BASE_URL=$TEST_URL" "$new_env" >/dev/null || fail "AI_BASE_URL missing"
grep -Fx "AI_SHARED_SECRET=$TEST_SECRET" "$new_env" >/dev/null || fail "AI_SHARED_SECRET missing"
assert_file_mode_600 "$new_env"
assert_no_sensitive_output "$TEST_DIR/create.stdout"
assert_no_sensitive_output "$TEST_DIR/create.stderr"

existing_env="$TEST_DIR/existing.env"
cat >"$existing_env" <<'EOF'
DB_HOST=db.example.test
DB_PASSWORD=preserve-me
AI_BASE_URL=https://old-ai.example.test
APP_FEATURE=true
AI_SHARED_SECRET=old-secret
AI_BASE_URL=https://older-ai.example.test
AI_SHARED_SECRET=older-secret
EOF
bash "$UPDATER" "$existing_env" >"$TEST_DIR/replace.stdout" 2>"$TEST_DIR/replace.stderr"
grep -Fx 'DB_HOST=db.example.test' "$existing_env" >/dev/null || fail "DB_HOST changed"
grep -Fx 'DB_PASSWORD=preserve-me' "$existing_env" >/dev/null || fail "DB_PASSWORD changed"
grep -Fx 'APP_FEATURE=true' "$existing_env" >/dev/null || fail "unrelated line changed"
[ "$(grep -c '^AI_BASE_URL=' "$existing_env")" -eq 1 ] || fail "duplicate AI_BASE_URL remains"
[ "$(grep -c '^AI_SHARED_SECRET=' "$existing_env")" -eq 1 ] || fail "duplicate AI_SHARED_SECRET remains"
grep -Fx "AI_BASE_URL=$TEST_URL" "$existing_env" >/dev/null || fail "AI_BASE_URL not replaced"
grep -Fx "AI_SHARED_SECRET=$TEST_SECRET" "$existing_env" >/dev/null || fail "AI_SHARED_SECRET not replaced"
assert_file_mode_600 "$existing_env"
assert_no_sensitive_output "$TEST_DIR/replace.stdout"
assert_no_sensitive_output "$TEST_DIR/replace.stderr"

unset AI_BASE_URL
if bash "$UPDATER" "$TEST_DIR/missing-url.env" >"$TEST_DIR/missing-url.stdout" 2>"$TEST_DIR/missing-url.stderr"; then
	fail "missing AI_BASE_URL unexpectedly succeeded"
fi
assert_no_sensitive_output "$TEST_DIR/missing-url.stdout"
assert_no_sensitive_output "$TEST_DIR/missing-url.stderr"

export AI_BASE_URL='http://mallo-ai.example.test'
export AI_SHARED_SECRET="$TEST_SECRET"
if bash "$UPDATER" "$TEST_DIR/http-url.env" >"$TEST_DIR/http-url.stdout" 2>"$TEST_DIR/http-url.stderr"; then
	fail "http AI_BASE_URL unexpectedly succeeded"
fi
! grep -F 'http://mallo-ai.example.test' "$TEST_DIR/http-url.stdout" >/dev/null || fail "http URL leaked to stdout"
! grep -F 'http://mallo-ai.example.test' "$TEST_DIR/http-url.stderr" >/dev/null || fail "http URL leaked to stderr"
assert_no_sensitive_output "$TEST_DIR/http-url.stdout"
assert_no_sensitive_output "$TEST_DIR/http-url.stderr"

export AI_BASE_URL=$'https://mallo-ai.example.test\nUNRELATED=must-not-inject'
export AI_SHARED_SECRET="$TEST_SECRET"
if bash "$UPDATER" "$TEST_DIR/multiline-url.env" >"$TEST_DIR/multiline-url.stdout" 2>"$TEST_DIR/multiline-url.stderr"; then
	fail "multiline AI_BASE_URL unexpectedly succeeded"
fi
! grep -F 'UNRELATED=must-not-inject' "$TEST_DIR/multiline-url.stdout" >/dev/null || fail "multiline URL leaked to stdout"
! grep -F 'UNRELATED=must-not-inject' "$TEST_DIR/multiline-url.stderr" >/dev/null || fail "multiline URL leaked to stderr"

export AI_BASE_URL="$TEST_URL"
export AI_SHARED_SECRET='too-short'
if bash "$UPDATER" "$TEST_DIR/short-secret.env" >"$TEST_DIR/short-secret.stdout" 2>"$TEST_DIR/short-secret.stderr"; then
	fail "short AI_SHARED_SECRET unexpectedly succeeded"
fi
! grep -F 'too-short' "$TEST_DIR/short-secret.stdout" >/dev/null || fail "short secret leaked to stdout"
! grep -F 'too-short' "$TEST_DIR/short-secret.stderr" >/dev/null || fail "short secret leaked to stderr"

export AI_SHARED_SECRET=$'1234567890123456789012345678901\n'
if bash "$UPDATER" "$TEST_DIR/multiline-secret.env" >"$TEST_DIR/multiline-secret.stdout" 2>"$TEST_DIR/multiline-secret.stderr"; then
	fail "multiline AI_SHARED_SECRET unexpectedly succeeded"
fi

echo "PASS: update-ai-env.sh"
