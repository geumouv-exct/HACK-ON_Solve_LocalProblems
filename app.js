const PROGRAMS = window.UMYEON_PROGRAMS;
const STORAGE_KEY = "umyeon-class-saved-v2";
const TIMETABLE_STORAGE_KEY = "umyeon-class-timetable-v1";
const PROGRAM_ID_ALIASES = { "umyeon-book-garden-2026": "oo-book-garden-2026" };
const state = { category: "all", query: "", saved: loadSaved(), timetable: loadTimetable(), activeProgram: null };
const els = {
  hero: document.querySelector(".hero"),
  programSection: document.querySelector(".program-section"),
  savedSection: document.querySelector(".saved-section"),
  programGrid: document.querySelector("#programGrid"),
  resultCount: document.querySelector("#resultCount"),
  emptyState: document.querySelector("#emptyState"),
  searchForm: document.querySelector("#searchForm"),
  searchInput: document.querySelector("#searchInput"),
  activeQuery: document.querySelector("#activeQuery"),
  queryText: document.querySelector("#queryText"),
  dialog: document.querySelector("#programDialog"),
  dialogBody: document.querySelector("#dialogBody"),
  savedList: document.querySelector("#savedList"),
  timetableSection: document.querySelector("#timetableSection"),
  timetableScroll: document.querySelector("#timetableScroll"),
  toast: document.querySelector("#toast")
};

function loadSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter(id => PROGRAMS.some(program => program.id === id)) : [];
  } catch { return []; }
}

function loadTimetable() {
  try {
    const saved = JSON.parse(localStorage.getItem(TIMETABLE_STORAGE_KEY) || "[]");
    return Array.isArray(saved)
      ? [...new Set(saved.map(id => PROGRAM_ID_ALIASES[id] || id))].filter(id => PROGRAMS.some(program => program.application && program.id === id))
      : [];
  } catch { return []; }
}

function persistSaved() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.saved)); }
  catch { showToast("브라우저 저장 공간을 사용할 수 없어요."); }
  updateSavedCounts();
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function formatISODate(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return value.replaceAll("-", ".");
}

function iconStyle(program) {
  return `--icon-bg:${program.iconBg};--icon-fg:${program.iconFg}`;
}

function programSearchText(program) {
  return [program.title, program.categoryLabel, program.facility, program.audience, program.schedule, program.room, ...program.tags].join(" ").toLocaleLowerCase("ko-KR");
}

function getVisiblePrograms() {
  let rows = PROGRAMS.filter(program => state.category === "all" || program.category === state.category);
  const terms = state.query.toLocaleLowerCase("ko-KR").split(/[\s,·/]+/).filter(Boolean);
  if (terms.length) rows = rows.filter(program => terms.some(term => programSearchText(program).includes(term)));
  return rows;
}

function renderProgramCard(program) {
  const isSaved = state.saved.includes(program.id);
  return `<article class="program-card" style="${iconStyle(program)}">
    <div class="card-heading"><h4>${escapeHTML(program.title)}</h4><span class="card-status ${escapeHTML(program.statusClass)}">${escapeHTML(program.status)}</span></div>
    <dl class="card-facts">
      <div><dt>요일·시간</dt><dd>${escapeHTML(program.schedule)}</dd></div>
      <div><dt>장소</dt><dd>${escapeHTML(program.room)}</dd></div>
      <div><dt>수강료</dt><dd>${escapeHTML(program.fee)}</dd></div>
    </dl>
    <div class="card-actions">
      <button class="card-saved ${isSaved ? "is-saved" : ""}" type="button" data-save="${program.id}" aria-label="${isSaved ? "관심 강좌 저장 해제" : "관심 강좌로 저장"}" aria-pressed="${isSaved}">${isSaved ? "저장됨" : "저장"}</button>
      <button class="card-open" type="button" data-detail="${program.id}">자세히 보기</button>
    </div>
  </article>`;
}

function renderPrograms() {
  const visible = getVisiblePrograms();
  const groups = [
    ["senior", "스마트폰·AI"],
    ["wellness", "건강·운동"],
    ["learning", "취미·배움"],
    ["kids", "아이·가족"],
    ["library", "도서관"]
  ];
  els.programGrid.innerHTML = groups.map(([category, title]) => {
    const programs = visible.filter(program => program.category === category);
    if (!programs.length) return "";
    return `<section class="program-group" aria-labelledby="group-${category}">
      <div class="group-heading"><h3 id="group-${category}">${title}</h3><span>${programs.length}개</span></div>
      <div class="group-cards">${programs.map(renderProgramCard).join("")}</div>
    </section>`;
  }).join("");
  els.programGrid.hidden = visible.length === 0;
  els.emptyState.hidden = visible.length > 0;
  els.resultCount.textContent = `${visible.length}개 프로그램`;
  els.activeQuery.hidden = !state.query;
  els.queryText.textContent = state.query ? `“${state.query}” 검색 결과` : "";
}

