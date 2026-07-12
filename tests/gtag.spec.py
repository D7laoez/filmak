"""Integration test: Google Analytics gtag loads on every page.

Verifies that the GA4 measurement ID G-RZVBBHB5X0 is wired into every
top-level route: the gtag loader script tag is present in the DOM AND
the request to https://www.googletagmanager.com/gtag/js?id=G-RZVBBHB5X0
is actually fired on page load.

Runs against TEST_BASE_URL (default http://localhost:8080). Point it at
the published site to verify the deployed version:

  TEST_BASE_URL=https://filmak.lovable.app python3 tests/gtag.spec.py
"""

from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

from playwright.async_api import async_playwright

BASE_URL = os.environ.get("TEST_BASE_URL", "http://localhost:8080")
MEASUREMENT_ID = "G-RZVBBHB5X0"
GTAG_URL_FRAGMENT = f"googletagmanager.com/gtag/js?id={MEASUREMENT_ID}"

# Public routes to sample. Add more as they are created.
ROUTES = ["/", "/about", "/contact", "/auth", "/browse"]

SCREENSHOTS = Path("/tmp/browser/gtag")
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

results: list[tuple[str, str, str]] = []


def record(name: str, status: str, detail: str = "") -> None:
    results.append((name, status, detail))
    print(f"[{status}] {name}" + (f" — {detail}" if detail else ""))


async def check_route(context, path: str) -> None:
    page = await context.new_page()
    requested: list[str] = []
    page.on("request", lambda req: requested.append(req.url))

    url = f"{BASE_URL}{path}"
    try:
        await page.goto(url, wait_until="load", timeout=20000)
    except Exception as exc:
        record(f"gtag on {path}", "FAIL", f"page.goto failed: {exc}")
        await page.close()
        return

    # Give the async gtag <script async> a beat to actually be requested.
    try:
        await page.wait_for_function(
            "() => Array.from(document.scripts).some(s => s.src.includes(arguments[0]))",
            arg=GTAG_URL_FRAGMENT,
            timeout=5000,
        )
    except Exception:
        pass

    script_present = await page.evaluate(
        "(frag) => Array.from(document.scripts).some(s => s.src.includes(frag))",
        GTAG_URL_FRAGMENT,
    )
    request_fired = any(GTAG_URL_FRAGMENT in u for u in requested)
    has_datalayer = await page.evaluate(
        "() => Array.isArray(window.dataLayer) && window.dataLayer.length > 0"
    )

    await page.screenshot(path=str(SCREENSHOTS / f"{path.strip('/') or 'index'}.png"))
    await page.close()

    if script_present and request_fired and has_datalayer:
        record(f"gtag on {path}", "PASS")
    else:
        record(
            f"gtag on {path}",
            "FAIL",
            f"script_tag={script_present} request_fired={request_fired} dataLayer={has_datalayer}",
        )


async def main() -> int:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        try:
            for path in ROUTES:
                await check_route(context, path)
        finally:
            await context.close()
            await browser.close()

    print("\n=== Summary ===")
    for name, status, detail in results:
        print(f"  {status:4}  {name}")
    return 0 if all(r[1] == "PASS" for r in results) else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))