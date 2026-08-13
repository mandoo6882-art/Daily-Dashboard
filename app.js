// ============================================================
// Daily Progress Dashboard - app.js
// CONFIG.API_ENDPOINT가 채워져 있으면 서버(/api/dashboard-data)에서 실제 데이터를 불러오고,
// 비어있으면 data-config.js의 MOCK_DATA(2026-08-11 스냅샷)로 미리보기를 보여줍니다.
// ============================================================

let charts = {};
let currentData = null;
let selectedDiscipline = null;

async function loadData() {
  // 1순위: 서버 API (나중에 OneDrive 자동 연동 시 이 경로 사용)
  if (CONFIG.API_ENDPOINT) {
    try {
      const res = await fetch(CONFIG.API_ENDPOINT);
      if (res.ok) return await res.json();
    } catch (err) {
      console.error("API fetch failed, trying data.json:", err);
    }
  }
  // 2순위: 담당자가 admin.html에서 매일 내려받아 올려둔 정적 data.json
  try {
    const res = await fetch("./data.json", { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch (err) {
    console.error("data.json fetch failed, using mock data:", err);
  }
  // 3순위: mock 데이터 (미리보기용)
  return MOCK_DATA;
}

function statusClass(status) {
  if (status === "Ahead") return "ahead";
  if (status === "Behind") return "behind";
  if (status === "Yet") return "yet";
  return "";
}

function achievementOf(d) {
  if (!d.dailyPlan || d.dailyPlan === 0) return "not-started";
  if (d.dailyActual >= d.dailyPlan) return "achieved";
  return "not-achieved";
}

function renderProjectInfo(data) {
  const p = (data && data.projectInfo) || CONFIG.PROJECT_INFO || {};
  document.getElementById("projectInfo").textContent = `Cut-off: ${p.cutoff || "--"} | ${p.categories || ""}`;
}

function populateSelector(disciplines) {
  const sel = document.getElementById("disciplineSelect");
  sel.innerHTML = "";
  disciplines.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d.name;
    opt.textContent = d.name;
    sel.appendChild(opt);
  });
  sel.value = selectedDiscipline;
  sel.onchange = () => {
    selectedDiscipline = sel.value;
    renderSelectedDiscipline();
  };
}

function destroyChart(key) {
  if (charts[key]) { charts[key].destroy(); delete charts[key]; }
}

function renderPlanActualBar(canvasId, key, plan, actual) {
  destroyChart(key);
  const ctx = document.getElementById(canvasId).getContext("2d");
  charts[key] = new Chart(ctx, {
    type: "bar",
    data: {
      labels: [""],
      datasets: [
        { label: "Plan", data: [plan || 0], backgroundColor: "#9fb3d9" },
        { label: "Actual", data: [actual || 0], backgroundColor: "#1f3864" }
      ]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 11 } } } },
      scales: { x: { beginAtZero: true } }
    }
  });
}