function updateSavedCounts() {
  const count = state.saved.length;
  document.querySelector("#savedCount").textContent = String(count);
  document.querySelector("#savedOverviewCount").textContent = String(count);
  document.querySelector("#savedEmpty").hidden = count > 0;
  els.savedList.hidden = count === 0;
}

function persistTimetable() {
  try { localStorage.setItem(TIMETABLE_STORAGE_KEY, JSON.stringify(state.timetable)); }
  catch { showToast("시간표를 저장할 수 없어요. 브라우저 저장 공간을 확인해 주세요."); }
  updateTimetableCounts();
}

function updateTimetableCounts() {
  const count = state.timetable.length;
  document.querySelector("#timetableCount").textContent = String(count);
  document.querySelector("#timetableOverviewCount").textContent = String(count);
  document.querySelector("#timetableEmpty").hidden = count > 0;
  els.timetableScroll.hidden = count === 0;
}

function renderTimetable() {
  const days = ["월", "화", "수", "목", "금"];
  const startMinute = 8 * 60;
  const endMinute = 19 * 60;
  const hourHeight = 48;
  const programs = state.timetable.map(id => PROGRAMS.find(program => program.id === id)).filter(Boolean);
  const dayMarkup = days.map(day => {
    const events = programs.flatMap(program => program.days.filter(value => value === day).map(() => {
      const [startHour, startPart] = program.startTime.split(":").map(Number);
      const [endHour, endPart] = program.endTime.split(":").map(Number);
      return { program, start: startHour * 60 + startPart, end: endHour * 60 + endPart };
    })).sort((left, right) => left.start - right.start || left.end - right.end);
    const overlapGroups = [];
    events.forEach(event => {
      const currentGroup = overlapGroups.at(-1);
      if (!currentGroup || event.start >= currentGroup.end) overlapGroups.push({ end: event.end, events: [event] });
      else {
        currentGroup.end = Math.max(currentGroup.end, event.end);
        currentGroup.events.push(event);
      }
    });
    overlapGroups.forEach(group => {
      const laneEnds = [];
      group.events.forEach(event => {
        let lane = laneEnds.findIndex(end => end <= event.start);
        if (lane < 0) lane = laneEnds.length;
        laneEnds[lane] = event.end;
        event.lane = lane;
      });
      group.events.forEach(event => { event.lanes = laneEnds.length; });
    });
    return `<section class="weekly-day-column" aria-label="${day}요일">
      <div class="weekly-day-lines" aria-hidden="true"></div>
      ${events.map(event => {
        const top = (event.start - startMinute) / 60 * hourHeight;
        const height = Math.max(46, (event.end - event.start) / 60 * hourHeight);
        return `<article class="weekly-event" style="--event-top:${top}px;--event-height:${height}px;--event-lane:${event.lane};--event-lanes:${event.lanes};--event-bg:${event.program.iconBg};--event-fg:${event.program.iconFg}">
          <button type="button" data-timetable-remove="${escapeHTML(event.program.id)}" aria-label="${escapeHTML(event.program.title)} 시간표에서 삭제">×</button>
          <b>${escapeHTML(event.program.title)}</b><span>${escapeHTML(event.program.startTime)}–${escapeHTML(event.program.endTime)}</span>
        </article>`;
      }).join("")}
    </section>`;
  }).join("");
  els.timetableScroll.innerHTML = `<div class="weekly-board" role="grid" aria-label="월요일부터 금요일까지 주간 시간표">
    <div class="weekly-headers"><div class="weekly-time-head">시간</div>${days.map(day => `<div class="weekly-day-head">${day}</div>`).join("")}</div>
    <div class="weekly-body"><div class="weekly-time-column">${Array.from({ length: (endMinute - startMinute) / 60 + 1 }, (_, index) => `<span style="--time-index:${index}">${String(8 + index).padStart(2, "0")}:00</span>`).join("")}</div>${dayMarkup}</div>
  </div>`;
  updateTimetableCounts();
}

