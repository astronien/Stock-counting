// ================================================
// Stock Counting System - Optimized Version
// ================================================

// Configuration
const CONFIG = {
    GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbyhvaI8Att7DL2dDpdwbN_rzu3XJYrK0un1m1Mkjb5BMWPRN3Q_c3F0tMCf-Cy0lsZ5/exec',
    EMPLOYEE_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    SCAN_COOLDOWN: 3000, // 3 seconds (increased for battery)
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    // Batch Sync Settings
    BATCH_SIZE: 20, // Sync every 20 items
    BATCH_INTERVAL: 60000, // Or every 1 minute (60 seconds)
    // Camera Optimization
    CAMERA_FPS: 5, // Reduced from 10 to 5 FPS
    PAUSE_CAMERA_AFTER_SCAN: true // Pause camera after successful scan
};

// Global State
let stockData = new Map();
let countHistory = [];
let lastEmployeeId = null;
let lastEmployeeIdTime = null;
let lastScannedCode = null;
let lastScanTime = 0;
let html5QrCode = null;

// Offline & Sync State
let pendingQueue = []; // Items waiting to be synced
let isSyncing = false;
let lastSyncTime = null;
let syncTimer = null;
let syncFailCount = 0;

// ========== Initialization ==========
document.addEventListener('DOMContentLoaded', () => {
    initStockData();
    loadPendingQueue();
    startBatchSyncTimer();
    setupBeforeUnload();
});

// ========== Local Storage Management ==========
function loadPendingQueue() {
    const saved = localStorage.getItem('pendingQueue');
    if (saved) {
        try {
            pendingQueue = JSON.parse(saved);
            console.log('Loaded pending queue:', pendingQueue.length, 'items');
            updateSyncBadge();
        } catch (e) {
            console.error('Error loading pending queue:', e);
            pendingQueue = [];
        }
    }
}

function savePendingQueue() {
    localStorage.setItem('pendingQueue', JSON.stringify(pendingQueue));
}

function setupBeforeUnload() {
    window.addEventListener('beforeunload', (e) => {
        if (pendingQueue.length > 0) {
            e.preventDefault();
            e.returnValue = `คุณมีข้อมูล ${pendingQueue.length} รายการที่ยังไม่ได้ sync กับ Google Sheets`;
            return e.returnValue;
        }
    });
}

// ========== Utility Functions ==========
function formatTimestamp(date, useBuddhistEra = true) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = useBuddhistEra ? date.getFullYear() + 543 : date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
}

function showLoading(show = true) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.add('active');
        document.body.classList.add('loading');
    } else {
        overlay.classList.remove('active');
        document.body.classList.remove('loading');
    }
}

function showMessage(msg) {
    const messageEl = document.getElementById('message');
    const errorEl = document.getElementById('error');
    messageEl.innerText = msg;
    errorEl.innerText = '';
    setTimeout(() => messageEl.innerText = '', 3000);
}

function showError(msg) {
    showLoading(false);
    const messageEl = document.getElementById('message');
    const errorEl = document.getElementById('error');
    errorEl.innerText = msg;
    messageEl.innerText = '';
    setTimeout(() => errorEl.innerText = '', 3000);
}

function showPopup(msg) {
    const popupEl = document.getElementById('popup');
    popupEl.innerText = msg;
    popupEl.style.display = 'block';
    setTimeout(() => popupEl.style.display = 'none', 3000);
}

// ========== Sync Badge & Status ==========
function updateSyncBadge() {
    const badge = document.getElementById('syncBadge');
    const syncBtn = document.getElementById('syncNowBtn');

    if (pendingQueue.length > 0) {
        badge.textContent = `🔄 รอ sync: ${pendingQueue.length}`;
        badge.style.display = 'inline-block';
        if (syncBtn) syncBtn.style.display = 'inline-block';
    } else {
        badge.textContent = '✓ Synced';
        badge.style.display = 'inline-block';
        if (syncBtn) syncBtn.style.display = 'none';
        setTimeout(() => {
            badge.style.display = 'none';
        }, 3000);
    }
}

