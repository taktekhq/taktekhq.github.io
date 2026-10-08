import assert from 'node:assert/strict';
import { reply, initState, detectLang, parseTime, parseDay, parseISO } from '../src/engine.js';

const TODAY = '2026-10-12'; // a Monday
let fails = 0;
const t = (name, fn) => { try { fn(); console.log('ok  ', name); } catch (e) { fails++; console.log('FAIL', name, '\n    ', e.message); } };
const chat = (biz, msgs) => {
  let state = initState(biz); const bookings = []; const log = [];
  for (const m of msgs) {
    const r = reply({ text: m, state, bookings, today: TODAY });
    state = r.state; log.push(r);
    if (r.event?.type === 'book') bookings.push(r.event);
    if (r.event?.type === 'move') Object.assign(bookings.find((b) => b.id === r.event.id), r.event);
    if (r.event?.type === 'cancel') bookings.splice(0, 1);
  }
  return { log, bookings, last: log[log.length - 1] };
};

t('lang detection', () => {
  assert.equal(detectLang('what are your hours'), 'en');
  assert.equal(detectLang('bonjour, vous êtes ouverts demain ?'), 'fr');
  assert.equal(detectLang('مرحبا بدي موعد'), 'ar');
  assert.equal(detectLang('kifak, shu el prices?'), 'ar');
});
t('time parsing', () => {
  assert.equal(parseTime('tomorrow at 3pm'), 15);
  assert.equal(parseTime('15:00'), 15);
  assert.equal(parseTime('demain à 15h'), 15);
  assert.equal(parseTime('بكرا الساعة ٣'), 15);
  assert.equal(parseTime('at 10 am'), 10);
  assert.equal(parseTime('hello'), null);
});
t('day parsing', () => {
  const today = parseISO(TODAY);
  assert.equal(parseDay('tomorrow', today).getDate(), 13);
  assert.equal(parseDay('Thursday please', today).getDate(), 15);
  assert.equal(parseDay('jeudi', today).getDate(), 15);
  assert.equal(parseDay('الخميس', today).getDate(), 15);
  assert.equal(parseDay('bokra', today).getDate(), 13);
});
t('hours / prices / location in 3 languages', () => {
  assert.match(chat('clinic', ['what are your opening hours?']).last.text, /09:00–18:00/);
  assert.match(chat('clinic', ['كم سعر تبييض الأسنان']).last.text, /\$120/);
  assert.match(chat('clinic', ['quels sont vos tarifs ?']).last.text, /Détartrage/);
  assert.match(chat('salon', ['where are you located']).last.text, /Gemmayzeh/);
  assert.match(chat('salon', ['wein el salon?']).last.text, /الجميزة/);
});
t('full booking', () => {
  const c = chat('clinic', ['I want to book a dental cleaning', 'Wednesday at 11am', 'yes']);
  assert.equal(c.bookings.length, 1);
  assert.equal(c.bookings[0].date, '2026-10-14'); assert.equal(c.bookings[0].time, 11); assert.equal(c.bookings[0].service, 'cleaning');
  assert.ok(c.last.reminder);
});
t('busy slot offers alternatives', () => {
  const c = chat('clinic', ['book a consultation tomorrow at 11']); // Tuesday 11 is busy
  assert.equal(c.last.intent, 'taken'); assert.ok(c.last.chips.length > 0);
});
t('closed day (Sunday)', () => {
  assert.equal(chat('clinic', ['book a consultation on Sunday at 10']).last.intent, 'closed');
  assert.equal(chat('salon', ['book a haircut today at 10']).last.intent, 'closed'); // salon is closed on Mondays
});
t('reschedule + cancel', () => {
  const c = chat('clinic', ['book a consultation Thursday at 10', 'yes', 'I need to reschedule', 'Friday at 2pm', 'yes']);
  assert.equal(c.bookings.length, 1); assert.equal(c.bookings[0].date, '2026-10-16'); assert.equal(c.bookings[0].time, 14);
  const d = chat('clinic', ['book a consultation Thursday at 10', 'yes', 'cancel my appointment']);
  assert.equal(d.last.intent, 'cancel');
});
t('French and Arabic booking', () => {
  const f = chat('clinic', ['Bonjour, je voudrais un rendez-vous pour un détartrage jeudi à 10h', 'oui']);
  assert.equal(f.bookings.length, 1); assert.match(f.log[0].text, /Je réserve/);
  const a = chat('clinic', ['بدي احجز موعد تنظيف أسنان الخميس الساعة 10', 'نعم']);
  assert.equal(a.bookings.length, 1);
  const l = chat('salon', ['bade a7jez haircut bokra sa3a 3', 'yes']);
  assert.equal(l.log[0].intent, 'confirm');
});
t('human hand-over', () => {
  const c = chat('clinic', ['I want to talk to a real person', 'hello?']);
  assert.equal(c.log[0].intent, 'human'); assert.equal(c.last.intent, 'handed_over');
});
t('medical advice refused', () => {
  assert.equal(chat('clinic', ['I have a fever, what medicine should I take?']).last.intent, 'medical');
  assert.equal(chat('clinic', ['شو الدوا لوجع الراس']).last.intent, 'medical');
});
t('unknown falls through', () => assert.equal(chat('clinic', ['who won the match']).last.intent, 'unknown'));
if (fails) { console.log(fails, 'failed'); process.exit(1); }
