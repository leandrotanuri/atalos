(function () {
  "use strict";
  var WA = "551732271269";
  // Fora de atalos.com.br (prévia) o formulário não envia de verdade.
  var PREVIA = !/(^|\.)atalos\.com\.br$/.test(location.hostname);
  var waLink = function (m) { return "https://wa.me/" + WA + "?text=" + encodeURIComponent(m); };

  // Links de WhatsApp com mensagem pronta
  document.querySelectorAll("[data-wa]").forEach(function (a) {
    a.href = waLink(a.getAttribute("data-wa")); a.target = "_blank"; a.rel = "noopener";
    a.addEventListener("click", function () { track("whatsapp_click", { origem: a.getAttribute("data-wa").slice(0, 60) }); });
  });

  // Menu
  var burger = document.querySelector(".burger"), menu = document.getElementById("menu");
  if (burger && menu) {
    burger.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("menu-open", open);
    });
  }
  document.querySelectorAll(".dd-t").forEach(function (t) {
    t.addEventListener("click", function (e) {
      if (window.matchMedia("(max-width: 960px)").matches) { e.preventDefault(); t.parentNode.classList.toggle("show"); }
    });
  });

  // Áreas e serviços, iguais aos do site original
  var AREAS = {
    "CrediAtalos": ["CrediAtalos"],
    "Certificação Digital": ["Certificação Digital - Pessoa Jurídica", "Certificação Digital - Pessoa Física"],
    "Gestão Ambiental": ["CETESB", "IBAMA", "Polícia Federal", "Projetos Ambientais", "MAPA - Registro de Estabelecimento"],
    "Gestão Empresarial": ["Credenciamento FINAME-BNDES"],
    "Gestão de Projetos": ["Alvará do Corpo de Bombeiros", "Certidão de Acessibilidade", "LTA - Vigilância Sanitária", "Outorgas DAEE", "Regularização de Imóveis"]
  };
  var form = document.getElementById("orcamento");
  var area = document.getElementById("f-area"), item = document.getElementById("f-item");
  function fillItems(pre) {
    if (!item) return;
    item.innerHTML = "";
    var list = AREAS[area.value];
    if (!list) { item.add(new Option("Escolha a área", "")); item.disabled = true; return; }
    item.add(new Option("Selecione…", ""));
    list.forEach(function (i) { item.add(new Option(i, i)); });
    item.disabled = false;
    if (pre) item.value = pre; else if (list.length === 1) item.value = list[0];
  }
  if (area) {
    Object.keys(AREAS).forEach(function (a) { area.add(new Option(a, a)); });
    area.addEventListener("change", function () { fillItems(); });
    if (form && form.dataset.area) { area.value = form.dataset.area; fillItems(form.dataset.item); }
  }

  // Botões que levam ao formulário (e já escolhem a área)
  document.querySelectorAll("[data-go]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      if (!form) return;
      e.preventDefault();
      if (a.dataset.area && area) { area.value = a.dataset.area; fillItems(a.dataset.item); }
      form.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(function () { var f = document.getElementById("f-nome") || area; if (f) f.focus({ preventScroll: true }); }, 500);
    });
  });

  // Máscara de telefone
  document.querySelectorAll('input[type="tel"]').forEach(function (tel) {
    tel.addEventListener("input", function () {
      var d = tel.value.replace(/\D/g, "").slice(0, 11);
      tel.value = d.length > 6 ? "(" + d.slice(0, 2) + ") " + d.slice(2, d.length - 4) + "-" + d.slice(-4)
        : d.length > 2 ? "(" + d.slice(0, 2) + ") " + d.slice(2) : d;
    });
  });

  function mark(el, ok, msg) {
    el.style.borderColor = ok ? "" : "#b42318";
    if (!ok) { var p = document.createElement("p"); p.className = "err"; p.textContent = msg; el.after(p); }
    return ok;
  }

  // Formulário de orçamento (campos do site original -> enviar-orcamento.php)
  if (form) {
    form.addEventListener("submit", function (e) {
      form.querySelectorAll(".err").forEach(function (x) { x.remove(); });
      var tel = form.querySelector('[name="txt_telefone"]');
      var checks = [
        [area, !!area.value, "Escolha a área de atuação"],
        [item, !!item.value, "Escolha o serviço"],
        [form.txt_nome_real, form.txt_nome_real.value.trim().length > 1, "Informe seu nome"],
        [tel, tel.value.replace(/\D/g, "").length >= 10, "Informe um telefone com DDD"],
        [form.txt_email, /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.txt_email.value.trim()), "Informe um e-mail válido"],
        [form.txt_mensagem, form.txt_mensagem.value.trim().length > 3, "Escreva uma mensagem curta"]
      ];
      var first = null;
      checks.forEach(function (c) { if (!mark(c[0], c[1], c[2]) && !first) first = c[0]; });
      if (first) { e.preventDefault(); first.focus(); return; }
      track("lead", { servico: item.value });
      if (PREVIA) {
        e.preventDefault();
        form.querySelector("button").disabled = true;
        document.getElementById("ok").hidden = false;
      }
    });
  }

  // Formulário curto da home (abre o WhatsApp)
  var lead = document.getElementById("lead");
  if (lead) {
    lead.addEventListener("submit", function (e) {
      e.preventDefault();
      lead.querySelectorAll(".err").forEach(function (x) { x.remove(); });
      var n = lead.nome, t = lead.tel, s = lead.svc, ok = true;
      ok = mark(n, n.value.trim().length > 1, "Informe seu nome") && ok;
      ok = mark(t, t.value.replace(/\D/g, "").length >= 10, "Informe um WhatsApp com DDD") && ok;
      ok = mark(s, !!s.value, "Escolha o serviço") && ok;
      if (!ok) return;
      track("lead", { servico: s.value });
      window.open(waLink("Olá! Meu nome é " + n.value.trim() + ". Preciso de: " + s.value + ". Meu WhatsApp: " + t.value.trim()), "_blank");
    });
  }

  // Medição: envia eventos ao Google Tag Manager quando ele estiver instalado
  function track(ev, data) {
    window.dataLayer = window.dataLayer || [];
    var o = { event: ev }; for (var k in data) o[k] = data[k];
    window.dataLayer.push(o);
  }

  var y = document.getElementById("y"); if (y) y.textContent = new Date().getFullYear();

  // Animação ao rolar
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
  }
})();
