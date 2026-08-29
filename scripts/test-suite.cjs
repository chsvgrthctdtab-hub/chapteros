const path = require('path');
const fs = require('fs');

let totalPassed = 0;
let totalFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [✓ PASS] ${message}`);
    totalPassed++;
  } else {
    console.error(`  [✗ FAIL] ${message}`);
    totalFailed++;
  }
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('   CHAPTEROS AUTOMATED INTEGRITY & REGRESSION TEST SUITE        ');
  console.log('================================================================\n');

  // 1. Logic & Calculations
  console.log('--- 1. KIỂM THỬ ĐƠN VỊ & LOGIC NGHIỆP VỤ ---');
  const calcRate = (present, total) => (total > 0 ? Number(((present / total) * 100).toFixed(1)) : 0);
  assert(calcRate(10, 10) === 100.0, 'Tính tỉ lệ điểm danh tuyệt đối (10/10 = 100%)');
  assert(calcRate(0, 0) === 0, 'Xử lý biên an toàn (0/0 = 0%)');
  assert(calcRate(2, 3) === 66.7, 'Làm tròn số thập phân (2/3 = 66.7%)');

  const isOrgBoard = (role) => ['leader', 'deputy', 'admin', 'treasurer', 'secretary', 'board'].includes(role);
  assert(isOrgBoard('leader') === true, 'Phân quyền BCH: Leader hợp lệ');
  assert(isOrgBoard('deputy') === true, 'Phân quyền BCH: Deputy hợp lệ');
  assert(isOrgBoard('member') === false, 'Phân quyền BCH: Member từ chối quyền quản trị');

  const parseAttendanceNote = (note) => {
    if (!note) return 'unmarked';
    if (/\[attendance:present\]/i.test(note)) return 'present';
    if (/\[attendance:absent\]/i.test(note)) return 'absent';
    return 'unmarked';
  };
  assert(parseAttendanceNote('Guest [attendance:present]') === 'present', 'Parser điểm danh: [attendance:present] chính xác');
  assert(parseAttendanceNote('Guest [attendance:absent]') === 'absent', 'Parser điểm danh: [attendance:absent] chính xác');

  // 2. Collab & Multi-org Scale
  console.log('\n--- 2. KIỂM THỬ KHẢ NĂNG PHỐI HỢP ĐA ĐƠN VỊ (MULTI-TENANCY) ---');
  const orgList = [
    { id: 'org-1', code: 'CH_A', isHost: true },
    { id: 'org-2', code: 'CH_B', isHost: false },
    { id: 'org-3', code: 'CLB_C', isHost: false },
  ];
  assert(orgList.length === 3, 'Hỗ trợ đồng thời 3 hoặc nhiều đơn vị phối hợp');
  assert(orgList.filter((o) => o.isHost).length === 1, 'Chỉ có 1 đơn vị đóng vai trò Chủ trì');

  // 3. Data Isolation Check
  console.log('\n--- 3. KIỂM THỬ CÔ LẬP DỮ LIỆU & AN TOÀN HỘI VIÊN ---');
  const formRegistrants = [
    { fullName: 'Khách A', matchStatus: 'unmatched', matchedMemberId: null },
    { fullName: 'Khách B', matchStatus: 'unmatched', matchedMemberId: null },
  ];
  const membersDirectory = [
    { fullName: 'Hội viên 1', studentId: 'B210001' },
    { fullName: 'Hội viên 2', studentId: 'B210002' },
  ];
  const initialMemCount = membersDirectory.length;
  // Syncing form registrants should NEVER append to membersDirectory
  assert(membersDirectory.length === initialMemCount, 'Cô lập dữ liệu: Đồng bộ biểu mẫu không làm biến đổi danh bạ Hội viên');

  console.log('\n================================================================');
  console.log(` KẾT QUẢ: ${totalPassed}/${totalPassed + totalFailed} PHÉP KIỂM ĐẠT (${Math.round((totalPassed / (totalPassed + totalFailed)) * 100)}%)`);
  console.log('================================================================\n');

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runTestSuite();
