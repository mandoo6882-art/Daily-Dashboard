// ============================================================
// 데이터 연결 설정
// ============================================================
// EXCEL_SHARE_URL : 연결할 OneDrive/SharePoint 엑셀 파일의 공유 링크.
//   나중에 다른 파일로 바꾸고 싶으면 이 값만 바꾸면 됨 (코드 수정 불필요).
//   실제 연결은 서버(/api/dashboard-data)에서 처리되고,
//   이 값은 Vercel 프로젝트의 환경변수 EXCEL_SHARE_URL 로 설정해서 관리하는 걸 추천.
// API_ENDPOINT : 프론트엔드가 데이터를 요청할 주소. 비워두면 mock 데이터 사용.
// ============================================================

const CONFIG = {
  API_ENDPOINT: "", // 예: "/api/dashboard-data"  (배포 후 채우면 실제 데이터로 전환)
  PROJECT_INFO: {
    cutoff: "2026-08-11",
    categories: "Steel Structure / EQT Erection / Shop Welding / Field Welding / Cable Elec & Inst"
  }
};

// ------------------------------------------------------------
// 샘플 데이터 (2026-08-11 Cut off 기준 실제 스냅샷)
// API_ENDPOINT가 비어있을 때 미리보기용으로 사용됨.
// 실제 연결 후에는 이 값들이 매번 최신 값으로 대체됨.
// ------------------------------------------------------------
const MOCK_DATA = {
  dailyKeyActivities: [],
  welderStatus: [
    { "Group": "JCC Received", "Plan": "308", "Actual": "215", "Var.": "-93" },
    { "Group": "JCC under Approval", "Plan": "27", "Actual": "6", "Var.": "-21" }
  ],
  disciplines: [
    { name: "Steel Structure", total: 12129, completed: 9991, remaining: 2138, dailyPlan: 37, dailyActual: 27, dailyVar: -10, cumPlan: 9775, cumActual: 9991, cumVar: 217, mpPlan: 620, mpActual: 522, status: "Ahead" },
    { name: "Equipment Erection", total: 369, completed: 96, remaining: 273, dailyPlan: 7, dailyActual: 0, dailyVar: -7, cumPlan: 208, cumActual: 96, cumVar: -112, mpPlan: 128, mpActual: 99, status: "Behind" },
    { name: "Shop Welding", total: 351974, completed: 325691, remaining: 26283, dailyPlan: 679, dailyActual: 335, dailyVar: -344, cumPlan: 340432, cumActual: 325691, cumVar: -14741, mpPlan: 76, mpActual: 55, status: "Behind" },
    { name: "Spool Release", total: 28633, completed: 20630, remaining: 8003, dailyPlan: 167, dailyActual: 33, dailyVar: -134, cumPlan: 24643, cumActual: 20630, cumVar: -4013, mpPlan: null, mpActual: null, status: "Behind" },
    { name: "Spool Delivery", total: 28633, completed: 16353, remaining: 12280, dailyPlan: 254, dailyActual: 11, dailyVar: -243, cumPlan: 21135, cumActual: 16353, cumVar: -4782, mpPlan: null, mpActual: null, status: "Behind" },
    { name: "Field Weld", total: 255383, completed: 62148, remaining: 193235, dailyPlan: 1165, dailyActual: 1009, dailyVar: -156, cumPlan: 65230, cumActual: 62148, cumVar: -3083, mpPlan: 308, mpActual: 117, status: "Behind" },
    { name: "Pressure Test", total: 1661, completed: 0, remaining: 1661, dailyPlan: 0.3, dailyActual: 0, dailyVar: -0.3, cumPlan: 0, cumActual: 0, cumVar: 0, mpPlan: null, mpActual: null, status: "Behind" },
    { name: "Reinstatement", total: 1661, completed: 0, remaining: 1661, dailyPlan: 0, dailyActual: 0, dailyVar: 0, cumPlan: 0, cumActual: 0, cumVar: 0, mpPlan: null, mpActual: null, status: "Yet" },
    { name: "Cable Pulling - ELEC", total: 585503, completed: 57197, remaining: 528306, dailyPlan: 3020, dailyActual: 90, dailyVar: -2930, cumPlan: 96554, cumActual: 57197, cumVar: -39357, mpPlan: 334, mpActual: 247, status: "Behind" },
    { name: "Cable Pulling - INST", total: 384693, completed: 44334, remaining: 340359, dailyPlan: 724, dailyActual: 720, dailyVar: -4, cumPlan: 24751, cumActual: 44334, cumVar: 19583, mpPlan: 277, mpActual: 223, status: "Ahead" },
    { name: "Loop Test", total: 10130, completed: 0, remaining: 10130, dailyPlan: 0, dailyActual: 0, dailyVar: 0, cumPlan: 0, cumActual: 0, cumVar: 0, mpPlan: null, mpActual: null, status: "Yet" }
  ],

  issueSummary: [
    { discipline: "Civil", total: 3, done: 0, open: 3 },
    { discipline: "Architecture", total: 1, done: 0, open: 1 },
    { discipline: "Steel Structure", total: 3, done: 1, open: 2 },
    { discipline: "Mechanical", total: 5, done: 1, open: 4 },
    { discipline: "Piping", total: 9, done: 3, open: 6 },
    { discipline: "Electrical", total: 3, done: 0, open: 3 },
    { discipline: "Instrument", total: 2, done: 0, open: 2 },
    { discipline: "QC", total: 1, done: 0, open: 1 },
    { discipline: "IM", total: 4, done: 2, open: 2 },
    { discipline: "CPM", total: 1, done: 1, open: 0 },
    { discipline: "All", total: 1, done: 0, open: 1 }
  ],

  issueList: {
    columns: ["No", "Unit", "Title", "Discipline", "Due Date", "Status"],
    filterColumn: "Discipline",
    rows: [
      { "No": "2", "Unit": "All", "Title": "PKG4 Cat IV Fence in west", "Discipline": "IM", "Due Date": "2026-07-15", "Status": "Open" },
      { "No": "4", "Unit": "All", "Title": "PKG4 Overbridge in Train 7", "Discipline": "IM", "Due Date": "2026-07-15", "Status": "Open" },
      { "No": "6", "Unit": "All", "Title": "SCOT Regenerator Dress-up (Train 7)", "Discipline": "Mechanical", "Due Date": "2026-08-10", "Status": "Open" },
      { "No": "8", "Unit": "All", "Title": "Refractory Lining for Incinerator Stack (Train 7)", "Discipline": "Mechanical", "Due Date": "2026-09-14", "Status": "Open" },
      { "No": "9", "Unit": "All", "Title": "Incinerator Stack Delivery (Train 8/9)", "Discipline": "Mechanical", "Due Date": "2026-08-22", "Status": "Open" },
      { "No": "10", "Unit": "All", "Title": "Site Constraints for Equipment Operations Due to Interface Issue", "Discipline": "All", "Due Date": "2026-09-30", "Status": "Open" },
      { "No": "11", "Unit": "All", "Title": "Sulfur Pit Lining Schedule", "Discipline": "Civil / Piping", "Due Date": "2026-08-15", "Status": "Open" },
      { "No": "13", "Unit": "All", "Title": "Solvent Trench Schedule Monitoring", "Discipline": "Civil", "Due Date": "2026-09-28", "Status": "Open" },
      { "No": "15", "Unit": "All", "Title": "Critical Milestone for Completion of All P/R", "Discipline": "Steel Structure", "Due Date": "2026-08-31", "Status": "Open" }
    ]
  },

  walkthroughSummary: [
    { responsibility: "SFEC", total: 136, done: 67, open: 69 },
    { responsibility: "NBTC", total: 127, done: 78, open: 49 },
    { responsibility: "Raymond", total: 45, done: 25, open: 20 },
    { responsibility: "KAEFER", total: 5, done: 0, open: 5 },
    { responsibility: "CGA", total: 23, done: 18, open: 5 },
    { responsibility: "GS", total: 7, done: 0, open: 7 },
    { responsibility: "COMPANY", total: 1, done: 0, open: 1 }
  ],

  walkthroughList: {
    columns: ["No", "Unit", "Date", "Item", "Responsibility", "Due Date", "Status"],
    filterColumn: "Responsibility",
    rows: [
      { "No": "15", "Unit": "Train 9", "Date": "2026-06-03", "Item": "T9 - Piping Work", "Responsibility": "NBTC", "Due Date": "2026-06-09", "Status": "Ongoing" },
      { "No": "16", "Unit": "Train 9", "Date": "2026-06-03", "Item": "T9 - TS001 installation of handrails", "Responsibility": "NBTC/SFEC", "Due Date": "2026-07-08", "Status": "Ongoing" },
      { "No": "29", "Unit": "Train 8", "Date": "2026-06-04", "Item": "TS-003 Steel Structure", "Responsibility": "NBTC/SFEC", "Due Date": "2026-06-07", "Status": "Latest update" },
      { "No": "41", "Unit": "Train 8", "Date": "2026-06-04", "Item": "U/G MDEA line work and Trench Coating Work", "Responsibility": "NBTC", "Due Date": "2026-06-10", "Status": "-" },
      { "No": "59", "Unit": "Train 8", "Date": "2026-06-11", "Item": "TS001 - Handrail", "Responsibility": "NBTC", "Due Date": "2026-07-15", "Status": "To be continued" },
      { "No": "60", "Unit": "Train 8", "Date": "2026-06-11", "Item": "SFEC to finish coating for pipe trench", "Responsibility": "SFEC", "Due Date": "2026-06-18", "Status": "Ongoing" },
      { "No": "61", "Unit": "Train 8", "Date": "2026-06-11", "Item": "Backfill", "Responsibility": "SFEC", "Due Date": "2026-06-13", "Status": "Started Jul 5" }
    ]
  }
};
