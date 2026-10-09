#!/usr/bin/env python3
"""Generate /sa/, /ae/, /jo/ (Arabic-first offer pages with an English toggle). Run from repo root: python3 tools/build-gulf.py"""
import json, urllib.parse, pathlib

WA = "96181511232"
AUDIT = "https://taktek.io/work/#audit"  # switch to /audit/ when the audit tool exists

C = {
 "sa": dict(
  cur_ar="ر.س", cur_en="SAR", code="SAR", loc="ar-SA", country_ar="السعودية", country_en="Saudi Arabia", prices=[1500, 2800, 3000, 280],
  sectors_ar="العيادات والصالونات والمطاعم والمتاجر", sectors_en="clinics, salons, restaurants and shops",
  wa_ar="السلام عليكم، أرغب في فحص مجاني لحضور نشاطي على الإنترنت (السعودية).", wa_en="Hello, I'd like a free audit of my business's online presence (Saudi Arabia).",
  notes_ar=[("الفاتورة الإلكترونية (فاتورة / هيئة الزكاة والضريبة والجمارك)", "نحن لسنا مزوّد حلول معتمدًا لدى الهيئة ولا ندّعي ذلك. ما نبنيه (الموقع، الحجز عبر واتساب) يعمل بجانب نظام فواتيرك الحالي ولا يستبدله. إن كنت تحتاج ربط الفوترة، نخبرك بذلك صراحةً ونوجّهك لمزوّد معتمد."),
            ("بيانات النشاط الظاهرة للعميل", "إن رغبت، نعرض رقم السجل التجاري واسم النشاط والعنوان بوضوح في موقعك وفي ملفك على خرائط جوجل، فهذا يزيد ثقة العميل.")],
  notes_en=[("E-invoicing (ZATCA / Fatoora)", "We are not a ZATCA-approved solution provider and don't claim to be. What we build (the site, WhatsApp booking) sits next to your existing invoicing system and doesn't replace it. If you need invoicing integration, we say so plainly and point you to an approved provider."),
            ("Business details customers can see", "If you like, we show your commercial registration number, business name and address clearly on your site and Google listing. It builds trust.")]),
 "ae": dict(
  cur_ar="د.إ", cur_en="AED", code="AED", loc="ar-AE", country_ar="الإمارات", country_en="the UAE", prices=[1470, 2750, 2950, 275],
  sectors_ar="العيادات والصالونات والمطاعم ومكاتب الخدمات", sectors_en="clinics, salons, restaurants and service offices",
  wa_ar="السلام عليكم، أرغب في فحص مجاني لحضور نشاطي على الإنترنت (الإمارات).", wa_en="Hello, I'd like a free audit of my business's online presence (UAE).",
  notes_ar=[("عربي وإنجليزي معًا", "في الإمارات عملاؤك يتصفحون بالعربية والإنجليزية، لذلك كل موقع نبنيه ثنائي اللغة من البداية، وبنفس الجودة في اللغتين، لا ترجمة آلية."),
            ("الرخصة التجارية", "نعرض رقم الرخصة التجارية واسم الجهة المرخِّصة في موقعك إن رغبت، وهذا معتاد ويزيد الثقة.")],
  notes_en=[("Arabic and English together", "Your customers browse in both languages, so every site we build is bilingual from day one, with the same care in each. No machine-translated leftovers."),
            ("Trade licence", "If you want, we show your trade licence number and issuing authority on your site. It's normal practice and builds trust.")]),
 "jo": dict(
  cur_ar="د.أ", cur_en="JOD", code="JOD", loc="ar-JO", country_ar="الأردن", country_en="Jordan", prices=[285, 530, 570, 53],
  sectors_ar="العيادات والمطاعم ومراكز التدريب والمحلات", sectors_en="clinics, restaurants, training centres and shops",
  wa_ar="مرحبًا، بدي أو أرغب في فحص مجاني لحضور نشاطي على الإنترنت (الأردن).", wa_en="Hello, I'd like a free audit of my business's online presence (Jordan).",
  notes_ar=[("نعرف أن كل دينار مهم", "لذلك نبدأ بالأقل كلفة: الفحص المجاني أولًا، ثم حزمة واحدة فقط إن أفادتك. لا اشتراكات إجبارية، والشهري اختياري ويمكن إيقافه متى شئت."),
            ("حجم يناسب نشاطك", "إن كانت الحزمة أكبر من حاجتك، نقلّص النطاق ونقلّص السعر معه بدل أن تدفع مقابل ما لا تستخدمه.")],
  notes_en=[("We know every dinar counts", "So we start with the cheapest step: the free audit first, then one package only if it helps. No forced subscriptions; the monthly plan is optional and you can stop any time."),
            ("Sized to your business", "If a package is bigger than you need, we shrink the scope and the price with it, instead of charging for what you won't use.")]),
}
C["jo"]["wa_ar"] = "مرحبًا، أرغب في فحص مجاني لحضور نشاطي على الإنترنت (الأردن)."