function renderSelectedDiscipline() {
  const d = currentData.disciplines.find(x => x.name === selectedDiscipline);
  if (!d) return;

  const pct = d.total > 0 ? Math.round((d.completed / d.total) * 1000) / 10 : 0;
  const bar = document.getElementById("overallProgressBar");
  bar.style.width = Math.min(pct, 100) + "%";
  bar.textContent = pct + "%";
  document.getElementById("kpiTotal").textContent = "Total " + d.total.toLocaleString();
  document.getElementById("kpiCompleted").textContent = "Completed " + d.completed.toLocaleString();
  document.getElementById("kpiRemaining").textContent = "Remaining " + d.remaining.toLocaleString();
  document.getElementById("kpiMpActual").textContent = d.mpActual != null ? d.mpActual.toLocaleString() : "-";
  document.getElementById("kpiMpPlan").textContent = d.mpPlan != null ? d.mpPlan.toLocaleString() : "-";

  const badge = document.getElementById("kpiStatusBadge");
  badge.textContent = d.status;
  badge.className = "badge " + statusClass(d.status);

  document.getElementById("sTotal").textContent = d.total.toLocaleString();
  document.getElementById("sCompleted").textContent = d.completed.toLocaleString();
  document.getElementById("sRemaining").textContent = d.remaining.toLocaleString();
  document.getElementById("sDailyPlan").textContent = d.dailyPlan.toLocaleString();
  document.getElementById("sDailyActual").textContent = d.dailyActual.toLocaleString();
  const dailyVarEl = document.getElementById("sDailyVar");
  dailyVarEl.textContent = d.dailyVar.toLocaleString();
  dailyVarEl.style.color = d.dailyVar < 0 ? "#c0392b" : (d.dailyVar > 0 ? "#1f5fa5" : "");
  document.getElementById("sCumPlan").textContent = d.cumPlan.toLocaleString();
  document.getElementById("sCumActual").textContent = d.cumActual.toLocaleString();
  const cumVarEl = document.getElementById("sCumVar");
  cumVarEl.textContent = d.cumVar.toLocaleString();
  cumVarEl.style.color = d.cumVar < 0 ? "#c0392b" : (d.cumVar > 0 ? "#1f5fa5" : "");
  document.getElementById("sProgressPct").textContent = pct + "%";
  document.getElementById("sMpPlan").textContent = d.mpPlan != null ? d.mpPlan.toLocaleString() : "-";
  document.getElementById("sMpActual").textContent = d.mpActual != null ? d.mpActual.toLocaleString() : "-";

  renderPlanActualBar("dailyChart", "daily", d.dailyPlan, d.dailyActual);
  renderPlanActualBar("cumulativeChart", "cumulative", d.cumPlan, d.cumActual);
  renderPlanActualBar("mpChart", "mp", d.mpPlan, d.mpActual);
}

function renderDailyActivities(data) {
  const list = document.getElementById("dailyActivitiesList");
  list.innerHTML = "";
  const items = data.dailyKeyActivities || [];
  if (items.length === 0) {
    list.innerHTML = '<li class="placeholder-note" style="list-style:none;margin-left:-18px;">No activities listed.</li>';
    return;
  }
  items.forEach(text => {
    const li = document.createElement("li");
    li.textContent = text;
    list.appendChild(li);
  });
}

const WELDER_GROUP_COLORS = ["#a9b6cc", "#c1dba0", "#f4c78e", "#9fc3d8", "#d8b0d0"];

