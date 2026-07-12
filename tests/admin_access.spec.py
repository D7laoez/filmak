"""Integration tests: admin-only route protection.

Runs three scenarios against http://localhost:8080:

  1. Anonymous  → /admin should redirect to /auth (public gate).
  2. Non-admin  → /admin should render the site-wide NotFound page (404).
  3. Admin      → /admin should render the admin dashboard.

Test users are picked up from env vars (see tests/README.md). Missing
credentials cause that scenario to be SKIPPED rather than failing.
"""

from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

from playwright.async_api import BrowserContext, Page, async_playwright

BASE_URL = os.environ.get("TEST_BASE_URL", "http://localhost:8080")
SCREENSHOTS = Path("/tmp/browser/admin-access")
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

results: list[tuple[str, str, str]] = []  # (name, status, detail)


def record(name: str, status: str, detail: str = "") -> None:
    results.append((name, status, detail))
    print(f"[{status}] {name}" + (f" — {detail}" if detail else ""))


async def sign_in(page: Page, email: str, password: str) -> bool:
    """Sign in via the /auth page. Returns True on success."""
    await page.goto(f"{BASE_URL}/auth", wait_until="domcontentloaded")
    # Best-effort selectors — tolerant to minor UI wording changes.
    try:
        await page.get_by_label("Email", exact=False).first.fill(email, timeout=5000)
        await page.get_by_label("Password", exact=False).first.fill(password, timeout=5000)
        await page.get_by_role("button", name="Sign in", exact=False).first.click(timeout=5000)
    except Exception:
        try:
            await page.locator('input[type="email"]').first.fill(email)
            await page.locator('input[type="password"]').first.fill(password)
            await page.locator('button[type="submit"]').first.click()
        except Exception as exc:  # pragma: no cover - defensive
            print(f"    sign-in selectors failed: {exc}")
            return False
    # Wait for navigation away from /auth OR for a session cookie.
    try:
        await page.wait_for_url(lambda url: "/auth" not in url, timeout=8000)
        return True
    except Exception:
        return False


async def is_notfound_page(page: Page) -> bool:
    """Detects the site-wide NotFoundComponent (404) content."""
    body = (await page.text_content("body")) or ""
    lowered = body.lower()
    return "404" in body or "not found" in lowered or "غير موجودة" in body


async def is_admin_dashboard(page: Page) -> bool:
    body = (await page.text_content("body")) or ""
    return any(k in body for k in ("Admin", "admin", "المستخدمين", "إدارة"))


async def test_anonymous_redirect(ctx: BrowserContext) -> None:
    page = await ctx.new_page()
    await page.goto(f"{BASE_URL}/admin", wait_until="domcontentloaded")
    await page.wait_for_load_state("networkidle")
    await page.screenshot(path=str(SCREENSHOTS / "1_anon.png"))
    final_url = page.url
    if "/auth" in final_url:
        record("anonymous → /admin redirects to /auth", "PASS", final_url)
    else:
        record(
            "anonymous → /admin redirects to /auth",
            "FAIL",
            f"expected /auth in URL, got {final_url}",
        )
    await page.close()


async def test_non_admin_404(ctx: BrowserContext) -> None:
    email = os.environ.get("TEST_USER_EMAIL")
    password = os.environ.get("TEST_USER_PASSWORD")
    name = "non-admin → /admin shows 404"
    if not email or not password:
        record(name, "SKIP", "TEST_USER_EMAIL / TEST_USER_PASSWORD not set")
        return
    page = await ctx.new_page()
    if not await sign_in(page, email, password):
        record(name, "FAIL", "sign-in failed for non-admin user")
        await page.close()
        return
    await page.goto(f"{BASE_URL}/admin", wait_until="domcontentloaded")
    await page.wait_for_load_state("networkidle")
    await page.screenshot(path=str(SCREENSHOTS / "2_non_admin.png"))
    if await is_notfound_page(page) and not await is_admin_dashboard(page):
        record(name, "PASS", page.url)
    else:
        snippet = ((await page.text_content("body")) or "")[:200]
        record(name, "FAIL", f"did not render NotFound; body starts: {snippet!r}")
    await page.close()


async def test_admin_success(ctx: BrowserContext) -> None:
    email = os.environ.get("TEST_ADMIN_EMAIL")
    password = os.environ.get("TEST_ADMIN_PASSWORD")
    name = "admin → /admin renders dashboard"
    if not email or not password:
        record(name, "SKIP", "TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD not set")
        return
    page = await ctx.new_page()
    if not await sign_in(page, email, password):
        record(name, "FAIL", "sign-in failed for admin user")
        await page.close()
        return
    await page.goto(f"{BASE_URL}/admin", wait_until="domcontentloaded")
    await page.wait_for_load_state("networkidle")
    await page.screenshot(path=str(SCREENSHOTS / "3_admin.png"))
    if await is_admin_dashboard(page) and not await is_notfound_page(page):
        record(name, "PASS", page.url)
    else:
        snippet = ((await page.text_content("body")) or "")[:200]
        record(name, "FAIL", f"admin dashboard not visible; body: {snippet!r}")
    await page.close()


async def main() -> int:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        try:
            # Fresh context per scenario → independent auth state.
            for scenario in (test_anonymous_redirect, test_non_admin_404, test_admin_success):
                ctx = await browser.new_context(viewport={"width": 1280, "height": 1800})
                try:
                    await scenario(ctx)
                finally:
                    await ctx.close()
        finally:
            await browser.close()

    failed = [r for r in results if r[1] == "FAIL"]
    print("\n=== Summary ===")
    for name, status, detail in results:
        print(f"  {status:4}  {name}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))