def fmt(n): return f"{n:,}"

def page(k):
    c = C[k]; p = c["prices"]
    usd = [400, 750, 800, 75]
    wa_ar = f"https://wa.me/{WA}?text=" + urllib.parse.quote(c["wa_ar"])
    wa_en = f"https://wa.me/{WA}?text=" + urllib.parse.quote(c["wa_en"])
    url = f"https://taktek.io/{k}/"
    pk = [
     dict(id="visibility", ar_t="موقعك على جوجل وخرائط جوجل خلال أسبوع", en_t="Found on Google and Google Maps, in a week",
          ar_d=f"نجهّز ملف نشاطك على خرائط جوجل، ونضبط Search Console وخريطة الموقع والبيانات المنظّمة، ليجدك عملاؤك بسهولة. مناسبة لأنشطة مثل: {c['sectors_ar']}. بلا وعود بترتيب معيّن في النتائج. الاشتراك الشهري الاختياري ({fmt(p[3])} {c['cur_ar']} / نحو {usd[3]}$) يبقي كل شيء محدّثًا.",
          en_d=f"We set up your Google Maps listing, Search Console, sitemap and structured data so customers find you easily. Suited to {c['sectors_en']}. No ranking promises. The optional monthly plan ({c['cur_en']} {fmt(p[3])} / about ${usd[3]}) keeps it current.",
          pa=f"{fmt(p[0])} {c['cur_ar']}", pe=f"{c['cur_en']} {fmt(p[0])}", usd="$400", price=p[0], uc="USD400"),
     dict(id="whatsapp", ar_t="رد تلقائي على واتساب مع الحجز", en_t="WhatsApp auto-reply with booking",
          ar_d="يردّ على العميل فورًا، ويجيب عن الأسئلة المتكررة (الأسعار، المواعيد، الموقع)، ويحجز موعدًا ويذكّره به. مناسب للعيادات والصالونات وكل نشاط يعتمد على المواعيد.",
          en_d="Replies to customers instantly, answers the repeat questions (prices, hours, location), books the appointment and reminds them. Built for clinics, salons and any appointment-based business.",
          pa=f"من {fmt(p[1])} {c['cur_ar']}", pe=f"from {c['cur_en']} {fmt(p[1])}", usd="$750", price=p[1], uc="USD750"),
     dict(id="website", ar_t="موقع ثنائي اللغة في أسبوع", en_t="A bilingual website in a week",
          ar_d="موقع حقيقي بالعربية والإنجليزية يعمل جيدًا على الجوال، مع زر واتساب ونموذج تواصل، يُصمَّم ويُسلَّم خلال نحو أسبوع.",
          en_d="A real Arabic and English website that works well on phones, with a WhatsApp button and contact form, designed and delivered in about a week.",
          pa=f"من {fmt(p[2])} {c['cur_ar']}", pe=f"from {c['cur_en']} {fmt(p[2])}", usd="$800", price=p[2], uc="USD800"),
    ]
    rows = ""
    rows += f'''<div class="row" style="cursor:default"><span class="row__main"><span class="row__title"><span class="ar">فحص مجاني لحضورك على الإنترنت</span><span class="en">Free online-presence audit</span></span><span class="row__desc"><span class="ar">نفحص ظهورك على جوجل والخرائط وإجابات الذكاء الاصطناعي، وسرعة ردّك على واتساب، ونرسل لك النتيجة خلال 24 ساعة. بلا التزام.</span><span class="en">We check how you show up on Google, Maps and AI answers, and how fast your WhatsApp replies, and send the result within 24 hours. No strings.</span></span></span><span class="row__price" style="color:var(--signal)"><span class="ar">مجانًا</span><span class="en">Free</span></span></div>\n'''
    for x in pk:
        rows += f'''<div class="row" id="{x['id']}" style="cursor:default"><span class="row__main"><span class="row__title"><span class="ar">{x['ar_t']}</span><span class="en">{x['en_t']}</span></span><span class="row__desc"><span class="ar">{x['ar_d']}</span><span class="en">{x['en_d']}</span></span></span><span class="row__price"><span class="ar">{x['pa']}</span><span class="en">{x['pe']}</span><small dir="ltr">≈ {x['usd']}</small></span></div>\n'''
    notes = ""
    for (ta, da), (te, de) in zip(c["notes_ar"], c["notes_en"]):
        notes += f'<div class="note"><h3><span class="ar">{ta}</span><span class="en">{te}</span></h3><p class="row__desc"><span class="ar">{da}</span><span class="en">{de}</span></p></div>\n'
    graph = []
    for x in pk:
        graph.append({"@type": "Service", "@id": f"{url}#{x['id']}", "name": x["en_t"], "alternateName": x["ar_t"],
            "provider": {"@id": "https://taktek.io/#llc"}, "areaServed": {"@type": "Country", "name": c["country_en"].replace("the ", "")},
            "availableLanguage": ["ar", "en"],
            "offers": {"@type": "Offer", "price": str(x["price"]), "priceCurrency": c["code"], "description": x["pe"] + " (about " + x["usd"] + " USD)"}})
    graph.append({"@type": "WebPage", "@id": url, "url": url, "inLanguage": c["loc"], "name": f"Taktek — {c['country_en']}"})
    graph.append({"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "taktek", "item": "https://taktek.io/"},
        {"@type": "ListItem", "position": 2, "name": c["country_en"], "item": url}]})
    ld = json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, indent=1)
    hreflang = "".join(f'<link rel="alternate" hreflang="{C[j]["loc"]}" href="https://taktek.io/{j}/">\n' for j in C)
    title_ar = f"تكتك — حلول رقمية لنشاطك في {c['country_ar']}"
    desc_ar = f"موقعك على جوجل وخرائط جوجل، رد تلقائي على واتساب مع الحجز، وموقع ثنائي اللغة. فحص مجاني خلال 24 ساعة، والدفع بعد التسليم للعملاء الأوائل."
    return f'''<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title_ar}</title>
<meta name="description" content="{desc_ar}">
<meta property="og:title" content="{title_ar}">
<meta property="og:description" content="{desc_ar}">
<meta property="og:url" content="{url}">
<meta property="og:locale" content="{c['loc'].replace('-', '_')}">
<meta property="og:image" content="https://taktek.io/assets/og/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="{url}">
{hreflang}<link rel="alternate" hreflang="x-default" href="https://taktek.io/work/">
<link rel="icon" href="../assets/logos/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="../assets/og/apple-touch.png">
<meta name="theme-color" content="#F7F5F1" media="(prefers-color-scheme:light)">
<meta name="theme-color" content="#0D0D0E" media="(prefers-color-scheme:dark)">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@400;700&family=Noto+Sans+Arabic:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/css/studio.css?v=head">
<link rel="stylesheet" href="../assets/css/gravity.css">
<style>
  html[lang=ar] body, html[lang=ar] .row__title, html[lang=ar] .row__price, html[lang=ar] .row__desc, html[lang=ar] .lede, html[lang=ar] h1, html[lang=ar] h2, html[lang=ar] h3, html[lang=ar] .eyebrow, html[lang=ar] .cta {{ font-family: "Noto Sans Arabic", "Space Grotesk", system-ui, sans-serif; letter-spacing: 0; }}
  html[lang=ar] .en, html[lang=en] .ar {{ display: none !important; }}
  html[lang=ar] h1 {{ line-height: 1.25; }}
  html[lang=ar] .cta span[aria-hidden] {{ display: inline-block; transform: scaleX(-1); }}
  .note {{ margin: 0 0 18px; max-width: 58ch; }}
  .note h3 {{ margin: 0 0 6px; font-size: 17px; font-weight: 500; color: var(--ink); }}
  .cta-row {{ display: flex; flex-wrap: wrap; gap: 14px; margin-top: 22px; }}
</style>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-MY112CQXP6"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  if (!(navigator.webdriver || /bot|crawl|spider|headless|lighthouse/i.test(navigator.userAgent) || (screen.width === 800 && screen.height === 600))) {{
    gtag('js', new Date());
    gtag('config', 'G-MY112CQXP6', {{ anonymize_ip: true }});
  }}
</script>
<script type="application/ld+json">
{ld}
</script>
</head><body>
<div class="wrap">
  <header class="head">
    <a class="mark" href="../" dir="ltr">taktek<i aria-hidden="true"></i></a>
    <button class="langbtn" id="lang" type="button" aria-label="Switch language"><span class="ar">English</span><span class="en">العربية</span></button>
    <input type="checkbox" id="mode">
    <label class="modebtn" for="mode" title="Switch appearance" aria-label="Switch appearance">
      <svg class="moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>
      <svg class="sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>
    </label>
  </header>
<main>
  <section class="hero">
    <p class="eyebrow"><span class="ar">{c['country_ar']}</span><span class="en">{c['country_en'][0].upper() + c['country_en'][1:]}</span></p>
    <h1><span class="ar">يجدك عملاؤك،<br>ويردّ عليهم واتساب<em>.</em></span><span class="en">Customers find you,<br>WhatsApp answers them<em>.</em></span></h1>
    <p class="lede"><span class="ar">تكتك استوديو برمجة يعمل فيه وكلاء ذكاء اصطناعي، بقيادة نزار محمود. نبني لنشاطك ظهورًا على جوجل وخرائط جوجل، وردًّا تلقائيًا على واتساب، وموقعًا بالعربية والإنجليزية. أسعار ثابتة ومعلنة.</span><span class="en">Taktek is a dev shop where the developers are AI agents, led by Nizar Mahmoud. We build your presence on Google and Maps, automatic WhatsApp replies, and a website in Arabic and English. Fixed, published prices.</span></p>
    <div class="cta-row">
      <a class="cta wa" id="wa1" href="{wa_ar}" target="_blank" rel="noopener"><span class="ar">ابدأ بفحص مجاني على واتساب</span><span class="en">Start with a free audit on WhatsApp</span> <span aria-hidden="true">&rarr;</span></a>
      <a class="cta" href="{AUDIT}"><span class="ar">أو اطلب الفحص بنموذج</span><span class="en">Or request it by form</span> <span aria-hidden="true">&rarr;</span></a>
    </div>
  </section>

  <section class="sec" aria-label="Packages" id="packages">
    <p class="eyebrow"><span class="ar">ثلاث حزم، أسعار واضحة</span><span class="en">Three packages, clear prices</span></p>
    <div class="index">
{rows}    </div>
    <p class="row__desc" style="margin-top:18px;max-width:58ch"><span class="ar">الأسعار بالدولار الأمريكي، والمبلغ بالعملة المحلية تقريبي (بأسعار الصرف في 8 أكتوبر 2026). للعملاء الأوائل: الدفع بعد التسليم والمعاينة. وبعدها نرسل رابط دفع أو فاتورة.</span><span class="en">Prices are in US dollars; the local amount is approximate (rates of 8 Oct 2026). For our first clients, you pay after delivery and review. We then send a payment link or invoice.</span></p>
  </section>

  <section class="sec" aria-label="Trust">
    <p class="eyebrow"><span class="ar">بكل صراحة</span><span class="en">Straight talk</span></p>
    <div class="note"><h3><span class="ar">ليس لدينا بعد عملاء في {c['country_ar']}</span><span class="en">We have no clients in {c['country_en']} yet</span></h3><p class="row__desc"><span class="ar">لن نعرض لك شعارات أو آراء لا نملكها. بدلًا من ذلك: فحص مجاني تراه بنفسك، والدفع بعد التسليم، وأعمال حقيقية يمكنك فتحها الآن: <a href="https://hobeichlegal.com" target="_blank" rel="noopener" dir="ltr">hobeichlegal.com</a> و<a href="https://barakebread.com" target="_blank" rel="noopener" dir="ltr">barakebread.com</a> و<a href="https://closet.ai" target="_blank" rel="noopener" dir="ltr">closet.ai</a>.</span><span class="en">We won't show logos or reviews we don't have. Instead: a free audit you can judge yourself, payment after delivery, and real work you can open right now: <a href="https://hobeichlegal.com" target="_blank" rel="noopener">hobeichlegal.com</a>, <a href="https://barakebread.com" target="_blank" rel="noopener">barakebread.com</a> and <a href="https://closet.ai" target="_blank" rel="noopener">closet.ai</a>.</span></p></div>
{notes}  </section>

  <section class="sec" aria-label="Contact">
    <p class="eyebrow"><span class="ar">تواصل</span><span class="en">Get in touch</span></p>
    <p class="lede" style="max-width:46ch"><span class="ar">أرسل لنا اسم نشاطك ورابط موقعك أو حسابك، ونعود إليك بالنتيجة خلال 24 ساعة.</span><span class="en">Send us your business name and your website or account link, and we'll come back with the result within 24 hours.</span></p>
    <div class="cta-row">
      <a class="cta wa" id="wa2" href="{wa_ar}" target="_blank" rel="noopener"><span class="ar">واتساب: +961 81 511 232</span><span class="en">WhatsApp: +961 81 511 232</span> <span aria-hidden="true">&rarr;</span></a>
    </div>
    <p class="row__desc" style="margin-top:18px"><span class="ar">الصفحة الإنجليزية الكاملة للخدمات: <a href="../work/">taktek.io/work</a></span><span class="en">The full English services page: <a href="../work/">taktek.io/work</a></span></p>
  </section>

  <footer>
    <div class="entities"><address dir="ltr"><b>Taktek, LLC</b><br>131 Continental Dr, Suite 305<br>Newark, DE 19713, United States</address><address dir="ltr"><b>Taktek Offshore SAL</b><br>Al Watta Street, Riman Building<br>Aley 5516, Lebanon</address></div>
    <a href="../">Home</a>
    <a href="../work/">Work with us</a>
    <a href="../terms/">Terms</a>
    <a href="../privacy/">Privacy</a>
    <a href="../support/">Support</a>
    <a class="spacer" href="https://github.com/taktekhq">github.com/taktekhq</a>
  </footer>
</main>
</div>
<script src="../assets/js/gravity.js"></script>
<script>
(() => {{
  const WA = {{ ar: "{wa_ar}", en: "{wa_en}" }};
  const set = (l) => {{
    document.documentElement.lang = l;
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
    document.title = l === 'ar' ? {json.dumps(title_ar, ensure_ascii=False)} : "Taktek — {c['country_en']}";
    document.querySelectorAll('a.wa').forEach(a => a.href = WA[l]);
  }};
  if (new URLSearchParams(location.search).get('lang') === 'en') set('en');
  document.getElementById('lang').addEventListener('click', () => set(document.documentElement.lang === 'ar' ? 'en' : 'ar'));
}})();
</script>
</body>
</html>
'''

root = pathlib.Path(__file__).resolve().parent.parent
for k in C:
    (root / k).mkdir(exist_ok=True)
    (root / k / "index.html").write_text(page(k), encoding="utf-8")
sm = root / "sitemap.xml"
s = sm.read_text()
for k in C:
    loc = f"https://taktek.io/{k}/"
    if loc not in s:
        alts = "".join(f'<xhtml:link rel="alternate" hreflang="{C[j]["loc"]}" href="https://taktek.io/{j}/"/>' for j in C)
        s = s.replace("</urlset>", f"  <url><loc>{loc}</loc><lastmod>2026-10-08</lastmod>{alts}</url>\n</urlset>")
if "xmlns:xhtml" not in s:
    s = s.replace('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">')
sm.write_text(s)
