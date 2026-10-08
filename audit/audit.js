(() => {
  const $ = (id) => document.getElementById(id);
  const API = (window.AUDIT_API || (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? "http://localhost:8788" : "")).replace(/\/$/, "");

  // check id -> [label, {pass,warn,fail}, fix title, fix body]
  const T = {
    en: {
      eyebrow: "Free check · 10 seconds",
      h1: "How visible is your business on Google, Maps and ChatGPT<em>?</em>",
      lede: "Type your website. You get a plain-language scorecard and the three fixes that matter most. No signup.",
      l_site: "Your website", l_name: "Business name (optional)", l_city: "City (optional)",
      go: "Check my business", busy: "Checking… about 10 seconds",
      fine: "We fetch your home page, robots.txt and sitemap once, like a browser would. We keep only the domain and the score.",
      fix_h: "Three fixes that matter most", all_h: "Everything we checked",
      scope: "This checks what a search engine or AI assistant can read on your website. It can't see your Google Business Profile, reviews or rankings; the full audit covers those.",
      full_h: "Want the full free audit?", full_p: "We check Google Business Profile, Maps, how ChatGPT describes you, and how fast you answer on WhatsApp, then send it back within 24 hours.",
      cta_form: "Get the free audit", cta_wa: "WhatsApp us", l_mail: "Prefer email? Send me the full report", send: "Email me the report",
      consent: "Yes, email me the full report for this website, and contact me once about fixing it. I understand Taktek stores my email and this website's score for up to 180 days, and I can ask for deletion any time.",
      fb_e: "Instant check is being switched on", fb_p: "The automatic scorecard isn't live yet. Request the free audit instead and a person will send you the same check, with more detail, within 24 hours.",
      sc: "/100", all_good: "You're in good shape", ok: "Decent, with clear gaps", low: "Hard to find right now",
      sub_good: "Search engines and AI assistants can read your site well. A few polish items remain.",
      sub_ok: "The basics work, but some gaps are costing you customers.",
      sub_low: "Search engines and AI assistants are missing key information about you. The fixes below are quick wins.",
      wall: "Your site refused our automated check (it answered with an error or a bot wall), so some results may be wrong. The full audit is done by hand and doesn't have this limit.",
      blocked: "Your robots.txt asks automated tools like ours to stay away, so we stopped after reading it, as it asked. Search engines may be blocked the same way, which would be the most important thing to check.",
      e_bad: "That doesn't look like a website address. Try something like yourbusiness.com", e_unreach: "We couldn't reach that website. Check the address, or try again in a minute.", e_time: "That website took too long to answer. If it's yours, that's a finding in itself; try again in a minute.", e_rate: "Too many checks from your network right now. Please try again in an hour, or request the free audit.", e_net: "Something went wrong on our side. Please try again, or request the free audit.",
      lead_ok: "Thanks. We'll email the full report within 24 hours (a person will do it, not a bot). Nothing else gets sent.", l_bad: "Please enter your email and tick the box.",
      status: { pass: "Good", warn: "Could be better", fail: "Needs fixing" },
      c: {
        https: ["Secure connection (HTTPS)", { pass: "Your site loads over HTTPS.", warn: "", fail: "Your site isn't served over HTTPS. Browsers show “Not secure” and Google prefers secure sites." }, "Switch your site to HTTPS", "Turn on the free SSL certificate in your hosting and redirect http:// to https://. Browsers warn visitors away from unsecured sites."],
        mobile: ["Works on phones", { pass: "A mobile viewport is set, so pages scale to phones.", warn: "", fail: "No mobile viewport tag: your site will likely look tiny or broken on phones, where most of your customers are." }, "Make the site mobile-friendly", "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"> and make sure the layout fits a phone. Google ranks the mobile version first."],
        speed: ["Speed", { pass: (d) => `Home page answered in ${d.ms} ms (${d.kb} KB of HTML). Fast.`, warn: (d) => `Home page took ${d.ms} ms and weighs ${d.kb} KB of HTML. Slower than it should be.`, fail: (d) => `Home page took ${d.ms} ms and weighs ${d.kb} KB of HTML. Visitors on mobile data will leave.` }, "Speed up the home page", "Compress images, drop unused plugins and scripts, and turn on caching or a CDN. Aim for the page to start showing in under 2 seconds on a phone."],
        title: ["Page title", { pass: (d) => `“${d.value}”`, warn: (d) => d.len ? `“${d.value}” is ${d.len} characters; 10–70 shows best in Google.` : "", fail: "No page title. It is the headline people see in Google results." }, "Write a clear page title", "Use 50–60 characters: what you do + where + your name, e.g. “Dentist in Beirut — Smile Clinic”. It is the headline in Google results."],
        description: ["Search description", { pass: (d) => `“${d.value}”`, warn: (d) => `“${d.value}” is ${d.len} characters; 50–160 shows best.`, fail: "No meta description. Google will show a random snippet from your page instead of your pitch." }, "Add a search description", "Write 120–155 characters selling the click: what you offer, where, and why you. Add it as a meta description on every important page."],
        schema: ["Business data for Google (schema)", { pass: (d) => `LocalBusiness markup found (${d.types.slice(0, 3).join(", ")}).`, warn: (d) => `Some structured data found (${d.types.slice(0, 3).join(", ") || "other types"}), but no LocalBusiness type with your address, hours and phone.`, fail: "No structured data. Google and AI assistants can't read your address, hours or phone directly." }, "Add LocalBusiness structured data", "Add a JSON-LD LocalBusiness block with name, address, phone, opening hours, social links and your Maps link. It is how Google and ChatGPT-style assistants read your basics."],
        indexable: ["Can Google index it?", { pass: "No noindex tag, normal response. Search engines can list this page.", warn: "", fail: (d) => d.noindex ? "This page tells search engines not to index it (noindex). It will not appear on Google." : d.parked ? "The page looks parked or like a placeholder, not a real business page." : `The page answered with an error (HTTP ${d.httpStatus}).` }, "Let Google index your site", "Remove the noindex tag (often a ‘discourage search engines’ checkbox in WordPress or a site-builder setting) and make sure the home page loads without errors."],
        sitemap: ["Sitemap", { pass: "A sitemap was found. Search engines can discover all your pages.", warn: "", fail: "No sitemap.xml found, so search engines may miss pages." }, "Publish a sitemap", "Generate a sitemap.xml (most site builders have a switch), list it in robots.txt, and submit it in Google Search Console."],
        maps: ["Google Maps link", { pass: "Your site links to or embeds Google Maps.", warn: "", fail: "No Google Maps link or embed. Customers can't tap through to find or navigate to you." }, "Link your Google Maps listing", "Add a ‘Find us’ button and embed the map on your contact page, using your Google Business Profile link. Claim the profile if you haven't."],
        whatsapp: ["WhatsApp button", { pass: "A WhatsApp link was found.", warn: "", fail: "No WhatsApp link. In this region most customers prefer to message first." }, "Add a WhatsApp button", "Add a click-to-chat button (wa.me/your-number) in the header and on the contact page, with a prefilled message."],
        booking: ["Booking or reservation link", { pass: "Booking or reservation links found.", warn: "No obvious online booking. Fine if you don't take bookings, a missed chance if you do.", fail: "" }, "Make booking one tap", "Add a booking link or form (Calendly, Fresha, your own form) so customers can book outside office hours."],
        ai: ["Readable by ChatGPT & AI answers", { pass: "AI crawlers aren't blocked and your page has readable text.", warn: (d) => `Some AI crawlers are blocked by robots.txt (${d.blocked.join(", ")}).`, fail: (d) => d.blocked.some(b => /gptbot|oai/.test(b)) ? "Your robots.txt blocks OpenAI's crawlers, so ChatGPT search can't read or cite your site." : "There is almost no readable text in the HTML (the content may load only via JavaScript), so AI assistants can't read it." }, "Make your site readable to AI assistants", "Allow GPTBot and OAI-SearchBot in robots.txt, and put your key facts (services, area, hours, prices) as plain text on the page, not only in images or scripts."],
      },
    },
    ar: {
      eyebrow: "فحص مجاني · ١٠ ثوانٍ",
      h1: "ما مدى ظهور نشاطك التجاري على Google والخرائط وChatGPT<em>؟</em>",
      lede: "اكتب عنوان موقعك. تحصل على تقييم واضح وبسيط، مع أهم ثلاثة إصلاحات. بدون تسجيل.",
      l_site: "موقعك الإلكتروني", l_name: "اسم النشاط (اختياري)", l_city: "المدينة (اختياري)",
      go: "افحص نشاطي", busy: "جارٍ الفحص… حوالي ١٠ ثوانٍ",
      fine: "نفتح صفحتك الرئيسية وملف robots.txt وخريطة الموقع مرة واحدة، كما يفعل أي متصفح. نحتفظ فقط باسم النطاق والنتيجة.",
      fix_h: "أهم ثلاثة إصلاحات", all_h: "كل ما فحصناه",
      scope: "يفحص هذا ما يستطيع محرك البحث أو مساعد الذكاء الاصطناعي قراءته على موقعك. لا يرى ملفك على Google Business ولا التقييمات ولا الترتيب؛ التدقيق الكامل يغطيها.",
      full_h: "تريد التدقيق المجاني الكامل؟", full_p: "نفحص ملفك على Google Business والخرائط وكيف يصفك ChatGPT وسرعة ردّك على واتساب، ونرسله لك خلال ٢٤ ساعة.",
      cta_form: "احصل على التدقيق المجاني", cta_wa: "راسلنا على واتساب", l_mail: "تفضّل البريد؟ أرسلوا لي التقرير الكامل", send: "أرسلوا لي التقرير",
      consent: "نعم، أرسلوا لي التقرير الكامل لهذا الموقع وتواصلوا معي مرة واحدة بخصوص الإصلاح. أفهم أن Taktek تحتفظ ببريدي ونتيجة هذا الموقع حتى ١٨٠ يومًا، ويمكنني طلب الحذف في أي وقت.",
      fb_e: "الفحص الفوري قيد التشغيل", fb_p: "التقييم التلقائي غير متاح بعد. اطلب التدقيق المجاني وسيرسل لك شخص الفحص نفسه بتفاصيل أكثر خلال ٢٤ ساعة.",
      all_good: "وضعك جيد", ok: "جيد، مع ثغرات واضحة", low: "يصعب العثور عليك حاليًا",
      sub_good: "تستطيع محركات البحث والذكاء الاصطناعي قراءة موقعك جيدًا. بقيت بعض التحسينات.",
      sub_ok: "الأساسيات تعمل، لكن بعض الثغرات تكلّفك زبائن.",
      sub_low: "محركات البحث والذكاء الاصطناعي تفتقد معلومات أساسية عنك. الإصلاحات أدناه سهلة وسريعة.",
      wall: "رفض موقعك فحصنا الآلي (ردّ بخطأ أو بحاجز للروبوتات)، لذلك قد تكون بعض النتائج غير دقيقة. التدقيق الكامل يتم يدويًا ولا يواجه هذا القيد.",
      blocked: "ملف robots.txt لديك يطلب من الأدوات الآلية مثل أداتنا الابتعاد، فتوقفنا بعد قراءته. وقد تكون محركات البحث ممنوعة بالطريقة نفسها، وهذا أهم ما يجب التحقق منه.",
      e_bad: "هذا لا يبدو عنوان موقع. جرّب مثلًا yourbusiness.com", e_unreach: "تعذّر الوصول إلى الموقع. تحقق من العنوان أو حاول بعد دقيقة.", e_time: "استغرق الموقع وقتًا طويلًا للرد. إن كان موقعك فهذه مشكلة بحد ذاتها؛ حاول بعد دقيقة.", e_rate: "عدد كبير من الفحوصات من شبكتك حاليًا. حاول بعد ساعة أو اطلب التدقيق المجاني.", e_net: "حدث خطأ من جهتنا. حاول مرة أخرى أو اطلب التدقيق المجاني.",
      lead_ok: "شكرًا. سنرسل التقرير الكامل بالبريد خلال ٢٤ ساعة (يرسله شخص وليس روبوت). لن نرسل لك شيئًا آخر.", l_bad: "أدخل بريدك الإلكتروني وفعّل الخانة.",
      status: { pass: "جيد", warn: "يمكن تحسينه", fail: "يحتاج إصلاحًا" },
      c: {
        https: ["اتصال آمن (HTTPS)", { pass: "موقعك يعمل عبر HTTPS.", warn: "", fail: "موقعك لا يعمل عبر HTTPS. تعرض المتصفحات «غير آمن» وGoogle يفضّل المواقع الآمنة." }, "فعّل HTTPS على موقعك", "فعّل شهادة SSL المجانية في الاستضافة وحوّل http:// إلى https://. المتصفحات تحذّر الزوار من المواقع غير الآمنة."],
        mobile: ["يعمل على الهاتف", { pass: "إعداد العرض للجوال موجود، فتتكيّف الصفحات مع الهاتف.", warn: "", fail: "لا يوجد وسم العرض للجوال: سيظهر موقعك صغيرًا أو مكسورًا على الهاتف حيث معظم زبائنك." }, "اجعل الموقع مناسبًا للجوال", "أضف <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"> وتأكد أن التصميم يناسب الهاتف. Google يقيّم نسخة الجوال أولًا."],
        speed: ["السرعة", { pass: (d) => `ردّت الصفحة الرئيسية خلال ${d.ms} ملّي ثانية (${d.kb} كيلوبايت). سريع.`, warn: (d) => `استغرقت الصفحة الرئيسية ${d.ms} ملّي ثانية وحجمها ${d.kb} كيلوبايت. أبطأ من المطلوب.`, fail: (d) => `استغرقت الصفحة الرئيسية ${d.ms} ملّي ثانية وحجمها ${d.kb} كيلوبايت. سيغادر زوار الهاتف.` }, "سرّع الصفحة الرئيسية", "اضغط الصور، احذف الإضافات والسكربتات غير المستخدمة، وفعّل التخزين المؤقت أو CDN. الهدف أن تبدأ الصفحة بالظهور خلال أقل من ثانيتين على الهاتف."],
        title: ["عنوان الصفحة", { pass: (d) => `«${d.value}»`, warn: (d) => d.len ? `«${d.value}» طوله ${d.len} حرفًا؛ الأفضل بين ١٠ و٧٠.` : "", fail: "لا يوجد عنوان للصفحة. هو العنوان الذي يراه الناس في نتائج Google." }, "اكتب عنوانًا واضحًا للصفحة", "استخدم ٥٠–٦٠ حرفًا: ماذا تقدّم + أين + اسمك، مثل «طبيب أسنان في بيروت — عيادة الابتسامة». هو عنوانك في نتائج Google."],
        description: ["وصف البحث", { pass: (d) => `«${d.value}»`, warn: (d) => `«${d.value}» طوله ${d.len} حرفًا؛ الأفضل بين ٥٠ و١٦٠.`, fail: "لا يوجد وصف (meta description). سيعرض Google مقتطفًا عشوائيًا بدل عرضك." }, "أضف وصفًا للبحث", "اكتب ١٢٠–١٥٥ حرفًا تشجّع على النقر: ماذا تقدّم وأين ولماذا أنت. أضفه في كل صفحة مهمة."],
        schema: ["بيانات النشاط لـ Google (schema)", { pass: (d) => `وُجد وسم LocalBusiness (${d.types.slice(0, 3).join("، ")}).`, warn: (d) => `وُجدت بيانات منظّمة (${d.types.slice(0, 3).join("، ") || "أنواع أخرى"}) لكن بدون LocalBusiness يتضمن العنوان والدوام والهاتف.`, fail: "لا توجد بيانات منظّمة. لا يستطيع Google ولا مساعدو الذكاء الاصطناعي قراءة عنوانك أو دوامك أو هاتفك مباشرة." }, "أضف بيانات LocalBusiness المنظّمة", "أضف كتلة JSON-LD من نوع LocalBusiness فيها الاسم والعنوان والهاتف وساعات الدوام وروابط التواصل ورابط الخريطة. هكذا يقرأ Google ومساعدو الذكاء الاصطناعي أساسياتك."],
        indexable: ["هل يستطيع Google أرشفته؟", { pass: "لا يوجد noindex والاستجابة طبيعية. يمكن لمحركات البحث إدراج الصفحة.", warn: "", fail: (d) => d.noindex ? "تطلب هذه الصفحة من محركات البحث عدم أرشفتها (noindex). لن تظهر على Google." : d.parked ? "تبدو الصفحة محجوزة أو مؤقتة وليست صفحة نشاط حقيقية." : `ردّت الصفحة بخطأ (HTTP ${d.httpStatus}).` }, "اسمح لـ Google بأرشفة موقعك", "احذف وسم noindex (غالبًا خيار «تثبيط محركات البحث» في ووردبريس أو إعداد في منشئ المواقع) وتأكد أن الصفحة الرئيسية تفتح بلا أخطاء."],
        sitemap: ["خريطة الموقع", { pass: "وُجدت خريطة موقع. تستطيع محركات البحث اكتشاف كل صفحاتك.", warn: "", fail: "لا توجد sitemap.xml، وقد تفوت محركات البحث بعض صفحاتك." }, "انشر خريطة للموقع", "أنشئ sitemap.xml (معظم منشئي المواقع فيها خيار)، اذكرها في robots.txt وأرسلها في Google Search Console."],
        maps: ["رابط خرائط Google", { pass: "موقعك يربط أو يضمّن خرائط Google.", warn: "", fail: "لا يوجد رابط أو خريطة مضمّنة. لا يستطيع الزبون الضغط للوصول إليك." }, "اربط موقعك بخرائط Google", "أضف زر «موقعنا» وضمّن الخريطة في صفحة التواصل برابط ملفك على Google Business. وإن لم تطالب بالملف بعد، افعل."],
        whatsapp: ["زر واتساب", { pass: "وُجد رابط واتساب.", warn: "", fail: "لا يوجد رابط واتساب. معظم الزبائن في منطقتنا يفضّلون المراسلة أولًا." }, "أضف زر واتساب", "أضف زر محادثة (wa.me/رقمك) في أعلى الموقع وفي صفحة التواصل مع رسالة جاهزة."],
        booking: ["رابط الحجز", { pass: "وُجدت روابط حجز.", warn: "لا يوجد حجز إلكتروني واضح. لا بأس إن كنت لا تأخذ حجوزات، وفرصة ضائعة إن كنت تأخذها.", fail: "" }, "اجعل الحجز بضغطة واحدة", "أضف رابط أو نموذج حجز (Calendly أو Fresha أو نموذجك) ليحجز الزبائن خارج ساعات الدوام."],
        ai: ["مقروء لـ ChatGPT ومساعدي الذكاء الاصطناعي", { pass: "زواحف الذكاء الاصطناعي غير ممنوعة وفي صفحتك نص مقروء.", warn: (d) => `يمنع robots.txt بعض زواحف الذكاء الاصطناعي (${d.blocked.join("، ")}).`, fail: (d) => d.blocked.some(b => /gptbot|oai/.test(b)) ? "يمنع robots.txt زواحف OpenAI، فلا يستطيع بحث ChatGPT قراءة موقعك أو الاستشهاد به." : "لا يوجد تقريبًا نص مقروء في HTML (قد يُحمَّل المحتوى بالجافاسكربت فقط)، فلا يستطيع مساعدو الذكاء الاصطناعي قراءته." }, "اجعل موقعك مقروءًا لمساعدي الذكاء الاصطناعي", "اسمح لـ GPTBot وOAI-SearchBot في robots.txt، واكتب معلوماتك الأساسية (الخدمات، المنطقة، الدوام، الأسعار) كنص عادي في الصفحة وليس في صور أو سكربتات فقط."],
      },
    },
  };

  let lang = (new URLSearchParams(location.search).get("lang") || localStorage.getItem("audit-lang") || (/^ar/i.test(navigator.language) ? "ar" : "en"));
  if (lang !== "ar") lang = "en";
  let last = null;
  const t = () => T[lang];
  const fmt = (v, d) => (typeof v === "function" ? v(d) : v);

  function applyLang() {
    document.documentElement.lang = lang; document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    $("lang").textContent = lang === "ar" ? "English" : "العربية";
    document.querySelectorAll("[data-t]").forEach(el => { const v = t()[el.dataset.t]; if (v != null) el.innerHTML = v; });
    $("wa").href = "https://wa.me/96181511232?text=" + encodeURIComponent(lang === "ar" ? "مرحبًا، أريد التدقيق المجاني لموقعي: " + (last ? last.host : "") : "Hi, I'd like the free audit for my website: " + (last ? last.host : ""));
    if (last) render(last);
  }

  function render(r) {
    $("r_host").textContent = r.host;
    $("r_score").textContent = lang === "ar" ? r.score.toLocaleString("ar-EG") : r.score;
    const col = r.score >= 75 ? "var(--signal)" : r.score >= 50 ? "#E0A100" : "#E5484D";
    $("ring").style.setProperty("--p", r.score); $("ring").style.setProperty("--c", col);
    const lvl = r.score >= 75 ? "good" : r.score >= 50 ? "ok" : "low";
    $("r_head").textContent = t()[lvl === "good" ? "all_good" : lvl];
    $("r_sub").textContent = t()["sub_" + lvl];
    const wall = $("r_wall"); wall.hidden = !(r.blocked || r.botWall); wall.textContent = r.blocked ? t().blocked : t().wall;
    const byId = Object.fromEntries(r.checks.map(c => [c.id, c]));
    const fx = $("r_fixes"); fx.innerHTML = "";
    if (r.blocked) { /* no fixes without reading the page */ }
    r.fixes.forEach(id => { const c = t().c[id]; const d = document.createElement("div"); d.className = "fix"; d.innerHTML = "<h3></h3><p></p>"; d.firstChild.textContent = c[2]; d.lastChild.textContent = c[3]; fx.appendChild(d); });
    const box = $("r_checks"); box.innerHTML = "";
    r.checks.forEach(ck => {
      const c = t().c[ck.id]; const d = document.createElement("div"); d.className = "chk " + ck.status;
      const msg = fmt(c[1][ck.status], ck) || fmt(c[1].fail, ck) || fmt(c[1].pass, ck);
      d.innerHTML = "<i></i><h3><span></span><em></em></h3><p></p>";
      d.querySelector("span").textContent = c[0]; d.querySelector("em").textContent = t().status[ck.status]; d.querySelector("p").textContent = msg;
      box.appendChild(d);
    });
    $("result").hidden = false;
  }

  function showErr(el, m) { el.textContent = m; el.hidden = false; }

  $("lang").addEventListener("click", () => { lang = lang === "ar" ? "en" : "ar"; localStorage.setItem("audit-lang", lang); applyLang(); });
  $("wa").addEventListener("click", () => { if (window.gtag) gtag("event", "whatsapp_click", { page: location.pathname }); });
  applyLang();
  if (!API) $("fallback").hidden = false;

  $("form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("err"); err.hidden = true;
    if (!API) { $("fallback").scrollIntoView({ behavior: "smooth" }); return; }
    const fd = new FormData(e.target);
    if (fd.get("website")) return;
    const url = String(fd.get("url") || "").trim();
    if (!url) return showErr(err, t().e_bad);
    if (window.gtag) gtag("event", "audit_run", { lang });
    const btn = $("go"); btn.disabled = true; btn.firstElementChild.innerHTML = '<span class="spin"></span>' + t().busy;
    $("result").hidden = true;
    try {
      const res = await fetch(API + "/api/audit?url=" + encodeURIComponent(url));
      const r = await res.json().catch(() => ({}));
      if (res.status === 429) showErr(err, t().e_rate);
      else if (r.error === "bad_url" || res.status === 400) showErr(err, t().e_bad);
      else if (r.error === "timeout") showErr(err, t().e_time);
      else if (r.error) showErr(err, t().e_unreach);
      else {
        last = Object.assign(r, { business: fd.get("business"), city: fd.get("city"), input: url });
        applyLang();
        if (window.gtag) gtag("event", "audit_done", { score_band: r.score >= 75 ? "good" : r.score >= 50 ? "ok" : "low" });
        $("result").scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch { showErr(err, t().e_net); }
    btn.disabled = false; btn.firstElementChild.textContent = t().go;
  });

  $("lead").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target), err = $("lead_err"); err.hidden = true;
    if (fd.get("website")) return;
    const email = String(fd.get("email") || "").trim();
    if (!email || !fd.get("consent") || !last) return showErr(err, t().l_bad);
    try {
      const res = await fetch(API + "/api/lead", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, consent: true, url: last.input, score: last.score, business: last.business, city: last.city, lang }) });
      if (!res.ok) throw 0;
      if (window.gtag) gtag("event", "audit_lead_submit", { score_band: last.score >= 75 ? "good" : last.score >= 50 ? "ok" : "low" });
      const ok = $("lead_ok"); ok.textContent = t().lead_ok; ok.hidden = false; e.target.querySelector("button").disabled = true;
    } catch { showErr(err, t().e_net); }
  });
})();
