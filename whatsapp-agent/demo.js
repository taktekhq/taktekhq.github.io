// Demo page logic. Talks to the Worker when reachable (Workers AI fallback for odd questions),
// otherwise runs the same scripted engine in the browser. Nothing is stored anywhere.
import { reply, BIZ, initState, iso, parseISO, isOpen } from './engine.js';

const $ = (id) => document.getElementById(id);
const API = (window.WA_API || '').replace(/\/$/, '');
const UI = {
  en: { ph: 'Type a message…', mode: 'demo assistant', modeAi: 'demo assistant · AI', modeScript: 'demo assistant · scripted', rate: 'Too many messages for now. Wait a minute and try again.', sys: 'Demo chat. Not WhatsApp. No medical advice, nothing is stored.', day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
  ar: { ph: 'اكتب رسالة…', mode: 'مساعد تجريبي', modeAi: 'مساعد تجريبي · ذكاء اصطناعي', modeScript: 'مساعد تجريبي · نصي', rate: 'رسائل كثيرة الآن. انتظر دقيقة وحاول مجددًا.', sys: 'محادثة تجريبية. ليست واتساب. بلا نصائح طبية ولا يُخزَّن شيء.', day: ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'] },
};
let ui = document.documentElement.lang === 'ar' ? 'ar' : 'en';
let biz = 'clinic';
let state = initState(biz, ui);
let bookings = [];
let hold = null;
let busy = false;
let lastMode = null;
const today = () => iso(new Date());

function bubble(text, cls) {
  const el = document.createElement('div');
  el.className = 'b ' + cls; el.dir = 'auto'; el.textContent = text;
  $('msgs').appendChild(el); $('msgs').scrollTop = $('msgs').scrollHeight;
  return el;
}
function chips(list) {
  const c = $('chips'); c.textContent = '';
  for (const label of list || []) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.dir = 'auto'; b.textContent = label;
    b.onclick = () => send(label); c.appendChild(b);
  }
}
function renderCal() {
  const cal = $('cal'); cal.textContent = '';
  const t0 = parseISO(today()); const days = [];
  for (let i = 0; i < 7; i++) { const d = new Date(t0); d.setDate(d.getDate() + i); days.push(d); }
  const cell = (cls, txt) => { const d = document.createElement('div'); d.className = cls; if (txt !== undefined) d.textContent = txt; cal.appendChild(d); return d; };
  cell('hd', '');
  for (const d of days) { const h = cell('hd'); h.textContent = UI[ui].day[d.getDay()] + '\n' + d.getDate(); h.style.whiteSpace = 'pre'; }
  const B = BIZ[biz];
  for (let h = 9; h < 18; h++) {
    cell('hd', String(h).padStart(2, '0') + ':00');
    for (const d of days) {
      const open = isOpen(biz, d, h);
      const mine = bookings.find((b) => b.date === iso(d) && b.time === h);
      const isHold = hold && hold.date === iso(d) && hold.time === h;
      const taken = (B.busy[d.getDay()] || []).includes(h);
      cell('s' + (!open ? ' off' : mine ? ' mine' : isHold ? ' hold' : taken ? ' busy' : ''), mine ? '✓' : isHold ? '?' : '');
    }
  }
}
function showReminder(txt) {
  const r = $('reminder'); r.textContent = txt; r.classList.add('on');
}
function resetReminder() {
  const r = $('reminder'); r.classList.remove('on'); r.textContent = '';
  for (const l of ['en', 'ar']) { const s = document.createElement('span'); s.className = l; s.textContent = l === 'en' ? 'Book an appointment and the reminder your customer would get appears here.' : 'احجز موعدًا وسيظهر هنا التذكير الذي يصل زبونك.'; r.appendChild(s); }
}
function applyEvent(ev) {
  hold = null;
  if (!ev) return;
  if (ev.type === 'hold') hold = ev;
  else if (ev.type === 'book') bookings = [{ id: ev.id, service: ev.service, date: ev.date, time: ev.time }];
  else if (ev.type === 'move') bookings = bookings.map((b) => (b.id === ev.id ? { ...b, date: ev.date, time: ev.time } : b));
  else if (ev.type === 'cancel') { bookings = bookings.filter((b) => b.id !== ev.id); resetReminder(); }
}
function setMode(m) {
  lastMode = m || lastMode;
  $('mode_tag').textContent = lastMode === 'ai' ? UI[ui].modeAi : lastMode === 'script' ? UI[ui].modeScript : UI[ui].mode;
}

async function ask(text) {
  const payload = { text, state, bookings, today: today() };
  if (API) {
    try {
      const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 9000);
      const res = await fetch(API + '/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: ctl.signal });
      clearTimeout(to);
      if (res.status === 429) return { rate: true };
      if (res.ok) return await res.json();
    } catch { /* Worker not reachable: run the scripted engine here */ }
  }
  const r = reply(payload); r.source = 'script'; return r;
}

const track = (name, params) => { try { if (window.gtag) gtag('event', name, params || {}); } catch (_) {} };

async function send(text) {
  text = (text || '').trim();
  if (!text || busy) return;
  busy = true; $('text').value = ''; chips([]);
  bubble(text, 'me');
  track('demo_message_sent', { biz, lang: ui });
  const typing = bubble('···', 'bot typing');
  const r = await ask(text);
  typing.remove();
  if (r.rate) bubble(UI[ui].rate, 'sys');
  else {
    state = r.state; applyEvent(r.event);
    bubble(r.text, 'bot'); chips(r.chips);
    if (r.reminder) showReminder(r.reminder);
    setMode(r.source);
    if (r.event?.type === 'handover') { bubble({ en: 'Chat handed to a team member (demo).', ar: 'تم تحويل المحادثة إلى أحد الفريق (تجريبي).' }[ui], 'sys'); track('demo_handover', { biz, lang: ui }); }
    if (r.event?.type === 'book') track('demo_booking', { biz, lang: ui });
  }
  renderCal(); busy = false; $('text').focus({ preventScroll: true });
}

function start() {
  $('msgs').textContent = ''; bookings = []; hold = null; state = initState(biz, ui);
  const n = BIZ[biz].name;
  $('bizname').textContent = n.en; $('avatar').textContent = n.en[0];
  $('text').placeholder = UI[ui].ph;
  bubble(UI[ui].sys, 'sys');
  const r = reply({ text: ui === 'ar' ? 'مرحبا' : 'hello', state, bookings, today: today() });
  state = r.state; bubble(r.text, 'bot'); chips(r.chips);
  resetReminder(); setMode(null); renderCal();
}

function setUi(l) {
  ui = l; document.documentElement.lang = l; document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
  $('lang').textContent = l === 'ar' ? 'English' : 'العربية';
  $('text').placeholder = UI[l].ph; setMode(null); renderCal();
  const wa = $('wa'); wa.href = 'https://wa.me/96181511232?text=' + encodeURIComponent(l === 'ar' ? 'مرحبا، جرّبت تجربة مساعد واتساب وبدي تدقيق مجاني.' : 'Hi Taktek, I tried the WhatsApp agent demo and would like a free audit.');
}

$('form').addEventListener('submit', (e) => { e.preventDefault(); send($('text').value); });
$('wa').addEventListener('click', () => track('whatsapp_click', { page: location.pathname }));
$('reset').onclick = start;
$('lang').onclick = () => { setUi(ui === 'en' ? 'ar' : 'en'); start(); };
document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => {
  biz = t.dataset.biz;
  document.querySelectorAll('.tab').forEach((x) => { const on = x === t; x.classList.toggle('on', on); x.setAttribute('aria-selected', on); });
  start();
}));
if (/^#ar|[?&]lang=ar/.test(location.hash + location.search)) setUi('ar');
start();
// ?try=msg1|msg2 plays messages in order (used for screenshots and for sharing a ready-made example)
const tryQ = new URLSearchParams(location.search).get('try');
if (tryQ) (async () => { for (const m of tryQ.split('|').slice(0, 6)) { await send(m); await new Promise((r) => setTimeout(r, 200)); } })();
