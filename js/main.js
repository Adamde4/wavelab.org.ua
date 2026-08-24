(() => {
  "use strict";

  /* ---------- Hero load-in sequence ---------- */
  requestAnimationFrame(() => {
    document.body.classList.add("is-loaded");
  });

  /* ---------- Magnetic buttons ---------- */
  const magneticEls = document.querySelectorAll("[data-magnetic]");
  const maxPull = 8;
  magneticEls.forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const relX = (e.clientX - r.left) / r.width - 0.5;
      const relY = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty("--mx", `${relX * maxPull * 2}px`);
      el.style.setProperty("--my", `${relY * maxPull}px`);
    });
    el.addEventListener("mouseleave", () => {
      el.style.setProperty("--mx", `0px`);
      el.style.setProperty("--my", `0px`);
    });
  });

  /* ---------- Hero glow parallax ---------- */
  const heroSection = document.querySelector(".hero");
  const heroGlow = document.querySelector(".hero-glow");
  if (heroSection && heroGlow && window.matchMedia("(pointer: fine)").matches) {
    heroSection.addEventListener("mousemove", (e) => {
      const r = heroSection.getBoundingClientRect();
      const relX = (e.clientX - r.left) / r.width - 0.5;
      const relY = (e.clientY - r.top) / r.height - 0.5;
      heroGlow.style.setProperty("--gx", `${relX * 40}px`);
      heroGlow.style.setProperty("--gy", `${relY * 40}px`);
    });
  }

  /* ---------- Header scroll state ---------- */
  const header = document.querySelector(".site-header");
  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile nav ---------- */
  const navToggle = document.querySelector(".nav-toggle");
  const mobileNav = document.querySelector(".mobile-nav");
  const closeMobileNav = () => {
    navToggle.classList.remove("is-open");
    mobileNav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  };
  navToggle.addEventListener("click", () => {
    const isOpen = mobileNav.classList.toggle("is-open");
    navToggle.classList.toggle("is-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.style.overflow = isOpen ? "hidden" : "";
  });
  mobileNav.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMobileNav));

  /* ---------- Render: services ---------- */
  const servicesGrid = document.querySelector("[data-services]");
  if (servicesGrid && typeof SERVICES !== "undefined") {
    servicesGrid.innerHTML = SERVICES.map((s, i) => `
      <article class="service-card" data-reveal style="--i:${i}">
        <span class="service-index">${String(i + 1).padStart(2, "0")}</span>
        <h3>${s.title}</h3>
        <p>${s.text}</p>
      </article>
    `).join("");

    servicesGrid.querySelectorAll(".service-card").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    });
  }

  /* ---------- Render: portfolio ---------- */
  const portfolioGrid = document.querySelector("[data-portfolio]");
  const previewPaths = [
    "M0,120 C 60,40 140,180 220,90 S 340,20 400,110",
    "M0,60 C 80,150 160,10 240,120 S 360,160 400,80",
    "M0,140 C 70,60 150,150 220,70 S 330,40 400,130",
    "M0,90 C 90,20 170,160 250,60 S 350,140 400,90"
  ];
  if (portfolioGrid && typeof PROJECTS !== "undefined") {
    portfolioGrid.innerHTML = PROJECTS.map((p, i) => {
      const isLive = /^https?:\/\//.test(p.url);
      const linkAttrs = isLive ? `target="_blank" rel="noopener"` : "";

      const media = isLive
        ? `<iframe class="portfolio-frame" src="${p.url}" title="Живий перегляд сайту: ${p.title}" loading="lazy" tabindex="-1" aria-hidden="true" scrolling="no"></iframe>`
        : `<svg viewBox="0 0 400 220" preserveAspectRatio="none" role="img" aria-hidden="true">
            <defs>
              <linearGradient id="pg${i}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#151a23"/>
                <stop offset="100%" stop-color="#0d1117"/>
              </linearGradient>
            </defs>
            <rect width="400" height="220" fill="url(#pg${i})"/>
            <path d="${previewPaths[i % previewPaths.length]}" fill="none" stroke="#33e6c4" stroke-opacity="0.55" stroke-width="2"/>
            <path d="${previewPaths[(i + 1) % previewPaths.length]}" fill="none" stroke="#3d6bff" stroke-opacity="0.35" stroke-width="2" transform="translate(0,20)"/>
          </svg>`;

      return `
      <a class="portfolio-card" href="${p.url}" ${linkAttrs} data-reveal style="--i:${i}" aria-label="Переглянути проєкт: ${p.title}">
        <div class="portfolio-media">
          <span class="portfolio-tag">${p.tag}</span>
          ${media}
        </div>
        <div class="portfolio-body">
          <div>
            <h3>${p.title}</h3>
            <p>${p.text}</p>
          </div>
          <span class="portfolio-arrow" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H9M17 7V15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
        </div>
      </a>
    `;
    }).join("");
  }

  /* ---------- Scroll reveal ---------- */
  const revealTargets = document.querySelectorAll("[data-reveal], .signal-divider");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -40px 0px" }
  );
  revealTargets.forEach((el) => io.observe(el));

  /* ---------- Footer year ---------- */
  const yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Analytics-ready conversion hooks ----------
     Плейсхолдер для Google Analytics / Google Tag Manager.
     Підключіть GA4 (замініть G-XXXXXXXXXX у index.html) —
     події нижче почнуть відправлятися автоматично через gtag,
     якщо він доступний на сторінці. */
  const trackEvent = (name, params = {}) => {
    if (typeof window.gtag === "function") {
      window.gtag("event", name, params);
    }
  };

  document.querySelectorAll('a[href*="t.me/"]').forEach((link) => {
    link.addEventListener("click", () => {
      trackEvent("telegram_click", { link_url: link.href });
    });
  });

  document.querySelectorAll("[data-cta-primary]").forEach((link) => {
    link.addEventListener("click", () => {
      trackEvent("cta_discuss_project_click");
    });
  });
})();
