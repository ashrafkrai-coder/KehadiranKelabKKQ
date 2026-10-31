/** Hadir KKQ Google Apps Script endpoint. Deploy as Web App, execute as owner. */
const APP_ACTIVITY = 'Kemahiran al-Quran';
const APP_ACTIVITY_NAME = 'Kelas Kemahiran al-Quran';
const SHEETS = {
  'Senarai': ['Nama', 'Kelas', 'ID'],
  'Kehadiran': ['Tahun', 'Tarikh', 'Jenis Aktiviti', 'Nama Aktiviti', 'Perjumpaan', 'Kelas', 'Nama Murid', 'Status', 'Sebab', 'Kunci Rekod', 'Dikemas kini'],
  'Log': ['Masa', 'Tahap', 'Mesej']
};
function doGet(e) { return output_({ ok: true, service: 'Hadir KKQ', version: 1 }); }
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (!tokenValid_(payload.token)) throw new Error('Token tidak sah.');
    if (payload.action === 'students') { const ss = SpreadsheetApp.getActiveSpreadsheet(); ensureSheets_(ss); const sh = ss.getSheetByName('Senarai'); const values = sh.getDataRange().getDisplayValues(); const headers = values.shift().map(x => String(x).trim().toLocaleLowerCase()); const ni = headers.findIndex(x => /nama/.test(x)), ci = headers.findIndex(x => /kelas|tingkatan/.test(x)), ii = headers.findIndex(x => /^id$/.test(x)); if (ni < 0 || ci < 0) throw new Error('Tab Senarai perlu mempunyai lajur Nama dan Kelas.'); const students = values.filter(row => row[ni] && row[ci]).map(row => ({ nama: clean_(row[ni], 100), kelas: clean_(row[ci], 50), id: ii >= 0 ? clean_(row[ii], 100) : '' })); return output_({ ok: true, students }); }
    if (payload.action !== 'attendance' || !Array.isArray(payload.rows)) throw new Error('Permintaan tidak sah.');
    if (payload.rows.length > 500) throw new Error('Maksimum 500 rekod setiap permintaan.');
    lock.waitLock(20000);
    const ss = SpreadsheetApp.getActiveSpreadsheet(); ensureSheets_(ss);
    const sheet = ss.getSheetByName('Kehadiran'); const last = sheet.getLastRow();
    const keys = last >= 2 ? sheet.getRange(2, 10, last - 1, 1).getDisplayValues().flat() : [];
    const index = new Map(keys.map((k, i) => [k, i + 2])); const appends = []; let updated = 0;
    payload.rows.forEach(raw => {
      const r = normalizeRow_(raw); const key = sessionKey_(r); const values = [r.tahun, r.tarikh, r.jenisAktiviti, r.namaAktiviti, r.perjumpaan, r.kelas, r.nama, r.status, r.sebab, key, r.dikemasKini];
      if (index.has(key)) { sheet.getRange(index.get(key), 1, 1, values.length).setValues([values]); updated++; }
      else { index.set(key, last + appends.length + 2); appends.push(values); }
    });
    if (appends.length) sheet.getRange(sheet.getLastRow() + 1, 1, appends.length, 11).setValues(appends);
    log_(ss, 'INFO', `Kehadiran: ${updated} dikemas kini, ${appends.length} baharu.`);
    return output_({ ok: true, updated, inserted: appends.length });
  } catch (err) {
    try { log_(SpreadsheetApp.getActiveSpreadsheet(), 'ERROR', String(err.message || err)); } catch (_) {}
    return output_({ ok: false, error: String(err.message || err) });
  } finally { try { lock.releaseLock(); } catch (_) {} }
}
function tokenValid_(token) { const expected = PropertiesService.getScriptProperties().getProperty('HADIR_TOKEN'); return !!expected && String(token || '') === expected; }
function normalizeRow_(r) {
  const date = String(r.tarikh || '').slice(0, 10), year = Number(r.tahun) || Number(date.slice(0, 4)), activity = normalizeActivity_(r.jenisAktiviti);
  const n = Number(r.perjumpaan), status = String(r.status || '').toUpperCase().trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !year || !activity || !Number.isInteger(n) || n < 1 || n > 12 || !['H', 'T', 'TS'].includes(status)) throw new Error('Medan tarikh, aktiviti, perjumpaan atau status tidak sah.');
  const namaAktiviti = activity === APP_ACTIVITY ? APP_ACTIVITY_NAME : clean_(r.namaAktiviti, 100);
  return { tahun: year, tarikh: date, jenisAktiviti: activity, namaAktiviti, perjumpaan: n, kelas: clean_(r.kelas, 50), nama: clean_(r.nama, 100), status, sebab: clean_(r.sebab, 300), dikemasKini: new Date().toISOString() };
}
function clean_(value, max) { return String(value == null ? '' : value).replace(/<[^>]*>/g, '').replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max); }
function normalizeActivity_(v) { const s = clean_(v, 80).toLocaleLowerCase(); return /quran|qur.?an|kemahiran/.test(s) ? APP_ACTIVITY : ''; }
function sessionKey_(r) { return [r.tahun, r.tarikh, r.jenisAktiviti, r.namaAktiviti.toLocaleLowerCase(), r.perjumpaan, r.kelas.toLocaleLowerCase(), r.nama.toLocaleLowerCase()].join('|'); }
/** Creates missing sheets. Existing header updates affect row 1 only and never clear data rows. */
function ensureSheets_(ss) {
  Object.keys(SHEETS).forEach(name => {
    let sh = ss.getSheetByName(name); if (!sh) sh = ss.insertSheet(name);
    const expected = SHEETS[name], width = Math.max(expected.length, sh.getLastColumn(), 1);
    const old = sh.getRange(1, 1, 1, width).getDisplayValues()[0];
    const headers = expected.map((h, i) => old[i] && String(old[i]).trim() ? old[i] : h);
    // For an older schema, add new labels only in unused header cells; retain legacy labels and every record.
    expected.forEach((h, i) => { if (!headers[i]) headers[i] = h; });
    sh.getRange(1, 1, 1, headers.length).setValues([headers]); sh.setFrozenRows(1);
  });
  removeLegacySheets_(ss);
}
function removeLegacySheets_(ss) {
  ['Kelab', 'Aktiviti', 'Murid'].forEach(name => {
    const sh = ss.getSheetByName(name);
    if (sh && ss.getSheets().length > 1) ss.deleteSheet(sh);
  });
}
function setupSheets() { const ss = SpreadsheetApp.getActiveSpreadsheet(); ensureSheets_(ss); log_(ss, 'INFO', 'Struktur sheet KKQ disediakan. Tab Kelab, Aktiviti dan Murid legacy dibuang.'); }
function log_(ss, level, message) { const sh = ss.getSheetByName('Log'); if (sh) sh.appendRow([new Date(), level, clean_(message, 400)]); }
function output_(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
