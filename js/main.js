// js/main.js

document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelectorAll('.main-nav a');

  // Mobile nav toggle
  if (header && toggle) {
    toggle.addEventListener('click', () => {
      header.classList.toggle('nav-open');
    });

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        header.classList.remove('nav-open');
      });
    });
  }

  // --- Coverage bubbles toggle ---
  document.querySelectorAll('.coverage-item').forEach((item) => {
    const btn = item.querySelector('.coverage-header');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Close all items
      document.querySelectorAll('.coverage-item').forEach((other) => {
        other.classList.remove('open');
        const otherBtn = other.querySelector('.coverage-header');
        if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
      });

      // Open this one if it was closed
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // --- Postcode coverage logic ---
  (function () {
    const input = document.getElementById('coverage-postcode');
    const button = document.getElementById('coverage-check-button');
    const result = document.getElementById('coverage-result');
    const leadForm = document.getElementById('coverage-lead-form');
    const leadPostcode = document.getElementById('coverage-postcode-confirm');

    // If coverage section not on this page, bail
    if (!input || !button || !result || !leadForm || !leadPostcode) return;

    function doCheck() {
      const raw = (input.value || '').toUpperCase().trim();
      if (!raw) {
        result.textContent = 'Please enter a postcode to check.';
        result.className = 'coverage-result negative';
        leadForm.style.display = 'none';
        return;
      }

      result.textContent = 'Checking coverage…';
      result.className = 'coverage-result loading';
      leadForm.style.display = 'none';

      setTimeout(() => {
        const match = raw.match(/^[A-Z]{1,2}/);
        const area = match ? match[0] : '';
        const coveredAreas = ['NE', 'SR', 'DH', 'DL', 'TS', 'CA'];

        result.className = 'coverage-result';

        if (coveredAreas.includes(area)) {
          result.textContent =
            'Great! – We cover this postcode area! Send us your details and we’ll confirm availability.';
          result.classList.add('positive');
        } else {
          result.textContent =
            'Unfortunately, we don’t currently cover this area. However, we may still be able to help. Please send us your details and we’ll confirm whether we can arrange coverage for this postcode.';
          result.classList.add('maybe');
        }

        leadForm.style.display = 'block';
        if (leadPostcode && !leadPostcode.value) {
          leadPostcode.value = raw;
        }
      }, 350);
    }

    button.addEventListener('click', doCheck);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        doCheck();
      }
    });

    // Lead form – open mailto with details
    leadForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = (document.getElementById('coverage-name').value || '').trim();
      const email = (document.getElementById('coverage-email').value || '').trim();
      const pc = (leadPostcode.value || input.value || '').trim();

      const toAddress = 'hello@myevreport.com';

      let body =
        'Name: ' + (name || '(not provided)') +
        '%0D%0AEmail: ' + (email || '(not provided)') +
        '%0D%0APostcode: ' + (pc || '(not provided)') +
        '%0D%0A%0D%0ARequesting confirmation of coverage and availability for an EV battery health report.';

      const mailto =
        'mailto:' + toAddress +
        '?subject=' + encodeURIComponent('Postcode coverage enquiry – MyEVReport') +
        '&body=' + body;

      window.location.href = mailto;
    });
  })();

  // Footer year
  const yearSpan = document.getElementById('year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear().toString();
  }
});
