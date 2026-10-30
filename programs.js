const CLASS_NOTICE = "https://www.seocho.go.kr/site/seocho/ex/lecture/View.do?clIdx=L00018738";
const CLASS_LIST = "https://www.seocho.go.kr/site/seocho/ex/lecture/List.do?scOrg=29280000";
const LIBRARY_NOTICE = "https://www.seocholib.or.kr/";
const CLASS_SOURCE_LABEL = "2026 4분기 강좌표·접수 안내";
const COURSE_START = "2026-10-01";
const COURSE_END = "2026-12-31";
const APPLICATION_START = "2026-09-14";
const APPLICATION_END = "2026-09-18";

const CLASS_INSTRUCTORS = {
  "senior-smartphone-basic": "김아영",
  "senior-smartphone-ai": "김아영",
  "ukulele-basic": "박지원",
  "ukulele-intermediate": "박지원",
  calligraphy: "시지나",
  watercolor: "박미정",
  knitting: "박선희",
  "pen-drawing": "양연희",
  guitar: "김영도",
  "strength-gym": "송주희",
  pilates: "강지연",
  "healing-yoga": "박성신",
  "line-dance-basic": "남정옥",
  "line-dance-intermediate": "남정옥",
  "kids-ballet": "진미아",
  "fun-dance": "박진화"
};

const makeClass = (id, title, category, icon, schedule, room, seats, sessions, fee, firstClassDate = COURSE_START, audience = "일반") => {
  const [dayLabel, timeLabel] = schedule.split(" · ");
  const [startTime, endTime] = timeLabel.split("–");
  return {
    id,
    title,
    category,
    categoryLabel: ({ kids: "아이·가족", wellness: "건강·운동", senior: "스마트폰·AI", learning: "취미·배움", library: "도서관" })[category],
    icon,
    iconBg: ({ kids: "#f6eadb", wellness: "#e3eee5", senior: "#ece8f4", learning: "#f5e5e2" })[category],
    iconFg: ({ kids: "#aa6842", wellness: "#3c7552", senior: "#71608e", learning: "#a65e54" })[category],
    facility: "OO자치회관 · OO열린문화센터",
    audience,
    schedule,
    days: dayLabel.split("·").map(day => day.trim()),
    startTime,
    endTime,
    instructor: CLASS_INSTRUCTORS[id] || "공식 공고 확인",
    dates: "2026.10.01 – 12.31",
    firstClassDate,
    applyStart: APPLICATION_START,
    applyEnd: APPLICATION_END,
    fee: `${fee.toLocaleString("ko-KR")}원 / 3개월`,
    room,
    seats: `${seats}명`,
    sessions: `${sessions}회`,
    status: "접수 마감",
    statusClass: "closed",
    statusRank: 0,
    source: CLASS_NOTICE,
    sourceLabel: CLASS_SOURCE_LABEL,
    application: CLASS_LIST,
    tags: ["2026 4분기", `${seats}명 정원`, ...(category === "senior" ? ["정보화"] : [])],
    summary: `서초구청 OO자치회관의 2026년 4분기 공식 강좌입니다. 접수 기간은 9월 14일부터 18일까지였으며 현재 접수 마감으로 표시됩니다.`,
    registration: "온라인 접수 마감 · 잔여석·대기 접수 전화 문의",
    contact: "02-2155-5378, 02-2155-5375"
  };
};