function updateSyncStatus(status) {
    const statusEl = document.getElementById('syncStatus');
    if (statusEl) {
        statusEl.textContent = status;
        statusEl.style.display = 'block';
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 3000);
    }
}

// ========== Stock Data Management ==========
async function initStockData() {
    // Load cached data first
    const cachedStockData = localStorage.getItem('stockData');
    if (cachedStockData) {
        stockData = new Map(JSON.parse(cachedStockData));
        console.log('Loaded stockData from cache:', stockData.size, 'items');
    }

    // Fetch fresh data from Google Sheets
    try {
        showLoading(true);
        const response = await fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?action=getStockData`);
        const data = await response.json();

        if (data && Array.isArray(data)) {
            stockData = new Map(data);
            localStorage.setItem('stockData', JSON.stringify([...stockData]));
            console.log('Loaded stockData from server:', stockData.size, 'items');
        }

        await checkEmployeeId();
        await refreshReport();
    } catch (err) {
        showError('ไม่สามารถโหลดข้อมูลสต็อกได้: ' + err.message);
        console.error('Error loading stock data:', err);
    } finally {
        showLoading(false);
    }
}

// ========== Employee ID Management ==========
async function checkEmployeeId() {
    const now = new Date().getTime();
    if (!lastEmployeeId || (now - lastEmployeeIdTime > CONFIG.EMPLOYEE_TIMEOUT)) {
        let newEmployeeId = prompt('กรุณากรอกรหัสพนักงาน:');
        if (newEmployeeId && newEmployeeId.trim().length > 0) {
            lastEmployeeId = newEmployeeId.trim();
            lastEmployeeIdTime = now;
            const employeeInput = document.getElementById('employeeId');
            if (employeeInput) {
                employeeInput.value = lastEmployeeId;
            }
        } else {
            showError('ต้องกรอกรหัสพนักงานเพื่อดำเนินการต่อ');
            setTimeout(checkEmployeeId, 1000);
        }
    } else {
        const employeeInput = document.getElementById('employeeId');
        if (employeeInput) {
            employeeInput.value = lastEmployeeId;
        }
    }
}

// ========== UI Mode Switching ==========
function showManualInput() {
    document.getElementById('manualInput').style.display = 'block';
    document.getElementById('scannerSection').style.display = 'none';

    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.error('Error stopping scanner:', err));
    }

    checkEmployeeId();
    document.getElementById('serialNumber').focus();
}

function showScanner() {
    document.getElementById('manualInput').style.display = 'none';
    document.getElementById('scannerSection').style.display = 'block';

    checkEmployeeId();
    startScanner();
}

// ========== Barcode Scanner ==========
function startScanner() {
    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("reader");
    }

    if (html5QrCode.isScanning) {
        console.log('Scanner already running');
        return;
    }

    const config = {
        fps: CONFIG.CAMERA_FPS, // Optimized to 5 FPS
        qrbox: { width: 400, height: 100 },
        aspectRatio: 1.777778
    };

    html5QrCode.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        (errorMessage) => {
            // Suppress continuous error logging
        }
    ).catch(err => {
        showError('ไม่สามารถเริ่มสแกนเนอร์ได้: ' + err.message);
        console.error('Error starting scanner:', err);
    });
}

function pauseScanner() {
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.pause(true);
        console.log('Scanner paused');
    }
}

function resumeScanner() {
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.resume();
        console.log('Scanner resumed');
    }
}

function onScanSuccess(decodedText, decodedResult) {
    const now = Date.now();

    // Prevent duplicate scans
    if (decodedText === lastScannedCode && now - lastScanTime < CONFIG.SCAN_COOLDOWN) {
        console.log('Skipping duplicate scan:', decodedText);
        return;
    }

    lastScannedCode = decodedText;
    lastScanTime = now;

    // Pause camera after scan (battery optimization)
    if (CONFIG.PAUSE_CAMERA_AFTER_SCAN) {
        pauseScanner();
    }

    // Validate barcode format
    const format = decodedResult.result.format.formatName;
    if (format !== "CODE_128" && format !== "CODE_39") {
        showScannerResult("FAIL", `ไม่ใช่บาร์โค้ด Code 128 หรือ Code 39!`, false);
        resumeScannerDelayed();
        return;
    }

    // Check if product exists
    const productName = loadProductName(decodedText);
    if (productName === "ไม่พบสินค้า") {
        showScannerResult("FAIL", `ไม่พบ S/N: ${decodedText} ในระบบ`, false);
        resumeScannerDelayed();
        return;
    }

    // Check if already counted
    if (countHistory.some(record => record.serialNumber.toLowerCase() === decodedText.toLowerCase())) {
        showScannerResult("FAIL", `S/N: ${decodedText} ถูกนับแล้ว!`, false);
        resumeScannerDelayed();
        return;
    }

    // Success - Save to local storage immediately
    showScannerResult("PASS", `S/N: ${decodedText} | ${productName}`, true);
    showPopup(`สแกนสำเร็จ: ${decodedText} (${format})`);
    saveToLocal(decodedText);

    // Resume scanner after delay
    resumeScannerDelayed();
}

function resumeScannerDelayed() {
    setTimeout(() => {
        if (CONFIG.PAUSE_CAMERA_AFTER_SCAN) {
            resumeScanner();
        }
    }, CONFIG.SCAN_COOLDOWN);
}

function showScannerResult(status, details, isSuccess) {
    const scannerResult = document.getElementById('scannerResult');
    scannerResult.innerHTML = `
        <div class="status">${status}</div>
        <div class="details">${details}</div>
    `;
    scannerResult.className = isSuccess ? 'success' : 'error';

    if (isSuccess && 'vibrate' in navigator) {
        navigator.vibrate(200);
    }

    setTimeout(() => {
        scannerResult.innerHTML = '';
        scannerResult.className = '';
    }, 3000);
}

// ========== Manual Entry ==========
function checkAndSave() {
    const serialNumber = document.getElementById('serialNumber').value.trim();
    if (serialNumber) {
        const productName = loadProductName(serialNumber);

        if (productName === "ไม่พบสินค้า") {
            showScannerResult("FAIL", `ไม่พบ S/N: ${serialNumber} ในระบบ`, false);
            return;
        }

        if (countHistory.some(record => record.serialNumber.toLowerCase() === serialNumber.toLowerCase())) {
            showScannerResult("FAIL", `S/N: ${serialNumber} ถูกนับแล้ว!`, false);
            return;
        }

        showScannerResult("PASS", `S/N: ${serialNumber} | ${productName}`, true);
        saveToLocal(serialNumber);
    }
}

function loadProductName(code) {
    const product = stockData.get(code.trim().toLowerCase());
    const productName = product ? product.productName.substring(0, 100) : "ไม่พบสินค้า";

    const productInput = document.getElementById('productName');
    if (productInput) {
        productInput.value = productName;
    }

    return productName;
}

// ========== Offline-First Save ==========
async function saveToLocal(serialNumber) {
    await checkEmployeeId();

    if (!lastEmployeeId) {
        showError('ต้องกรอกรหัสพนักงานก่อนบันทึก');
        return;
    }

    const record = {
        serialNumber: serialNumber.trim(),
        employeeId: lastEmployeeId,
        timestamp: new Date().toISOString(),
        productName: loadProductName(serialNumber)
    };

    // Add to local history immediately
    const displayRecord = {
        ...record,
        timestamp: formatTimestamp(new Date(record.timestamp), true)
    };
    countHistory.push(displayRecord);
    updateHistoryTable();

    // Add to pending queue for sync
    pendingQueue.push(record);
    savePendingQueue();
    updateSyncBadge();

    console.log('Saved to local:', record);
    showMessage('✓ บันทึกเรียบร้อย (รอ sync)');

    // Clear input
    const serialInput = document.getElementById('serialNumber');
    if (serialInput) {
        serialInput.value = '';
    }

    // Update uncounted count (optimistic)
    const remainingEl = document.getElementById('remainingCount');
    if (remainingEl) {
        const current = parseInt(remainingEl.textContent) || 0;
        remainingEl.textContent = Math.max(0, current - 1);
    }

    // Check if should trigger batch sync
    if (pendingQueue.length >= CONFIG.BATCH_SIZE) {
        console.log('Batch size reached, triggering sync...');
        await syncPendingQueue();
    }
}

// ========== Batch Sync ==========
function startBatchSyncTimer() {
    // Sync every BATCH_INTERVAL (1 minute)
    syncTimer = setInterval(() => {
        if (pendingQueue.length > 0 && !isSyncing) {
            console.log('Timer triggered, syncing pending items...');
            syncPendingQueue();
        }
    }, CONFIG.BATCH_INTERVAL);
}

async function syncPendingQueue() {
    if (isSyncing || pendingQueue.length === 0) {
        console.log('Sync skipped:', isSyncing ? 'already syncing' : 'nothing to sync');
        return;
    }

    isSyncing = true;
    updateSyncStatus('🔄 กำลัง sync...');

    try {
        console.log('Syncing', pendingQueue.length, 'items...');

        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'batchSaveCount',
                data: pendingQueue
            })
        });

        const result = await response.json();
        console.log('Batch sync result:', result);

        if (result.status === "Success") {
            // Clear pending queue
            pendingQueue = [];
            savePendingQueue();
            updateSyncBadge();
            lastSyncTime = new Date();
            syncFailCount = 0;

            updateSyncStatus('✓ Sync สำเร็จ!');
            console.log('Sync completed successfully');

            // Refresh uncounted items
            await updateUncountedTable();
        } else {
            throw new Error(result.message || 'Sync failed');
        }
    } catch (err) {
        syncFailCount++;
        console.error('Sync error:', err);
        updateSyncStatus(`✗ Sync ล้มเหลว (จะลองใหม่)`);

        // Auto-retry with exponential backoff
        if (syncFailCount < CONFIG.RETRY_ATTEMPTS) {
            const delay = CONFIG.RETRY_DELAY * Math.pow(2, syncFailCount - 1);
            console.log(`Will retry in ${delay}ms...`);
            setTimeout(() => {
                isSyncing = false;
                syncPendingQueue();
            }, delay);
            return;
        } else {
            showError('ไม่สามารถ sync ได้ ข้อมูลจะถูกเก็บไว้ sync ภายหลัง');
        }
    } finally {
        if (syncFailCount >= CONFIG.RETRY_ATTEMPTS || pendingQueue.length === 0) {
            isSyncing = false;
        }
    }
}

// Manual sync button
async function syncNow() {
    if (pendingQueue.length === 0) {
        showMessage('ไม่มีข้อมูลที่ต้อง sync');
        return;
    }

    await syncPendingQueue();
}

// ========== History Table ==========
function updateHistoryTable() {
    const historyBody = document.getElementById('historyBody');
    historyBody.innerHTML = '';

    const fragment = document.createDocumentFragment();
    countHistory.slice().reverse().forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${record.serialNumber}</td>
            <td>${record.productName}</td>
            <td>${record.timestamp}</td>
            <td>${record.employeeId}</td>
        `;
        fragment.appendChild(row);
    });

    historyBody.appendChild(fragment);

    // Update scanned count
    document.getElementById('scannedCount').innerText = countHistory.length;

    console.log('Updated history table with', countHistory.length, 'items');
}