function renderWelderStatus(data) {
  const rows = data.welderStatus || [];
  const table = document.getElementById("welderTable");
  const emptyNote = document.getElementById("welderEmptyNote");
  const thead = table.querySelector("thead");
  const tbody = table.querySelector("tbody");
  thead.innerHTML = "";
  tbody.innerHTML = "";

  if (rows.length === 0) {
    table.style.display = "none";
    emptyNote.style.display = "block";
    return;
  }
  table.style.display = "";
  emptyNote.style.display = "none";

  const isGroupSchema = rows.every(r => "Group" in r && "Plan" in r && "Actual" in r && "Var." in r);

  if (isGroupSchema) {
    table.classList.add("welder-grouped");
    const trGroup = document.createElement("tr");
    const trSub = document.createElement("tr");
    const trData = document.createElement("tr");

    rows.forEach((r, i) => {
      const color = WELDER_GROUP_COLORS[i % WELDER_GROUP_COLORS.length];
      const th = document.createElement("th");
      th.colSpan = 3;
      th.textContent = r["Group"];
      th.style.background = color;
      th.style.color = "#1c2733";
      trGroup.appendChild(th);

      ["Plan", "Actual", "Var."].forEach(label => {
        const subTh = document.createElement("th");
        subTh.textContent = label;
        subTh.style.background = color;
        subTh.style.color = "#1c2733";
        subTh.style.fontWeight = "500";
        trSub.appendChild(subTh);
      });

      const planTd = document.createElement("td");
      planTd.textContent = r["Plan"];
      planTd.style.background = color;
      trData.appendChild(planTd);

      const actualTd = document.createElement("td");
      actualTd.textContent = r["Actual"];
      actualTd.style.background = color;
      trData.appendChild(actualTd);

      const varTd = document.createElement("td");
      varTd.textContent = r["Var."];
      varTd.style.background = color;
      const varNum = parseFloat(String(r["Var."]).replace(/,/g, ""));
      if (!isNaN(varNum) && varNum < 0) varTd.style.color = "#c0392b";
      trData.appendChild(varTd);
    });

    thead.appendChild(trGroup);
    thead.appendChild(trSub);
    tbody.appendChild(trData);
  } else {
    table.classList.remove("welder-grouped");
    const columns = Object.keys(rows[0]);
    const trHead = document.createElement("tr");
    columns.forEach(c => {
      const th = document.createElement("th");
      th.textContent = c;
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    rows.forEach(r => {
      const tr = document.createElement("tr");
      columns.forEach(c => {
        const td = document.createElement("td");
        td.textContent = r[c] != null ? r[c] : "";
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }
}

function renderProgressTable(disciplines) {
  const tbody = document.querySelector("#progressTable tbody");
  tbody.innerHTML = "";
  disciplines.forEach(d => {
    const tr = document.createElement("tr");
    tr.className = "status-" + statusClass(d.status);
    tr.innerHTML = `
      <td>${d.name}</td>
      <td>${d.total.toLocaleString()}</td>
      <td>${d.completed.toLocaleString()}</td>
      <td>${d.remaining.toLocaleString()}</td>
      <td>${d.dailyPlan.toLocaleString()}</td>
      <td>${d.dailyActual.toLocaleString()}</td>
      <td>${d.dailyVar.toLocaleString()}</td>
      <td>${d.cumPlan.toLocaleString()}</td>
      <td>${d.cumActual.toLocaleString()}</td>
      <td>${d.cumVar.toLocaleString()}</td>
      <td>${d.mpPlan != null ? d.mpPlan.toLocaleString() : "-"}</td>
      <td>${d.mpActual != null ? d.mpActual.toLocaleString() : "-"}</td>
      <td><span class="badge ${statusClass(d.status)}">${d.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderKeyQty(disciplines) {
  let achieved = 0, notAchieved = 0, notStarted = 0;
  const grid = document.getElementById("keyqtyGrid");
  grid.innerHTML = "";
  disciplines.forEach(d => {
    const state = achievementOf(d);
    if (state === "achieved") achieved++;
    else if (state === "not-achieved") notAchieved++;
    else notStarted++;

    const div = document.createElement("div");
    div.className = "kq-item " + state;
    const icon = state === "achieved" ? "✓" : state === "not-achieved" ? "✗" : "⟳";
    const label = state === "achieved" ? "Achieved" : state === "not-achieved" ? "Not Achieved" : "Not Started";
    div.innerHTML = `<span class="kq-name">${d.name}</span>${icon} ${label}<span class="kq-numbers">Plan ${d.dailyPlan.toLocaleString()} / Actual ${d.dailyActual.toLocaleString()}</span>`;
    grid.appendChild(div);
  });
  document.getElementById("kqAchieved").textContent = achieved;
  document.getElementById("kqNotAchieved").textContent = notAchieved;
  document.getElementById("kqNotStarted").textContent = notStarted;
}

function renderPie(canvasId, key, labels, values) {
  destroyChart(key);
  const palette = ["#1f3864", "#4472c4", "#8faadc", "#c9daf8", "#e05252", "#f4b183", "#a9d18e", "#b8860b", "#6b7686", "#2e7d4f", "#993c1d"];
  const ctx = document.getElementById(canvasId).getContext("2d");
  charts[key] = new Chart(ctx, {
    type: "pie",
    data: { labels, datasets: [{ data: values, backgroundColor: palette }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom", labels: { boxWidth: 8, font: { size: 10 } } } }
    }
  });
}

function renderIssueList(list) {
  const listBody = document.querySelector("#issueListTable tbody");
  listBody.innerHTML = "";
  list.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.no}</td><td>${r.title}</td><td>${r.discipline}</td><td>${r.dueDate}</td><td>${r.status}</td>`;
    listBody.appendChild(tr);
  });
  document.getElementById("issueCount").textContent = list.length + " item(s)";
}

function renderIssueSection(data) {
  const tbody = document.querySelector("#issueSummaryTable tbody");
  tbody.innerHTML = "";
  data.issueSummary.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.discipline}</td><td>${r.total}</td><td>${r.done}</td><td>${r.open}</td>`;
    tbody.appendChild(tr);
  });
  renderPie("issuePie", "issuePie",
    data.issueSummary.map(r => r.discipline),
    data.issueSummary.map(r => r.open));

  const filter = document.getElementById("issueFilter");
  const disciplines = Array.from(new Set(data.issueList.map(r => r.discipline).filter(Boolean))).sort();
  filter.innerHTML = '<option value="">All Disciplines</option>' +
    disciplines.map(d => `<option value="${d}">${d}</option>`).join("");
  filter.onchange = () => {
    const v = filter.value;
    renderIssueList(v ? data.issueList.filter(r => r.discipline === v) : data.issueList);
  };
  renderIssueList(data.issueList);
}

function renderWalkthroughList(list) {
  const listBody = document.querySelector("#walkthroughListTable tbody");
  listBody.innerHTML = "";
  list.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.no}</td><td>${r.unit}</td><td>${r.item}</td><td>${r.responsibility}</td><td>${r.dueDate}</td><td>${r.status}</td>`;
    listBody.appendChild(tr);
  });
  document.getElementById("walkthroughCount").textContent = list.length + " item(s)";
}

function renderWalkthroughSection(data) {
  const tbody = document.querySelector("#walkthroughSummaryTable tbody");
  tbody.innerHTML = "";
  data.walkthroughSummary.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.responsibility}</td><td>${r.total}</td><td>${r.done}</td><td>${r.open}</td>`;
    tbody.appendChild(tr);
  });
  renderPie("walkthroughPie", "walkthroughPie",
    data.walkthroughSummary.map(r => r.responsibility),
    data.walkthroughSummary.map(r => r.open));

  const filter = document.getElementById("walkthroughFilter");
  const resps = Array.from(new Set(data.walkthroughList.map(r => r.responsibility).filter(Boolean))).sort();
  filter.innerHTML = '<option value="">All Responsibilities</option>' +
    resps.map(r => `<option value="${r}">${r}</option>`).join("");
  filter.onchange = () => {
    const v = filter.value;
    renderWalkthroughList(v ? data.walkthroughList.filter(r => r.responsibility === v) : data.walkthroughList);
  };
  renderWalkthroughList(data.walkthroughList);
}

function showErrorBanner(message) {
  let el = document.getElementById("errorBanner");
  if (!el) {
    el = document.createElement("div");
    el.id = "errorBanner";
    el.style.cssText = "background:#fbe1e1;color:#c0392b;padding:10px 14px;border-radius:8px;margin-bottom:14px;font-size:13px;white-space:pre-wrap;";
    document.querySelector(".wrap").prepend(el);
  }
  el.textContent = "Error: " + message;
  el.style.display = "block";
}
function hideErrorBanner() {
  const el = document.getElementById("errorBanner");
  if (el) el.style.display = "none";
}

async function refreshDashboard() {
  const btn = document.getElementById("refreshBtn");
  btn.disabled = true;
  btn.textContent = "Loading...";
  hideErrorBanner();

  try {
    if (typeof Chart === "undefined") {
      throw new Error("Could not load the chart library (Chart.js). This may be a network/firewall issue. Please refresh the page and try again.");
    }

    currentData = await loadData();
    if (!currentData || !currentData.disciplines || currentData.disciplines.length === 0) {
      throw new Error("Could not load data (data.json is empty or has an invalid format).");
    }
    if (!selectedDiscipline || !currentData.disciplines.some(d => d.name === selectedDiscipline)) {
      selectedDiscipline = currentData.disciplines[0].name;
    }

    renderProjectInfo(currentData);
    renderDailyActivities(currentData);
    populateSelector(currentData.disciplines);
    renderSelectedDiscipline();
    renderProgressTable(currentData.disciplines);
    renderKeyQty(currentData.disciplines);
    renderWelderStatus(currentData);
    renderIssueSection(currentData);
    renderWalkthroughSection(currentData);

    document.getElementById("lastUpdated").textContent = "Last updated: " + new Date().toLocaleString("en-US");
  } catch (err) {
    console.error(err);
    showErrorBanner((err && err.message) ? err.message : String(err));
  } finally {
    btn.disabled = false;
    btn.textContent = "↻ Refresh";
  }
}

document.getElementById("refreshBtn").addEventListener("click", refreshDashboard);
document.addEventListener("DOMContentLoaded", refreshDashboard);