const SHARED_PROGRAMS = [
  {
    id: "oo-book-garden-2026",
    title: "OO 북가든 팝업 야외도서관",
    category: "library",
    categoryLabel: "도서관",
    icon: "책",
    iconBg: "#f4edda",
    iconFg: "#9a7840",
    facility: "OO도서관 4층 테라스",
    audience: "누구나 · 도서관 운영시간 내 자유 이용",
    schedule: "평일 10:00–20:00 · 주말 10:00–17:00",
    dates: "2026.09.30 – 10.29",
    applyStart: "2026-09-30",
    applyEnd: "2026-10-29",
    fee: "상설 공간은 자유 이용",
    room: "OO도서관 4층 야외 테라스",
    seats: "정원 안내 없음",
    sessions: "운영기간 중 상시",
    status: "운영 종료 · 10/29",
    statusClass: "closed",
    statusRank: 1,
    source: LIBRARY_NOTICE,
    sourceLabel: "OO도서관 운영 안내",
    application: null,
    tags: ["OO도서관", "10/29까지", "누구나"],
    summary: "가을 테마 야외 독서공간, 세대공감 북큐레이션과 연계 체험을 운영합니다. 우천 시 실내 북카페로 장소가 바뀌며, 특별 문화행사는 별도 사전 신청이 필요합니다.",
    registration: "상설 공간은 별도 신청 없이 이용 · 특별 문화행사는 별도 접수",
    contact: "OO도서관 02-3461-0920"
  },
  makeClass("senior-smartphone-basic", "시니어 스마트폰 활용(초급)", "senior", "폰", "화·목 · 09:30–10:30", "프로그램실 1", 15, 24, 90000),
  makeClass("senior-smartphone-ai", "시니어 스마트폰 AI 활용(중급)", "senior", "AI", "화·목 · 11:00–12:00", "프로그램실 1", 15, 24, 90000),
  makeClass("ukulele-basic", "우쿨렐레(초급)", "learning", "음악", "금 · 10:00–12:00", "프로그램실 1", 15, 10, 90000, "2026-10-02"),
  makeClass("ukulele-intermediate", "우쿨렐레(중급)", "learning", "음악", "목 · 13:00–15:00", "프로그램실 1", 15, 12, 90000),
  makeClass("calligraphy", "캘리그라피", "learning", "글씨", "화 · 09:30–11:30", "프로그램실 2", 20, 12, 90000, "2026-10-06"),
  makeClass("watercolor", "수채화 교실", "learning", "그림", "화 · 14:00–16:00", "프로그램실 2", 20, 12, 90000, "2026-10-06"),
  makeClass("knitting", "손뜨개 교실", "learning", "뜨개", "목 · 09:30–11:30", "프로그램실 2", 20, 12, 90000),
  makeClass("pen-drawing", "펜 드로잉", "learning", "드로잉", "목 · 14:00–16:00", "프로그램실 2", 20, 12, 90000),
  makeClass("guitar", "통기타 교실", "learning", "기타", "금 · 14:00–16:00", "프로그램실 2", 15, 10, 90000, "2026-10-02"),
  makeClass("strength-gym", "건강체조(근력강화)", "wellness", "건강", "화·목 · 10:00–11:00", "다목적실", 30, 24, 90000),
  makeClass("pilates", "필라테스", "wellness", "운동", "화·목 · 13:30–14:30", "다목적실", 30, 24, 90000),
  makeClass("healing-yoga", "힐링요가", "wellness", "요가", "수·금 · 09:00–10:00", "다목적실", 30, 22, 90000, "2026-10-02"),
  makeClass("line-dance-basic", "라인댄스(초급)", "wellness", "댄스", "월·수 · 10:30–11:30", "다목적실", 25, 23, 90000, "2026-10-07"),
  makeClass("line-dance-intermediate", "라인댄스(중급)", "wellness", "댄스", "월·수 · 11:30–12:30", "다목적실", 25, 23, 90000, "2026-10-07"),
  makeClass("kids-ballet", "키즈 발레", "kids", "발레", "월 · 17:00–17:50", "다목적실", 25, 11, 75000, "2026-10-12", "유아 및 초등 1·2학년"),
  makeClass("fun-dance", "신나는 댄스(체력증진)", "wellness", "댄스", "수·금 · 13:00–14:00", "다목적실", 25, 22, 90000, "2026-10-02")
];


window.UMYEON_PROGRAMS = SHARED_PROGRAMS;
window.UMYEON_COURSES = SHARED_PROGRAMS.filter(program => Boolean(program.application));
