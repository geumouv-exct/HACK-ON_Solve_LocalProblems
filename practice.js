const query = new URLSearchParams(window.location.search);
const COURSE_CATALOG = Array.isArray(window.UMYEON_COURSES) ? window.UMYEON_COURSES : [];
const COURSE_ID_ALIASES = { "umyeon-book-garden-2026": "oo-book-garden-2026" };
const FALLBACK_COURSE = {
  id: "senior-smartphone-basic",
  title: "시니어 스마트폰 활용(초급)", facility: "OO자치회관 · OO열린문화센터",
  room: "프로그램실 1", schedule: "화·목 · 09:30–10:30", dates: "2026.10.01 – 12.31",
  audience: "일반", fee: "90,000원 / 3개월", seats: "15명", sessions: "24회",
  instructor: "김아영", days: ["화", "목"], startTime: "09:30", endTime: "10:30",
  applyStart: "2026.09.14", applyEnd: "2026.09.18",
  source: "https://www.seocho.go.kr/site/seocho/ex/lecture/View.do?clIdx=L00018738",
  application: "https://www.seocho.go.kr/site/seocho/ex/lecture/List.do?scOrg=29280000",
  contact: "02-2155-5378"
};
function formatDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || "") ? value.replaceAll("-", ".") : value;
}
function toPracticeCourse(program) {
  return { ...program, applyStart: formatDate(program.applyStart), applyEnd: formatDate(program.applyEnd) };
}
const requestedCourse = COURSE_CATALOG.find(program => program.id === (COURSE_ID_ALIASES[query.get("courseId")] || query.get("courseId")))
  || COURSE_CATALOG.find(program => program.title === query.get("title"))
  || COURSE_CATALOG.find(program => program.id === "senior-smartphone-basic");
let course = requestedCourse
  ? toPracticeCourse(requestedCourse)
  : Object.fromEntries(Object.keys(FALLBACK_COURSE).map(key => [key, query.get(key) || FALLBACK_COURSE[key]]));
