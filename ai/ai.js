(() => {
  const $ = (id) => document.getElementById(id);
  const API = (window.AUDIT_API || (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? "http://localhost:8788" : "")).replace(/\/$/, "");
  const params = new URLSearchParams(location.search);
  const isBot = navigator.webdriver || /bot|crawl|spider|headless|lighthouse/i.test(navigator.userAgent);
  const track = (name, p) => { try { if (window.gtag) gtag("event", name, p || {}); } catch (_) {} };

  // Fix copy, keyed by id from the Worker (AI fixes + the taktek-audit website checks).
  const FIX_EN = {
    website: ["Give AI something to read: a simple website", "Assistants with web search quote websites. One page with your name, what you do, the areas you serve, hours, phone and a Maps link is enough to start."],
    gbp: ["Complete your Google Business Profile", "Gemini reads Google's own data first. Claim the profile, pick the exact category, add hours, photos, services and your website, and post monthly."],
    directories: ["Get listed where assistants look", "AI answers lean on directories and “best of” lists. Make sure you're listed, with the same name, phone and address, on the local directories for your city and category."],
    reviews: ["Ask your happy customers for reviews", "Assistants name businesses that many people talk about. A steady trickle of recent Google reviews that mention what you do and where is the strongest signal you control."],
    facts: ["Say the same thing everywhere", "Use exactly the same business name, category, phone and address on your website, Google, Facebook, Instagram and directories, so assistants are sure they're all you."],
    indexable: ["Let search engines index your website", "Your website tells search engines not to list it, or answers with an error. Assistants with web search can't cite a page they can't find. Remove the noindex setting."],
    schema: ["Add LocalBusiness structured data to your website", "A JSON-LD block with your name, address, phone, hours and Maps link lets Google and AI assistants read your basics without guessing."],
    ai: ["Unblock AI crawlers on your website", "Your robots.txt blocks AI crawlers, or the page has almost no readable text. Allow GPTBot and OAI-SearchBot and put your key facts in plain text."],
    maps: ["Link your Google Maps listing from your website", "Add a ‘Find us’ link or embedded map using your Google Business Profile, so assistants and customers can tie your site to your Maps listing."],
  };
  const FIX_AR = {
    website: ["أعطِ الذكاء الاصطناعي ما يقرأه: موقع بسيط", "المساعدون الذين يبحثون في الويب يستشهدون بالمواقع. صفحة واحدة فيها اسمك وما تقدّمه والمناطق التي تخدمها والدوام والهاتف ورابط الخريطة تكفي للبداية."],
    gbp: ["أكمل ملفك على Google Business", "يقرأ Gemini بيانات Google أولًا. طالب بالملف، اختر الفئة الدقيقة، أضف الدوام والصور والخدمات وموقعك، وانشر شهريًا."],
    directories: ["كن مدرجًا حيث يبحث المساعدون", "تعتمد إجابات الذكاء الاصطناعي على الأدلة وقوائم «الأفضل». تأكد أنك مدرج، بالاسم والهاتف والعنوان نفسه، في الأدلة المحلية لمدينتك ومجالك."],
    reviews: ["اطلب التقييمات من زبائنك الراضين", "يرشّح المساعدون الأنشطة التي يتحدث عنها كثيرون. تقييمات Google حديثة ومنتظمة تذكر ما تقدّمه وأين هي أقوى إشارة بيدك."],
    facts: ["قل الشيء نفسه في كل مكان", "استخدم الاسم والفئة والهاتف والعنوان نفسها تمامًا على موقعك وGoogle وفيسبوك وإنستغرام والأدلة، ليتأكد المساعدون أنها كلها أنت."],
    indexable: ["اسمح لمحركات البحث بأرشفة موقعك", "موقعك يطلب من محركات البحث عدم إدراجه أو يردّ بخطأ. لا يستطيع المساعد الاستشهاد بصفحة لا يجدها. أزل إعداد noindex."],
    schema: ["أضف بيانات LocalBusiness المنظّمة إلى موقعك", "كتلة JSON-LD فيها اسمك وعنوانك وهاتفك ودوامك ورابط الخريطة تجعل Google والمساعدين يقرؤون أساسياتك دون تخمين."],
    ai: ["ألغِ حظر زواحف الذكاء الاصطناعي على موقعك", "ملف robots.txt يمنع زواحف الذكاء الاصطناعي، أو الصفحة شبه خالية من النص المقروء. اسمح لـ GPTBot وOAI-SearchBot واكتب معلوماتك الأساسية كنص."],
    maps: ["اربط ملفك على خرائط Google من موقعك", "أضف رابط «موقعنا» أو خريطة مضمّنة من ملفك على Google Business ليربط المساعدون والزبائن موقعك بملفك على الخرائط."],
  };

  const T = {
    en: {
      skip: "Skip to the check", kicker: "Free, takes about 15 seconds, no signup.",
      h1: "Is ChatGPT recommending your business?",
      lede: "We ask AI assistants what your customers ask, like “best dentist in Beirut”, and show you whether they name you, who they name instead, and what to fix.",
      check_h: "Run the check", l_name: "Business name", l_cat: "What you do", l_city: "City and country",
      ph_cat: "dentist, bakery, car rental…", ph_city: "Beirut, Lebanon",
      l_site: "Website (optional, adds a website check to the fixes)", go: "Check my business",
      fine: "We ask {M}, with web search on. Results name the exact models and time. We keep what you typed and the answers for 24 hours; your IP is only used, hashed, for a 2-hour rate limit.",
      busy: "Asking the assistants…", busy_q: (q) => `“${q}”`,
      e_name: "Type your business name.", e_cat: "Say what you do, e.g. dentist or bakery.", e_city: "Add your city, e.g. Beirut, Lebanon.",
      e_rate: "Too many checks from your network this hour. Try again later.", e_cfg: "The check is being switched on. Please try again in a little while.", e_up: "The assistants didn't answer in time. Please try again.", e_net: "Something went wrong on our side. Please try again.",
      head_yes: (n, of) => `Recommended in ${n} of ${of} answers`, head_no: "Not recommended yet",
      sub_yes: (name, known) => `When customers ask AI assistants for your kind of business, ${name} comes up some of the time.` + (known ? " They also know who you are." : " But asked about you directly, they couldn't say much."),
      sub_no: (name, known) => known ? `The assistants know ${name} when asked by name, but didn't recommend you when a customer asked for your kind of business.` : `None of the assistants recommended ${name}, and asked directly, they didn't know about you. That's common, and fixable.`,
      asked: (models, when) => `Asked <b>${models}</b> on ${when}. We did not ask ChatGPT itself; it works the same way (a language model with web search), but we only report what we actually asked. Answers change from day to day.`,
      web: "with web search", noweb: "no web search", cached: " Result from earlier today (cached for 24 hours).",
      comp_h: "Who they recommend instead", times: (n) => `named ${n}×`, comp_none: "No other businesses were named.",
      fix_h: "Three fixes that matter most", fix_site: (h, s) => `From the website check of ${h} (score ${s}/100). <a href="../audit/">Full scorecard →</a>`,
      mon_h: "Monitor it weekly", per_month: "/month", mon_p: "Every week we ask the assistants again and email you the answers. You get an alert the week you appear, or disappear. Cancel any time.",
      mon_cta: "Start monitoring", mon_mail: "Where should the weekly report go?", mon_note: "Payment links aren't switched on yet: we'll email you a secure Stripe link for $19/month within a day, and the first weekly report starts when you pay.",
      mon_send: "Send me the link", mon_ok: "Got it. The Stripe link comes by email within a day. Nothing is charged until you pay it.",
      fixit_h: "Get it fixed", once: "once", fixit_p: "We do the fixes for you: Google Business Profile, directory listings, structured data and AI-readable pages, then re-run this check. No ranking promises.", fixit_cta: "Ask for the setup",
      ans_h: "The exact answers", q_best: "Best in your city", q_call: "Who to call", q_know: "What they know about you",
      named: "Named you", not_named: "Didn't name you", knows: "Knows you", unknown: "Doesn't know you", failed: "No answer (timed out)",
      mail_h: "Email me this report", l_mail: "Email", consent: "Email me this report and one follow-up about fixing it. Taktek keeps my email for up to 180 days; I can ask for deletion any time.",
      send: "Email me the report", lead_ok: "Sent to our queue. The report arrives within 24 hours.", l_bad: "Enter your email and tick the box.",
      fb_h: "Was this right?", fb_l: "Feedback", fb_ph: "Tell us if an answer looks wrong, or what you'd want next.", fb_send: "Send feedback", fb_ok: "Thank you. We read every message.",
      again: "Check another business", faq_h: "Questions",
      q1: "Does this ask ChatGPT?", a1: "No. It asks {M}, with web search on, the same questions a customer would ask, and the results name the exact models and the time. ChatGPT works the same way (a language model plus web search), so they're a fair proxy, but we only report what we actually asked.",
      q2: "What questions does it ask?", a2: "“What are the best &lt;category&gt; in &lt;city&gt;?”, “Who should I call for &lt;category&gt; in &lt;city&gt;?” and “What do you know about &lt;your business&gt; in &lt;city&gt;?”",
      q3: "How do I get AI assistants to recommend me?", a3: "Assistants with web search repeat what the web says about you: a complete Google Business Profile with recent reviews, consistent listings in local directories, and a website that states your name, services, area and contact details as plain text with LocalBusiness structured data. The check picks the three fixes that matter most for you.",
      q4: "Is it free? What does monitoring cost?", a4: "The check is free, no signup. Weekly monitoring is $19/month. If you want us to make the fixes, the visibility setup is $400 once. No ranking promises: nobody can promise what an AI will say.",
      q5: "What do you store?", a5: "What you type and the answers, cached for 24 hours so a repeat check is instant. Your IP address is only used, hashed, for a rate limit, for up to 2 hours. Your email only if you ask for the report or monitoring. See <a href=\"../privacy/\">privacy</a>.",
      also: "Want a full website scorecard?", also_a: "Get the free website scorecard →",
      stick_p: "weekly AI check", back_offers: "Get these answers every week, or have us fix it →", count_note: (n) => ` Counts the ${n} “best” and “who to call” answers.`, hook: (c) => `Each week, see whether they name you or ${c}.`, mon_bad: "Enter an email like you@yourbusiness.com.",
      subbed: "You're subscribed. Your first weekly report arrives within 7 days; reply to any report to cancel.",
      langbtn: "العربية", fix: FIX_EN, locale: "en-GB",
    },
    ar: {
      skip: "انتقل إلى الفحص", kicker: "مجاني، يستغرق حوالي ١٥ ثانية، بدون تسجيل.",
      h1: "هل يرشّح ChatGPT نشاطك التجاري؟",
      lede: "نسأل مساعدي الذكاء الاصطناعي ما يسأله زبائنك، مثل «أفضل طبيب أسنان في بيروت»، ونريك إن كانوا يذكرونك، ومن يذكرون بدلًا منك، وما الذي يجب إصلاحه.",
      check_h: "ابدأ الفحص", l_name: "اسم النشاط", l_cat: "ماذا تعمل", l_city: "المدينة والبلد",
      ph_cat: "طبيب أسنان، فرن، تأجير سيارات…", ph_city: "بيروت، لبنان",
      l_site: "الموقع الإلكتروني (اختياري، يضيف فحص الموقع إلى الإصلاحات)", go: "افحص نشاطي",
      fine: "نسأل {M} مع تفعيل البحث في الويب. النتائج تذكر النماذج والوقت بالضبط. نحتفظ بما كتبته وبالإجابات ٢٤ ساعة؛ ويُستخدم عنوان IP مشفّرًا فقط لتحديد عدد الفحوصات لمدة ساعتين.",
      busy: "نسأل المساعدين…", busy_q: (q) => `«${q}»`,
      e_name: "اكتب اسم نشاطك.", e_cat: "اكتب ماذا تعمل، مثل طبيب أسنان أو فرن.", e_city: "أضف مدينتك، مثل بيروت، لبنان.",
      e_rate: "عدد كبير من الفحوصات من شبكتك هذه الساعة. حاول لاحقًا.", e_cfg: "الفحص قيد التشغيل. حاول بعد قليل.", e_up: "لم يردّ المساعدون في الوقت المحدد. حاول مرة أخرى.", e_net: "حدث خطأ من جهتنا. حاول مرة أخرى.",
      head_yes: (n, of) => `رُشّحت في ${n} من ${of} إجابات`, head_no: "لا يرشّحونك بعد",
      sub_yes: (name, known) => `عندما يسأل الزبائن عن نشاط مثل نشاطك، يظهر ${name} أحيانًا.` + (known ? " ويعرفون من أنت أيضًا." : " لكن عند السؤال عنك مباشرة لم يعرفوا الكثير."),
      sub_no: (name, known) => known ? `يعرف المساعدون ${name} عند السؤال عنه بالاسم، لكنهم لم يرشّحوه عندما سأل زبون عن نشاط مثله.` : `لم يرشّح أيّ من المساعدين ${name}، وعند السؤال مباشرة لم يعرفوا عنه شيئًا. هذا شائع، ويمكن إصلاحه.`,
      asked: (models, when) => `سألنا <b>${models}</b> في ${when}. لم نسأل ChatGPT نفسه؛ يعمل بالطريقة نفسها (نموذج لغوي مع بحث في الويب)، لكننا لا ننقل إلا ما سألناه فعلًا. الإجابات تتغير من يوم لآخر.`,
      web: "مع البحث في الويب", noweb: "بدون بحث في الويب", cached: " نتيجة من وقت سابق اليوم (محفوظة ٢٤ ساعة).",
      comp_h: "من يرشّحون بدلًا منك", times: (n) => `ذُكر ${n} مرات`, comp_none: "لم يُذكر أي نشاط آخر.",
      fix_h: "أهم ثلاثة إصلاحات", fix_site: (h, s) => `من فحص موقع ${h} (النتيجة ${s}/100). <a href="../audit/">التقييم الكامل ←</a>`,
      mon_h: "راقب كل أسبوع", per_month: "/شهريًا", mon_p: "كل أسبوع نسأل المساعدين من جديد ونرسل لك الإجابات بالبريد، مع تنبيه في الأسبوع الذي تظهر فيه أو تختفي. يمكنك الإلغاء في أي وقت.",
      mon_cta: "ابدأ المراقبة", mon_mail: "إلى أين نرسل التقرير الأسبوعي؟", mon_note: "روابط الدفع غير مفعّلة بعد: سنرسل لك رابط Stripe آمنًا بـ ‎$19 شهريًا خلال يوم، ويبدأ أول تقرير أسبوعي عند الدفع.",
      mon_send: "أرسلوا لي الرابط", mon_ok: "تم. يصلك رابط Stripe بالبريد خلال يوم. لا يُخصم شيء قبل أن تدفع.",
      fixit_h: "نصلحها لك", once: "مرة واحدة", fixit_p: "ننفّذ الإصلاحات: ملف Google Business، الإدراج في الأدلة، البيانات المنظّمة وصفحات يقرؤها الذكاء الاصطناعي، ثم نعيد هذا الفحص. لا وعود بالترتيب.", fixit_cta: "اطلب الإعداد",
      ans_h: "الإجابات كما هي", q_best: "الأفضل في مدينتك", q_call: "بمن أتصل", q_know: "ماذا يعرفون عنك",
      named: "ذكرك", not_named: "لم يذكرك", knows: "يعرفك", unknown: "لا يعرفك", failed: "لا إجابة (انتهى الوقت)",
      mail_h: "أرسلوا لي هذا التقرير", l_mail: "البريد الإلكتروني", consent: "أرسلوا لي هذا التقرير ورسالة متابعة واحدة بخصوص الإصلاح. تحتفظ Taktek ببريدي حتى ١٨٠ يومًا، ويمكنني طلب الحذف في أي وقت.",
      send: "أرسلوا لي التقرير", lead_ok: "تم. يصلك التقرير خلال ٢٤ ساعة.", l_bad: "أدخل بريدك الإلكتروني وفعّل الخانة.",
      fb_h: "هل كانت النتيجة صحيحة؟", fb_l: "ملاحظات", fb_ph: "أخبرنا إن بدت إجابة خاطئة، أو ماذا تريد بعد ذلك.", fb_send: "أرسل الملاحظة", fb_ok: "شكرًا. نقرأ كل رسالة.",
      again: "افحص نشاطًا آخر", faq_h: "أسئلة",
      q1: "هل يسأل هذا الفحص ChatGPT؟", a1: "لا. يسأل {M}، مع البحث في الويب، الأسئلة نفسها التي يطرحها الزبون، وتذكر النتائج النماذج والوقت بالضبط. يعمل ChatGPT بالطريقة نفسها (نموذج لغوي مع بحث في الويب)، لذا هما مقياس عادل، لكننا لا ننقل إلا ما سألناه فعلًا.",
      q2: "ما الأسئلة التي يطرحها؟", a2: "«ما أفضل &lt;المجال&gt; في &lt;المدينة&gt;؟» و«بمن أتصل لـ &lt;المجال&gt; في &lt;المدينة&gt;؟» و«ماذا تعرف عن &lt;نشاطك&gt; في &lt;المدينة&gt;؟»",
      q3: "كيف أجعل مساعدي الذكاء الاصطناعي يرشّحونني؟", a3: "المساعدون الذين يبحثون في الويب يكرّرون ما يقوله الويب عنك: ملف Google Business مكتمل بتقييمات حديثة، إدراج متّسق في الأدلة المحلية، وموقع يذكر اسمك وخدماتك ومنطقتك ووسائل التواصل كنص عادي مع بيانات LocalBusiness المنظّمة. يختار الفحص أهم ثلاثة إصلاحات لك.",
      q4: "هل هو مجاني؟ وكم تكلّف المراقبة؟", a4: "الفحص مجاني بلا تسجيل. المراقبة الأسبوعية ‎$19 شهريًا. وإن أردت أن ننفّذ الإصلاحات، فإعداد الظهور ‎$400 مرة واحدة. لا وعود بالترتيب: لا أحد يستطيع أن يعد بما سيقوله الذكاء الاصطناعي.",
      q5: "ماذا تحفظون؟", a5: "ما تكتبه والإجابات، ٢٤ ساعة ليكون الفحص المتكرر فوريًا. عنوان IP يُستخدم مشفّرًا فقط لتحديد عدد الفحوصات، لمدة أقصاها ساعتان. وبريدك فقط إن طلبت التقرير أو المراقبة. راجع <a href=\"../privacy/\">الخصوصية</a>.",
      also: "تريد تقييمًا كاملًا لموقعك؟", also_a: "احصل على تقييم موقعك المجاني ←",
      stick_p: "فحص أسبوعي", back_offers: "احصل على هذه الإجابات كل أسبوع، أو دعنا نصلحها ←", count_note: (n) => ` يُحتسب ${n} إجابات عن «الأفضل» و«بمن أتصل».`, hook: (c) => `كل أسبوع، اعرف إن كانوا يذكرونك أم ${c}.`, mon_bad: "أدخل بريدًا مثل you@yourbusiness.com.",
      subbed: "تم الاشتراك. يصلك أول تقرير أسبوعي خلال ٧ أيام؛ ردّ على أي تقرير للإلغاء.",
      langbtn: "English", fix: FIX_AR, locale: "ar-u-nu-arab",
    },
  };

  let lang = params.get("lang") === "ar" ? "ar" : "en";
  let liveModels = null; // from GET /api/ai-check: only name models the Worker really asks
  let last = null; // last result
  const t = (k) => T[lang][k];

  function applyLang() {
    const d = T[lang];
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    const M = liveModels && liveModels.length ? liveModels.map((m) => m.label).join(lang === "ar" ? " و" : " and ") : (lang === "ar" ? "Google Gemini وAnthropic Claude" : "Google Gemini and Anthropic Claude");
    document.querySelectorAll("[data-t]").forEach((el) => { const v = d[el.dataset.t]; if (typeof v === "string") el.innerHTML = v.replace("{M}", M); });
    document.querySelectorAll("[data-ph]").forEach((el) => { el.placeholder = d[el.dataset.ph]; });
    const lb = $("lang"); lb.textContent = d.langbtn; lb.lang = lang === "ar" ? "en" : "ar";
    if (params.get("subscribed")) { $("subbed").textContent = d.subbed; $("subbed").hidden = false; }
    if (last) render(last);
  }
  $("lang").addEventListener("click", () => {
    lang = lang === "ar" ? "en" : "ar";
    const u = new URL(location.href); if (lang === "ar") u.searchParams.set("lang", "ar"); else u.searchParams.delete("lang");
    history.replaceState(null, "", u);
    applyLang();
  if (params.get("subscribed")) track("monitor_subscribed", {});
  });

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const num = (n) => new Intl.NumberFormat(t("locale")).format(n);
  const form = $("form"), go = $("go");
  const fields = { name: $("f_name"), category: $("f_cat"), city: $("f_city"), website: $("f_site") };
  for (const k of ["name", "city", "category", "website"]) { const v = params.get(k); if (v) fields[k].value = v.slice(0, 200); }

  function showErr(msg, field) {
    const e = $("err"); e.textContent = msg; e.hidden = !msg;
    Object.values(fields).forEach((f) => f.removeAttribute("aria-invalid"));
    if (field) { field.setAttribute("aria-invalid", "true"); field.setAttribute("aria-describedby", "err"); field.focus(); }
  }

  async function check() {
    const q = { name: fields.name.value.trim(), category: fields.category.value.trim(), city: fields.city.value.trim(), website: fields.website.value.trim() };
    if (q.name.length < 2) return showErr(t("e_name"), fields.name);
    if (q.category.length < 2) return showErr(t("e_cat"), fields.category);
    if (q.city.length < 2) return showErr(t("e_city"), fields.city);
    showErr("");
    track("ai_check_start", { src: params.get("src") || "direct", has_site: !!q.website });
    go.disabled = true;
    $("result").hidden = true;
    const bl = $("busylist"); bl.innerHTML = "";
    [`What are the best ${q.category} in ${q.city}?`, `Who should I call for ${q.category} in ${q.city}?`, `What do you know about ${q.name} in ${q.city}?`]
      .forEach((x) => { const li = document.createElement("li"); li.textContent = t("busy_q")(x); li.dir = "auto"; bl.appendChild(li); });
    $("busy").hidden = false;
    let r, status = 0;
    try {
      const ac = new AbortController(); const to = setTimeout(() => ac.abort(), 30000);
      const res = await fetch(API + "/api/ai-check", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...q, lang, hp: form.hp.value }), signal: ac.signal });
      clearTimeout(to); status = res.status; r = await res.json();
    } catch (_) { r = { error: "net" }; }
    $("busy").hidden = true; go.disabled = false;
    if (!r || r.error || !r.ok) {
      const code = r && r.error;
      track("ai_check_error", { error: String(code || status) });
      return showErr(code === "rate_limited" ? t("e_rate") : code === "not_configured" ? t("e_cfg") : code === "upstream" ? t("e_up") : code === "bad_input" ? t("e_city") : t("e_net"));
    }
    last = r;
    track("ai_check_result", { mentioned: r.summary.recommended > 0, recommended: r.summary.recommended, asked: r.summary.asked, known: r.summary.known, cached: !!r.cached });
    render(r);
    $("result").hidden = false;
    $("r_head").focus({ preventScroll: true });
    upd();
    $("result").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }
  form.addEventListener("submit", (e) => { e.preventDefault(); check(); });

  function highlight(text, name) {
    const safe = esc(text).replace(/\*\*([^*]+)\*\*/g, "$1").replace(/^#+\s*/gm, "");
    if (name.length < 2) return safe;
    try { return safe.replace(new RegExp("(" + esc(name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi"), "<mark>$1</mark>"); } catch (_) { return safe; }
  }

  function render(r) {
    const d = T[lang], s = r.summary, name = r.query.name;
    const meter = $("meter"); meter.innerHTML = "";
    for (let i = 0; i < s.asked; i++) { const dot = document.createElement("i"); if (i < s.recommended) dot.className = "on"; meter.appendChild(dot); }
    meter.style.gridTemplateColumns = `repeat(${Math.min(2, s.asked) || 1}, 1fr)`;
    $("r_head").textContent = s.recommended ? d.head_yes(num(s.recommended), num(s.asked)) : d.head_no;
    $("r_sub").textContent = (s.recommended ? d.sub_yes(name, s.known) : d.sub_no(name, s.known)) + d.count_note(num(s.asked));
    const top = r.competitors[0]; $("mon_hook").hidden = !top; if (top) $("mon_hook").textContent = d.hook(top.name);
    const when = new Intl.DateTimeFormat(d.locale, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(r.checkedAt)) + " UTC";
    const models = r.models.map((m) => `<bdi dir="ltr">${esc(m.label)}</bdi> (<bdi dir="ltr">${esc(m.model)}</bdi>، ${m.web ? d.web : d.noweb})`.replace("، ", lang === "ar" ? "، " : ", ")).join(lang === "ar" ? " و" : " and ");
    $("r_asked").innerHTML = d.asked(models, esc(when)) + (r.cached ? d.cached : "");

    const comps = $("r_comps"); comps.innerHTML = "";
    if (r.competitors.length) r.competitors.forEach((c) => { const li = document.createElement("li"); li.innerHTML = `<bdi>${esc(c.name)}</bdi> <small>${esc(d.times(num(c.n)))}</small>`; comps.appendChild(li); });
    else comps.innerHTML = `<li class="none">${esc(d.comp_none)}</li>`;

    const fx = $("r_fixes"); fx.innerHTML = "";
    r.fixes.forEach((id) => {
      const f = d.fix[id]; if (!f) return;
      const li = document.createElement("li");
      const fromSite = r.audit && r.audit.fixes && r.audit.fixes.includes(id) && !["website", "gbp", "directories", "reviews", "facts"].includes(id);
      li.innerHTML = `<h4>${esc(f[0])}</h4><p>${esc(f[1])}${fromSite ? "<br>" + d.fix_site(esc(r.audit.host), num(r.audit.score)) : ""}</p>`;
      fx.appendChild(li);
    });

    const qs = { best: d.q_best, call: d.q_call, know: d.q_know };
    const box = $("r_answers"); box.innerHTML = "";
    r.questions.forEach((q) => {
      const div = document.createElement("div"); div.className = "q";
      div.innerHTML = `<h4>${esc(qs[q.id])}: <bdi dir="ltr">“${esc(q.text)}”</bdi></h4>`;
      r.answers.filter((a) => a.q === q.id).forEach((a) => {
        const m = r.models.find((x) => x.id === a.model) || { label: a.model };
        const det = document.createElement("details"); det.className = "ans";
        const tag = a.error ? `<span class="tag err">${esc(d.failed)}</span>` : q.id === "know" ? `<span class="tag ${a.mentioned ? "yes" : ""}">${esc(a.mentioned ? d.knows : d.unknown)}</span>` : `<span class="tag ${a.mentioned ? "yes" : ""}">${esc(a.mentioned ? d.named : d.not_named)}</span>`;
        det.innerHTML = `<summary><bdi dir="ltr">${esc(m.label)}</bdi>${tag}</summary>` + (a.error ? "" : `<blockquote dir="auto">${highlight(a.text, name)}</blockquote>`);
        div.appendChild(det);
      });
      box.appendChild(div);
    });
    $("fix_btn").href = `../work/?package=visibility&business=${encodeURIComponent(name)}&where=${encodeURIComponent(r.query.website || r.query.city)}#audit`;
  }

  // Offers
  const post = (body) => fetch(API + "/api/lead", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const base = () => ({ name: last?.query.name, city: last?.query.city, category: last?.query.category, site: last?.query.website || "", key: last?.key || "", lang });
  $("mon_btn").addEventListener("click", async () => {
    track("monitor_click", { recommended: last?.summary.recommended ?? null, mode: window.AI_MONITOR_LINK ? "stripe" : "request" });
    if (window.AI_MONITOR_LINK) {
      try { await Promise.race([post({ source: "ai_monitor", ...base() }), new Promise((r) => setTimeout(r, 1200))]); } catch (_) {}
      const u = new URL(window.AI_MONITOR_LINK); if (last?.key) u.searchParams.set("client_reference_id", last.key);
      location.href = u.toString(); return;
    }
    $("mon_btn").hidden = true; $("mon_form").hidden = false; $("stick").hidden = true; $("mon_mail").focus();
  });
  $("mon_form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const em = $("mon_mail").value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(em)) { $("mon_mail").setAttribute("aria-invalid", "true"); $("mon_err").textContent = t("mon_bad"); $("mon_err").hidden = false; $("mon_mail").focus(); return; }
    $("mon_mail").removeAttribute("aria-invalid"); $("mon_err").hidden = true;
    const btn = e.submitter || $("mon_form").querySelector("button"); btn.disabled = true;
    try {
      await post({ source: "ai_monitor", ...base() });
      const r = await post({ source: "ai", ...base(), email: em, consent: true, recommended: last?.summary.recommended || 0, plan: "monitor_19" });
      if (!r.ok) throw 0;
      $("mon_ok").textContent = t("mon_ok"); $("mon_ok").hidden = false; $("mon_mail").disabled = true;
      track("email_capture", { form: "monitor" });
    } catch (_) { btn.disabled = false; $("mon_ok").textContent = t("e_net"); $("mon_ok").hidden = false; }
  });
  $("fix_btn").addEventListener("click", () => track("fix_click", { recommended: last?.summary.recommended ?? null }));

  $("lead").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target, em = f.email.value.trim(), err = $("lead_err");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(em) || !f.consent.checked) { err.textContent = t("l_bad"); err.hidden = false; const bad = !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(em) ? f.email : f.consent; bad.setAttribute("aria-invalid", "true"); bad.focus(); return; }
    f.email.removeAttribute("aria-invalid"); f.consent.removeAttribute("aria-invalid");
    err.hidden = true; const btn = f.querySelector("button"); btn.disabled = true;
    try {
      const r = await post({ source: "ai", ...base(), email: em, consent: true, recommended: last?.summary.recommended || 0 });
      if (!r.ok) throw 0;
      $("lead_ok").textContent = t("lead_ok"); $("lead_ok").hidden = false; f.email.disabled = true;
      track("email_capture", { form: "report" });
    } catch (_) { btn.disabled = false; err.textContent = t("e_net"); err.hidden = false; }
  });
  $("fb").addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = $("fb_text").value.trim(); if (!text) { $("fb_text").focus(); return; }
    const btn = e.target.querySelector("button"); btn.disabled = true;
    try { await post({ source: "ai_feedback", ...base(), text }); } catch (_) {}
    $("fb_ok").textContent = t("fb_ok"); $("fb_ok").hidden = false; $("fb_text").disabled = true;
    track("feedback_sent", { recommended: last?.summary.recommended ?? null });
  });
  $("again").addEventListener("click", () => { $("result").hidden = true; $("stick").hidden = true; last = null; fields.name.value = ""; fields.website.value = ""; fields.name.focus(); window.scrollTo({ top: $("check").offsetTop - 20 }); });

  // Mobile: a sticky "Start monitoring" bar while the result is open and the offer card is off screen.
  const stick = $("stick");
  const upd = () => {
    if ($("result").hidden || !$("mon_form").hidden) { stick.hidden = true; return; }
    const r = $("offers").getBoundingClientRect();
    stick.hidden = r.top < innerHeight && r.bottom > 0; // hide while the offer card itself is on screen
  };
  addEventListener("scroll", upd, { passive: true }); addEventListener("resize", upd);
  $("stick_btn").addEventListener("click", () => { track("monitor_click_sticky", {}); stick.hidden = true; $("offers").scrollIntoView({ block: "start" }); $("mon_btn").click(); });
  applyLang();
  if (API) fetch(API + "/api/ai-check").then((r) => r.json()).then((j) => { if (j.models && j.models.length) { liveModels = j.models; applyLang(); } }).catch(() => {});
  // Coming from a Lebanese Businesses listing with everything prefilled: run it straight away (results are cached 24 h).
  if (!isBot && params.get("src") && fields.name.value && fields.city.value && fields.category.value) check();

})();
