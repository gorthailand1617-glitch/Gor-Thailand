
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/**
 * ฟังก์ชันหลักสำหรับแสดงหน้าเว็บแอป
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Thai Herb Explorer')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * ฟังก์ชันสำหรับบันทึกข้อมูลวิจัยสมุนไพรลงใน Google Sheets
 */
function saveHerbToSheet(data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('HerbResearch') || ss.insertSheet('HerbResearch');
    
    // ตั้งค่าหัวตารางหากยังไม่มี
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['วันที่บันทึก', 'ชื่อสมุนไพร', 'สรรพคุณหลัก', 'หมวดหมู่การใช้งาน', 'ระดับความยาก', 'URL อ้างอิง']);
      sheet.getRange(1, 1, 1, 6).setBackground('#4d7c4d').setFontColor('white').setFontWeight('bold');
    }
    
    sheet.appendRow([
      new Date(),
      data.name,
      data.properties,
      data.category,
      data.level,
      data.sources
    ]);
    
    return { success: true, message: 'บันทึกข้อมูลเรียบร้อยแล้ว' };
  } catch (e) {
    return { success: false, message: 'เกิดข้อผิดพลาด: ' + e.toString() };
  }
}