if (!/^https:\/\/www\.seocho\.go\.kr\//.test(course.source)) course.source = FALLBACK_COURSE.source;
const TIMETABLE_STORAGE_KEY = "umyeon-class-timetable-v1";
function isCourseInTimetable(courseId) {
  try {
    const ids = JSON.parse(localStorage.getItem(TIMETABLE_STORAGE_KEY) || "[]");
    return Array.isArray(ids) && ids.map(id => COURSE_ID_ALIASES[id] || id).includes(courseId);
  } catch { return false; }
}
const startsWithSelectedCourse = query.get("flow") !== "choose" && Boolean(query.get("courseId") || query.get("title"));
const state = { step: startsWithSelectedCourse ? 2 : 0, searched: false, searchText: "", address: "", message: "", timetableError: "", coachVisible: true, detailTab: "course", timetableAdded: isCourseInTimetable(course.id) };
const steps = ["강좌 찾기", "목록 확인", "상세 확인", "주소 입력", "신청 확인", "결제 연습", "연습 완료"];
const content = document.querySelector("#portalContent");
const coachMessage = document.querySelector("#coachMessage");
const coachBack = document.querySelector("#coachBack");
const coachNext = document.querySelector("#coachNext");
const fillExample = document.querySelector("#fillExample");
const coach = document.querySelector(".coach");
const reopenCoach = document.querySelector("#reopenCoach");
let coachTarget = null;
let coachPlacement = "below";
let coachFrame = 0;
const html = value => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function positionCoach(choosePlacement = false) {
  if (coach.hidden || !coachTarget?.isConnected) return;
  const rect = coachTarget.getBoundingClientRect();
  const width = coach.offsetWidth;
  const height = coach.offsetHeight;
  const edge = 10;
  const gap = 14;
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = window.innerHeight;
  if (choosePlacement) {
    const belowSpace = viewportHeight - rect.bottom;
    const aboveSpace = rect.top;
    coachPlacement = belowSpace >= height + gap || belowSpace >= aboveSpace ? "below" : "above";
  }
  const centerX = rect.left + rect.width / 2;
  const left = clamp(centerX - width / 2, edge, viewportWidth - width - edge);
  const desiredTop = coachPlacement === "below" ? rect.bottom + gap : rect.top - height - gap;
  const top = clamp(desiredTop, edge, viewportHeight - height - edge);
  coach.style.left = `${left}px`;
  coach.style.top = `${top}px`;
  coach.dataset.placement = coachPlacement;
  coach.style.setProperty("--coach-arrow-x", `${clamp(centerX - left - 9, 18, width - 36)}px`);
}

function followCoachTarget() {
  if (coachFrame) cancelAnimationFrame(coachFrame);
  coachFrame = requestAnimationFrame(() => {
    coachFrame = 0;
    positionCoach();
  });
}

function currentDateRange() {
  return `${course.applyStart} ~ ${course.applyEnd}`;
}

function portalTitle(title, note = "") {
  return `<div class="content-title"><h2>${title}</h2>${note ? `<span>${note}</span>` : ""}</div>`;
}

function listing() {
  const normalized = state.searchText.toLocaleLowerCase("ko-KR");
  const visibleCourses = state.searched && normalized
    ? COURSE_CATALOG.filter(item => `${item.title} ${item.categoryLabel} ${item.schedule} ${item.instructor}`.toLocaleLowerCase("ko-KR").includes(normalized))
    : COURSE_CATALOG;
  return `${portalTitle("강좌 목록", "OO자치회관")}
    <div class="filter-table" aria-label="강좌 검색 조건">
      <div><b>교육기관</b><span>OO자치회관</span></div><div><b>강좌 상태</b><span>전체　　접수중　　접수마감</span></div>
      <div><b>강좌 분류</b><span>전체</span></div><div><b>강좌 요일</b><span>전체</span></div>
    </div>
    <form class="course-search" id="courseSearch"><label for="courseQuery">강의명 검색</label><input id="courseQuery" value="${html(state.searchText)}" placeholder="강좌명을 입력하세요" autocomplete="off"><button type="submit">검색</button></form>
    ${state.message ? `<p class="inline-error" role="alert">${html(state.message)}</p>` : ""}
    ${visibleCourses.length ? `<div class="table-scroll"><table class="course-list"><caption>${state.searched ? "검색 결과" : "전체 강좌"} · ${visibleCourses.length}개</caption><thead><tr><th>번호</th><th>강좌명</th><th>교육기관</th><th>교육기간</th><th>접수기간</th><th>상태</th></tr></thead><tbody>${visibleCourses.map((item, index) => courseRow(item, index)).join("")}</tbody></table></div>` : `<div class="no-results">검색 결과가 없습니다. 강좌명을 다시 확인해 주세요.</div>`}`;
}

function courseRow(item, index) {
  return `<tr><td>${index + 1}</td><td><button type="button" class="course-result" data-action="open-detail" data-course-id="${html(item.id)}">${html(item.title)}<small>${html(item.schedule)}　·　${html(item.instructor)} 강사　·　${html(item.fee)}</small></button></td><td>OO자치회관</td><td>${html(item.dates)}</td><td>${html(`${formatDate(item.applyStart)} ~ ${formatDate(item.applyEnd)}`)}</td><td><span class="closed-label">접수마감</span></td></tr>`;
}

function getScheduleConflicts(candidate) {
  if (!candidate?.days?.length || !candidate.startTime || !candidate.endTime) return [];
  let ids;
  try {
    const stored = JSON.parse(localStorage.getItem(TIMETABLE_STORAGE_KEY) || "[]");
    ids = Array.isArray(stored) ? stored.map(id => COURSE_ID_ALIASES[id] || id) : [];
  } catch { return []; }
  const start = time => {
    const [hours, minutes] = String(time).split(":").map(Number);
    return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : NaN;
  };
  const candidateStart = start(candidate.startTime);
  const candidateEnd = start(candidate.endTime);
  if (!Number.isFinite(candidateStart) || !Number.isFinite(candidateEnd)) return [];
  return [...new Set(ids)]
    .filter(id => id !== candidate.id)
    .map(id => COURSE_CATALOG.find(program => program.id === id))
    .filter(program => {
      if (!program?.days?.some(day => candidate.days.includes(day))) return false;
      const existingStart = start(program.startTime);
      const existingEnd = start(program.endTime);
      return Number.isFinite(existingStart) && Number.isFinite(existingEnd)
        && candidateStart < existingEnd && existingStart < candidateEnd;
    });
}

function scheduleConflictMessage(conflicts) {
  const labels = conflicts.map(program => `‘${program.title}’(${program.schedule})`).join(", ");
  return `내 시간표에 담긴 ${labels}와 시간이 겹쳐 신청 연습을 계속할 수 없어요. 다른 강좌를 선택해 주세요.`;
}

function detailPage() {
  const conflicts = getScheduleConflicts(course);
  const rows = [
    ["교육 기관", "OO자치회관", "관리부서", "양재1동"], ["강사명", course.instructor], ["수강료", course.fee],
    ["교육기간", course.dates], ["총 수강일", course.sessions], ["수강요일", course.schedule],
    ["교육대상", course.audience], ["교육장소", course.room], ["접수기간", currentDateRange()],
    ["교육인원", course.seats], ["접수방법", "인터넷 접수"], ["강의방법", "현장 강의"], ["전화문의", course.contact]
  ];
  const courseInfo = `<div class="table-scroll"><table class="detail-table"><tbody>${rows.map(row => row.length === 4 ? `<tr><th>${row[0]}</th><td>${html(row[1])}</td><th>${row[2]}</th><td>${html(row[3])}</td></tr>` : `<tr><th>${row[0]}</th><td colspan="3">${html(row[1])}</td></tr>`).join("")}</tbody></table></div>
    <p class="instructor-source-note">강사명은 서초구 2026년 4분기 OO자치회관 프로그램 공고 기준입니다.</p>`;
  const instructorInfo = `<section class="instructor-panel" aria-labelledby="instructorName">
      <div class="instructor-card"><span class="instructor-mark" aria-hidden="true">강사</span><div><small>공식 공고에 등록된 강사</small><h3 id="instructorName">${html(course.instructor)}</h3><p>${html(course.title)} 담당</p></div></div>
      <div class="instructor-facts"><div><span>강의 일정</span><b>${html(course.schedule)}</b></div><div><span>강의 장소</span><b>${html(course.room)}</b></div><div><span>강의 형태</span><b>현장 강의</b></div></div>
      <p class="instructor-source-note">공개 공고에서 확인되는 강사명과 담당 강좌를 표시합니다.</p>
      <a class="text-link" href="${html(course.source)}" target="_blank" rel="noreferrer">서초구 공식 강좌 공고 보기 ↗</a>
    </section>`;
  return `${portalTitle("강좌 상세정보", "OO자치회관")}
    <h3 class="record-title">${html(course.title)}</h3>
    <div class="detail-tabs" role="tablist" aria-label="강좌 정보"><button type="button" role="tab" data-action="detail-tab" data-tab="course" aria-selected="${state.detailTab === "course"}">강좌 상세정보</button><button type="button" role="tab" data-action="detail-tab" data-tab="instructor" aria-selected="${state.detailTab === "instructor"}">강사정보</button></div>
    <div role="tabpanel">${state.detailTab === "instructor" ? instructorInfo : courseInfo}</div>
    ${conflicts.length ? `<div class="schedule-conflict" role="alert"><b>시간이 겹쳐 신청할 수 없어요</b><span>${html(scheduleConflictMessage(conflicts))}</span></div>` : ""}
    <div class="portal-action-row"><a class="text-link" href="${html(course.source)}" target="_blank" rel="noreferrer">공식 공고 확인 ↗</a><button class="portal-primary" data-action="apply" ${conflicts.length ? "disabled" : ""}>${conflicts.length ? "시간표와 겹침" : "수강신청"}</button></div>`;
}

function applyPage() {
  return `${portalTitle("수강신청", "신청자 정보 확인")}
    <div class="selected-course"><b>${html(course.title)}</b><span>${html(course.schedule)}　·　${html(course.dates)}</span></div>
    <div class="member-summary"><span>신청자 정보</span><b>로그인 후 자동으로 표시되는 정보</b><small>연습 화면에서는 이름·전화번호를 입력하지 않습니다.</small></div>
    <form class="application-form" id="applicationForm"><label for="practiceAddress">주소 <em>필수</em></label><input id="practiceAddress" value="${html(state.address)}" placeholder="예: OO동 연습로 1" autocomplete="off" maxlength="40"><small>개인 주소를 입력하지 말고, 위 예시 주소만 사용해 주세요.</small>${state.message ? `<p class="inline-error" role="alert">${html(state.message)}</p>` : ""}<button class="portal-primary" type="submit">신청 정보 확인</button></form>`;
}

function confirmationPage() {
  return `${portalTitle("수강신청 확인", "신청 내용")}
    <div class="confirmation-box"><div><b>강좌명</b><span>${html(course.title)}</span></div><div><b>교육기관</b><span>OO자치회관</span></div><div><b>교육기간</b><span>${html(course.dates)}</span></div><div><b>주소 예시</b><span>${html(state.address)}</span></div><div><b>수강료</b><span>${html(course.fee)}</span></div></div>
    <p class="inline-note">연습 화면입니다. 아래 버튼은 실제 신청을 접수하지 않습니다.</p><div class="portal-action-row"><button class="portal-primary" data-action="confirm-application">신청 확인</button></div>`;
}

function paymentPage() {
  const amount = course.fee.split("/")[0].trim();
  return `${portalTitle("수강료 결제", "결제 단계 연습")}
    <div class="payment-card"><div class="fake-radio" aria-hidden="true">✓</div><div><b>신용카드</b><span>신용카드 결제 입력 연습</span></div></div>
    <div class="payment-total"><span>결제 예정 금액 <small>(연습 화면)</small></span><b>${html(amount)}</b></div>
    <section class="payment-practice" aria-labelledby="paymentPracticeTitle">
      <div class="payment-practice-heading"><h3 id="paymentPracticeTitle">카드 정보 입력 연습</h3><button type="button" class="payment-example" data-action="fill-payment-example">카드 예시 입력</button></div>
      <p class="payment-safety" role="note"><b>연습 화면입니다.</b> 실제 카드 정보 대신 예시를 사용해 주세요. 입력한 내용은 저장·전송되지 않으며 결제되지 않습니다.</p>
      <div class="payment-fields">
        <label class="payment-field">카드 번호<input type="text" inputmode="numeric" maxlength="19" placeholder="0000 0000 0000 0000" autocomplete="off" data-payment-field="cardNumber"></label>
        <label class="payment-field">유효기간 <span>(월/년)</span><input type="text" inputmode="numeric" maxlength="5" placeholder="12/30" autocomplete="off" data-payment-field="expiration"></label>
        <label class="payment-field">CVC <span>(카드 뒷면 3자리)</span><input type="password" inputmode="numeric" maxlength="4" placeholder="000" autocomplete="off" data-payment-field="cvc"></label>
        <label class="payment-field">카드 소유자 이름<input type="text" maxlength="30" placeholder="홍길동" autocomplete="off" data-payment-field="ownerName"></label>
        <label class="payment-field payment-field-wide">주소<input type="text" maxlength="60" placeholder="OO동 연습로 1" autocomplete="off" data-payment-field="address"></label>
        <label class="payment-field">우편번호<input type="text" inputmode="numeric" maxlength="5" placeholder="00000" autocomplete="off" data-payment-field="postalCode"></label>
      </div>
      <p class="payment-message" id="paymentMessage" role="alert" hidden></p>
    </section>
    <p class="inline-note strong-note">결제 연습을 마쳐도 실제 신청이나 결제는 일어나지 않습니다.</p><div class="portal-action-row"><button class="portal-primary" type="button" data-action="finish">결제 연습 완료 · 청구 없음</button></div>`;
}

function finishPage() {
  return `<div class="completion"><span class="completion-mark" aria-hidden="true">✓</span><p class="completion-label">연습 완료</p><h2>신청 절차를 모두 살펴봤어요</h2><p class="completion-warning">실제 강좌 신청과 결제는 완료되지 않았습니다.</p><div class="confirmation-box"><div><b>연습한 강좌</b><span>${html(course.title)}</span></div><div><b>결제</b><span>진행되지 않음 · 청구 0원</span></div></div>${state.timetableError ? `<p class="inline-error" role="alert">${html(state.timetableError)}</p>` : ""}<p class="inline-note">연습을 마친 강좌를 시간표에 추가했어요. 시간표에 담겨도 실제 수강 등록은 되지 않습니다.</p><div class="finish-actions">${state.timetableAdded ? `<button type="button" disabled>시간표에 추가됨 ✓</button>` : `<button type="button" data-action="add-timetable">내 시간표에 추가</button>`}<a href="./index.html#timetable">내 시간표 보기</a><a href="${html(course.source)}" target="_blank" rel="noreferrer">공식 공고 보기</a><a href="tel:${course.contact.replace(/[^0-9+]/g, "")}">전화 문의 ${html(course.contact)}</a><button data-action="restart">처음부터 연습</button></div></div>`;
}

const pages = [listing, listing, detailPage, applyPage, confirmationPage, paymentPage, finishPage];
const guidance = [
  "강좌 이름을 검색하거나, 아래 전체 목록에서 원하는 강좌를 눌러 보세요.",
  "검색 결과에서 강좌 이름을 눌러 상세 내용을 확인해 보세요.",
  "강좌명과 수강료, 기간을 확인한 뒤 ‘수강신청’을 눌러 보세요.",
  "주소 입력을 연습해요. 실제 주소 대신 ‘OO동 연습로 1’만 입력해 보세요.",
  "신청 전에 강좌와 입력 내용을 마지막으로 확인하는 화면이에요. ‘신청 확인’을 눌러 보세요.",
  "실제 카드 정보 대신 연습용 예시를 사용해 주세요. 입력한 내용은 저장되거나 전송되지 않습니다.",
  "연습이 끝났어요. 실제 신청과 결제는 진행되지 않았습니다."
];
const targets = ["#courseQuery", "[data-action=\"open-detail\"]", "[data-action=\"apply\"]", "#practiceAddress", "[data-action=\"confirm-application\"]", "[data-payment-field=\"cardNumber\"]", ".completion-warning"];

function render() {
  document.querySelector("#pageCount").textContent = state.step === 6 ? "연습 완료" : `연습 ${state.step + 1}단계`;
  document.querySelector("#stepTrack").innerHTML = steps.slice(0, 6).map((label, index) => `<span class="track-step ${index === Math.min(state.step, 5) ? "current" : index < state.step ? "complete" : ""}"><i>${index < state.step ? "✓" : index + 1}</i><b>${label}</b></span>`).join("");
  content.innerHTML = pages[state.step]();
  coachMessage.textContent = guidance[state.step];
  coach.hidden = !state.coachVisible;
  reopenCoach.hidden = state.coachVisible;
  document.querySelector("#coachCounter").textContent = state.step === 6 ? "연습을 마쳤어요" : `${state.step + 1}단계 안내`;
  coachBack.hidden = state.step === 0 || state.step === 6;
  coachNext.hidden = state.step === 6;
  fillExample.hidden = state.step !== 0 && state.step !== 3 && state.step !== 5;
  fillExample.textContent = state.step === 3 ? "주소 예시 입력" : state.step === 5 ? "카드 예시 입력" : "강좌명 예시 입력";
  if (state.step === 0 || state.step === 3 || state.step === 5) fillExample.hidden = false;
  const detailConflicts = state.step === 2 ? getScheduleConflicts(course) : [];
  coachMessage.textContent = detailConflicts.length ? "시간표에 담긴 강좌와 시간이 겹쳐 신청할 수 없어요. 다른 강좌를 골라 주세요." : guidance[state.step];
  const target = document.querySelector(targets[state.step]);
  coachTarget = target;
  if (target) {
    if (state.coachVisible) target.classList.add("coach-target");
    if (state.step !== 6) setTimeout(() => {
      const top = window.scrollY + target.getBoundingClientRect().top - window.innerHeight * 0.55;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      if (target.matches("input,button,a,[tabindex]")) target.focus({ preventScroll: true });
      positionCoach(true);
      setTimeout(() => positionCoach(true), 420);
    }, 60);
    else positionCoach(true);
  }
}

function advance(step) {
  state.step = Math.max(0, Math.min(6, step));
  state.message = "";
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showMessage(message) {
  state.message = message;
  render();
}

content.addEventListener("submit", event => {
  event.preventDefault();
  if (event.target.id === "courseSearch") {
    const input = event.target.querySelector("#courseQuery");
    state.searchText = input.value.trim();
    if (!state.searchText) return showMessage("강좌 이름을 먼저 입력해 주세요.");
    state.searched = true;
    const found = COURSE_CATALOG.some(item => `${item.title} ${item.categoryLabel} ${item.schedule} ${item.instructor}`.toLocaleLowerCase("ko-KR").includes(state.searchText.toLocaleLowerCase("ko-KR")));
    if (found) advance(1);
    else showMessage("강좌가 검색되지 않았어요. 강좌명 예시를 사용해 보세요.");
  }
  if (event.target.id === "applicationForm") {
    const address = event.target.querySelector("#practiceAddress").value.trim();
    if (!address) return showMessage("개인 주소 대신 예시 주소를 입력해 주세요.");
    state.address = address;
    advance(4);
  }
});

content.addEventListener("click", event => {
  const actionElement = event.target.closest("[data-action]");
  const action = actionElement?.dataset.action;
  if (action === "open-detail") {
    const selected = COURSE_CATALOG.find(item => item.id === actionElement.dataset.courseId);
    if (selected) {
      course = toPracticeCourse(selected);
      state.timetableAdded = isCourseInTimetable(course.id);
      state.detailTab = "course";
    }
    advance(2);
  }
  if (action === "detail-tab") {
    state.detailTab = actionElement.dataset.tab;
    render();
  }
  if (action === "apply") {
    const conflicts = getScheduleConflicts(course);
    if (conflicts.length) {
      render();
      return;
    }
    advance(3);
  }
  if (action === "confirm-application") advance(5);
  if (action === "fill-payment-example") {
    const example = {
      cardNumber: "0000 0000 0000 0000",
      expiration: "12/30",
      cvc: "000",
      ownerName: "홍길동",
      address: "OO동 연습로 1",
      postalCode: "00000"
    };
    Object.entries(example).forEach(([key, value]) => {
      const input = content.querySelector(`[data-payment-field="${key}"]`);
      if (input) input.value = value;
    });
    const message = document.querySelector("#paymentMessage");
    message.hidden = true;
    message.textContent = "";
  }
  if (action === "finish") {
    const paymentFields = [...content.querySelectorAll("[data-payment-field]")];
    const missingField = paymentFields.find(input => !input.value.trim());
    if (missingField) {
      const message = document.querySelector("#paymentMessage");
      const fieldName = missingField.closest("label")?.childNodes[0]?.textContent?.trim() || "빈 칸";
      message.textContent = `“${fieldName}” 항목을 입력하거나 ‘카드 예시 입력’을 눌러 주세요.`;
      message.hidden = false;
      missingField.focus();
      return;
    }
    const conflicts = getScheduleConflicts(course);
    if (conflicts.length) {
      const message = document.querySelector("#paymentMessage");
      message.textContent = scheduleConflictMessage(conflicts);
      message.hidden = false;
      return;
    }
    if (!state.timetableAdded) {
      state.timetableAdded = addCourseToTimetable();
      if (!state.timetableAdded) {
        const message = document.querySelector("#paymentMessage");
        message.textContent = state.timetableError || "시간표에 추가하지 못했어요. 다시 시도해 주세요.";
        message.hidden = false;
        return;
      }
    }
    advance(6);
  }
  if (action === "add-timetable") {
    state.timetableAdded = addCourseToTimetable();
    render();
  }
  if (action === "restart") {
    Object.assign(state, { step: 0, searched: false, searchText: "", address: "", message: "" });
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

function addCourseToTimetable() {
  try {
    const stored = JSON.parse(localStorage.getItem(TIMETABLE_STORAGE_KEY) || "[]");
    const ids = Array.isArray(stored) ? stored.map(id => COURSE_ID_ALIASES[id] || id) : [];
    const conflicts = getScheduleConflicts(course);
    if (conflicts.length) {
      state.timetableError = scheduleConflictMessage(conflicts);
      return false;
    }
    if (!ids.includes(course.id)) ids.push(course.id);
    localStorage.setItem(TIMETABLE_STORAGE_KEY, JSON.stringify(ids));
    state.timetableError = "";
    return true;
  } catch {
    state.timetableError = "시간표에 추가하지 못했어요. 브라우저 저장 공간을 확인해 주세요.";
    return false;
  }
}

coachBack.addEventListener("click", () => advance(state.step - 1));
coachNext.addEventListener("click", () => {
  if (state.step === 0) {
    const input = content.querySelector("#courseQuery");
    if (input?.value.trim()) content.querySelector("#courseSearch")?.requestSubmit();
    else {
      coachMessage.textContent = "원하는 강좌를 아래 목록에서 고르거나, 강좌명을 먼저 검색해 주세요.";
      content.querySelector(".course-result")?.focus();
    }
    return;
  }
  if (state.step === 1) {
    const firstResult = content.querySelector(".course-result");
    coachMessage.textContent = firstResult
      ? "원하는 강좌 이름을 눌러 상세 내용을 확인해 보세요."
      : "검색 결과가 없어요. 강좌명을 바꾸어 다시 검색해 주세요.";
    firstResult?.focus();
    return;
  }
  if (state.step === 2) {
    const applyButton = content.querySelector('[data-action="apply"]');
    if (applyButton?.disabled) {
      coachMessage.textContent = "시간표에 담긴 강좌와 시간이 겹쳐요. 다른 강좌를 골라 주세요.";
      return;
    }
    applyButton?.click();
    return;
  }
  if (state.step === 3) {
    content.querySelector("#applicationForm")?.requestSubmit();
    return;
  }
  if (state.step === 4) {
    content.querySelector('[data-action="confirm-application"]')?.click();
    return;
  }
  if (state.step === 5) content.querySelector('[data-action="finish"]')?.click();
});
document.querySelector("#closeCoach").addEventListener("click", () => {
  state.coachVisible = false;
  coachTarget?.classList.remove("coach-target");
  coach.hidden = true;
  reopenCoach.hidden = false;
  reopenCoach.focus();
});
reopenCoach.addEventListener("click", () => {
  state.coachVisible = true;
  coach.hidden = false;
  reopenCoach.hidden = true;
  coachTarget?.classList.add("coach-target");
  if (coachTarget) {
    coachTarget.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => positionCoach(true), 420);
  }
});
fillExample.addEventListener("click", () => {
  if (state.step === 0) {
    state.searchText = course.title;
    state.searched = true;
    advance(1);
  } else if (state.step === 3) {
    state.address = "OO동 연습로 1";
    render();
    document.querySelector("#practiceAddress")?.focus();
  } else if (state.step === 5) {
    content.querySelector('[data-action="fill-payment-example"]')?.click();
    content.querySelector('[data-payment-field="cardNumber"]')?.focus();
  }
});
document.querySelector("#speakGuide").addEventListener("click", () => {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(guidance[state.step]);
  utterance.lang = "ko-KR";
  utterance.rate = 0.88;
  window.speechSynthesis.speak(utterance);
});

window.addEventListener("scroll", followCoachTarget, { passive: true });
window.addEventListener("resize", () => positionCoach(true));

render();
