/* workr live demo — scripted run animator over real, pre-computed workr output */
(function () {
  "use strict";
  var D = window.DEMO;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  function tableHTML(preview, caption) {
    if (!preview) return "";
    var h = '<table class="tbl"><thead><tr>';
    preview.columns.forEach(function (c) { h += "<th>" + esc(c) + "</th>"; });
    h += "</tr></thead><tbody>";
    preview.rows.forEach(function (row) {
      h += "<tr>";
      preview.columns.forEach(function (c) { h += "<td>" + esc(row[c]) + "</td>"; });
      h += "</tr>";
    });
    h += "</tbody></table>";
    if (caption) h += '<div class="caption">' + esc(caption) + "</div>";
    return h;
  }

  /* ---- flatten pipeline into an ordered run list ---- */
  var runList = [];
  D.pipeline.phases.forEach(function (ph) {
    ph.workflows.forEach(function (wf) { runList.push({ wf: wf, phase: ph }); });
  });

  /* ================= Pipeline tab ================= */
  var cardById = {};
  function buildPipeline() {
    var root = $("#pipeline");
    root.innerHTML = "";
    D.pipeline.phases.forEach(function (ph, i) {
      var col = document.createElement("div");
      col.className = "phase";
      var head = '<div class="phase-head" style="background:' + ph.color + '">' + esc(ph.title) + "</div>";
      var cards = ph.workflows.map(function (wf) {
        return '<div class="card" data-id="' + esc(wf.id) + '">' +
          '<div class="cid">' + esc(wf.id) + "</div>" +
          '<div class="ctype">' + esc(wf.type) + "</div>" +
          '<div class="cmeta"><span class="dot"></span>' +
          '<span class="chip">' + wf.steps.length + " step" + (wf.steps.length > 1 ? "s" : "") + "</span>" +
          '<span class="status">idle</span></div></div>';
      }).join("");
      col.innerHTML = head + cards;
      root.appendChild(col);
      if (i < D.pipeline.phases.length - 1) {
        var arr = document.createElement("div");
        arr.className = "arrow"; arr.textContent = "▶";
        root.appendChild(arr);
      }
    });
    root.querySelectorAll(".card").forEach(function (el) {
      cardById[el.getAttribute("data-id")] = el;
      el.addEventListener("click", function () { openModal(findWf(el.getAttribute("data-id"))); });
    });
  }
  function findWf(id) {
    for (var i = 0; i < runList.length; i++) if (runList[i].wf.id === id) return runList[i].wf;
    return null;
  }

  function setState(card, state, statusHTML) {
    card.classList.remove("is-running", "is-done", "is-error");
    if (state) card.classList.add("is-" + state);
    $(".status", card).innerHTML = statusHTML;
  }

  /* ---- log + lData ---- */
  function log(msg, cls) {
    var l = $("#log");
    var line = document.createElement("div");
    if (cls) line.className = cls;
    line.textContent = msg;
    l.appendChild(line);
    l.scrollTop = l.scrollHeight;
  }
  function addLData(wf) {
    var box = $("#ldata");
    if (box.querySelector(".ldata-empty")) box.innerHTML = "";
    var item = document.createElement("div");
    item.className = "ldata-item";
    item.innerHTML = '<div class="k">lData$' + esc(wf.id) + " <span style=\"color:var(--dim)\">(" +
      wf.nrow + " rows)</span></div>" + tableHTML(wf.preview);
    box.appendChild(item);
  }

  var running = false, stepIdx = 0;
  function resetPipeline() {
    stepIdx = 0; running = false;
    Object.keys(cardById).forEach(function (id) { setState(cardById[id], null, "idle"); });
    $("#ldata").innerHTML = '<div class="ldata-empty">lData is empty. Press Run to execute the workflows.</div>';
    $("#log").innerHTML = "";
    $("#btn-run").disabled = false; $("#btn-step").disabled = false;
    log("$ workr::RunProject(\"workflows\")", "run");
  }

  function storage() { return $("#storage").value; }

  async function runOne(entry) {
    var wf = entry.wf, card = cardById[wf.id];
    setState(card, "running", '<span class="spinner"></span> running');
    for (var i = 0; i < wf.steps.length; i++) {
      log("  ▸ " + wf.steps[i].name, "run");
      await sleep(360);
    }
    setState(card, "done", "✓ done");
    log("  ✓ " + wf.id + ": " + wf.nrow + " rows", "ok");
    if (storage() !== "memory") log("  hook(" + storage() + ") ← saved " + wf.id, "hook");
    addLData(wf);
    await sleep(180);
  }

  async function runAll() {
    if (running) return;
    resetPipeline(); running = true;
    $("#btn-run").disabled = true; $("#btn-step").disabled = true;
    for (var i = 0; i < runList.length; i++) await runOne(runList[i]);
    log("✓ project complete — " + runList.length + " workflows across 3 phases", "ok");
    running = false; stepIdx = runList.length;
    $("#btn-run").disabled = false;
  }

  async function stepOne() {
    if (running) return;
    if (stepIdx === 0) { $("#ldata").innerHTML = ""; $("#log").innerHTML = ""; log("$ stepping through RunProject(\"workflows\")", "run"); }
    if (stepIdx >= runList.length) return;
    running = true; $("#btn-run").disabled = true;
    await runOne(runList[stepIdx]);
    stepIdx++;
    running = false; $("#btn-run").disabled = false;
    if (stepIdx >= runList.length) { log("✓ project complete", "ok"); $("#btn-step").disabled = true; }
  }

  /* ================= Discovery tab ================= */
  function buildDiscovery() {
    var call = document.getElementById("disc-call");
    var list = document.getElementById("disc-list");
    function render(includeInactive) {
      var ids = includeInactive ? D.discovery.withInactive : D.discovery.activeSorted;
      list.innerHTML = ids.map(function (id, i) {
        var inactive = D.discovery.activeSorted.indexOf(id) === -1;
        return '<div class="wf-row' + (inactive ? " inactive" : "") + '">' +
          '<span class="p">' + (i + 1) + ".</span> " + esc(id) +
          (inactive ? ' <span class="chip">Active: false</span>' : "") + "</div>";
      }).join("");
      call.textContent = includeInactive
        ? 'MakeWorkflowList("workflows/02_analyze", bActiveOnly = FALSE)'
        : 'MakeWorkflowList("workflows/02_analyze")';
    }
    render(false);
    document.getElementById("disc-toggle").addEventListener("change", function (e) { render(e.target.checked); });
  }

  /* ================= Continue-on-error tab ================= */
  var coeCards = {};
  function buildCoE() {
    var root = document.getElementById("coe-pipeline");
    root.innerHTML = "";
    D.continueOnError.workflows.forEach(function (wf, i) {
      var col = document.createElement("div"); col.className = "phase";
      col.innerHTML = '<div class="phase-head" style="background:' + (wf.status === "error" ? "#f87171" : "#60a5fa") + '">' +
        esc(wf.phase) + "</div>" +
        '<div class="card" data-cid="' + esc(wf.id) + '"><div class="cid">' + esc(wf.id) + "</div>" +
        '<div class="ctype">' + esc(wf.steps[0].name) + "</div>" +
        '<div class="cmeta"><span class="dot"></span><span class="status">idle</span></div></div>';
      root.appendChild(col);
      if (i < D.continueOnError.workflows.length - 1) {
        var a = document.createElement("div"); a.className = "arrow"; a.textContent = "▶"; root.appendChild(a);
      }
      coeCards[wf.id] = col.querySelector(".card");
    });
    document.getElementById("coe-out").innerHTML = "";
  }
  async function runCoE() {
    buildCoE();
    var out = document.getElementById("coe-out");
    var clog = function (m, c) { var d = document.createElement("div"); if (c) d.className = c; d.textContent = m; document.getElementById("coe-log").appendChild(d); };
    document.getElementById("coe-log").innerHTML = "";
    clog('$ RunProject("demo_continue_on_error", bContinueOnError = TRUE)', "run");
    for (var i = 0; i < D.continueOnError.workflows.length; i++) {
      var wf = D.continueOnError.workflows[i], card = coeCards[wf.id];
      setState(card, "running", '<span class="spinner"></span> running');
      clog("  ▸ " + wf.steps[0].name, "run");
      await sleep(700);
      if (wf.status === "error") {
        setState(card, "error", "✗ error");
        clog("  ✗ " + wf.id + ": " + wf.error, "err");
      } else {
        setState(card, "done", "✓ done");
        clog("  ✓ " + wf.id, "ok");
      }
      await sleep(200);
    }
    clog("✓ run completed despite the failure", "ok");
    out.innerHTML = '<div class="section-label">status</div>' + tableHTML(D.continueOnError.status) +
      '<div class="section-label">failures</div>' + tableHTML(D.continueOnError.failures);
  }

  /* ================= Modal ================= */
  function openModal(wf) {
    if (!wf) return;
    var steps = wf.steps.map(function (s, i) {
      var arr = i < wf.steps.length - 1 ? '<div class="down">↓</div>' : "";
      return '<div class="stepflow"><div class="s"><span class="o">' + esc(s.output || "") + "</span> ← " +
        esc(s.name) + "</div>" + arr + "</div>";
    }).join("");
    $("#modal-body").innerHTML =
      "<h2>" + esc(wf.id) + "</h2><div style=\"color:var(--dim);font-size:0.85rem\">" + esc(wf.desc || "") + "</div>" +
      '<div class="section-label">steps</div>' + steps +
      (wf.preview ? '<div class="section-label">output</div>' + tableHTML(wf.preview, wf.nrow + " rows total") : "") +
      '<div class="section-label">workflow yaml</div><pre>' + esc(wf.yaml) + "</pre>";
    $("#modal").classList.add("open");
  }
  function closeModal() { $("#modal").classList.remove("open"); }

  /* ================= Boot ================= */
  document.addEventListener("DOMContentLoaded", function () {
    $("#workr-ver").textContent = "workr " + D.meta.workrVersion;
    buildPipeline(); resetPipeline(); buildDiscovery(); buildCoE();

    $("#btn-run").addEventListener("click", runAll);
    $("#btn-step").addEventListener("click", stepOne);
    $("#btn-reset").addEventListener("click", resetPipeline);
    $("#coe-run").addEventListener("click", runCoE);

    document.querySelectorAll(".tab").forEach(function (t) {
      t.addEventListener("click", function () {
        document.querySelectorAll(".tab").forEach(function (x) { x.classList.remove("active"); });
        document.querySelectorAll(".panel").forEach(function (x) { x.classList.remove("active"); });
        t.classList.add("active");
        document.getElementById(t.getAttribute("data-tab")).classList.add("active");
      });
    });

    $("#modal").addEventListener("click", function (e) { if (e.target.id === "modal") closeModal(); });
    $("#modal-close").addEventListener("click", closeModal);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });
  });
})();
