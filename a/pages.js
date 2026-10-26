// Checkout form: checks the details, then hands them to the payment provider once one is connected.
// SUMIT payment pages, one per package; each sends the buyer back to thanks.html?p=<plan> after paying.
var ET_PAY = {
  film: 'https://pay.sumit.co.il/kr8wxv/15ivkhf/15ivkhg/payment/',
  clip: 'https://pay.sumit.co.il/kr8wxv/15ivzam/15ivzan/payment/',
  bundle: 'https://pay.sumit.co.il/kr8wxv/15iw0kg/15iw0kh/payment/'
};
var ET_PLAN = { film: ['CinemaScript', 130], clip: ['ClipScript', 130], bundle: ['Cinema+Clip Script', 200] };
// Google Sheet web app (build/sheets-apps-script.gs); rows are skipped while this is empty.
var ET_SHEET = 'https://script.google.com/macros/s/AKfycbxs2PiHGnHfXBOIdooYSFRH4R5fTgykJIWWDOtribZ7Ppw-dT30nSfRHXT9yD9k2AhL/exec';

function etLog(status, plan, d, extra) {
  if (!ET_SHEET || !ET_PLAN[plan]) return;
  var row = JSON.stringify({ status: status, name: d.name, email: d.email, news: d.news, product: ET_PLAN[plan][0], price: ET_PLAN[plan][1], extra: extra || '' });
  var blob = new Blob([row], { type: 'text/plain' });
  // sendBeacon survives the jump to the payment page; fetch is the fallback
  if (!(navigator.sendBeacon && navigator.sendBeacon(ET_SHEET, blob))) fetch(ET_SHEET, { method: 'POST', body: row, mode: 'no-cors', keepalive: true });
}

window.etPay = function (plan, d) {
  if (!ET_PAY[plan]) return;
  // the thank-you page reads this back to log the paid row with the buyer's details
  try { localStorage.setItem('etBuy', JSON.stringify({ plan: plan, name: d.name, email: d.email, news: d.news })); } catch (e) {}
  etLog('עבר לתשלום', plan, d);
  // GoatCounter event: how many reached the payment page, per package
  try { window.goatcounter.count({ path: 'pay-' + plan, title: 'מעבר לתשלום', event: true }); } catch (e) {}
  location.href = ET_PAY[plan];
};
(function () {
  var form = document.getElementById('buyForm');
  if (!form) return;
  var msg = document.getElementById('payMsg');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var el = form.elements, name = el.name.value.trim(), email = el.email.value.trim(), ok = name && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && el.agree.checked;
    if (!ok) { msg.dataset.m = 'miss'; return; }
    // PAYMENT: when a provider is chosen, define window.etPay(plan, details) (or replace #paySlot with its button)
    if (typeof window.etPay === 'function') { msg.dataset.m = 'soon'; window.etPay(form.dataset.plan, { name: name, email: email, news: el.news.checked }); }
    else msg.dataset.m = 'soon';
  });
  form.addEventListener('input', function () { if (msg.dataset.m === 'miss') msg.dataset.m = ''; });
})();

// Thank-you page: log the paid row once, with whatever SUMIT added to the address.
(function () {
  if (!document.body.classList.contains('pg-thanks')) return;
  var d = null;
  try { d = JSON.parse(localStorage.getItem('etBuy')); localStorage.removeItem('etBuy'); } catch (e) {}
  if (!d) return;
  var plan = new URLSearchParams(location.search).get('p') || d.plan;
  etLog('שולם', plan, d, location.search.slice(1));
})();
