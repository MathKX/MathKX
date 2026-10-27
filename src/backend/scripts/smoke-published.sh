#!/usr/bin/env bash
# Publishes the service to a temporary folder, starts it from outside the checkout, and resolves a lesson
# and an instance: proves the published output carries content/ beside the binaries (research R2, T035).
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
api="$here/../MathKX.Api"
out="$(mktemp -d "${TMPDIR:-/tmp}/mathkx-publish-XXXXXX")"
port="${MATHKX_SMOKE_PORT:-5099}"
cleanup() {
  if [ -n "${pid:-}" ]; then kill "$pid" 2>/dev/null || true; wait "$pid" 2>/dev/null || true; fi
  rm -rf "$out" 2>/dev/null || true   # Windows may hold the folder briefly; a leftover temp folder is harmless
}
trap cleanup EXIT

dotnet publish "$api" --configuration Release --output "$out/app" --nologo -v quiet

test -f "$out/app/content/registry/generators.json" || { echo "content/ was not published beside the binaries"; exit 1; }

cd "$out"   # outside the checkout: the repository-relative fallback cannot apply
ASPNETCORE_ENVIRONMENT=Production ASPNETCORE_URLS="http://127.0.0.1:$port" dotnet "app/MathKX.Api.dll" > "$out/service.log" 2>&1 &
pid=$!

for _ in $(seq 1 60); do
  if curl -fsS "http://127.0.0.1:$port/api/health" > /dev/null 2>&1; then break; fi
  sleep 0.5
done

curl -fsS "http://127.0.0.1:$port/api/health" | grep -q '"lessons":1' || { echo "health did not report the lesson"; cat "$out/service.log"; exit 1; }
curl -fsS "http://127.0.0.1:$port/api/lessons/number-bonds-to-ten" | grep -q '"id":"number-bonds-to-ten"' || { echo "lesson did not resolve"; exit 1; }
body="$(curl -fsS "http://127.0.0.1:$port/api/instances/numbers.addition.within-10/1/42")"
echo "$body" | grep -q '"definitionId":"numbers.addition.within-10"' || { echo "instance did not resolve"; exit 1; }
echo "$body" | grep -q '"sum"' && { echo "instance leaked the sum"; exit 1; }
echo "$body" | grep -q '"lessons":\[{"id":"number-bonds-to-ten"' || { echo "instance did not list its lesson"; exit 1; }

# specs/003 T060: the package carries the lesson files and their assets, which deploy.yml ships to production.
curl -fsS "http://127.0.0.1:$port/api/lessons/number-bonds-to-ten/content/en" | grep -q '"markdown":"---' || { echo "lesson content was not published"; exit 1; }
type="$(curl -fsS -o /dev/null -w '%{content_type}' "http://127.0.0.1:$port/api/lessons/number-bonds-to-ten/assets/ten-frame-3-7.svg")"
case "$type" in image/svg+xml*) ;; *) echo "lesson asset was not published (content type '$type')"; exit 1 ;; esac
curl -fsS "http://127.0.0.1:$port/api/visuals/make-ten?a=8&b=5" | grep -q '"type":"make-ten"' || { echo "lesson visuals did not resolve"; exit 1; }
# specs/004 T013: the package carries the named skill files.
curl -fsS "http://127.0.0.1:$port/api/skills" | grep -q '"name":{"nb":"Addisjon opp til 20","en":"Addition within 20"}' || { echo "skill names were not published"; exit 1; }
# specs/005 T008: the package builds and serves the question pools, with operands only.
pool="$(curl -fsS "http://127.0.0.1:$port/api/definitions/numbers.addition.within-10/1/pool")"
[ "$(echo "$pool" | grep -o '"seed":' | wc -l)" -eq 45 ] || { echo "the within-ten pool does not list 45 questions"; exit 1; }
echo "$pool" | grep -q '"sum"' && { echo "the pool leaked a sum"; exit 1; }
echo "published service resolved content outside the checkout: ok"