function renderSaved() {
  const rows = state.saved.map(id => PROGRAMS.find(program => program.id === id)).filter(Boolean);
  els.savedList.innerHTML = rows.map(program => `<article class="saved-row" style="${iconStyle(program)}">
    <span class="saved-row-icon" aria-hidden="true">${escapeHTML(program.icon)}</span>
    <div class="saved-row-copy"><b>${escapeHTML(program.title)}</b><small>${escapeHTML(program.facility)}</small></div>
    <div class="saved-row-deadline">공고 상태<b>${escapeHTML(program.status)}</b></div>
    <div class="saved-row-actions"><button type="button" data-detail="${program.id}" aria-label="공고 상세 보기">↗</button><button type="button" data-remove="${program.id}" aria-label="저장 해제">×</button></div>
  </article>`).join("");
  updateSavedCounts();
}

function setView(view) {
  const saved = view === "saved";
  const timetable = view === "timetable";
  els.hero.hidden = saved || timetable;
  els.programSection.hidden = saved || timetable;
  els.savedSection.hidden = !saved;
  els.timetableSection.hidden = !timetable;
  document.querySelector("#browseNav").classList.toggle("active", view === "browse");
  document.querySelector("#savedNav").classList.toggle("active", saved);
  document.querySelector("#timetableNav").classList.toggle("active", timetable);
  document.querySelector("#browseNav").setAttribute("aria-current", view === "browse" ? "page" : "false");
  document.querySelector("#savedNav").setAttribute("aria-current", saved ? "page" : "false");
  document.querySelector("#timetableNav").setAttribute("aria-current", timetable ? "page" : "false");
  if (saved) renderSaved();
  if (timetable) renderTimetable();
  if (view === "timetable") history.replaceState(null, "", "#timetable");
  else if (saved) history.replaceState(null, "", "#saved");
  else if (location.hash === "#timetable" || location.hash === "#saved") history.replaceState(null, "", location.pathname + location.search);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function createPracticeUrl(program) {
  const params = new URLSearchParams({
    courseId: program.id, title: program.title, facility: program.facility, room: program.room, schedule: program.schedule,
    dates: program.dates, audience: program.audience, fee: program.fee, seats: program.seats,
    sessions: program.sessions, applyStart: formatISODate(program.applyStart),
    applyEnd: formatISODate(program.applyEnd), source: program.source, instructor: program.instructor || "공식 공고 확인", contact: program.contact || "02-2155-5378"
  });
  return `./practice.html?${params.toString()}`;
}

function openDetails(id) {
  const program = PROGRAMS.find(row => row.id === id);
  if (!program) return;
  state.activeProgram = id;
  document.querySelector("#dialogKicker").textContent = "강좌 정보";
  const isSaved = state.saved.includes(id);
  const detailItems = [
    ["운영 기간", program.dates],
    ["요일·시간", program.schedule],
    ...(program.application ? [["강사", program.instructor || "공식 공고 확인"]] : []),
    ["대상", program.audience],
    ["장소", program.room],
    ["수강료", program.fee],
    ["접수", program.registration]
  ];
  if (program.firstClassDate) detailItems.push(["첫 수업", formatISODate(program.firstClassDate)]);
  if (program.seats) detailItems.push(["정원·횟수", `${program.seats} · ${program.sessions}`]);
  if (program.category !== "library") detailItems.push(["접수 기간", `${formatISODate(program.applyStart)} – ${formatISODate(program.applyEnd)}`]);
  const sourceLinks = `<div class="dialog-actions">
    <button class="dialog-save ${isSaved ? "is-saved" : ""}" data-save="${program.id}" type="button">${isSaved ? "저장됨" : "저장"}</button>
    <a class="dialog-official" href="${program.source}" target="_blank" rel="noreferrer">공식 공고 보기 ↗</a>
    ${program.application ? `<a class="dialog-official" href="${program.application}" target="_blank" rel="noreferrer">OO자치회관 공고 목록 ↗</a>` : ""}
  </div>`;
  els.dialogBody.innerHTML = `<div class="dialog-title-row" style="${iconStyle(program)}">
    <span class="dialog-category-icon" aria-hidden="true">${escapeHTML(program.icon)}</span>
    <div class="dialog-title-copy"><span class="dialog-category">${escapeHTML(program.categoryLabel)} · ${escapeHTML(program.status)}</span><h2 id="dialogTitle">${escapeHTML(program.title)}</h2><p class="dialog-place">⌖ ${escapeHTML(program.facility)}</p></div>
  </div>
  <div class="detail-grid">${detailItems.map(([label, value]) => `<div class="detail-item ${label === "접수" ? "detail-wide" : ""}"><span>${escapeHTML(label)}</span><b>${escapeHTML(value)}</b></div>`).join("")}</div>
  ${sourceLinks}
  ${program.application ? `<a class="dialog-practice" href="${createPracticeUrl(program)}">신청 연습하기 <span aria-hidden="true">→</span></a>` : ""}`;
  if (typeof els.dialog.showModal === "function") els.dialog.showModal();
  else els.dialog.setAttribute("open", "");
}

function toggleSaved(id) {
  const currentlySaved = state.saved.includes(id);
  state.saved = currentlySaved ? state.saved.filter(savedId => savedId !== id) : [...state.saved, id];
  persistSaved();
  renderPrograms();
  renderSaved();
  if (state.activeProgram === id && els.dialog.open) openDetails(id);
  showToast(currentlySaved ? "관심 목록에서 지웠어요." : "관심 목록에 저장했어요.");
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.remove("show"), 2200);
}

