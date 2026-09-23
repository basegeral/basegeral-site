/* BaseGeral Modelagem e Corte — site behaviour (no dependencies) */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Header: solid background after scrolling ---------------- */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------------- Mobile menu ---------------- */
  var toggle = document.querySelector(".menu-toggle");
  var mobileNav = document.querySelector(".nav-mobile");
  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      var open = mobileNav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    });
    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mobileNav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
  }

  /* ---------------- Reveal sections on scroll ---------------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- Missing-image placeholders ----------------
     Real photos/videos are optional at build time. Any <img class="real-photo">
     that fails to load falls back to a clearly labelled placeholder box instead
     of a broken-image icon, so the layout looks intentional until real files
     are dropped into /assets/images/ and /assets/videos/. */
  document.querySelectorAll("img.real-photo").forEach(function (img) {
    var ph = img.closest(".img-ph");
    img.addEventListener("error", function () {
      img.classList.add("is-missing");
    }, { once: true });
    img.addEventListener("load", function () {
      if (ph) ph.classList.add("has-photo");
    }, { once: true });
    if (img.complete && img.naturalWidth > 0 && ph) ph.classList.add("has-photo");
  });

  var heroVideo = document.querySelector(".hero__media video");
  if (heroVideo) {
    heroVideo.addEventListener("error", function () {
      heroVideo.style.display = "none"; // dark gradient background remains as fallback
    }, true);
  }

  /* ---------------- Gallery lightbox ---------------- */
  var lightbox = document.querySelector(".lightbox");
  if (lightbox) {
    var stage = lightbox.querySelector(".lightbox__stage");
    var closeBtn = lightbox.querySelector(".lightbox__close");
    var lastFocus = null;

    function openLightbox(sourceItem) {
      lastFocus = document.activeElement;
      stage.innerHTML = "";
      var clone = sourceItem.querySelector(".img-ph").cloneNode(true);
      stage.appendChild(clone);
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      closeBtn.focus();
      document.body.style.overflow = "hidden";
    }
    function closeLightbox() {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    }
    document.querySelectorAll(".gal-item").forEach(function (item) {
      item.addEventListener("click", function () { openLightbox(item); });
    });
    closeBtn.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && lightbox.classList.contains("is-open")) closeLightbox();
    });
  }

  /* ---------------- Quote form ----------------
     No web backend exists yet, so requests are sent as a pre-filled email to
     basegeral.af@gmail.com via a mailto: link (opens the visitor's own email
     app). This actually delivers the request today with zero server setup.
     Limitation: mailto cannot attach the uploaded file automatically — the
     visitor is told to attach it manually before sending.
     To upgrade later to a proper in-page submission (no email client
     required), replace the block marked below with a fetch() call to a
     form/email service (e.g. Formspree, a serverless function, or your own
     endpoint) and keep the same field names. */
  var form = document.querySelector("#quote-form");
  if (form) {
    var status = form.querySelector(".form-status");
    var isEnglish = document.documentElement.lang.indexOf("en") === 0;
    var labels = isEnglish
      ? { subject: "Quote request", name: "Name", company: "Company", email: "Email", phone: "Phone", service: "Service type", material: "Material", message: "Message", file: "Attachment", fileNote: "(please attach this file manually before sending)", sending: "Opening your email app\u2026" }
      : { subject: "Pedido de orçamento", name: "Nome", company: "Empresa", email: "Email", phone: "Telefone", service: "Tipo de serviço", material: "Material", message: "Mensagem", file: "Anexo", fileNote: "(anexe este ficheiro manualmente antes de enviar)", sending: "A abrir o seu email\u2026" };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var data = new FormData(form);
      var lines = [];
      [["nome", labels.name], ["name", labels.name],
       ["empresa", labels.company], ["company", labels.company],
       ["email", labels.email],
       ["telefone", labels.phone], ["phone", labels.phone],
       ["servico", labels.service], ["service", labels.service],
       ["material", labels.material]].forEach(function (pair) {
        var v = data.get(pair[0]);
        if (v) lines.push(pair[1] + ": " + v);
      });
      var message = data.get("mensagem") || data.get("message") || "";
      lines.push("", labels.message + ":", message);

      var fileField = form.querySelector('input[type="file"]');
      if (fileField && fileField.files && fileField.files[0]) {
        lines.push("", labels.file + ": " + fileField.files[0].name + " " + labels.fileNote);
      }

      // ---- TO UPGRADE TO A DIRECT IN-PAGE SUBMISSION, REPLACE THIS BLOCK ----
      var mailto = "mailto:basegeral.af@gmail.com"
        + "?subject=" + encodeURIComponent(labels.subject + (data.get("empresa") || data.get("company") ? " \u2014 " + (data.get("empresa") || data.get("company")) : ""))
        + "&body=" + encodeURIComponent(lines.join("\n"));
      window.location.href = mailto;
      // -------------------------------------------------------------------

      status.textContent = labels.sending;
      status.className = "form-status is-visible ok";
    });
  }
})();