// ========== Refresh Report ==========
async function refreshReport() {
    try {
        showLoading(true);

        const response = await fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?action=getCountData`);
        const result = await response.json();

        // Update counted items
        countHistory = (result.countedItems || []).map(item => ({
            serialNumber: item.serialNumber,
            productName: item.productName,
            timestamp: formatTimestamp(new Date(item.timestamp), true),
            employeeId: item.employeeId
        }));

        console.log('Loaded counted items:', countHistory.length);
        updateHistoryTable();

        // Update uncounted items
        const uncountedItems = result.uncountedItems || [];
        console.log('Loaded uncounted items:', uncountedItems.length);
        populateUncountedTable(uncountedItems);

        showMessage('รีเฟรชข้อมูลสำเร็จ');
    } catch (err) {
        showError('ไม่สามารถโหลดข้อมูลได้: ' + err.message);
        console.error('Error refreshing report:', err);
    } finally {
        showLoading(false);
    }
}

// ========== Uncounted Items Table ==========
function populateUncountedTable(data) {
    const uncountedBody = document.getElementById('uncountedBody');
    uncountedBody.innerHTML = '';

    if (!data || data.length === 0) {
        document.getElementById('scannedCount').innerText = countHistory.length;
        document.getElementById('remainingCount').innerText = 0;
        showPopup('สแกนครบทุก S/N แล้ว! 🎉');
        return;
    }

    const fragment = document.createDocumentFragment();
    data.forEach(item => {
        const serialNumber = item.serialNumber || '';
        const maskedSerial = serialNumber.length > 4
            ? '**********' + serialNumber.slice(-4)
            : serialNumber.padStart(14, '*');

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${maskedSerial}</td>
            <td>${item.productName || 'ไม่ระบุ'}</td>
            <td>${item.total || 0}</td>
        `;
        fragment.appendChild(row);
    });

    uncountedBody.appendChild(fragment);

    // Update summary
    document.getElementById('scannedCount').innerText = countHistory.length;
    document.getElementById('remainingCount').innerText = data.length;

    console.log('Populated uncounted table with', data.length, 'items');
}

