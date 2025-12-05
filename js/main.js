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
    const successActions = document.getElementById('coverage-success-actions');
    const bookingSection = document.getElementById('book'); // present on index.html

    // If coverage section not on this page, bail
    if (!input || !button || !result || !successActions) return;

    function resetResult() {
      result.textContent = '';
      result.className = 'coverage-result';
      successActions.style.display = 'none';
      successActions.innerHTML = '';
    }

    function doCheck() {
      const raw = (input.value || '').toUpperCase().trim();

      if (!raw) {
        result.textContent = 'Please enter a postcode to check.';
        result.className = 'coverage-result negative';
        successActions.style.display = 'none';
        successActions.innerHTML = '';
        return;
      }

      result.textContent = 'Checking coverage…';
      result.className = 'coverage-result loading';
      successActions.style.display = 'none';
      successActions.innerHTML = '';

      setTimeout(() => {
        // Remove spaces, take first 1–2 letters
        const cleaned = raw.replace(/\s+/g, '');
        const match = cleaned.match(/^[A-Z]{1,2}/);
        const area = match ? match[0] : '';
        const coveredAreas = ['NE', 'SR', 'DH', 'DL', 'TS', 'CA'];

        // Reset base class
        result.className = 'coverage-result';

        if (coveredAreas.includes(area)) {
          // POSITIVE RESULT
          result.textContent = 'Great! – We cover this postcode area.';
          result.classList.add('positive');
        } else {
          // NEGATIVE RESULT – your orange message
          result.textContent =
            'Unfortunately, we don’t currently cover this area. However, we may still be able to help. Please send us your details and we’ll confirm whether we can arrange coverage for this postcode.';
          result.classList.add('maybe'); // style this as orange in CSS
        }

        // In both cases, show a Book a report button
        if (bookingSection) {
          // On index.html – scroll to booking form
          successActions.innerHTML = `
            <button
              type="button"
              class="btn btn-primary"
              onclick="document.getElementById('book').scrollIntoView({ behavior: 'smooth' });"
            >
              Book a report
            </button>
          `;
        } else {
          // On coverage.html – go to book page
          successActions.innerHTML = `
            <a href="book.html" class="btn btn-primary">
              Book a report
            </a>
          `;
        }

        successActions.style.display = 'block';
      }, 300);
    }

    button.addEventListener('click', doCheck);

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        doCheck();
      } else {
        // Clear message as they change the text
        resetResult();
      }
    });
  })();

  // Footer year
  const yearSpan = document.getElementById('year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear().toString();
  }
});
