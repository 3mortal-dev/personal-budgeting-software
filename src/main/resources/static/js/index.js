
    document.addEventListener('DOMContentLoaded', () => {

      const heroImage = document.getElementById('heroImage');
      const scrollMsg = document.getElementById('scrollMessage');
      const closeBtn  = document.getElementById('closeMsg');
      let dismissed   = false;
      let shown       = false;

      function showMsg() {
        if (dismissed || shown) return;
        shown = true;
        scrollMsg.classList.add('is-visible');
        scrollMsg._timer = setTimeout(hideMsg, 9000);
      }

      function hideMsg() {
        shown = false;
        scrollMsg.classList.remove('is-visible');
        clearTimeout(scrollMsg._timer);
      }

      closeBtn.addEventListener('click', e => {
        e.preventDefault();
        dismissed = true;
        hideMsg();
      });

      // Trigger on scroll
      let triggered = false;
      window.addEventListener('scroll', () => {
        if (triggered || dismissed) return;
        if (window.scrollY > window.innerHeight * 0.10) {
          triggered = true;
          showMsg();
        }
      }, { passive: true });

      // Trigger via IntersectionObserver
      const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting && e.intersectionRatio >= 0.35 && !dismissed) showMsg();
        });
      }, { threshold: [0.35] });
      if (heroImage) obs.observe(heroImage);

      // Parallax
      window.addEventListener('scroll', () => {
        if (!heroImage) return;
        heroImage.style.backgroundPositionY = `calc(50% + ${window.scrollY * 0.22}px)`;
      }, { passive: true });

      // Animate feature items
      const items = document.querySelectorAll('.feature-item');
      const fObs  = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const i = [...items].indexOf(entry.target);
            setTimeout(() => entry.target.classList.add('in-view'), i * 90);
            fObs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      items.forEach(item => fObs.observe(item));

    });