async function updateUncountedTable() {
    try {
        const response = await fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?action=getCountData`);
        const result = await response.json();
        const uncountedItems = result.uncountedItems || [];
        populateUncountedTable(uncountedItems);
    } catch (err) {
        console.error('Error updating uncounted table:', err);
    }
}

// ========== Reset Count ==========
async function resetCount() {
    const code = prompt('กรุณากรอกรหัสยืนยัน (P12345678):');
    if (code !== 'P12345678') {
        showError('รหัสยืนยันไม่ถูกต้อง!');
        return;
    }

    if (!confirm('คุณแน่ใจหรือไม่ที่จะรีเซ็ตการนับ?')) {
        showMessage('การรีเซ็ตถูกยกเลิก');
        return;
    }

    try {
        showLoading(true);

        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'resetCountRecords',
                code: code
            })
        });

        const result = await response.json();
        console.log('Reset result:', result);

        // Clear local data
        countHistory = [];
        pendingQueue = [];
        savePendingQueue();
        updateSyncBadge();

        document.getElementById('historyBody').innerHTML = '';
        await refreshReport();
        showMessage('รีเซ็ตการนับสำเร็จ! ✓');
    } catch (err) {
        showError('ไม่สามารถรีเซ็ตการนับได้: ' + err.message);
        console.error('Error resetting count:', err);
    } finally {
        showLoading(false);
    }
}

// ========== Export ==========
async function exportCountRecords() {
    try {
        showLoading(true);

        const response = await fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?action=exportCountRecords`);
        const result = await response.json();

        console.log('Export result:', result);

        if (!result.data || result.data.length === 0) {
            showMessage('ไม่มีข้อมูลใน Count Records เพื่อส่งออก');
            return;
        }

        // Create and download CSV
        const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = result.filename || 'count_records.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showMessage('ส่งออกข้อมูลสำเร็จ! ✓');
    } catch (err) {
        showError('ไม่สามารถส่งออกข้อมูลได้: ' + err.message);
        console.error('Error exporting count records:', err);
    } finally {
        showLoading(false);
    }
}
