// Checkout form: checks the details, then hands them to the payment provider once one is connected.
(function () {
  var form = document.getElementById('buyForm');
  if (!form) return;
  var msg = document.getElementById('payMsg');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var el = form.elements, name = el.name.value.trim(), email = el.email.value.trim(), ok = name && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && el.agree.checked;
    if (!ok) { msg.dataset.m = 'miss'; return; }
    // PAYMENT: when a provider is chosen, define window.etPay(plan, details) (or replace #paySlot with its button)
    if (typeof window.etPay === 'function') { msg.dataset.m = ''; window.etPay(form.dataset.plan, { name: name, email: email, news: el.news.checked }); }
    else msg.dataset.m = 'soon';
  });
  form.addEventListener('input', function () { if (msg.dataset.m === 'miss') msg.dataset.m = ''; });
})();
