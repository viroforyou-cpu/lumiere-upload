(function () {
  "use strict";

  var SEED = window.LUMIERE_DATA;
  var STORAGE_KEY = "lumiere_dashboard_v4";

  var lang = "en";
  var role = "owner";
  var sec = "today";
  var forceOpen = false;
  var analyticsPeriod = "daily";
  var analyticsQueries = null;
  var analyticsDraft = null;
  var lastQueryResult = null;
  var editTarget = null;
  var searchQ = "";
  var checkout = { client: "", stylist: "", assistant: "", lines: [], payments: {} };

  try { lang = localStorage.getItem("lumiere_lang") || "en"; } catch (e) {}
  try { role = localStorage.getItem("lumiere_role") || "owner"; } catch (e) {}

  var D = loadData();
  var state = { today: D.meta.today, weekStart: D.meta.weekStart, weekEnd: D.meta.weekEnd };

  var OWNER_SECTIONS = ["week", "month", "commission", "reports", "analytics", "rules"];
  var PUBLIC_SECTIONS = ["today", "appointments", "checkout", "clients", "staff", "services", "products", "sales"];

  function isObj(x) { return x && typeof x === "object" && !Array.isArray(x); }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function deepMerge(base, extra) {
    var out = clone(base);
    if (!extra) return out;
    Object.keys(extra).forEach(function (k) {
      if (extra[k] === undefined) return;
      if (isObj(out[k]) && isObj(extra[k])) out[k] = deepMerge(out[k], extra[k]);
      else if (Array.isArray(out[k]) && Array.isArray(extra[k])) out[k] = clone(extra[k]);
      else out[k] = clone(extra[k]);
    });
    return out;
  }
  function loadData() {
    var stored = null;
    try { stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch (e) {}
    return deepMerge(SEED, stored);
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(D)); } catch (e) {}
    try { localStorage.setItem("lumiere_lang", lang); } catch (e) {}
    try { localStorage.setItem("lumiere_role", role); } catch (e) {}
  }

  function canSee(s) {
    if (role === "receptionist") return PUBLIC_SECTIONS.indexOf(s) > -1;
    return true;
  }
  function canEdit() { return role === "owner" || role === "admin"; }

  function t(key) { return (D.i18n[lang] && D.i18n[lang][key]) || D.i18n.en[key] || key; }

  function fmt(n) { return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function ars(n) { return "$" + fmt(n); }
  function compact(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1e3) return Math.round(n / 1e3) + "k";
    return String(Math.round(n || 0));
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  function svcName(k) { var s = D.services[k]; return s ? (lang === "es" ? s.name_es : s.name_en) : k; }
  function prodName(k) { var p = D.products[k]; return p ? (lang === "es" ? p.name_es : p.name_en) : k; }
  function clientById(id) { return D.clients.find(function (c) { return c.id === id; }); }
  function staffById(id) { return D.staff.find(function (s) { return s.id === id; }); }

  function lineTotal(line) {
    var price = line.t === "service" ? (D.services[line.k] || {}).price_ars : (D.products[line.k] || {}).price_ars;
    return (price || 0) * line.q;
  }
  function ticketTotal(ticket) {
    return ticket.lines.reduce(function (a, l) { return a + lineTotal(l); }, 0);
  }
  function ticketServices(t) { return t.lines.filter(function (l) { return l.t === "service"; }); }
  function ticketProducts(t) { return t.lines.filter(function (l) { return l.t === "product"; }); }

  function isReturning(ticket) {
    var c = clientById(ticket.client);
    return !!(c && c.first_visit < ticket.date);
  }
  function inWeek(t) { return t.date >= state.weekStart && t.date <= state.weekEnd; }
  function inMonth(t) { return t.date.slice(0, 7) === state.today.slice(0, 7); }
  function sum(arr) { return arr.reduce(function (a, b) { return a + (b || 0); }, 0); }
  function groupBy(list, fn) {
    var out = {};
    list.forEach(function (it) { var k = fn(it); (out[k] = out[k] || []).push(it); });
    return out;
  }

  function addDays(d, delta) {
    var dt = new Date(d + "T00:00:00");
    dt.setDate(dt.getDate() + delta);
    return dt.getFullYear() + "-" + pad2(dt.getMonth() + 1) + "-" + pad2(dt.getDate());
  }
  function isoWeek(d) {
    var date = new Date(d + "T00:00:00");
    var dayNum = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - dayNum + 3);
    var firstThursday = new Date(date.getFullYear(), 0, 4);
    var fd = (firstThursday.getDay() + 6) % 7;
    firstThursday.setDate(firstThursday.getDate() - fd + 3);
    return Math.round((date - firstThursday) / (7 * 86400000)) + 1;
  }
  function shiftMonth(ym, delta) {
    var y = +ym.slice(0, 4), m = +ym.slice(5, 7);
    var i = y * 12 + (m - 1) + delta;
    var yy = Math.floor(i / 12), mm = (i % 12 + 12) % 12 + 1;
    return yy + "-" + pad2(mm);
  }
  function monthEnd(ym) {
    var y = +ym.slice(0, 4), m = +ym.slice(5, 7);
    var d = new Date(y, m, 0).getDate();
    return ym + "-" + pad2(d);
  }
  function daysBetween(a, b) {
    return Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000);
  }
  function MONTHS_SHORT() { return lang === "es" ? ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"] : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]; }

  function statusBadge(status) {
    var map = {
      booked: "gold", done: "ok", "no-show": "danger", paid: "ok",
      pending: "warn", active: "ok", archived: "dim", briefed: "warn",
      approved: "ok", morning: "gold", afternoon: "warn"
    };
    var cls = map[status] || "dim";
    return '<span class="badge ' + cls + '">' + esc(status) + '</span>';
  }

  function sectionTitle(txt) { return '<div class="section-title">' + txt + '</div>'; }

  var ICONS = {
    revenue: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>',
    tickets: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"/><path d="M12 7v6M12 16h.01"/></svg>',
    products: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-9-5-9 5v8l9 5 9-5V8z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg>',
    newClients: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg>',
    returning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M15 19l2 2 4-4"/></svg>',
    noShows: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18M9.5 15.5l5 5M14.5 15.5l-5 5"/></svg>',
    cash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/></svg>',
    card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>',
    mobile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/></svg>',
    gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4"/><path d="M12 8v13M5 12v9h14v-9"/><path d="M12 8c-2 0-4-1.5-4-3.5S10 2 12 4c2-2 4 0 4 1.5S14 8 12 8z"/></svg>',
    voucher: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4L11 3H4v7l10.4 10.6a2 2 0 002.8 0l3.4-3.4a2 2 0 000-2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>'
  };

  function icon(name, size) {
    var map = {
      edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z"/></svg>',
      trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>',
      plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
      search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
      settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
      chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l3-4 3 3 4-7"/></svg>',
      clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
      scissors: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12"/></svg>',
      percent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 5L5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>',
      users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
      staff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>',
      services: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16M6 16l6-12 6 12"/><path d="M9 16h6"/></svg>',
      products: ICONS.products,
      calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4"/></svg>',
      cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1.5"/><circle cx="19" cy="21" r="1.5"/><path d="M2 3h2l2.6 12.4a2 2 0 002 1.6h8.9a2 2 0 002-1.6L21 7H6"/></svg>',
      grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
      file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>',
      grid3: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 3v18h18"/><path d="M7 14l3-3 3 3 5-6"/></svg>'
    };
    var s = map[name] || map.grid;
    if (!size) size = 16;
    return s.replace('<svg ', '<svg width="' + size + '" height="' + size + '" ');
  }

  function metric(label, value, tone, ic) {
    var cls = "metric " + (tone || "");
    var body = '<div class="metric-value">' + value + '</div><div class="metric-label">' + label + '</div>';
    if (ICONS[ic]) {
      cls += " with-icon";
      return '<div class="' + cls + '"><div class="metric-icon">' + ICONS[ic] + '</div><div>' + body + '</div></div>';
    }
    return '<div class="' + cls + '">' + body + '</div>';
  }

  function cards(list) {
    return '<div class="grid">' + list.join("") + '</div>';
  }

  function table(rows, opts) {
    opts = opts || {};
    if (!rows.length) return '<div class="card"><h3>' + (opts.empty || t("pending")) + '</h3></div>';
    var html = '<div class="card"><table><thead><tr>';
    rows[0].forEach(function (h, i) {
      html += '<th' + (opts.numCols && opts.numCols.indexOf(i) > -1 ? ' class="num"' : "") + '>' + h + '</th>';
    });
    html += '</tr></thead><tbody>';
    rows.slice(1).forEach(function (r, ri) {
      var attrs = opts.rowAttr ? " " + opts.rowAttr(r, ri) : "";
      html += '<tr' + attrs + '>';
      r.forEach(function (cell, i) {
        html += '<td' + (opts.numCols && opts.numCols.indexOf(i) > -1 ? ' class="num"' : "") + '>' + cell + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    return html;
  }

  function chartCard(title, chart, extra) {
    return '<div class="card chart-card"><h3>' + title + '</h3>' + chart + (extra || "") + '</div>';
  }

  var PERIOD_COLORS = {
    daily: { c1: "#e8b64c", c2: "#f7dfa0" },
    weekly: { c1: "#37c8a8", c2: "#a5e9d8" },
    monthly: { c1: "#e87ba0", c2: "#f2c6d6" }
  };
  var CHART_COLORS = ["#e8b64c", "#37c8a8", "#e87ba0", "#8f7ee8", "#5aa9e6", "#f2a33c", "#3ddc97"];
  var DONUT_COLORS = CHART_COLORS;
  function colorFor(i) { return CHART_COLORS[i % CHART_COLORS.length]; }

  function timeChart(labels, values, opts) {
    opts = opts || {};
    var id = opts.id || "chart";
    var col = PERIOD_COLORS[opts.period || "daily"];
    var W = 600, H = 250, padB = 36, padT = 28, padL = 10, padR = 10;
    var max = Math.max.apply(null, values.concat([1]));
    var n = labels.length;
    var c1 = col.c1, c2 = col.c2;
    var body = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart" role="img">' +
      '<defs><linearGradient id="' + id + '_g" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="' + c2 + '"/><stop offset="100%" stop-color="' + c1 + '"/></linearGradient>' +
      '<linearGradient id="' + id + '_fill" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="' + c1 + '" stop-opacity="0.55"/><stop offset="100%" stop-color="' + c1 + '" stop-opacity="0.05"/></linearGradient></defs>';

    if (opts.type === "line") {
      var step = (W - padL - padR) / (n - 1 || 1);
      var pts = values.map(function (v, i) {
        return [padL + i * step, H - padB - (v / max) * (H - padB - padT)];
      });
      var area = "M " + pts[0][0] + " " + (H - padB) + " L " + pts.map(function (p) { return p[0] + " " + p[1]; }).join(" L ") + " L " + pts[n - 1][0] + " " + (H - padB) + " Z";
      var line = pts.map(function (p) { return p[0] + "," + p[1]; }).join(" ");
      body += '<path d="' + area + '" fill="url(#' + id + '_fill)"/>' +
        '<polyline points="' + line + '" fill="none" stroke="' + c1 + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';
      pts.forEach(function (p, i) {
        body += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" fill="' + c1 + '" stroke="#0e131b" stroke-width="2">' +
          '<title>' + esc(labels[i] + ": " + compact(values[i])) + '</title></circle>' +
          '<text x="' + p[0] + '" y="' + (p[1] - 10) + '" text-anchor="middle" class="chart-label">' + compact(values[i]) + '</text>' +
          '<text x="' + p[0] + '" y="' + (H - padB + 16) + '" text-anchor="middle" class="chart-axis">' + esc(labels[i]) + '</text>';
      });
    } else {
      var bw = (W - padL - padR) / n;
      values.forEach(function (v, i) {
        var h = (v / max) * (H - padB - padT);
        var x = padL + i * bw + bw * 0.16;
        var y = H - padB - h;
        var w = bw * 0.68;
        body += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + Math.max(h, 2) + '" rx="5" fill="url(#' + id + '_g)">' +
          '<title>' + esc(labels[i] + ": " + compact(v)) + '</title></rect>' +
          '<text x="' + (x + w / 2) + '" y="' + (y - 6) + '" text-anchor="middle" class="chart-label">' + compact(v) + '</text>' +
          '<text x="' + (x + w / 2) + '" y="' + (H - padB + 16) + '" text-anchor="middle" class="chart-axis">' + esc(labels[i]) + '</text>';
      });
    }
    body += '</svg>';
    return body;
  }

  function donutChart(parts, opts) {
    opts = opts || {};
    var r = 70, cx = 80, cy = 80, stroke = 26;
    var total = sum(parts.map(function (p) { return p.value; }));
    var C = 2 * Math.PI * r;
    var offset = 0;
    var circles = "";
    var legend = "";
    if (!total) return '<p class="muted">' + t("pending") + '</p>';
    parts.forEach(function (p, i) {
      var color = p.color || DONUT_COLORS[i % DONUT_COLORS.length];
      var len = (p.value / total) * C;
      var rot = (offset / total) * 360 - 90;
      circles += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="' + stroke + '" stroke-dasharray="' + len.toFixed(2) + ' ' + (C - len).toFixed(2) + '" transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')"/>';
      offset += p.value;
      legend += '<div class="donut-legend-row"><span class="dot" style="background:' + color + '"></span><span class="lk">' + esc(p.label) + '</span><span class="lv">' + p.valueText + '</span></div>';
    });
    var pct = parts.length ? Math.round((parts[0].value / total) * 100) : 0;
    return '<div class="donut-wrap">' +
      '<div class="donut-svg"><svg viewBox="0 0 160 160" width="150" height="150">' + circles + '</svg>' +
      '<div class="donut-center"><div>' + pct + '%</div></div></div>' +
      '<div class="donut-legend">' + legend + '</div></div>';
  }

  function barRows(items, opts) {
    opts = opts || {};
    if (!items.length) return '<p class="muted">' + t("pending") + '</p>';
    var max = Math.max.apply(null, items.map(function (i) { return i.value; }).concat([1]));
    var color = (opts.period && PERIOD_COLORS[opts.period] ? PERIOD_COLORS[opts.period].c1 : "#e8b64c");
    var html = '<div class="hbar-list">';
    items.forEach(function (it, i) {
      var pct = Math.max((it.value / max) * 100, 3);
      html += '<div class="hbar-row"><span class="hbar-label">' + (opts.index ? '<em>' + (i + 1) + '.</em> ' : "") + esc(it.label) + '</span>' +
        '<div class="hbar-track"><div class="hbar-fill" style="width:' + pct + '%;background:linear-gradient(90deg,' + color + ',' + (opts.period ? PERIOD_COLORS[opts.period].c2 : "#f7dfa0") + ')"></div></div>' +
        '<span class="hbar-value">' + (it.valueText || fmt(it.value)) + '</span></div>';
    });
    return html + '</div>';
  }

  function multiBarChart(labels, series, opts) {
    opts = opts || {};
    var W = 620, H = 250, padB = 38, padT = 26, padL = 46, padR = 12;
    var n = labels.length, m = series.length;
    var totals = labels.map(function (_, i) { return sum(series.map(function (s) { return s.values[i] || 0; })); });
    var max = Math.max.apply(null, totals.concat([1]));
    var body = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart" role="img">';
    var g;
    for (g = 0; g <= 4; g++) {
      var val = max * g / 4;
      var y = H - padB - (g / 4) * (H - padB - padT);
      body += '<line x1="' + padL + '" y1="' + y + '" x2="' + (W - padR) + '" y2="' + y + '" stroke="rgba(255,255,255,0.07)"/>';
      body += '<text x="' + (padL - 8) + '" y="' + (y + 4) + '" text-anchor="end" class="chart-axis">' + compact(val) + '</text>';
    }
    var gw = (W - padL - padR) / Math.max(n, 1);
    var bw = opts.stacked ? gw * 0.6 : Math.min(gw * 0.7 / Math.max(m, 1), 44);
    for (var i = 0; i < n; i++) {
      var cx = padL + i * gw + gw / 2;
      if (opts.stacked) {
        var yTop = H - padB;
        var stacked = 0;
        for (var si = 0; si < m; si++) {
          var v = series[si].values[i] || 0;
          if (!v) continue;
          var h = (v / max) * (H - padB - padT);
          var col = series[si].color || colorFor(si);
          yTop -= h;
          body += '<rect x="' + (cx - bw / 2) + '" y="' + yTop + '" width="' + bw + '" height="' + Math.max(h, 1) + '" rx="4" fill="' + col + '" opacity="0.92"><title>' + esc(labels[i] + " · " + series[si].name + ": " + (opts.fmt || fmt)(v)) + '</title></rect>';
          stacked += v;
        }
        if (stacked) body += '<text x="' + cx + '" y="' + (H - padB - (stacked / max) * (H - padB - padT) - 8) + '" text-anchor="middle" class="chart-label">' + compact(stacked) + '</text>';
      } else {
        var x0 = cx - (m * bw + Math.max(m - 1, 0) * 4) / 2;
        for (var sj = 0; sj < m; sj++) {
          var v2 = series[sj].values[i] || 0;
          var h2 = (v2 / max) * (H - padB - padT);
          var x = x0 + sj * (bw + 4);
          body += '<rect x="' + x + '" y="' + (H - padB - h2) + '" width="' + bw + '" height="' + Math.max(h2, 1) + '" rx="4" fill="' + (series[sj].color || colorFor(sj)) + '" opacity="0.9"><title>' + esc(labels[i] + " · " + series[sj].name + ": " + (opts.fmt || fmt)(v2)) + '</title></rect>';
        }
      }
      body += '<text x="' + cx + '" y="' + (H - padB + 18) + '" text-anchor="middle" class="chart-axis">' + esc(labels[i]) + '</text>';
    }
    body += '</svg>';
    body += '<div class="chart-legend">' + series.map(function (s, k) {
      return '<span class="cl-item"><span class="cl-dot" style="background:' + (s.color || colorFor(k)) + '"></span>' + esc(s.name) + '</span>';
    }).join("") + '</div>';
    return body;
  }

  function heatColor(pct) {
    var a = 0.18 + pct * 0.75;
    return "rgba(232, 182, 76, " + a.toFixed(3) + ")";
  }

  function heatmapChart(rows, cols, opts) {
    opts = opts || {};
    var max = 1;
    rows.forEach(function (r) { r.values.forEach(function (v) { if (v > max) max = v; }); });
    var html = '<div class="heatmap">';
    html += '<div class="hm-row"><div class="hm-cell hm-label"></div>' + cols.map(function (c) { return '<div class="hm-cell hm-col">' + esc(c) + '</div>'; }).join("") + '</div>';
    rows.forEach(function (r) {
      html += '<div class="hm-row"><div class="hm-cell hm-label">' + esc(r.label) + '</div>';
      r.values.forEach(function (v, i) {
        var pct = max ? v / max : 0;
        var col = v ? heatColor(pct) : "rgba(255,255,255,0.03)";
        html += '<div class="hm-cell hm-val" style="background:' + col + '"' +
          (v ? ' title="' + esc(r.label + " " + cols[i] + ": " + fmt(v) + " ARS") + '"' : "") + '>' + (v ? compact(v) : "") + '</div>';
      });
      html += '</div>';
    });
    return html + '</div>';
  }

  /* ------------------------- CRUD helpers ------------------------- */

  function nextClientId() {
    var max = 0;
    D.clients.forEach(function (c) { var n = parseInt(c.id, 10); if (n > max) max = n; });
    return pad2(max + 1).padStart(4, "0");
  }
  function slug(s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function formCard(title, body, actions) {
    return '<div class="card form-card">' +
      '<div class="form-title">' + title + '</div>' +
      '<div class="form-body">' + body + '</div>' +
      '<div class="form-actions">' + actions + '</div></div>';
  }
  function field(label, inner) {
    return '<div class="form-field">' + (label ? '<label>' + label + '</label>' : "") + inner + '</div>';
  }
  function inputVal(id, fallback) {
    var el = document.getElementById(id);
    return el ? el.value : (fallback || "");
  }
  function numVal(id, fallback) {
    var v = parseFloat(inputVal(id, ""));
    return isNaN(v) ? (fallback || 0) : v;
  }

  function renderClientForm() {
    var c = editTarget.id ? clientById(editTarget.id) : null;
    var mode = editTarget.mode;
    var title = mode === "edit" ? t("edit") + " — " + esc(c ? c.name : "") : t("add_client");
    var body =
      field(t("name"), '<input id="cName" value="' + esc(c ? c.name : "") + '" placeholder="' + esc(t("name")) + '">') +
      field(t("gender"), '<select id="cGender"><option value="women"' + (c && c.gender_line === "women" ? " selected" : "") + '>' + t("womens") + '</option><option value="men"' + (c && c.gender_line === "men" ? " selected" : "") + '>' + t("mens") + '</option></select>') +
      field(t("phone"), '<input id="cPhone" value="' + esc(c ? (c.phone || "") : "") + '" placeholder="+54 ...">') +
      (mode === "edit" ? field(t("status"), '<select id="cStatus"><option value="active"' + (c && c.status === "active" ? " selected" : "") + '>' + t("now_open") + '</option><option value="archived"' + (c && c.status === "archived" ? " selected" : "") + '>' + t("pending") + '</option></select>') : "");
    var actions =
      '<button class="btn" onclick="Lumiere.saveClient()">' + t("save") + '</button>' +
      '<button class="btn ghost" onclick="Lumiere.cancelForm()">' + t("cancel") + '</button>';
    return formCard(title, '<div class="form-row">' + body + '</div>', actions);
  }

  function renderStaffForm() {
    var s = editTarget.id ? staffById(editTarget.id) : null;
    var title = editTarget.mode === "edit" ? t("edit") + " — " + esc(s ? s.name : "") : t("add_staff");
    var body =
      field(t("name"), '<input id="sName" value="' + esc(s ? s.name : "") + '">') +
      field(t("role"), '<select id="sRole"><option value="stylist"' + (s && s.role === "stylist" ? " selected" : "") + '>' + t("role_stylist") + '</option><option value="assistant"' + (s && s.role === "assistant" ? " selected" : "") + '>' + t("role_assistant") + '</option><option value="receptionist"' + (s && s.role === "receptionist" ? " selected" : "") + '>' + t("role_receptionist") + '</option></select>') +
      field(t("shift"), '<select id="sShift"><option value="">—</option><option value="morning"' + (s && s.shift === "morning" ? " selected" : "") + '>' + t("morning") + '</option><option value="afternoon"' + (s && s.shift === "afternoon" ? " selected" : "") + '>' + t("afternoon") + '</option></select>') +
      field(t("status"), '<select id="sStatus"><option value="active"' + (!s || s.status === "active" ? " selected" : "") + '>' + t("now_open") + '</option><option value="archived"' + (s && s.status === "archived" ? " selected" : "") + '>' + t("pending") + '</option></select>');
    var actions =
      '<button class="btn" onclick="Lumiere.saveStaff()">' + t("save") + '</button>' +
      '<button class="btn ghost" onclick="Lumiere.cancelForm()">' + t("cancel") + '</button>';
    return formCard(title, '<div class="form-row">' + body + '</div>', actions);
  }

  function renderServiceForm() {
    var s = editTarget.id ? D.services[editTarget.id] : null;
    var title = editTarget.mode === "edit" ? t("edit") + " — " + esc(s ? svcName(editTarget.id) : "") : t("btn_new_service");
    var body =
      field(t("name") + " (EN)", '<input id="svNameEn" value="' + esc(s ? s.name_en : "") + '">') +
      field(t("name") + " (ES)", '<input id="svNameEs" value="' + esc(s ? s.name_es : "") + '">') +
      field(t("group"), '<select id="svGroup"><option value="hair"' + (s && s.group === "hair" ? " selected" : "") + '>' + t("group_hair") + '</option><option value="nails"' + (s && s.group === "nails" ? " selected" : "") + '>' + t("group_nails") + '</option><option value="beauty"' + (s && s.group === "beauty" ? " selected" : "") + '>' + t("group_beauty") + '</option></select>') +
      field(t("price"), '<input id="svPrice" type="number" min="0" value="' + (s ? s.price_ars : "") + '">');
    var actions =
      '<button class="btn" onclick="Lumiere.saveService()">' + t("save") + '</button>' +
      '<button class="btn ghost" onclick="Lumiere.cancelForm()">' + t("cancel") + '</button>';
    return formCard(title, '<div class="form-row">' + body + '</div>', actions);
  }

  function renderProductForm() {
    var p = editTarget.id ? D.products[editTarget.id] : null;
    var title = editTarget.mode === "edit" ? t("edit") + " — " + esc(p ? prodName(editTarget.id) : "") : t("btn_new_product");
    var body =
      field(t("name") + " (EN)", '<input id="pNameEn" value="' + esc(p ? p.name_en : "") + '">') +
      field(t("name") + " (ES)", '<input id="pNameEs" value="' + esc(p ? p.name_es : "") + '">') +
      field(t("price"), '<input id="pPrice" type="number" min="0" value="' + (p ? p.price_ars : "") + '">') +
      field(t("stock"), '<input id="pStock" type="number" min="0" value="' + (p ? p.stock : "") + '">') +
      field(t("reorder"), '<input id="pReorder" type="number" min="0" value="' + (p ? p.reorder : D.settings.lowStockDefault || 5) + '">');
    var actions =
      '<button class="btn" onclick="Lumiere.saveProduct()">' + t("save") + '</button>' +
      '<button class="btn ghost" onclick="Lumiere.cancelForm()">' + t("cancel") + '</button>';
    return formCard(title, '<div class="form-row">' + body + '</div>', actions);
  }

  /* ------------------------- Renderers ------------------------- */

  function renderToday() {
    var s = daySummary(state.today);
    var avg = s.tickets ? Math.round(s.revenue / s.tickets) : 0;
    var html = '<div class="toolbar"><h2>📅 ' + t("sec_today") + '</h2><span class="spacer"></span>' +
      '<span class="day-label">' + esc(state.today) + '</span></div>';
    html += cards([
      metric("💰 " + t("revenue_ars"), ars(s.revenue), "", "revenue"),
      metric("🧾 " + t("tickets"), s.tickets, "", "tickets"),
      metric("🎟️ " + t("avg_ticket"), ars(avg), "", "cash"),
      metric("🧴 " + t("products_sold"), s.products, "", "products"),
      metric("🆕 " + t("new_clients"), s.newClients, "", "newClients"),
      metric("🔁 " + t("returning_clients"), s.returning, "", "returning"),
      metric("🚫 " + t("no_shows"), s.noShows, s.noShows > 0 ? "warn" : "good", "noShows")
    ]);

    html += sectionTitle("💳 " + t("payment_split"));
    var pay = ["cash", "card", "mobile", "gift_card", "voucher"].filter(function (m) { return s.payments[m]; });
    if (pay.length) {
      var donutParts = pay.map(function (m) { return { label: t(m), value: s.payments[m], valueText: ars(s.payments[m]) }; });
      html += '<div class="card">' + donutChart(donutParts) + '</div>';
    } else {
      html += '<div class="card"><h3>' + t("pending") + '</h3></div>';
    }

    html += sectionTitle("🏆 " + t("top_clients"));
    html += table(renderTopClients(D.tickets.filter(function (t) { return t.date === state.today; })), { numCols: [1] });
    return html;
  }

  function daySummary(day) {
    var tickets = D.tickets.filter(function (t) { return t.date === day; });
    var revenue = sum(tickets.map(ticketTotal));
    var products = sum(tickets.map(function (t) { return sum(ticketProducts(t).map(function (l) { return l.q; })); }));
    var newClients = D.clients.filter(function (c) { return c.first_visit === day; }).length;
    var returning = tickets.filter(isReturning).length;
    var payments = {};
    tickets.forEach(function (t) { t.payments.forEach(function (p) { payments[p.m] = (payments[p.m] || 0) + p.a; }); });
    return { tickets: tickets.length, revenue: revenue, products: products, newClients: newClients, returning: returning, payments: payments, noShows: D.noShows[day] || 0 };
  }

  function renderTopClients(tickets) {
    var byC = groupBy(tickets, function (t) { return t.client; });
    var rows = [[t("client"), t("total") + " ARS"]];
    Object.keys(byC).map(function (k) {
      return { k: k, v: sum(byC[k].map(ticketTotal)) };
    }).sort(function (a, b) { return b.v - a.v; }).slice(0, 5).forEach(function (r) {
      var c = clientById(r.k);
      rows.push([c ? c.name : r.k, ars(r.v)]);
    });
    return rows;
  }

  function renderWeek() {
    var tickets = D.tickets.filter(inWeek);
    var revenue = sum(tickets.map(ticketTotal));
    var products = sum(tickets.map(function (t) { return sum(ticketProducts(t).map(function (l) { return l.q; })); }));
    var newClients = D.clients.filter(function (c) { return c.first_visit >= state.weekStart && c.first_visit <= state.weekEnd; }).length;

    var html = '<div class="toolbar"><h2>📆 ' + t("sec_week") + '</h2><span class="spacer"></span>' +
      '<span class="day-label">' + esc(state.weekStart) + ' → ' + esc(state.weekEnd) + '</span></div>';
    html += cards([
      metric("💰 " + t("weekly_revenue") + " (ARS)", ars(revenue), "", "revenue"),
      metric("🧾 " + t("tickets"), tickets.length, "", "tickets"),
      metric("🧴 " + t("products_sold"), products, "", "products"),
      metric("🆕 " + t("new_clients"), newClients, "", "newClients")
    ]);

    var mix = {};
    tickets.forEach(function (t) { ticketServices(t).forEach(function (l) { mix[l.k] = (mix[l.k] || 0) + l.q; }); });
    var mixItems = Object.keys(mix).map(function (k) { return { label: svcName(k), value: mix[k] }; })
      .sort(function (a, b) { return b.value - a.value; }).slice(0, 6);
    html += sectionTitle("✂️ " + t("service_mix"));
    html += '<div class="card">' + barRows(mixItems, { period: "weekly" }) + '</div>';

    html += sectionTitle("💇 " + t("staff_performance")) + table(renderStaffPerformance(tickets), { numCols: [1, 2] });

    var stock = {};
    tickets.forEach(function (t) { ticketProducts(t).forEach(function (l) { stock[l.k] = (stock[l.k] || 0) + l.q; }); });
    var stockRows = [[t("name"), t("units_sold")]];
    Object.keys(stock).map(function (k) { return { k: k, v: stock[k] }; })
      .sort(function (a, b) { return b.v - a.v; })
      .forEach(function (r) { stockRows.push([prodName(r.k), r.v]); });
    html += sectionTitle("🧴 " + t("stock_movement")) + table(stockRows, { numCols: [1] });

    html += sectionTitle("🏆 " + t("top_clients")) + table(renderTopClients(tickets), { numCols: [1] });
    return html;
  }

  function renderStaffPerformance(tickets) {
    var rows = [[t("staff"), t("new_visits"), t("return_visits")]];
    D.staff.filter(function (s) { return s.role === "stylist"; }).forEach(function (st) {
      var stT = tickets.filter(function (t) { return t.stylist === st.id; });
      var ret = stT.filter(isReturning).length;
      rows.push([st.name, stT.length - ret, ret]);
    });
    return rows;
  }

  function renderMonth() {
    var tickets = D.tickets.filter(inMonth);
    var revenue = sum(tickets.map(ticketTotal));
    var newClients = D.clients.filter(function (c) { return c.first_visit.slice(0, 7) === state.today.slice(0, 7); }).length;

    var html = '<div class="toolbar"><h2>🗓️ ' + t("sec_month") + '</h2><span class="spacer"></span>' +
      '<span class="day-label">' + esc(state.today.slice(0, 7)) + '</span></div>';
    html += cards([
      metric("💰 " + t("monthly_revenue") + " (ARS)", ars(revenue), "", "revenue"),
      metric("🧾 " + t("tickets"), tickets.length, "", "tickets"),
      metric("🆕 " + t("new_clients"), newClients, "", "newClients")
    ]);

    var byGender = { men: 0, women: 0 };
    tickets.forEach(function (t) {
      var c = clientById(t.client);
      byGender[c ? c.gender_line : "women"] += ticketTotal(t);
    });
    var totalG = byGender.men + byGender.women;
    html += sectionTitle("👥 " + t("gender_segments"));
    var gParts = [
      { label: t("mens"), value: byGender.men, valueText: ars(byGender.men) + " · " + (totalG ? Math.round(byGender.men / totalG * 100) : 0) + "%" },
      { label: t("womens"), value: byGender.women, valueText: ars(byGender.women) + " · " + (totalG ? Math.round(byGender.women / totalG * 100) : 0) + "%" }
    ];
    html += '<div class="card">' + donutChart(gParts) + '</div>';

    html += sectionTitle("⭐ " + t("retention_rate")) + table(renderRetention(), { numCols: [1, 2] });
    html += sectionTitle("📊 " + t("seasonality")) + table(renderSeasonality(), { numCols: [1] });
    html += sectionTitle("💵 " + t("commission_totals")) + table(renderCommission(), { numCols: [1, 2, 3] });
    html += sectionTitle("🏆 " + t("top_clients")) + table(renderTopClients(tickets), { numCols: [1] });
    return html;
  }

  function renderRetention() {
    var w30 = 0, w60 = 0, total = 0;
    D.clients.forEach(function (c) {
      if ((c.visits || []).length < 2) return;
      total++;
      var diff = daysBetween(c.first_visit, c.visits[1]);
      if (diff <= 30) w30++;
      if (diff <= 60) w60++;
    });
    return [
      ["", "1 " + t("week_label").toLowerCase() + " / mes", "2 meses"],
      [t("returning_after_1_2_months"), (total ? Math.round(w30 / total * 100) : 0) + "%", (total ? Math.round(w60 / total * 100) : 0) + "%"]
    ];
  }

  function renderSeasonality() {
    var byM = {};
    D.tickets.forEach(function (t) { byM[t.date.slice(0, 7)] = (byM[t.date.slice(0, 7)] || 0) + ticketTotal(t); });
    var rows = [[t("name"), "ARS"]];
    Object.keys(byM).sort().forEach(function (m) {
      var mon = MONTHS_SHORT()[+m.slice(5, 7) - 1];
      rows.push([m.slice(0, 4) + " " + mon, ars(byM[m])]);
    });
    return rows;
  }

  function renderCommission(tickets) {
    tickets = tickets || D.tickets.filter(inMonth);
    var rows = [["Staff", t("services"), t("revenue_ars"), t("commission_totals")]];
    Object.keys(D.commissionRates).forEach(function (id) {
      var rate = D.commissionRates[id];
      var own = tickets.filter(function (t) { return t.stylist === id || t.assistant === id; });
      var serv = 0, prod = 0;
      own.forEach(function (t) {
        ticketServices(t).forEach(function (l) { serv += lineTotal(l); });
        ticketProducts(t).forEach(function (l) { prod += lineTotal(l); });
      });
      var comm = serv * rate.service / 100 + prod * rate.product / 100;
      var s = staffById(id);
      rows.push([s ? s.name : id, ars(serv), ars(serv + prod), ars(comm)]);
    });
    return rows;
  }

  function renderAppointments() {
    var html = '<div class="toolbar">' +
      '<h2>🕐 ' + t("sec_appointments") + '</h2>' +
      '<span class="spacer"></span>' +
      '<input type="date" id="apptDate" value="' + state.today + '" style="width:160px">' +
      '<button class="btn" onclick="Lumiere.newAppointment()">' + icon("plus", 14) + ' ' + t("new_appointment") + '</button>' +
      '</div>';

    var apps = D.appointments.filter(function (a) { return a.date >= state.today; })
      .sort(function (a, b) { return (a.date + a.time) < (b.date + b.time) ? -1 : 1; });

    if (!apps.length) return html + '<div class="card"><h3>' + t("pending") + '</h3></div>';

    html += '<div class="card"><div class="appointment-row" style="color:var(--text-dim);font-weight:600;text-transform:uppercase;font-size:12px">' +
      '<div>' + t("time") + '</div><div>' + t("client") + '</div><div>' + t("services") + '</div><div>' + t("staff") + '</div><div>' + t("status") + '</div></div>';

    apps.forEach(function (a) {
      var c = clientById(a.client), s = staffById(a.stylist);
      html += '<div class="appointment-row">' +
        '<div class="time">' + esc(a.date.slice(5) + " · " + a.time) + '</div>' +
        '<div>' + esc(c ? c.name : a.client) + '</div>' +
        '<div>' + svcName(a.service) + '</div>' +
        '<div>' + esc(s ? s.name : a.stylist) + '</div>' +
        '<div>' + statusBadge(a.status) + '</div></div>';
    });
    return html + '</div>';
  }

  function renderCheckout() {
    var html = '<div class="toolbar"><h2>🧾 ' + t("sec_checkout") + '</h2></div>';
    html += '<div class="grid cols-2">';

    html += '<div class="card"><h3>1. ' + t("client") + '</h3>';
    html += '<div class="form-field" style="margin-bottom:8px"><label>' + t("select_client") + '</label>' +
      '<select id="coClient">' + D.clients.map(function (c) {
        return '<option value="' + c.id + '">' + esc(c.name) + ' (' + t(c.gender_line === "men" ? "mens" : "womens") + ')</option>';
      }).join("") + '</select></div>';
    html += '<div class="form-field" style="margin-bottom:8px"><label>' + t("role_stylist") + '</label>' +
      '<select id="coStylist">' + D.staff.filter(function (s) { return s.role === "stylist" && s.status !== "archived"; }).map(function (s) {
        return '<option value="' + s.id + '">' + esc(s.name) + '</option>';
      }).join("") + '</select></div>';
    html += '<div class="form-field"><label>' + t("role_assistant") + '</label>' +
      '<select id="coAssistant"><option value="">—</option>' + D.staff.filter(function (s) { return s.role === "assistant" && s.status !== "archived"; }).map(function (s) {
        return '<option value="' + s.id + '">' + esc(s.name) + '</option>';
      }).join("") + '</select></div></div>';

    html += '<div class="card"><h3>2. ' + t("services") + '</h3>';
    html += '<div class="form-field" style="margin-bottom:8px"><label>' + t("add_service") + '</label>' +
      '<select id="coSvc">' + Object.keys(D.services).map(function (k) {
        return '<option value="' + k + '">' + svcName(k) + ' — ' + ars(D.services[k].price_ars) + '</option>';
      }).join("") + '</select>' +
      '<button class="btn ghost" style="margin-top:8px" onclick="Lumiere.addCheckoutLine(\'service\')">' + icon("plus", 14) + ' ' + t("add") + '</button></div>';
    html += '<div class="form-field"><label>' + t("add_product") + '</label>' +
      '<select id="coProd">' + Object.keys(D.products).map(function (k) {
        return '<option value="' + k + '">' + prodName(k) + ' — ' + ars(D.products[k].price_ars) + '</option>';
      }).join("") + '</select>' +
      '<button class="btn ghost" style="margin-top:8px" onclick="Lumiere.addCheckoutLine(\'product\')">' + icon("plus", 14) + ' ' + t("add") + '</button></div></div>';

    html += '</div>';

    html += '<div class="card" style="margin-top:16px"><h3>3. ' + t("bill") + '</h3>';
    if (!checkout.lines.length) {
      html += '<p class="muted">' + t("no_lines") + '</p>';
    } else {
      var rows = [["", "Item", "Qty", "ARS"]];
      var total = 0;
      checkout.lines.forEach(function (l, i) {
        var lt = lineTotal(l);
        total += lt;
        rows.push(['<button class="btn danger" style="padding:2px 8px" onclick="Lumiere.removeCheckoutLine(' + i + ')">×</button>',
          (l.t === "service" ? svcName(l.k) : prodName(l.k)), l.q, ars(lt)]);
      });
      html += table(rows, { numCols: [3] });
      html += '<div style="display:flex;justify-content:flex-end;margin-top:12px;font-size:18px;font-weight:700">' +
        t("total") + ': <span style="color:var(--gold-soft);margin-left:8px">' + ars(total) + '</span></div>';
    }
    html += '<div style="margin-top:16px"><h3>4. ' + t("payments") + '</h3>';
    html += '<div class="form-row" style="grid-template-columns:1fr 1fr 1fr">' +
      '<div class="form-field"><label>💵 ' + t("cash") + '</label><input id="coCash" type="number" min="0" value="0"></div>' +
      '<div class="form-field"><label>💳 ' + t("card") + '</label><input id="coCard" type="number" min="0" value="0"></div>' +
      '<div class="form-field"><label>📱 ' + t("mobile") + '</label><input id="coMobile" type="number" min="0" value="0"></div></div>';
    html += '<button class="btn" style="margin-top:12px" onclick="Lumiere.completeCheckout()">✅ ' + t("complete_payment") + '</button>';
    html += '<span id="coMsg" class="muted" style="margin-left:12px"></span></div></div>';

    return html;
  }

  function addCheckoutLine(type) {
    var k = document.getElementById(type === "service" ? "coSvc" : "coProd").value;
    var existing = checkout.lines.find(function (l) { return l.t === type && l.k === k; });
    if (existing) existing.q++;
    else checkout.lines.push({ t: type, k: k, q: 1 });
    render();
  }

  function removeCheckoutLine(i) {
    checkout.lines.splice(i, 1);
    render();
  }

  function completeCheckout() {
    var client = document.getElementById("coClient").value;
    var stylist = document.getElementById("coStylist").value;
    var assistant = document.getElementById("coAssistant").value;
    var cash = +document.getElementById("coCash").value || 0;
    var card = +document.getElementById("coCard").value || 0;
    var mobile = +document.getElementById("coMobile").value || 0;
    var total = sum(checkout.lines.map(lineTotal));
    var msg = document.getElementById("coMsg");

    if (!checkout.lines.length) { msg.textContent = t("no_lines"); return; }
    if (cash + card + mobile < total) { msg.textContent = t("insufficient"); return; }

    var seq = String(D.tickets.length + 1).padStart(3, "0");
    var payments = [];
    if (cash) payments.push({ m: "cash", a: cash });
    if (card) payments.push({ m: "card", a: card });
    if (mobile) payments.push({ m: "mobile", a: mobile });

    D.tickets.push({
      date: state.today, seq: seq, client: client, stylist: stylist, assistant: assistant,
      lines: checkout.lines.slice(), payments: payments
    });
    checkout.lines.forEach(function (l) {
      if (l.t === "product" && D.products[l.k]) {
        D.products[l.k].stock = Math.max((D.products[l.k].stock || 0) - l.q, 0);
      }
    });
    var c = clientById(client);
    if (c) {
      if (c.visits.indexOf(state.today) === -1) c.visits.push(state.today);
    }
    checkout = { client: "", stylist: "", assistant: "", lines: [], payments: {} };
    save();
    msg.textContent = t("saved");
    sec = "sales";
    render();
  }

  function renderClients() {
    var html = '<div class="toolbar"><h2>👥 ' + t("sec_clients") + '</h2>' +
      '<span class="spacer"></span>' +
      '<div class="search-box">' + icon("search", 14) + '<input id="clientSearch" type="text" placeholder="' + esc(t("client_search_ph")) + '" oninput="Lumiere.filterClients(this.value)"></div>' +
      '<button class="btn" onclick="Lumiere.startClientForm()">' + icon("plus", 14) + ' ' + t("add_client") + '</button></div>';

    if (editTarget && editTarget.kind === "client") html += renderClientForm();
    html += '<p class="muted" style="margin-bottom:10px">' + t("clients_editable_note") + '</p>';

    var rows = [["", t("name"), t("gender"), t("phone"), "Visits", t("status"), ""]];
    D.clients.forEach(function (c) {
      var q = searchQ.toLowerCase();
      var match = !q || c.name.toLowerCase().indexOf(q) > -1 || c.id.indexOf(q) > -1;
      if (!match) return;
      var actions = canEdit()
        ? '<button class="btn ghost sm" onclick="Lumiere.startClientForm(\'edit\',\'' + c.id + '\')">' + icon("edit", 13) + '</button> ' +
          '<button class="btn danger sm" onclick="Lumiere.deleteClient(\'' + c.id + '\')">' + icon("trash", 13) + '</button>'
        : "";
      rows.push([c.id, esc(c.name), t(c.gender_line === "men" ? "mens" : "womens"), esc(c.phone || "—"), c.visits.length, statusBadge(c.status || "active"), actions]);
    });
    return html + table(rows, { rowAttr: function (r) { return 'class="client-row" data-id="' + esc(r[0]) + '" data-name="' + esc(r[1].replace(/<[^>]+>/g, "")) + '"'; } });
  }

  function renderStaff() {
    var html = '<div class="toolbar"><h2>💇 ' + t("sec_staff") + '</h2><span class="spacer"></span>';
    if (canEdit()) {
      html += '<button class="btn" onclick="Lumiere.startStaffForm()">' + icon("plus", 14) + ' ' + t("add_staff") + '</button>';
    }
    html += '</div>';

    if (editTarget && editTarget.kind === "staff") html += renderStaffForm();

    var rows = [["", t("name"), t("role"), t("shift"), t("status"), ""]];
    D.staff.forEach(function (s) {
      var actions = canEdit()
        ? '<button class="btn ghost sm" onclick="Lumiere.startStaffForm(\'edit\',\'' + s.id + '\')">' + icon("edit", 13) + '</button> ' +
          '<button class="btn danger sm" onclick="Lumiere.deleteStaff(\'' + s.id + '\')">' + icon("trash", 13) + '</button>'
        : "";
      rows.push([s.id, esc(s.name), t("role_" + s.role), s.shift ? t(s.shift) : "—", statusBadge(s.status || "active"), actions]);
    });
    return html + table(rows);
  }

  function renderServices() {
    var html = '<div class="toolbar"><h2>✂️ ' + t("sec_services") + '</h2><span class="spacer"></span>';
    if (canEdit()) {
      html += '<button class="btn" onclick="Lumiere.startServiceForm()">' + icon("plus", 14) + ' ' + t("btn_new_service") + '</button>';
    }
    html += '</div>';

    if (editTarget && editTarget.kind === "service") html += renderServiceForm();

    var rows = [["", t("services"), t("group"), t("price"), ""]];
    Object.keys(D.services).forEach(function (k) {
      var s = D.services[k];
      var actions = canEdit()
        ? '<button class="btn ghost sm" onclick="Lumiere.startServiceForm(\'edit\',\'' + k + '\')">' + icon("edit", 13) + '</button> ' +
          '<button class="btn danger sm" onclick="Lumiere.deleteService(\'' + k + '\')">' + icon("trash", 13) + '</button>'
        : "";
      rows.push([k, svcName(k), t("group_" + s.group), ars(s.price_ars), actions]);
    });
    return html + table(rows, { numCols: [3] });
  }

  function renderProducts() {
    var html = '<div class="toolbar"><h2>🧴 ' + t("sec_products") + '</h2><span class="spacer"></span>';
    if (canEdit()) {
      html += '<button class="btn" onclick="Lumiere.startProductForm()">' + icon("plus", 14) + ' ' + t("btn_new_product") + '</button>';
    }
    html += '</div>';

    if (editTarget && editTarget.kind === "product") html += renderProductForm();

    var rows = [["", t("name"), t("price"), t("stock"), t("reorder"), t("status"), ""]];
    Object.keys(D.products).forEach(function (k) {
      var p = D.products[k];
      var low = p.stock <= p.reorder;
      var actions = canEdit()
        ? '<button class="btn ghost sm" onclick="Lumiere.startProductForm(\'edit\',\'' + k + '\')">' + icon("edit", 13) + '</button> ' +
          '<button class="btn danger sm" onclick="Lumiere.deleteProduct(\'' + k + '\')">' + icon("trash", 13) + '</button>'
        : "";
      rows.push([k, prodName(k), ars(p.price_ars), p.stock, p.reorder, low ? '<span class="badge danger">' + t("low") + '</span>' : '<span class="badge ok">' + t("ok") + '</span>', actions]);
    });
    return html + table(rows, { numCols: [1, 2, 3] });
  }

  function renderSales() {
    var html = '<div class="toolbar"><h2>💳 ' + t("sec_sales") + '</h2><span class="spacer"></span>' +
      '<button class="btn ghost" onclick="Lumiere.exportCSV()">⬇ ' + t("export_csv") + '</button></div>';
    var tickets = D.tickets.slice().sort(function (a, b) { return b.date < a.date ? -1 : 1; });
    var rows = [[t("time"), t("client"), t("role_stylist"), "ARS", t("payments"), t("status")]];
    tickets.forEach(function (tk) {
      var c = clientById(tk.client), s = staffById(tk.stylist);
      var pay = tk.payments.map(function (p) { return t(p.m); }).join(" + ");
      rows.push([tk.date, esc(c ? c.name : tk.client), esc(s ? s.name : tk.stylist), ars(ticketTotal(tk)), pay, statusBadge("paid")]);
    });
    return html + table(rows, { numCols: [3] });
  }

  function renderCommissionRates() {
    var html = '<div class="toolbar"><h2>💰 ' + t("sec_commission") + '</h2></div>';
    html += '<p class="muted" style="margin-bottom:12px">' + t("commission_edit_note") + '</p>';

    var rows = [["Staff", t("role"), "Service %", "Product %"]];
    D.staff.filter(function (s) { return s.role === "stylist" || s.role === "assistant"; }).forEach(function (s) {
      var r = D.commissionRates[s.id] || { service: 0, product: 0 };
      rows.push([esc(s.name), t("role_" + s.role),
        '<input class="rate-input" type="number" min="0" max="100" id="rate_' + s.id + '_s" value="' + r.service + '">',
        '<input class="rate-input" type="number" min="0" max="100" id="rate_' + s.id + '_p" value="' + r.product + '">']);
    });
    html += table(rows);
    html += '<button class="btn" style="margin-top:14px" onclick="Lumiere.saveRates()">' + t("save") + '</button>';
    html += '<p class="muted" style="margin-top:14px">' + t("commission_owner_note") + '</p>';
    return html;
  }

  /* ------------------------- Analytics ------------------------- */

  function bucketsFor(period) {
    var out = [];
    if (period === "daily") {
      for (var i = 13; i >= 0; i--) {
        var d = addDays(state.today, -i);
        out.push({ label: d.slice(5), from: d, to: d });
      }
    } else if (period === "weekly") {
      for (var j = 7; j >= 0; j--) {
        var ws = addDays(state.weekStart, -7 * j);
        out.push({ label: "W" + isoWeek(ws), from: ws, to: addDays(ws, 6) });
      }
    } else {
      for (var k = 5; k >= 0; k--) {
        var m = shiftMonth(state.today.slice(0, 7), -k);
        out.push({ label: MONTHS_SHORT()[+m.slice(5, 7) - 1], from: m + "-01", to: monthEnd(m) });
      }
    }
    return out;
  }

  function bucketStats(b) {
    var tickets = D.tickets.filter(function (t) { return t.date >= b.from && t.date <= b.to; });
    var revenue = sum(tickets.map(ticketTotal));
    var newClients = D.clients.filter(function (c) { return c.first_visit >= b.from && c.first_visit <= b.to; }).length;
    return { revenue: revenue, tickets: tickets.length, newClients: newClients, avg: tickets.length ? Math.round(revenue / tickets.length) : 0 };
  }

  function weekLabel(d) { return "W" + isoWeek(d); }

  function periodSeg() {
    return '<div class="seg">' +
      '<button class="seg-btn' + (analyticsPeriod === "daily" ? " active" : "") + '" onclick="Lumiere.setAnalyticsPeriod(\'daily\')">' + t("daily") + '</button>' +
      '<button class="seg-btn' + (analyticsPeriod === "weekly" ? " active" : "") + '" onclick="Lumiere.setAnalyticsPeriod(\'weekly\')">' + t("weekly") + '</button>' +
      '<button class="seg-btn' + (analyticsPeriod === "monthly" ? " active" : "") + '" onclick="Lumiere.setAnalyticsPeriod(\'monthly\')">' + t("monthly") + '</button></div>';
  }

  /* ------------------------- Custom analytics engine ------------------------- */

  var METRICS = {
    revenue: { money: true },
    visits: { money: false },
    avg_ticket: { money: true },
    returning: { money: false },
    new_clients: { money: false },
    product_qty: { money: false },
    commission: { money: true }
  };

  var WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

  function ticketCommission(t) {
    var r = D.commissionRates[t.stylist] || { service: 0, product: 0 };
    var a = D.commissionRates[t.assistant] || { service: 0, product: 0 };
    var sv = sum(ticketServices(t).map(lineTotal));
    var pr = sum(ticketProducts(t).map(lineTotal));
    return Math.round(sv * r.service / 100 + pr * r.product / 100 + sv * a.service / 100 + pr * a.product / 100);
  }

  function metricValue(metric, tickets, from, to) {
    var rev = sum(tickets.map(ticketTotal));
    switch (metric) {
      case "revenue": return rev;
      case "visits": return tickets.length;
      case "avg_ticket": return tickets.length ? Math.round(rev / tickets.length) : 0;
      case "returning": return tickets.filter(isReturning).length;
      case "new_clients":
        if (from && to) return D.clients.filter(function (c) { return c.first_visit >= from && c.first_visit <= to; }).length;
        return tickets.filter(function (t) { var c = clientById(t.client); return !!(c && c.first_visit === t.date); }).length;
      case "product_qty": return sum(tickets.map(function (t) { return sum(ticketProducts(t).map(function (l) { return l.q; })); }));
      case "commission": return sum(tickets.map(ticketCommission));
    }
    return 0;
  }

  function passesFilters(t, q) {
    if (q.staff && t.stylist !== q.staff && t.assistant !== q.staff) return false;
    if (q.gender) {
      var c = clientById(t.client);
      if (!c || c.gender_line !== q.gender) return false;
    }
    if (q.payment && !t.payments.some(function (p) { return p.m === q.payment; })) return false;
    return true;
  }

  function dataRange() {
    var min = D.tickets.reduce(function (a, t) { return t.date < a ? t.date : a; }, state.today);
    return { from: min, to: state.today };
  }

  function allBuckets() {
    var min = dataRange().from;
    if (daysBetween(min, state.today) <= 45) return bucketsFor("daily").filter(function (b) { return b.from >= min; });
    var out = [];
    var start = addDays(min, -((new Date(min + "T00:00:00").getDay() + 6) % 7));
    while (start <= state.today) {
      out.push({ label: "W" + isoWeek(start), from: start, to: addDays(start, 6) });
      start = addDays(start, 7);
    }
    return out;
  }

  function customBuckets(from, to) {
    if (!from || !to || from > to) return [];
    var out = [];
    if (daysBetween(from, to) <= 45) {
      for (var d = from; d <= to; d = addDays(d, 1)) out.push({ label: d.slice(5), from: d, to: d });
    } else {
      var start = addDays(from, -((new Date(from + "T00:00:00").getDay() + 6) % 7));
      while (start <= to) {
        out.push({ label: "W" + isoWeek(start), from: start, to: addDays(start, 6) });
        start = addDays(start, 7);
      }
    }
    return out;
  }

  function queryRange(q) {
    var buckets = q.period === "all" ? allBuckets() : (q.period === "custom" ? customBuckets(q.from, q.to) : bucketsFor(q.period));
    if (!buckets.length) return { buckets: [], from: state.today, to: state.today };
    return { buckets: buckets, from: buckets[0].from, to: buckets[buckets.length - 1].to };
  }

  function categoricalGroups(q, tickets, dim) {
    var map = {};
    function add(key, label, ticket, order) {
      if (key == null || key === "") return;
      if (!map[key]) map[key] = { label: label, tickets: [], order: order || 0 };
      map[key].tickets.push(ticket);
    }
    tickets.forEach(function (tk) {
      var wi = (new Date(tk.date + "T00:00:00").getDay() + 6) % 7;
      if (dim === "weekday") {
        add(String(wi), t(WEEKDAY_KEYS[wi]), tk, wi);
      } else if (dim === "staff") {
        var s = staffById(tk.stylist);
        add(tk.stylist, s ? s.name : tk.stylist, tk);
      } else if (dim === "gender") {
        var c = clientById(tk.client);
        add(c ? c.gender_line : "unknown", c ? t(c.gender_line) : "?", tk);
      } else if (dim === "client") {
        var cl = clientById(tk.client);
        add(tk.client, cl ? cl.name : tk.client, tk);
      } else if (dim === "service") {
        ticketServices(tk).forEach(function (l) { add(l.k, svcName(l.k), tk); });
      } else if (dim === "product") {
        ticketProducts(tk).forEach(function (l) { add(l.k, prodName(l.k), tk); });
      } else if (dim === "payment") {
        tk.payments.forEach(function (p) { add(p.m, t(p.m), tk); });
      }
    });
    var groups = Object.keys(map).map(function (k) {
      return { label: map[k].label, tickets: map[k].tickets, order: map[k].order, value: metricValue(q.metric, map[k].tickets, null, null) };
    });
    if (dim === "weekday") groups.sort(function (a, b) { return a.order - b.order; });
    else {
      groups.sort(function (a, b) { return b.value - a.value; });
      groups = groups.slice(0, q.limit || 10);
    }
    return groups;
  }

  function analyticsGroups(q) {
    var range = queryRange(q);
    var tickets = D.tickets.filter(function (t) { return t.date >= range.from && t.date <= range.to && passesFilters(t, q); });
    var dim = q.dimension;
    if (dim === "day" || dim === "week" || dim === "month") {
      return range.buckets.map(function (b) {
        var bt = tickets.filter(function (t) { return t.date >= b.from && t.date <= b.to; });
        return { label: b.label, value: metricValue(q.metric, bt, b.from, b.to), tickets: bt, from: b.from, to: b.to, order: 0 };
      });
    }
    return categoricalGroups(q, tickets, dim);
  }

  function compareSplit(q, group) {
    var tickets = group.tickets;
    var out = {};
    if (q.compare === "new_ret") {
      out[t("new_clients")] = metricValue("new_clients", tickets, group.from, group.to);
      out[t("returning_clients")] = metricValue("returning", tickets, group.from, group.to);
      return out;
    }
    tickets.forEach(function (tk) {
      var keys;
      if (q.compare === "payment") keys = tk.payments.map(function (p) { return t(p.m); });
      else if (q.compare === "gender") { var c = clientById(tk.client); keys = [c ? t(c.gender_line) : t("womens")]; }
      else if (q.compare === "staff") { var s = staffById(tk.stylist); keys = [s ? s.name : tk.stylist]; }
      else if (q.compare === "group") keys = ticketServices(tk).map(function (l) { var g = (D.services[l.k] || {}).group || "other"; return t("group_" + g); });
      else keys = [t("pending")];
      var v = metricValue(q.metric, [tk], null, null);
      keys.forEach(function (k) { out[k] = (out[k] || 0) + v; });
    });
    return out;
  }

  function compareSeries(q, groups) {
    var splitKeys = [], seriesMap = {};
    groups.forEach(function (g) {
      var sp = compareSplit(q, g);
      Object.keys(sp).forEach(function (k) { if (splitKeys.indexOf(k) === -1) splitKeys.push(k); });
      seriesMap[g.label] = sp;
    });
    return splitKeys.map(function (k) {
      return { name: k, values: groups.map(function (g) { return seriesMap[g.label][k] || 0; }), color: colorFor(splitKeys.indexOf(k)) };
    });
  }

  function heatmapChartForQuery(q) {
    var range = queryRange(q);
    var tickets = D.tickets.filter(function (t) { return t.date >= range.from && t.date <= range.to && passesFilters(t, q); });
    var dayT = { mon: t("mon"), tue: t("tue"), wed: t("wed"), thu: t("thu"), fri: t("fri"), sat: t("sat"), sun: t("sun") };
    var weeks = {};
    tickets.forEach(function (t) { weeks[weekLabel(t.date)] = true; });
    var weekOrder = Object.keys(weeks).sort(function (a, b) { return +a.slice(1) - +b.slice(1); });
    var rows = WEEKDAY_KEYS.map(function (d) { return { label: dayT[d], values: weekOrder.map(function () { return 0; }) }; });
    tickets.forEach(function (t) {
      var wi = weekOrder.indexOf(weekLabel(t.date));
      var di = (new Date(t.date + "T00:00:00").getDay() + 6) % 7;
      if (wi > -1) rows[di].values[wi] += metricValue(q.metric, [t], null, null);
    });
    return heatmapChart(rows, weekOrder, {});
  }

  function metricOptions() {
    return [
      ["revenue", "💰 " + t("metric_revenue")],
      ["visits", "🧾 " + t("metric_visits")],
      ["avg_ticket", "🎟️ " + t("metric_avg_ticket")],
      ["returning", "🔁 " + t("metric_returning")],
      ["new_clients", "🆕 " + t("metric_new_clients")],
      ["product_qty", "🧴 " + t("metric_product_qty")],
      ["commission", "💵 " + t("metric_commission")]
    ];
  }

  function dimensionOptions() {
    return [
      ["day", t("dim_day")], ["week", t("dim_week")], ["month", t("dim_month")], ["weekday", t("dim_weekday")],
      ["staff", t("dim_staff")], ["service", t("dim_service")], ["product", t("dim_product")],
      ["payment", t("dim_payment")], ["gender", t("dim_gender")], ["client", t("dim_client")]
    ];
  }

  function compareOptions() {
    return [
      ["", t("compare_none")], ["new_ret", t("compare_new_ret")], ["payment", t("compare_payment")],
      ["gender", t("compare_gender")], ["staff", t("compare_staff")], ["group", t("compare_group")]
    ];
  }

  function chartOptions() {
    return [
      ["auto", t("chart_auto")], ["bars", t("chart_bars")], ["line", t("chart_line")],
      ["donut", t("chart_donut")], ["bars-h", t("chart_bars_h")], ["heatmap", t("chart_heatmap")]
    ];
  }

  function periodOptions() {
    return [["daily", t("daily")], ["weekly", t("weekly")], ["monthly", t("monthly")], ["custom", t("period_custom")], ["all", t("period_all")]];
  }

  function staffFilterOptions() {
    var opts = [["", t("filter_none")]];
    D.staff.forEach(function (s) { if (s.role === "stylist" || s.role === "assistant") opts.push([s.id, s.name]); });
    return opts;
  }

  function genderFilterOptions() {
    return [["", t("filter_none")], ["women", t("womens")], ["men", t("mens")]];
  }

  function paymentFilterOptions() {
    return [["", t("filter_none")], ["cash", t("cash")], ["card", t("card")], ["mobile", t("mobile")], ["gift_card", t("gift_card")], ["voucher", t("voucher")]];
  }

  function qSel(id, label, options, val, onchange) {
    return field(label, '<select id="' + id + '"' + (onchange ? ' onchange="Lumiere.' + onchange + '"' : "") + '>' + options.map(function (op) {
      return '<option value="' + op[0] + '"' + (val === op[0] ? " selected" : "") + '>' + esc(op[1]) + '</option>';
    }).join("") + '</select>');
  }

  function renderBuilder() {
    var q = analyticsDraft || { metric: "revenue", dimension: "day", compare: "", chart: "auto", period: analyticsPeriod, staff: "", gender: "", payment: "", limit: 10 };
    return '<div class="card"><h3>🧪 ' + t("analytics_builder") + '</h3>' +
      '<div class="form-row" style="grid-template-columns:1fr 1fr 1fr 1fr">' +
      qSel("qMetric", t("metric"), metricOptions(), q.metric) +
      qSel("qPeriod", t("period"), periodOptions(), q.period, "syncPeriod(this.value)") +
      qSel("qDim", t("group_by"), dimensionOptions(), q.dimension) +
      qSel("qCompare", t("compare"), compareOptions(), q.compare) +
      '</div>' +
      (q.period === "custom" ? '<div class="form-row" style="grid-template-columns:1fr 1fr">' +
        field(t("from_date"), '<input id="qFrom" type="date" value="' + esc(q.from || "") + '" max="' + esc(q.to || state.today) + '">') +
        field(t("to_date"), '<input id="qTo" type="date" value="' + esc(q.to || state.today) + '" min="' + esc(q.from || "") + '">') +
        '<div class="form-field full"><p class="muted">' + t("custom_range_note") + '</p></div>' +
        '</div>' : "") +
      '<div class="form-row" style="grid-template-columns:1fr 1fr 1fr 1fr">' +
      qSel("qChart", t("chart_type"), chartOptions(), q.chart) +
      qSel("qStaff", t("filter_staff"), staffFilterOptions(), q.staff) +
      qSel("qGender", t("filter_gender"), genderFilterOptions(), q.gender) +
      qSel("qPay", t("filter_payment"), paymentFilterOptions(), q.payment) +
      '</div>' +
      '<div class="form-row" style="grid-template-columns:1fr auto auto auto;align-items:end">' +
      field(t("top_n"), '<input id="qLimit" type="number" min="1" max="50" value="' + (q.limit || 10) + '">') +
      '<div class="form-field" style="align-self:end"><button class="btn" onclick="Lumiere.runAnalytics()">▶ ' + t("run") + '</button></div>' +
      '<div class="form-field" style="align-self:end"><button class="btn ghost" onclick="Lumiere.saveAnalyticsQuery()">💾 ' + t("save_query") + '</button></div>' +
      '<div class="form-field" style="align-self:end"><button class="btn ghost" onclick="Lumiere.exportQueryCSV()">⬇ ' + t("export_result") + '</button></div>' +
      '</div></div>';
  }

  function readDraftFromForm() {
    var range = dataRange();
    var from = inputVal("qFrom", "");
    var to = inputVal("qTo", "");
    analyticsDraft = {
      metric: inputVal("qMetric", "revenue"),
      dimension: inputVal("qDim", "day"),
      compare: inputVal("qCompare", ""),
      chart: inputVal("qChart", "auto"),
      period: inputVal("qPeriod", analyticsPeriod),
      staff: inputVal("qStaff", ""),
      gender: inputVal("qGender", ""),
      payment: inputVal("qPay", ""),
      limit: Math.max(1, numVal("qLimit", 10) || 10),
      from: from,
      to: to
    };
    if (analyticsDraft.period === "custom") {
      if (!analyticsDraft.from) analyticsDraft.from = range.from;
      if (!analyticsDraft.to) analyticsDraft.to = range.to;
      if (analyticsDraft.from > analyticsDraft.to) {
        var tmp = analyticsDraft.from;
        analyticsDraft.from = analyticsDraft.to;
        analyticsDraft.to = tmp;
      }
    }
    return analyticsDraft;
  }

  function queryTitle(q) {
    var parts = [t("metric_" + q.metric), t("dim_" + q.dimension)];
    if (q.compare) parts.push(t("compare_" + q.compare));
    if (q.staff) parts.push((staffById(q.staff) || { name: q.staff }).name);
    if (q.gender) parts.push(t(q.gender === "men" ? "mens" : "womens"));
    if (q.payment) parts.push(t(q.payment));
    if (q.period === "custom" && q.from && q.to) parts.push(q.from + " → " + q.to);
    else if (q.period === "all") parts.push(t("period_all"));
    return parts.join(" · ");
  }

  function defaultQueries() {
    return [
      { id: "q1", metric: "revenue", dimension: "day", compare: "", chart: "auto", period: "daily", staff: "", gender: "", payment: "", limit: 10 },
      { id: "q2", metric: "revenue", dimension: "payment", compare: "", chart: "donut", period: "daily", staff: "", gender: "", payment: "", limit: 10 },
      { id: "q3", metric: "revenue", dimension: "staff", compare: "", chart: "bars-h", period: "daily", staff: "", gender: "", payment: "", limit: 10 },
      { id: "q4", metric: "revenue", dimension: "service", compare: "", chart: "donut", period: "daily", staff: "", gender: "", payment: "", limit: 10 },
      { id: "q5", metric: "visits", dimension: "weekday", compare: "", chart: "bars", period: "weekly", staff: "", gender: "", payment: "", limit: 10 },
      { id: "q6", metric: "visits", dimension: "week", compare: "new_ret", chart: "auto", period: "weekly", staff: "", gender: "", payment: "", limit: 10 },
      { id: "q7", metric: "revenue", dimension: "week", compare: "", chart: "line", period: "weekly", staff: "", gender: "", payment: "", limit: 10 },
      { id: "q8", metric: "revenue", dimension: "week", compare: "", chart: "heatmap", period: "weekly", staff: "", gender: "", payment: "", limit: 10 },
      { id: "q9", metric: "revenue", dimension: "month", compare: "", chart: "line", period: "monthly", staff: "", gender: "", payment: "", limit: 10 },
      { id: "q10", metric: "commission", dimension: "staff", compare: "", chart: "bars-h", period: "monthly", staff: "", gender: "", payment: "", limit: 10 },
      { id: "q11", metric: "revenue", dimension: "gender", compare: "", chart: "donut", period: "monthly", staff: "", gender: "", payment: "", limit: 10 }
    ];
  }

  var PERIOD_ORDER = ["daily", "weekly", "monthly", "custom", "all"];

  function periodLabel(p) {
    return p === "daily" ? t("daily") : p === "weekly" ? t("weekly") : p === "monthly" ? t("monthly") : p === "custom" ? t("period_custom") : p === "all" ? t("period_all") : t("other");
  }

  function loadQueries() {
    try {
      var s = JSON.parse(localStorage.getItem("lumiere_analytics_queries") || "null");
      if (Array.isArray(s)) return s;
    } catch (e) {}
    return defaultQueries();
  }

  function saveQueries() {
    try { localStorage.setItem("lumiere_analytics_queries", JSON.stringify(analyticsQueries)); } catch (e) {}
  }

  function renderQueryResult(q) {
    var isMoney = METRICS[q.metric] && METRICS[q.metric].money;
    var fv = function (v) { return isMoney ? ars(v) : fmt(v); };
    if (q.chart === "heatmap") {
      return '<div class="card chart-card"><h3>' + esc(queryTitle(q)) + '</h3>' + heatmapChartForQuery(q) + '</div>';
    }
    var groups = analyticsGroups(q);
    if (!groups.length) return '<div class="card"><h3>' + t("no_results") + '</h3></div>';
    var labels = groups.map(function (g) { return g.label; });
    var values = groups.map(function (g) { return g.value; });
    var total = sum(values);
    var timeDim = ["day", "week", "month"].indexOf(q.dimension) > -1;
    var period = (q.period === "all" || q.period === "custom") ? "daily" : q.period;

    var html = '<div class="card chart-card"><h3>' + esc(queryTitle(q)) + '</h3>';
    if (q.compare) {
      var series = compareSeries(q, groups);
      html += multiBarChart(labels, series, { stacked: timeDim, fmt: fv });
    } else if (q.chart === "donut") {
      html += donutChart(groups.map(function (g) { return { label: g.label, value: g.value, valueText: fv(g.value) }; }));
    } else if (q.chart === "bars-h" || (!timeDim && q.chart !== "bars" && q.chart !== "line")) {
      html += barRows(groups.map(function (g) { return { label: g.label, value: g.value, valueText: fv(g.value) }; }), { period: period });
    } else {
      html += timeChart(labels, values, { type: q.chart === "line" ? "line" : "bars", period: period, id: "aq_" + (q.id || "draft") });
    }
    html += '</div>';

    var trows = [[t("metric_" + q.metric), t("total"), "%"]];
    groups.forEach(function (g) {
      trows.push([esc(g.label), fv(g.value), (total ? Math.round(g.value / total * 100) : 0) + "%"]);
    });
    html += table(trows, { numCols: [1, 2] });
    return html;
  }

  function renderAnalytics() {
    if (!analyticsQueries) analyticsQueries = loadQueries();
    var html = '<div class="toolbar"><h2>📈 ' + t("sec_analytics") + '</h2><span class="spacer"></span>' +
      periodSeg() +
      '<button class="btn ghost" onclick="Lumiere.exportCSV()">⬇ ' + t("export_csv") + '</button></div>';
    html += '<p class="muted" style="margin-bottom:16px">' + t("analytics_builder_note") + '</p>';
    html += renderBuilder();

    if (analyticsDraft) {
      html += sectionTitle("▶ " + t("query_result"));
      html += renderQueryResult(analyticsDraft);
    }

    if (analyticsQueries.length) {
      html += sectionTitle("📌 " + t("saved_queries"));
      html += '<div class="starter-bar"><span>' + t("starter_packs") + ':</span>' +
        '<button class="btn ghost sm" onclick="Lumiere.loadStarterPack(\'daily\')">' + t("daily") + '</button>' +
        '<button class="btn ghost sm" onclick="Lumiere.loadStarterPack(\'weekly\')">' + t("weekly") + '</button>' +
        '<button class="btn ghost sm" onclick="Lumiere.loadStarterPack(\'monthly\')">' + t("monthly") + '</button>' +
        '<button class="btn ghost sm" onclick="Lumiere.loadStarterPack(\'all\')">' + t("all_packs") + '</button></div>';
      PERIOD_ORDER.forEach(function (p) {
        var pack = analyticsQueries.filter(function (q) { return q.period === p; });
        if (!pack.length) return;
        html += '<div class="aq-group"><div class="aq-group-title">' + periodLabel(p) + '</div>';
        pack.forEach(function (q) {
          var i = analyticsQueries.indexOf(q);
          html += '<div class="aq-wrap"><div class="aq-head"><strong>' + esc(queryTitle(q)) + '</strong><span class="aq-actions">' +
            '<button class="btn ghost sm" onclick="Lumiere.editAnalyticsQuery(' + i + ')">' + icon("edit", 13) + '</button>' +
            '<button class="btn danger sm" onclick="Lumiere.removeAnalyticsQuery(' + i + ')">' + icon("trash", 13) + '</button>' +
            '</span></div>' + renderQueryResult(q) + '</div>';
        });
        html += '</div>';
      });
      var rest = analyticsQueries.filter(function (q) { return PERIOD_ORDER.indexOf(q.period) === -1; });
      if (rest.length) {
        html += '<div class="aq-group"><div class="aq-group-title">' + t("other") + '</div>';
        rest.forEach(function (q) {
          var i = analyticsQueries.indexOf(q);
          html += '<div class="aq-wrap"><div class="aq-head"><strong>' + esc(queryTitle(q)) + '</strong><span class="aq-actions">' +
            '<button class="btn ghost sm" onclick="Lumiere.editAnalyticsQuery(' + i + ')">' + icon("edit", 13) + '</button>' +
            '<button class="btn danger sm" onclick="Lumiere.removeAnalyticsQuery(' + i + ')">' + icon("trash", 13) + '</button>' +
            '</span></div>' + renderQueryResult(q) + '</div>';
        });
        html += '</div>';
      }
      html += '<div style="margin-top:14px"><button class="btn danger sm" onclick="Lumiere.clearAnalyticsQueries()">🧹 ' + t("clear_all") + '</button></div>';
    } else {
      html += '<div class="starter-bar"><span>' + t("starter_packs") + ':</span>' +
        '<button class="btn ghost sm" onclick="Lumiere.loadStarterPack(\'daily\')">' + t("daily") + '</button>' +
        '<button class="btn ghost sm" onclick="Lumiere.loadStarterPack(\'weekly\')">' + t("weekly") + '</button>' +
        '<button class="btn ghost sm" onclick="Lumiere.loadStarterPack(\'monthly\')">' + t("monthly") + '</button>' +
        '<button class="btn ghost sm" onclick="Lumiere.loadStarterPack(\'all\')">' + t("all_packs") + '</button></div>';
      html += '<p class="muted">' + t("no_saved_queries") + '</p>';
    }
    return html;
  }

  /* ------------------------- Business rules ------------------------- */

  var DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

  function renderRules() {
    var s = D.settings;
    var html = '<div class="toolbar"><h2>⚙️ ' + t("sec_rules") + '</h2></div>';

    html += '<div class="grid cols-2">';

    html += '<div class="card"><h3>🕐 ' + t("operating_hours") + '</h3>';
    html += '<div class="form-row">' +
      field(t("open_time"), '<input id="rOpen" type="time" value="' + esc(s.openTime) + '">') +
      field(t("close_time"), '<input id="rClose" type="time" value="' + esc(s.closeTime) + '">') +
      '</div>';
    html += '<div class="form-field" style="margin-bottom:10px"><label>' + t("closed_days") + '</label><div class="day-check">';
    for (var d = 0; d < 7; d++) {
      var checked = s.closedDays.indexOf(d) > -1;
      html += '<label class="day-chip"><input type="checkbox" id="rDay' + d + '"' + (checked ? " checked" : "") + '> ' + t(DAY_KEYS[d]) + '</label>';
    }
    html += '</div></div>';
    html += '<div class="form-field" style="margin-bottom:12px"><label><input type="checkbox" id="rNight"' + (s.nightCloseEnabled ? " checked" : "") + '> ' + t("night_close") + '</label>' +
      '<p class="muted">' + t("night_close_desc") + '</p></div>';
    html += '<button class="btn" onclick="Lumiere.saveHours()">' + t("save") + '</button></div>';

    html += '<div class="card"><h3>📋 ' + t("business_rules") + '</h3>';
    s.predefinedRules.forEach(function (r) {
      html += '<label class="rule-row"><span>' + (lang === "es" ? r.label_es : r.label_en) + '</span>' +
        '<input type="checkbox" id="pr_' + r.key + '"' + (r.enabled ? " checked" : "") + ' onchange="Lumiere.togglePredefined(\'' + r.key + '\',this.checked)"></label>';
    });
    html += '</div>';

    html += '</div>';

    html += sectionTitle("✨ " + t("custom_rules"));
    html += '<div class="card">';
    var rows = [[t("rule_name"), t("rule_value"), t("enabled"), ""]];
    s.customRules.forEach(function (r, i) {
      rows.push([esc(r.name), esc(r.value),
        '<input type="checkbox" ' + (r.enabled ? "checked" : "") + ' onchange="Lumiere.toggleCustomRule(' + i + ',this.checked)">',
        '<button class="btn danger sm" onclick="Lumiere.removeCustomRule(' + i + ')">' + icon("trash", 13) + '</button>']);
    });
    html += table(rows);
    html += '<div class="form-row" style="grid-template-columns:1fr 1fr 1fr auto;align-items:end;margin-top:14px">' +
      field(t("rule_name"), '<input id="crName" placeholder="' + esc(t("rule_name")) + '">') +
      field(t("rule_value"), '<input id="crValue" placeholder="' + esc(t("rule_value")) + '">') +
      '<div></div>' +
      '<button class="btn" onclick="Lumiere.addCustomRule()">' + icon("plus", 14) + ' ' + t("add_rule") + '</button>' +
      '</div></div>';

    return html;
  }

  /* ------------------------- Reports ------------------------- */

  function renderReports() {
    var html = '<div class="toolbar"><h2>📊 ' + t("sec_reports") + '</h2><span class="spacer"></span>' +
      periodSeg() +
      '<button class="btn ghost" onclick="Lumiere.exportCSV()">⬇ ' + t("export_csv") + '</button></div>';

    var buckets = bucketsFor(analyticsPeriod);
    var labels = buckets.map(function (b) { return b.label; });
    var revs = buckets.map(function (b) { return bucketStats(b).revenue; });
    var visits = buckets.map(function (b) { return bucketStats(b).tickets; });
    var news = buckets.map(function (b) { return bucketStats(b).newClients; });
    var totalRev = sum(revs), totalVisits = sum(visits);

    html += cards([
      metric("💰 " + t("revenue_ars"), ars(totalRev), "", "revenue"),
      metric("🧾 " + t("visits"), totalVisits, "", "tickets"),
      metric("🎟️ " + t("avg_ticket"), ars(totalVisits ? Math.round(totalRev / totalVisits) : 0), "", "cash"),
      metric("🆕 " + t("new_clients"), sum(news), "", "newClients")
    ]);

    html += '<div class="grid cols-2">';
    html += chartCard(t("revenue_trend") + " (" + t(analyticsPeriod) + ")", timeChart(labels, revs, { type: analyticsPeriod === "weekly" ? "line" : "bars", period: analyticsPeriod, id: "rp_rev" }));
    var t1 = [[t("time"), "ARS", t("visits"), t("new_clients")]];
    buckets.forEach(function (b, i) {
      var st = bucketStats(b);
      t1.push([b.label, ars(st.revenue), st.tickets, st.newClients]);
    });
    html += table(t1, { numCols: [1, 2, 3] });
    html += '</div>';

    var serv = {}, servCnt = {};
    D.tickets.forEach(function (t) { ticketServices(t).forEach(function (l) { serv[l.k] = (serv[l.k] || 0) + lineTotal(l); servCnt[l.k] = (servCnt[l.k] || 0) + l.q; }); });
    var servArr = Object.keys(serv).map(function (k) { return { k: k, v: serv[k], q: servCnt[k] }; }).sort(function (a, b) { return b.v - a.v; });
    var servParts = servArr.slice(0, 7).map(function (r) { return { label: svcName(r.k), value: r.v, valueText: ars(r.v) }; });
    html += '<div class="grid cols-2">';
    html += chartCard(t("service_mix"), donutChart(servParts));
    var t2 = [[t("services"), t("visits"), "ARS", "%"]];
    servArr.forEach(function (r) {
      t2.push([svcName(r.k), r.q, ars(r.v), totalRev ? Math.round(r.v / totalRev * 100) + "%" : "0%"]);
    });
    html += table(t2, { numCols: [1, 2, 3] });
    html += '</div>';

    var pay = {};
    D.tickets.forEach(function (t) { t.payments.forEach(function (p) { pay[p.m] = (pay[p.m] || 0) + p.a; }); });
    var payKeys = ["cash", "card", "mobile", "gift_card", "voucher"].filter(function (m) { return pay[m]; });
    var payParts = payKeys.map(function (m) { return { label: t(m), value: pay[m], valueText: ars(pay[m]) }; });
    html += '<div class="grid cols-2">';
    html += chartCard(t("payment_split"), payParts.length ? donutChart(payParts) : '<p class="muted">' + t("pending") + '</p>');
    var t3 = [[t("payments"), "ARS", "%"]];
    payKeys.forEach(function (m) { t3.push([t(m), ars(pay[m]), totalRev ? Math.round(pay[m] / totalRev * 100) + "%" : "0%"]); });
    html += table(t3, { numCols: [1, 2] });
    html += '</div>';

    var byG = { men: 0, women: 0 };
    D.tickets.forEach(function (t) {
      var c = clientById(t.client);
      byG[c ? c.gender_line : "women"] += ticketTotal(t);
    });
    var gParts = [
      { label: t("mens"), value: byG.men, valueText: ars(byG.men) + " · " + (totalRev ? Math.round(byG.men / totalRev * 100) : 0) + "%" },
      { label: t("womens"), value: byG.women, valueText: ars(byG.women) + " · " + (totalRev ? Math.round(byG.women / totalRev * 100) : 0) + "%" }
    ];
    var byC = groupBy(D.tickets, function (t) { return t.client; });
    var topC = Object.keys(byC).map(function (k) {
      return { label: (clientById(k) || {}).name || k, value: sum(byC[k].map(ticketTotal)), valueText: ars(sum(byC[k].map(ticketTotal))) };
    }).sort(function (a, b) { return b.value - a.value; }).slice(0, 6);
    html += '<div class="grid cols-2">';
    html += chartCard(t("gender_segments"), donutChart(gParts));
    html += chartCard(t("top_clients"), barRows(topC, { period: analyticsPeriod, index: true }));
    html += '</div>';

    var from = buckets[0].from, to = buckets[buckets.length - 1].to;
    var commTickets = D.tickets.filter(function (t) { return t.date >= from && t.date <= to; });
    html += sectionTitle("💵 " + t("commission_totals"));
    html += table(renderCommission(commTickets), { numCols: [1, 2, 3] });

    return html;
  }

  var renderers = {
    today: renderToday,
    week: renderWeek,
    month: renderMonth,
    appointments: renderAppointments,
    checkout: renderCheckout,
    clients: renderClients,
    staff: renderStaff,
    services: renderServices,
    products: renderProducts,
    sales: renderSales,
    commission: renderCommissionRates,
    reports: renderReports,
    analytics: renderAnalytics,
    rules: renderRules
  };

  /* ------------------------- Clock & open/closed ------------------------- */

  function toMin(hm) {
    var p = String(hm || "00:00").split(":");
    return (+p[0]) * 60 + (+p[1] || 0);
  }
  function isOpenNow() {
    var s = D.settings;
    if (!s.nightCloseEnabled) return true;
    var now = new Date();
    if ((s.closedDays || []).indexOf(now.getDay()) > -1) return false;
    var hm = now.getHours() * 60 + now.getMinutes();
    return hm >= toMin(s.openTime) && hm < toMin(s.closeTime);
  }
  function nextOpenLabel() {
    var s = D.settings;
    var open = s.openTime;
    var now = new Date();
    var dow = now.getDay();
    for (var i = 0; i < 8; i++) {
      var d = (dow + i) % 7;
      if (s.closedDays.indexOf(d) === -1) {
        if (i === 0 && toMin(s.closeTime) > now.getHours() * 60 + now.getMinutes()) {
          return t("opens_at") + " " + open;
        }
        if (i === 0) return t("opens_at") + " " + open + " " + t(DAY_KEYS[d]);
        return t(DAY_KEYS[d]) + " " + open;
      }
    }
    return open;
  }

  function updateClock() {
    var now = new Date();
    var hm = pad2(now.getHours()) + ":" + pad2(now.getMinutes());
    var hms = hm + ":" + pad2(now.getSeconds());
    var el = document.getElementById("clock");
    if (el) el.textContent = hms;
    var de = document.getElementById("clockDate");
    if (de) {
      try { de.textContent = now.toLocaleDateString(lang === "es" ? "es-AR" : "en-US", { weekday: "short", day: "numeric", month: "short" }); }
      catch (e) { de.textContent = now.toLocaleDateString(); }
    }
    var op = document.getElementById("openPill");
    if (op) {
      var open = isOpenNow() || forceOpen;
      op.textContent = open ? t("now_open") : t("now_closed");
      op.className = "pill " + (open ? "open" : "closed");
    }
    var ov = document.getElementById("ovClock");
    if (ov) ov.textContent = hms;
    var ovDate = document.getElementById("ovDate");
    if (ovDate) {
      try { ovDate.textContent = now.toLocaleDateString(lang === "es" ? "es-AR" : "en-US", { weekday: "long", day: "numeric", month: "long" }); }
      catch (e) {}
    }
    var ovOpen = document.getElementById("ovOpenAt");
    if (ovOpen) ovOpen.textContent = nextOpenLabel();
    updateOverlay();
  }

  function updateOverlay() {
    var ov = document.getElementById("closedOverlay");
    if (!ov) return;
    var show = !(isOpenNow() || forceOpen);
    ov.style.display = show ? "flex" : "none";
    var fb = document.getElementById("ovForceBtn");
    var rb = document.getElementById("ovResetBtn");
    if (fb) fb.style.display = (canEdit() && show && !forceOpen) ? "" : "none";
    if (rb) rb.style.display = (canEdit() && show && forceOpen) ? "" : "none";
  }

  function render() {
    var el = document.getElementById("view");
    if (renderers[sec]) el.innerHTML = renderers[sec]();
    else el.innerHTML = "";

    document.querySelectorAll("[data-i18n]").forEach(function (n) {
      var txt = t(n.getAttribute("data-i18n"));
      var svg = n.querySelector("svg");
      if (svg) {
        Array.prototype.slice.call(n.childNodes).forEach(function (c) {
          if (c.nodeType === 3) n.removeChild(c);
        });
        n.appendChild(document.createTextNode(txt));
      } else {
        n.textContent = txt;
      }
    });

    var langEl = document.getElementById("lang");
    if (langEl) langEl.textContent = lang === "en" ? "ES" : "EN";
    var dayEl = document.getElementById("dayLabel");
    if (dayEl) dayEl.textContent = state.today;
    var roleEl = document.getElementById("role");
    if (roleEl) roleEl.value = role;

    document.querySelectorAll(".nav-item").forEach(function (b) {
      var s = b.getAttribute("data-sec");
      var vis = canSee(s);
      b.classList.toggle("hidden", !vis);
      b.classList.toggle("active", vis && s === sec);
    });

    updateClock();
  }

  function navigate(s) {
    if (!canSee(s)) s = "today";
    editTarget = null;
    searchQ = "";
    sec = s;
    render();
  }

  /* ------------------------- CSV export ------------------------- */

  function csvEscape(s) {
    s = String(s == null ? "" : s);
    if (/[",\r\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function downloadFile(name, text) {
    var blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 200);
  }

  function buildSalesCSV() {
    var rows = [["Date", "Seq", "Client", "Client ID", "Stylist", "Assistant", "Items", "Total ARS", "Payment"]];
    D.tickets.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; }).forEach(function (tk) {
      var c = clientById(tk.client), s = staffById(tk.stylist), as = staffById(tk.assistant);
      var items = tk.lines.map(function (l) {
        var n = l.t === "service" ? svcName(l.k) : prodName(l.k);
        return n + " x" + l.q;
      }).join("; ");
      var pay = tk.payments.map(function (p) { return t(p.m) + " " + p.a; }).join(" + ");
      rows.push([tk.date, tk.seq, c ? c.name : tk.client, tk.client, s ? s.name : tk.stylist, as ? as.name : "", items, ticketTotal(tk), pay]);
    });
    return rows.map(function (r) { return r.map(csvEscape).join(","); }).join("\n");
  }

  /* ------------------------- window.Lumiere API ------------------------- */

  window.Lumiere = {
    navigate: navigate,
    newAppointment: function () { alert(t("demo_new_appt")); },

    addCheckoutLine: addCheckoutLine,
    removeCheckoutLine: removeCheckoutLine,
    completeCheckout: completeCheckout,

    exportCSV: function () { downloadFile("lumiere-sales.csv", buildSalesCSV()); },

    filterClients: function (q) {
      searchQ = q || "";
      var rows = document.querySelectorAll(".client-row");
      rows.forEach(function (r) {
        var name = (r.getAttribute("data-name") || "").toLowerCase();
        var id = (r.getAttribute("data-id") || "").toLowerCase();
        var m = !searchQ || name.indexOf(searchQ) > -1 || id.indexOf(searchQ) > -1;
        r.style.display = m ? "" : "none";
      });
    },

    startClientForm: function (mode, id) { editTarget = { kind: "client", mode: mode || "add", id: id || null }; render(); },
    startStaffForm: function (mode, id) { editTarget = { kind: "staff", mode: mode || "add", id: id || null }; render(); },
    startServiceForm: function (mode, id) { editTarget = { kind: "service", mode: mode || "add", id: id || null }; render(); },
    startProductForm: function (mode, id) { editTarget = { kind: "product", mode: mode || "add", id: id || null }; render(); },
    cancelForm: function () { editTarget = null; render(); },

    saveClient: function () {
      var name = inputVal("cName", "").trim();
      if (!name) return;
      var gender = inputVal("cGender", "women");
      var phone = inputVal("cPhone", "").trim();
      if (editTarget.mode === "edit") {
        var c = clientById(editTarget.id);
        if (c) { c.name = name; c.gender_line = gender; c.phone = phone; c.status = inputVal("cStatus", "active"); }
      } else {
        D.clients.push({ id: nextClientId(), name: name, gender_line: gender, phone: phone, first_visit: state.today, visits: [], status: "active" });
      }
      save(); editTarget = null; render();
    },
    deleteClient: function (id) {
      D.clients = D.clients.filter(function (c) { return c.id !== id; });
      save(); render();
    },

    saveStaff: function () {
      var name = inputVal("sName", "").trim();
      if (!name) return;
      var r = inputVal("sRole", "stylist");
      var sh = inputVal("sShift", "");
      var st = inputVal("sStatus", "active");
      if (editTarget.mode === "edit") {
        var s = staffById(editTarget.id);
        if (s) { s.name = name; s.role = r; s.shift = sh; s.status = st; }
      } else {
        var id = r + "-" + (String(D.staff.length + 1).padStart(3, "0")) + "-" + slug(name);
        D.staff.push({ id: id, name: name, role: r, shift: sh, status: st });
      }
      save(); editTarget = null; render();
    },
    deleteStaff: function (id) {
      D.staff = D.staff.filter(function (s) { return s.id !== id; });
      delete D.commissionRates[id];
      save(); render();
    },

    saveService: function () {
      var nameEn = inputVal("svNameEn", "").trim();
      var nameEs = inputVal("svNameEs", "").trim();
      if (!nameEn) return;
      var price = numVal("svPrice", 0);
      var grp = inputVal("svGroup", "hair");
      if (editTarget.mode === "edit") {
        var s = D.services[editTarget.id];
        if (s) { s.name_en = nameEn; s.name_es = nameEs || nameEn; s.price_ars = price; s.group = grp; }
      } else {
        var key = slug(nameEn) || "svc-" + (Object.keys(D.services).length + 1);
        while (D.services[key]) key += "-" + Math.floor(Math.random() * 90 + 10);
        D.services[key] = { name_en: nameEn, name_es: nameEs || nameEn, group: grp, price_ars: price };
      }
      save(); editTarget = null; render();
    },
    deleteService: function (k) {
      delete D.services[k];
      save(); render();
    },

    saveProduct: function () {
      var nameEn = inputVal("pNameEn", "").trim();
      var nameEs = inputVal("pNameEs", "").trim();
      if (!nameEn) return;
      var price = numVal("pPrice", 0);
      var stock = numVal("pStock", 0);
      var reorder = numVal("pReorder", D.settings.lowStockDefault || 5);
      if (editTarget.mode === "edit") {
        var p = D.products[editTarget.id];
        if (p) { p.name_en = nameEn; p.name_es = nameEs || nameEn; p.price_ars = price; p.stock = stock; p.reorder = reorder; }
      } else {
        var key = slug(nameEn) || "prod-" + (Object.keys(D.products).length + 1);
        while (D.products[key]) key += "-" + Math.floor(Math.random() * 90 + 10);
        D.products[key] = { name_en: nameEn, name_es: nameEs || nameEn, price_ars: price, stock: stock, reorder: reorder };
      }
      save(); editTarget = null; render();
    },
    deleteProduct: function (k) {
      delete D.products[k];
      save(); render();
    },

    saveRates: function () {
      D.staff.filter(function (s) { return s.role === "stylist" || s.role === "assistant"; }).forEach(function (s) {
        var sv = parseFloat(inputVal("rate_" + s.id + "_s", "0"));
        var pv = parseFloat(inputVal("rate_" + s.id + "_p", "0"));
        D.commissionRates[s.id] = { service: isNaN(sv) ? 0 : sv, product: isNaN(pv) ? 0 : pv };
      });
      save(); render();
    },

    setAnalyticsPeriod: function (p) {
      analyticsPeriod = p;
      if (analyticsDraft) analyticsDraft.period = p;
      render();
    },

    syncPeriod: function (p) {
      readDraftFromForm();
      analyticsDraft.period = p;
      render();
    },

    runAnalytics: function () {
      readDraftFromForm();
      lastQueryResult = analyticsGroups(analyticsDraft);
      render();
    },
    saveAnalyticsQuery: function () {
      readDraftFromForm();
      var q = { id: "q" + Date.now() };
      ["metric", "dimension", "compare", "chart", "period", "from", "to", "staff", "gender", "payment", "limit"].forEach(function (k) { q[k] = analyticsDraft[k]; });
      if (!analyticsQueries) analyticsQueries = [];
      analyticsQueries.push(q);
      saveQueries();
      render();
    },
    editAnalyticsQuery: function (i) {
      var q = analyticsQueries[i];
      if (!q) return;
      analyticsDraft = {};
      ["metric", "dimension", "compare", "chart", "period", "from", "to", "staff", "gender", "payment", "limit"].forEach(function (k) { analyticsDraft[k] = q[k]; });
      render();
    },
    removeAnalyticsQuery: function (i) {
      analyticsQueries.splice(i, 1);
      saveQueries();
      render();
    },
    clearAnalyticsQueries: function () {
      analyticsQueries = [];
      saveQueries();
      render();
    },
    loadStarterPack: function (period) {
      if (!analyticsQueries) analyticsQueries = loadQueries();
      var has = {};
      analyticsQueries.forEach(function (q) { has[q.id] = true; });
      defaultQueries().forEach(function (q) {
        if (period !== "all" && q.period !== period) return;
        if (has[q.id]) return;
        analyticsQueries.push(q);
        has[q.id] = true;
      });
      saveQueries();
      render();
    },
    exportQueryCSV: function () {
      if (!lastQueryResult || !lastQueryResult.length) return;
      var rows = [["Label", "Value"]].concat(lastQueryResult.map(function (g) { return [g.label, g.value]; }));
      downloadFile("lumiere-query.csv", rows.map(function (r) { return r.map(csvEscape).join(","); }).join("\n"));
    },

    saveHours: function () {
      var s = D.settings;
      s.openTime = inputVal("rOpen", s.openTime);
      s.closeTime = inputVal("rClose", s.closeTime);
      s.closedDays = [];
      for (var d = 0; d < 7; d++) {
        var el = document.getElementById("rDay" + d);
        if (el && el.checked) s.closedDays.push(d);
      }
      var n = document.getElementById("rNight");
      s.nightCloseEnabled = n ? n.checked : true;
      save(); render();
    },
    togglePredefined: function (key, checked) {
      var r = D.settings.predefinedRules.find(function (x) { return x.key === key; });
      if (r) r.enabled = !!checked;
      save();
    },
    toggleCustomRule: function (i, checked) {
      if (D.settings.customRules[i]) D.settings.customRules[i].enabled = !!checked;
      save();
    },
    removeCustomRule: function (i) {
      D.settings.customRules.splice(i, 1);
      save(); render();
    },
    addCustomRule: function () {
      var name = inputVal("crName", "").trim();
      var value = inputVal("crValue", "").trim();
      if (!name) return;
      D.settings.customRules.push({ name: name, value: value, enabled: true });
      save(); render();
    },

    forceOpen: function () { forceOpen = true; updateClock(); },
    resetForceOpen: function () { forceOpen = false; updateClock(); }
  };

  /* ------------------------- listeners ------------------------- */

  document.addEventListener("change", function (e) {
    if (e.target && e.target.id === "apptDate") {
      state.today = e.target.value;
      render();
    }
  });

  document.getElementById("role").addEventListener("change", function (e) {
    role = e.target.value;
    if (role === "receptionist" && !canSee(sec)) sec = "today";
    try { localStorage.setItem("lumiere_role", role); } catch (err) {}
    render();
  });

  document.getElementById("lang").addEventListener("click", function () {
    lang = lang === "en" ? "es" : "en";
    try { localStorage.setItem("lumiere_lang", lang); } catch (err) {}
    render();
  });

  document.querySelectorAll(".nav-item").forEach(function (b) {
    b.addEventListener("click", function () { navigate(b.getAttribute("data-sec")); });
  });

  setInterval(updateClock, 1000);

  render();
  updateClock();
})();
