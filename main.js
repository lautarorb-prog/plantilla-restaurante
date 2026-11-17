/* =========================================================
   Casa Albufera (ejemplo) — comportamiento
   JavaScript sin librerías. Cada función hace UNA cosa y va
   protegida con safe(): si una falla, el resto sigue funcionando.
   ========================================================= */
(function () {
  "use strict";

  /* ---------- CONFIGURACIÓN: cambia aquí los datos reales ---------- */
  var CONFIG = {
    whatsapp: "34600000000",   // con prefijo de país, sin + ni espacios (EJEMPLO)
    timezone: "Europe/Madrid",
    // Horario: día (0=domingo … 6=sábado) → tramos ["HH:MM","HH:MM"]
    // Debe coincidir con la tabla de horario del HTML.
    horario: {
      0: [["13:00", "16:30"]],
      1: [],
      2: [["13:00", "16:00"]],
      3: [["13:00", "16:00"]],
      4: [["13:00", "16:00"], ["20:30", "23:30"]],
      5: [["13:00", "16:00"], ["20:30", "23:30"]],
      6: [["13:00", "16:30"], ["20:30", "23:30"]]
    },
    diasCerrado: [1]           // lunes cerrado: no se puede reservar
  };
  /* ----------------------------------------------------------------- */

  var $ = function (s, scope) { return (scope || document).querySelector(s); };
  var $$ = function (s, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(s)); };

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "] falló:", e); }
  }

  /* Menú móvil (hamburguesa) */
  function initNav() {
    var nav = $("[data-nav]"), btn = $("[data-nav-toggle]");
    if (!nav || !btn) return;
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open);
    });
    $$("[data-nav-links] a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* Pestañas de la carta */
  function initTabs() {
    var tabs = $$(".tab");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) {
          var active = t === tab;
          t.classList.toggle("is-active", active);
          t.setAttribute("aria-selected", active);
          var panel = document.getElementById(t.getAttribute("aria-controls"));
          if (panel) { panel.hidden = !active; panel.classList.toggle("is-active", active); }
        });
      });
    });
  }

  /* Hora actual en Valencia (aunque el visitante esté en otro país) */
  function nowInValencia() {
    var parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: CONFIG.timezone, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false
    }).formatToParts(new Date());
    var get = function (t) { return (parts.find(function (p) { return p.type === t; }) || {}).value; };
    var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { day: days[get("weekday")], minutes: (+get("hour") % 24) * 60 + (+get("minute")) };
  }
  var toMin = function (hhmm) { var p = hhmm.split(":"); return +p[0] * 60 + +p[1]; };

  /* "Abierto ahora / Cerrado" + resalta el día de hoy */
  function initOpenNow() {
    var now = nowInValencia();
    var tramos = CONFIG.horario[now.day] || [];
    var abierto = tramos.some(function (t) { return now.minutes >= toMin(t[0]) && now.minutes < toMin(t[1]); });

    var row = $('.hours tr[data-day="' + now.day + '"]');
    if (row) row.classList.add("is-today");

    var label = $("[data-open-now]");
    if (label) {
      label.textContent = abierto ? "● Abierto ahora" : "● Cerrado ahora";
      label.className = "open-now " + (abierto ? "is-open" : "is-closed");
    }
    var dot = $("[data-open-dot]");
    if (dot && abierto) dot.classList.add("is-open");
  }

  /* Aparición suave de elementos al hacer scroll */
  function initReveals() {
    var items = $$(".reveal");
    if (!("IntersectionObserver" in window)) { items.forEach(function (el) { el.classList.add("is-in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { threshold: 0.05 });
    items.forEach(function (el) { io.observe(el); });
    // Red de seguridad: si algo falla, a los 2,5 s todo visible
    setTimeout(function () { items.forEach(function (el) { el.classList.add("is-in"); }); }, 2500);
  }

  /* Formulario de reserva → abre WhatsApp con el mensaje ya escrito */
  function initReserva() {
    var form = $("[data-reserva]");
    if (!form) return;
    var fecha = form.elements.fecha;
    var errorBox = $("[data-form-error]");

    // No permitir fechas pasadas
    var hoy = new Date();
    fecha.min = new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

    function fail(msg, field) {
      errorBox.textContent = msg;
      if (field) { field.closest(".field") && field.closest(".field").classList.add("has-error"); field.focus(); }
    }

    form.addEventListener("input", function (e) {
      var f = e.target.closest(".field");
      if (f) f.classList.remove("has-error");
      errorBox.textContent = "";
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var el = form.elements;

      if (!el.nombre.value.trim()) return fail("Escribe tu nombre.", el.nombre);
      if (!el.telefono.checkValidity() || !el.telefono.value.trim()) return fail("Revisa el teléfono (mínimo 9 números).", el.telefono);
      if (!el.fecha.value) return fail("Elige una fecha.", el.fecha);
      if (el.fecha.value < el.fecha.min) return fail("La fecha no puede ser anterior a hoy.", el.fecha);

      var dia = new Date(el.fecha.value + "T12:00:00").getDay();
      if (CONFIG.diasCerrado.indexOf(dia) !== -1) return fail("Ese día estamos cerrados. Elige otra fecha.", el.fecha);
      if (!el.hora.value) return fail("Elige una hora.", el.hora);

      var esCena = toMin(el.hora.value) >= toMin("20:00");
      var tramos = CONFIG.horario[dia] || [];
      var abreCena = tramos.some(function (t) { return toMin(t[0]) >= toMin("20:00"); });
      if (esCena && !abreCena) return fail("Ese día no abrimos por la noche. Elige una hora de comida.", el.hora);
      if (!el.privacidad.checked) return fail("Acepta el uso de tus datos para gestionar la reserva.");

      var fechaBonita = new Date(el.fecha.value + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
      var msg = [
        "Hola, quiero reservar mesa:",
        "• Nombre: " + el.nombre.value.trim(),
        "• Teléfono: " + el.telefono.value.trim(),
        "• Día: " + fechaBonita,
        "• Hora: " + el.hora.value,
        "• Personas: " + el.personas.value,
        el.notas.value.trim() ? "• Comentarios: " + el.notas.value.trim() : ""
      ].filter(Boolean).join("\n");

      window.open("https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
    });
  }

  /* Actualiza todos los enlaces de WhatsApp con el número de CONFIG */
  function initWhatsappLinks() {
    $$("[data-whatsapp]").forEach(function (a) {
      var url = new URL(a.href);
      a.href = "https://wa.me/" + CONFIG.whatsapp + url.search;
    });
  }

  function boot() {
    document.documentElement.classList.add("js");
    safe(initNav, "initNav");
    safe(initTabs, "initTabs");
    safe(initOpenNow, "initOpenNow");
    safe(initReveals, "initReveals");
    safe(initWhatsappLinks, "initWhatsappLinks");
    safe(initReserva, "initReserva");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