function updateSearch() {
  state.query = els.searchInput.value.trim();
  renderPrograms();
  document.querySelector("#programSection").scrollIntoView({ behavior: "smooth", block: "start" });
}

els.searchForm.addEventListener("submit", event => {
  event.preventDefault();
  updateSearch();
});

document.querySelectorAll(".suggestion").forEach(button => button.addEventListener("click", () => {
  els.searchInput.value = button.dataset.query;
  updateSearch();
}));

document.querySelectorAll(".filter-chip").forEach(button => button.addEventListener("click", () => {
  state.category = button.dataset.category;
  document.querySelectorAll(".filter-chip").forEach(chip => {
    const active = chip === button;
    chip.classList.toggle("selected", active);
    chip.setAttribute("aria-pressed", String(active));
  });
  renderPrograms();
}));

document.querySelector("#clearQuery").addEventListener("click", () => {
  state.query = "";
  els.searchInput.value = "";
  renderPrograms();
});

document.querySelector("#emptyReset").addEventListener("click", () => {
  state.category = "all";
  state.query = "";
  els.searchInput.value = "";
  document.querySelectorAll(".filter-chip").forEach(chip => {
    const active = chip.dataset.category === "all";
    chip.classList.toggle("selected", active);
    chip.setAttribute("aria-pressed", String(active));
  });
  renderPrograms();
});

document.body.addEventListener("click", event => {
  const detailButton = event.target.closest("[data-detail]");
  const saveButton = event.target.closest("[data-save]");
  const removeButton = event.target.closest("[data-remove]");
  if (detailButton) openDetails(detailButton.dataset.detail);
  else if (saveButton) toggleSaved(saveButton.dataset.save);
  else if (removeButton) toggleSaved(removeButton.dataset.remove);
});

document.querySelector("#browseNav").addEventListener("click", () => setView("browse"));
document.querySelector("#savedNav").addEventListener("click", () => setView("saved"));
document.querySelector("#timetableNav").addEventListener("click", () => setView("timetable"));
document.querySelector(".brand").addEventListener("click", event => {
  event.preventDefault();
  setView("browse");
});
document.querySelector("#backToBrowse").addEventListener("click", () => setView("browse"));
document.querySelector("#savedEmptyBrowse").addEventListener("click", () => setView("browse"));
document.querySelector("#backFromTimetable").addEventListener("click", () => setView("browse"));
document.querySelector("#timetableEmptyBrowse").addEventListener("click", () => setView("browse"));
document.querySelector("#dialogClose").addEventListener("click", () => els.dialog.close());
els.dialog.addEventListener("click", event => { if (event.target === els.dialog) els.dialog.close(); });
els.timetableScroll.addEventListener("click", event => {
  const remove = event.target.closest("[data-timetable-remove]");
  if (!remove) return;
  state.timetable = state.timetable.filter(id => id !== remove.dataset.timetableRemove);
  persistTimetable();
  renderTimetable();
  showToast("시간표에서 강좌를 지웠어요.");
});
window.addEventListener("storage", event => {
  if (event.key !== TIMETABLE_STORAGE_KEY) return;
  state.timetable = loadTimetable();
  updateTimetableCounts();
  if (els.timetableSection && !els.timetableSection.hidden) renderTimetable();
});

updateSavedCounts();
updateTimetableCounts();
renderPrograms();
renderSaved();
if (location.hash === "#timetable") setView("timetable");
else if (location.hash === "#saved") setView("saved");
