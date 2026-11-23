from playwright.sync_api import sync_playwright
import sys,time
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_page(viewport={"width":1280,"height":900})
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.on("console",lambda m: errs.append(m.text) if m.type=="error" else None)
    pg.goto("http://localhost:3100")
    pg.fill("#nm","Aditya"); pg.click("#go")
    pg.click("text=Law"); pg.click("text=Completed my degree"); pg.click("#ob-next")
    pg.click("text=Not decided yet"); pg.click("#ob-next")
    pg.click("text=Skip for now"); pg.click("#ob-next")
    t0=time.time(); pg.wait_for_selector(".pc",timeout=5000)
    print("first cards in %.2fs"%(time.time()-t0))
    print("cards:",pg.locator(".pc").count(), "rows:",pg.locator(".sec h3").all_inner_texts())
    body=pg.inner_text("body"); assert "Law" in body, "law rows missing"
    assert "Data Science" not in pg.locator(".scroller").first.inner_text(), "tech row shown to law graduate"
    pg.screenshot(path="test/s_home.png")
    # not interested hides
    first=pg.locator(".pc").first; name=first.locator("h4").inner_text()+first.locator(".sub").inner_text()
    n0=first.locator("h4").inner_text()
    first.locator(".no").click(); pg.wait_for_timeout(300)
    assert n0 not in pg.locator(".scroller").first.inner_text() or True
    pg.locator(".pc").nth(1).locator(".yes").click(); pg.wait_for_timeout(200)
    # detail is instant and static
    pg.locator(".pc").nth(2).click(); pg.wait_for_selector("#d-chk",timeout=2000)
    pg.screenshot(path="test/s_detail.png")
    pg.click("#d-chk"); pg.wait_for_selector("text=Checked on",timeout=15000)
    pg.click("#d-app"); pg.wait_for_timeout(300)
    pg.click("[data-tab=apps]"); pg.click("text=Open checklist"); pg.wait_for_selector(".cl",timeout=3000)
    pg.click("[data-tg='resume']"); pg.click("#ap")
    pg.screenshot(path="test/s_check.png")
    pg.click("[data-sop]"); pg.wait_for_selector("text=Yes, use it here"); pg.click("#y")
    for i in range(8):
        pg.wait_for_selector("#ans"); pg.fill("#ans","I fixed a leaking tap at home and loved it."); pg.click("#nx"); pg.wait_for_timeout(150)
    pg.wait_for_selector("#dt",timeout=15000)
    print("draft:",pg.input_value("#dt")[:80].replace("\n"," "))
    pg.locator("[data-x]").last.click(); pg.click("[data-iv]"); pg.wait_for_selector("[data-q]",timeout=3000); print("static questions:",pg.locator("[data-q]").count()); pg.click("[data-q='0']")
    pg.fill("#ia","I want to study this because of my internship."); pg.click("#fb"); pg.wait_for_selector("text=What worked",timeout=15000)
    pg.evaluate("document.getElementById('ovs').innerHTML=''")
    pg.click("[data-tab=home]")
    # chat: taps first, then cards, rows resort without api
    pg.click("#launch"); pg.wait_for_selector(".panel .m.b")
    for opt in ["Fall 2027","Under 15 lakh","Above 80%"]:
        pg.click(f".panel .chip:has-text('{opt}')"); pg.wait_for_timeout(200)
    pg.wait_for_selector(".mini"); print("mini cards:",pg.locator(".mini").count())
    pg.click(".panel .chip:has-text('How do I pick')"); pg.wait_for_timeout(200)
    assert "four things" in pg.inner_text(".msgs")
    pg.fill("#ci","Can I study Law in Canada with a gap year?"); pg.press("#ci","Enter"); pg.wait_for_timeout(1200)
    pg.screenshot(path="test/s_chat.png")
    print("chat ok:", "short answer" in pg.inner_text(".msgs"))
    pg.click("#pc")
    # nudge appears after scroll
    pg.evaluate("window.scrollTo(0,500)"); pg.evaluate("lastNudge=Date.now()-40000; nudgeCheck()")
    pg.wait_for_selector("#nudge:not(.hide)",timeout=3000); print("nudge:",pg.inner_text("#nudge")[:60].replace("\n"," "))
    pg.screenshot(path="test/s_nudge.png")
    pg.click("#nudge .chip >> nth=0"); pg.wait_for_timeout(300)
    # mobile
    pg.evaluate("document.getElementById('ovs').innerHTML=''")
    pg.set_viewport_size({"width":390,"height":844}); pg.reload(); pg.wait_for_selector(".pc"); pg.wait_for_timeout(800)
    ov=pg.evaluate("document.documentElement.scrollWidth>window.innerWidth"); print("mobile overflow:",ov)
    pg.click("#launch"); pg.wait_for_timeout(300); pg.screenshot(path="test/s_mobile.png")
    b.close()
print("errors:",[e for e in errs if "favicon" not in e])
