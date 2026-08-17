(function (global) {
  "use strict";

  /* Deterministic, bilingual (EN/ES) natural-language analytics parser.
     Maps a plain-language question onto the dashboard's analytics query
     object q = { metric, dimension, compare, chart, period, staff, gender,
     payment, limit, from, to }. No external services; fully offline. */

  function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim(); }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function fmtDate(dt) { return dt.getFullYear() + "-" + pad2(dt.getMonth() + 1) + "-" + pad2(dt.getDate()); }
  function addDaysStr(d, n) { var dt = new Date(d + "T00:00:00"); dt.setDate(dt.getDate() + n); return fmtDate(dt); }
  function addMonthsStr(d, n) { var dt = new Date(d + "T00:00:00"); var day = dt.getDate(); dt.setMonth(dt.getMonth() + n); if (dt.getDate() < day) dt.setDate(0); return fmtDate(dt); }
  function todayStr() { return fmtDate(new Date()); }
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function matchWord(text, phrase) {
    return new RegExp("\\b" + escRe(phrase) + "\\b").test(text);
  }
  function matchAny(text, words) { for (var i = 0; i < words.length; i++) if (matchWord(text, words[i])) return true; return false; }

  var METRIC_SYN = {
    en: {
      services_rev: ["revenue from services", "services revenue", "service revenue", "revenue of services"],
      products_rev: ["revenue from products", "products revenue", "product revenue", "revenue of products"],
      returning_rate: ["returning rate", "rebooking rate", "retention rate", "return rate"],
      avg_ticket: ["average ticket", "avg ticket", "average spend", "average sale", "ticket size", "avg. ticket"],
      returning: ["returning clients", "returning visits", "repeat clients", "repeating clients"],
      new_clients: ["new clients", "new customers"],
      avg_frequency: ["average frequency", "avg visits per client", "visits per client", "frequency of visits"],
      product_qty: ["products sold", "product quantity", "units sold"],
      commission: ["commission", "commissions"],
      revenue: ["revenue", "sales", "income", "takings", "turnover", "earnings"],
      visits: ["visits", "tickets", "attendances", "appointments done"]
    },
    es: {
      services_rev: ["ingresos por servicios", "ingresos de servicios", "facturacion por servicios"],
      products_rev: ["ingresos por productos", "ingresos de productos", "ventas de productos"],
      returning_rate: ["tasa de regreso", "tasa de rebooking", "tasa de retencion", "porcentaje de regreso"],
      avg_ticket: ["ticket promedio", "promedio de ticket", "gasto promedio", "venta promedio", "promedio por ticket"],
      returning: ["clientes que regresan", "visitas recurrentes", "recurrentes"],
      new_clients: ["clientes nuevos", "nuevos clientes"],
      avg_frequency: ["frecuencia promedio", "visitas por cliente", "frecuencia de visitas"],
      product_qty: ["productos vendidos", "cantidad de productos", "unidades vendidas"],
      commission: ["comisiones"],
      revenue: ["ingresos", "ventas", "facturacion", "recaudacion"],
      visits: ["visitas", "atenciones", "turnos realizados"]
    }
  };

  var METRIC_PRIORITY = ["services_rev", "products_rev", "returning_rate", "avg_ticket", "returning", "new_clients", "avg_frequency", "product_qty", "commission", "revenue", "visits"];

  var DIM_SYN = {
    en: {
      month: ["by month", "monthly"],
      week: ["by week", "weekly"],
      weekday: ["by weekday", "by day of the week", "day of week"],
      staff: ["by staff", "by stylist", "by employee", "per staff", "per stylist", "by team"],
      service: ["by service", "by treatment", "per service", "services", "service"],
      product: ["by product", "per product", "products", "product"],
      payment: ["by payment method", "by payment", "per payment"],
      gender: ["by gender", "per gender"],
      client: ["by client", "per client", "top clients", "top client"],
      day: ["by day", "daily"]
    },
    es: {
      month: ["por mes", "mensual"],
      week: ["por semana", "semanal"],
      weekday: ["por dia de la semana", "dia de la semana"],
      staff: ["por equipo", "por estilista", "por empleado"],
      service: ["por servicio", "por tratamiento", "servicios", "servicio"],
      product: ["por producto", "productos", "producto"],
      payment: ["por metodo de pago", "por pago"],
      gender: ["por genero"],
      client: ["por cliente", "mejores clientes", "top clientes"],
      day: ["por dia", "diario"]
    }
  };

  var CHART_SYN = {
    en: { line: ["line chart", "trend", "over time"], donut: ["donut", "pie chart", "pie"], "bars-h": ["bar chart", "bars"], heatmap: ["heatmap"] },
    es: { line: ["linea", "tendencia", "evolucion"], donut: ["donut", "torta", "circular", "pastel"], "bars-h": ["barras", "grafico de barras"], heatmap: ["mapa de calor"] }
  };

  var GENDER_WORDS = {
    en: { women: ["women", "female", "ladies"], men: ["men", "male", "gentlemen"] },
    es: { women: ["mujeres", "femenino", "damas"], men: ["hombres", "masculino", "caballeros"] }
  };

  var PAYMENT_WORDS = {
    en: { cash: ["cash", "in cash"], card: ["card", "credit card", "debit card"], mobile: ["mobile payment", "mobile"], gift_card: ["gift card"], voucher: ["voucher"] },
    es: { cash: ["efectivo", "en efectivo"], card: ["tarjeta", "tarjeta de credito", "tarjeta de debito"], mobile: ["mercado pago", "pago movil", "movil"], gift_card: ["tarjeta regalo", "gift card"], voucher: ["voucher"] }
  };

  var WEEKEND_WORDS = { en: ["weekend", "weekends", "friday", "fridays", "saturday", "saturdays"], es: ["fin de semana", "finde", "viernes", "sabado"] };

  function entityMatches(text, list, nameKeys) {
    var found = [];
    list.forEach(function (it) {
      var hit = false;
      nameKeys.forEach(function (k) {
        var nm = String(it[k] || "").toLowerCase();
        if (nm && matchWord(text, nm)) hit = true;
        var first = nm.split(" ")[0];
        if (first && first !== nm && matchWord(text, first)) hit = true;
      });
      if (hit) found.push(it);
    });
    return found;
  }

  function resolveMetric(text, lang) {
    var dict = METRIC_SYN[lang] || METRIC_SYN.en;
    for (var p = 0; p < METRIC_PRIORITY.length; p++) {
      var key = METRIC_PRIORITY[p];
      var words = dict[key].slice().sort(function (a, b) { return b.length - a.length; });
      for (var i = 0; i < words.length; i++) if (matchWord(text, words[i])) return { key: key, matched: true };
    }
    return { key: "revenue", matched: false };
  }

  function resolveDimension(text, lang) {
    var dict = DIM_SYN[lang] || DIM_SYN.en;
    var keys = Object.keys(dict);
    for (var i = 0; i < keys.length; i++) {
      var words = dict[keys[i]].slice().sort(function (a, b) { return b.length - a.length; });
      for (var j = 0; j < words.length; j++) if (matchWord(text, words[j])) return { key: keys[i], matched: true };
    }
    if (matchAny(text, WEEKEND_WORDS[lang] || WEEKEND_WORDS.en)) return { key: "weekday", matched: true };
    return { key: "", matched: false };
  }

  function resolveChart(text, lang) {
    var dict = CHART_SYN[lang] || CHART_SYN.en;
    var keys = Object.keys(dict);
    for (var i = 0; i < keys.length; i++) {
      var words = dict[keys[i]].slice().sort(function (a, b) { return b.length - a.length; });
      for (var j = 0; j < words.length; j++) if (matchWord(text, words[j])) return { key: keys[i], matched: true };
    }
    return { key: "", matched: false };
  }

  function resolvePeriod(text, refToday) {
    var ref = refToday || todayStr();
    var m = text.match(/(?:last|ultimos?|últimos?)\s*(\d+)\s*(?:months?|mes(?:es)?)/);
    if (m) return { period: "custom", from: addMonthsStr(ref, -parseInt(m[1], 10)), to: ref, matched: true };
    m = text.match(/(?:last|ultimos?|últimos?)\s*(\d+)\s*(?:days?|dias?|días?)/);
    if (m) return { period: "custom", from: addDaysStr(ref, -parseInt(m[1], 10)), to: ref, matched: true };
    if (matchAny(text, ["last week", "semana pasada", "la semana pasada"])) return { period: "custom", from: addDaysStr(ref, -7), to: addDaysStr(ref, -1), matched: true };
    if (matchAny(text, ["last month", "mes pasado", "el mes pasado"])) { var ms = ref.slice(0, 8) + "01"; return { period: "custom", from: addMonthsStr(ms, -1), to: addDaysStr(ms, -1), matched: true }; }
    if (matchAny(text, ["this week", "esta semana"])) return { period: "weekly", from: "", to: "", matched: true };
    if (matchAny(text, ["this month", "este mes"])) return { period: "monthly", from: "", to: "", matched: true };
    if (matchAny(text, ["this year", "este ano", "este año"])) return { period: "custom", from: ref.slice(0, 4) + "-01-01", to: ref, matched: true };
    if (matchAny(text, ["today", "hoy"])) return { period: "custom", from: ref, to: ref, matched: true };
    return { period: "monthly", from: "", to: "", matched: false };
  }

  function resolveFilters(text, lang, staffMatched) {
    var out = { staff: "", gender: "", payment: "", matched: false };
    if (staffMatched.length === 1) { out.staff = staffMatched[0].id; out.matched = true; }
    var gw = GENDER_WORDS[lang] || GENDER_WORDS.en;
    if (matchAny(text, gw.women)) { out.gender = "women"; out.matched = true; }
    else if (matchAny(text, gw.men)) { out.gender = "men"; out.matched = true; }
    var pw = PAYMENT_WORDS[lang] || PAYMENT_WORDS.en;
    Object.keys(pw).forEach(function (k) {
      if (matchAny(text, pw[k])) { out.payment = k; out.matched = true; }
    });
    return out;
  }

  function resolveCompare(text, lang, staffMatched) {
    if (matchAny(text, ["new vs returning", "returning vs new", "new and returning", "nuevos vs recurrentes", "recurrentes vs nuevos"])) return { key: "new_ret", matched: true };
    if (matchAny(text, ["by group", "by category", "por grupo", "por categoria"])) return { key: "group", matched: true };
    if (staffMatched.length >= 2 && matchAny(text, [" vs ", " versus ", "compared to", "compared with", "en comparacion", "comparado con"])) return { key: "staff", matched: true };
    if (staffMatched.length >= 2) return { key: "staff", matched: true };
    return { key: "", matched: false };
  }

  function resolveLimit(text) {
    var m = text.match(/(?:top|mejores|principales)\s*(\d+)/);
    if (m) return { limit: Math.max(1, Math.min(50, parseInt(m[1], 10))), matched: true };
    return { limit: 10, matched: false };
  }

  function i18n(D, lang, key) {
    return (D.i18n[lang] && D.i18n[lang][key]) || (D.i18n.en && D.i18n.en[key]) || key;
  }

  function buildSummary(D, lang, q, meta) {
    var metricLabel = i18n(D, lang, "metric_" + q.metric);
    var dimLabel = i18n(D, lang, "dim_" + q.dimension);
    var periodLabel;
    if (q.period === "custom") {
      var fromTo = D.i18n[lang] && D.i18n[lang].nl_from_to;
      periodLabel = fromTo ? fromTo.replace("{from}", q.from).replace("{to}", q.to) : (q.from + " → " + q.to);
    } else {
      periodLabel = i18n(D, lang, q.period);
    }
    var parts = [metricLabel, dimLabel, periodLabel];
    if (q.compare === "staff" && meta.staffNames && meta.staffNames.length >= 2) parts.push(meta.staffNames.join(" & "));
    if (q.staff && meta.staffNames && meta.staffNames.length) parts.push(meta.staffNames[0]);
    if (q.gender) parts.push(i18n(D, lang, q.gender === "women" ? "womens" : "mens"));
    if (q.payment) parts.push(i18n(D, lang, q.payment));
    if (q.compare === "new_ret") parts.push(i18n(D, lang, "compare_new_ret"));
    return parts.join(" · ");
  }

  function parse(text, D, lang) {
    lang = lang === "es" ? "es" : "en";
    var t = norm(text);
    if (!t) return { type: "unknown" };
    var refToday = (D.meta && D.meta.today) || todayStr();

    var staffMatched = entityMatches(t, D.staff || [], ["name"]);
    var svcMatched = entityMatches(t, Object.keys(D.services || {}).map(function (k) { return { id: k, name: D.services[k].name_en, nameEs: D.services[k].name_es }; }), lang === "es" ? ["nameEs"] : ["name"]);
    var prodMatched = entityMatches(t, Object.keys(D.products || {}).map(function (k) { return { id: k, name: D.products[k].name_en, nameEs: D.products[k].name_es }; }), lang === "es" ? ["nameEs"] : ["name"]);

    var metric = resolveMetric(t, lang);
    var dimension = resolveDimension(t, lang);
    var dimKey = dimension.key;
    if (!dimKey) {
      if (svcMatched.length) dimKey = "service";
      else if (prodMatched.length) dimKey = "product";
      else if (staffMatched.length === 1) dimKey = "day";
      else dimKey = "day";
    }
    if (dimKey === "day" && (svcMatched.length || prodMatched.length)) dimKey = svcMatched.length ? "service" : "product";

    var period = resolvePeriod(t, refToday);
    var chart = resolveChart(t, lang);
    var filters = resolveFilters(t, lang, staffMatched);
    var compare = resolveCompare(t, lang, staffMatched);
    var limit = resolveLimit(t);

    var signals = metric.matched || dimension.matched || period.matched || chart.matched || compare.matched ||
      staffMatched.length > 0 || svcMatched.length > 0 || prodMatched.length > 0 || filters.matched || limit.matched;
    if (!signals) return { type: "unknown" };

    if (compare.key === "staff") filters.staff = "";

    var q = {
      metric: metric.key,
      dimension: dimKey,
      compare: compare.key,
      chart: chart.key || "auto",
      period: period.period,
      staff: filters.staff,
      gender: filters.gender,
      payment: filters.payment,
      limit: limit.limit,
      from: period.from,
      to: period.to
    };

    var meta = { staffNames: staffMatched.map(function (s) { return s.name; }) };
    return { type: "query", q: q, summary: buildSummary(D, lang, q, meta) };
  }

  function speechSupported() {
    try {
      return !!(global.SpeechRecognition || global.webkitSpeechRecognition);
    } catch (e) { return false; }
  }

  function recognize(lang, onResult, onEnd, onError) {
    var SR = global.SpeechRecognition || global.webkitSpeechRecognition;
    if (!SR) return null;
    var rec = new SR();
    rec.lang = lang === "es" ? "es-AR" : "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = function (ev) {
      var txt = "";
      for (var i = 0; i < ev.results.length; i++) {
        var alt = ev.results[i];
        if (alt && alt[0] && alt[0].transcript) txt += alt[0].transcript;
      }
      onResult(txt.trim());
    };
    if (onEnd) rec.onend = onEnd;
    if (onError) rec.onerror = onError;
    rec.start();
    return rec;
  }

  global.NaturalQuery = { parse: parse, speechSupported: speechSupported, recognize: recognize };
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : global));
