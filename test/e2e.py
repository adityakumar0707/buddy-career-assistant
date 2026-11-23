from playwright.sync_api import sync_playwright
import sys
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_page(viewport={"width":1280,"height":900})
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.on("console",lambda m: errs.append(m.text) if m.type=="error" else None)
    pg.goto("http://localhost:3100")
    pg.fill("#nm","Aditya"); pg.click("#go")
    pg.click("text=Law"); pg.click("text=Completed my degree"); pg.click("#ob-next")
    pg.click("text=Master of Laws (LLM)"); pg.click("#ob-next")
    pg.click("text=Skip for now"); pg.click("#ob-next")
    pg.wait_for_selector(".pc",timeout=15000)
    pg.wait_for_timeout(1500)
    print("cards:",pg.locator(".pc").count(), "rows:",pg.locator(".sec h3").all_inner_texts())
    pg.screenshot(path="test/s_home.png")
    assert "Law" in pg.inner_text("body") or "law" in pg.inner_text("body")
    # not interested hides
    first=pg.locator(".pc").first; name=first.locator("h4").inner_text()
    first.locator(".no").click(); pg.wait_for_timeout(300)
    assert name not in pg.locator(".scroller").first.inner_text(), "not-interested card still shown"
    # interested
    pg.locator(".pc").nth(1).locator(".yes").click(); pg.wait_for_timeout(200)
    # detail
    pg.locator(".pc").nth(2).click(); pg.wait_for_selector("text=Start application",timeout=15000)
    pg.screenshot(path="test/s_detail.png")
    pg.click("#d-app"); pg.wait_for_timeout(300)
    pass
    pg.click("[data-tab=apps]"); pg.click("text=Open checklist"); pg.wait_for_selector(".cl",timeout=15000)
    pg.click("[data-tg='1']"); pg.click("#ap")
    pg.screenshot(path="test/s_check.png")
    pg.click("[data-sop]"); pg.wait_for_selector("text=Yes, use it here"); pg.click("#y")
    for i in range(8):
        pg.wait_for_selector("#ans"); pg.fill("#ans","I fixed a leaking tap at home and loved it."); pg.click("#nx"); pg.wait_for_timeout(150)
    pg.wait_for_selector("#dt",timeout=15000)
    print("draft:",pg.input_value("#dt")[:80].replace("\n"," "))
    pg.screenshot(path="test/s_sop.png")
    pg.locator("[data-x]").last.click(); pg.click("[data-iv]"); pg.wait_for_selector("[data-q]",timeout=15000); pg.click("[data-q='0']")
    pg.fill("#ia","I want to study this because of my internship."); pg.click("#fb"); pg.wait_for_selector("text=What worked",timeout=15000)
    pg.screenshot(path="test/s_iv.png")
    pg.keyboard.press("Escape")
    pg.evaluate("document.getElementById('ovs').innerHTML=''")
    pg.click("[data-tab=home]")
    pg.click("#ask"); pg.wait_for_selector(".m.b")
    for opt in ["Fall 2027","IELTS"]:
        pg.click(f".chip:has-text('{opt}')"); pg.wait_for_timeout(200)
    pg.fill("#ci","72 percent"); pg.press("#ci","Enter"); pg.wait_for_timeout(1500)
    pg.fill("#ci","Which is better, UK or Canada?"); pg.press("#ci","Enter"); pg.wait_for_timeout(1500)
    pg.screenshot(path="test/s_chat.png")
    t=pg.inner_text(".msgs"); print("chat ok:", "short answer" in t)
    # mobile
    pg.evaluate("document.getElementById('ovs').innerHTML=''")
    pg.set_viewport_size({"width":390,"height":844}); pg.reload(); pg.wait_for_selector(".pc"); pg.wait_for_timeout(800)
    ov=pg.evaluate("document.documentElement.scrollWidth>window.innerWidth"); print("mobile overflow:",ov)
    pg.screenshot(path="test/s_mobile.png")
    b.close()
print("errors:",[e for e in errs if "favicon" not in e])
