// ================================================
// Stock Counting System - Supabase Version
// Real-time Sync + Offline Support
// ================================================

import { getSupabase, COLLECTIONS } from './supabase-config.js';

// Global State
let stockData = new Map();
let countHistory = [];
let lastEmployeeId = null;
let lastEmployeeIdTime = null;
let lastScannedCode = null;
let lastScanTime = 0;
let html5QrCode = null;

// Supabase State
let supabase = null;
let stockSubscription = null;
let countSubscription = null;

// Offline State
let pendingQueue = [];
let isSyncing = false;

// Configuration
const CONFIG = {
    EMPLOYEE_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    SCAN_COOLDOWN: 3000, // 3 seconds
    CAMERA_FPS: 5,
    PAUSE_CAMERA_AFTER_SCAN: true
};

// ========== Initialization ==========
document.addEventListener('DOMContentLoaded', async () => {
    await initSupabase();
});

// ========== Supabase Initialization ==========
async function initSupabase() {
    try {
        showLoading(true);

        supabase = getSupabase();
        if (!supabase) {
            throw new Error('Supabase SDK not initialized');
        }

        console.log('✓ Supabase initialized');

        // Load pending queue from localStorage
        loadPendingQueue();

        // Initial Data Load
        await loadStockData();
        await loadCountHistory();

        // Setup real-time listeners
        setupRealtimeListeners();

        // Check employee ID
        await checkEmployeeId();

        showMessage('✓ เชื่อมต่อ Supabase สำเร็จ');
    } catch (error) {
        console.error('Supabase initialization error:', error);
        showError('ไม่สามารถเชื่อมต่อ Supabase ได้: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// ========== Data Loading & Real-time ==========
async function loadStockData() {
    const { data, error } = await supabase
        .from(COLLECTIONS.STOCK)
        .select('serialNumber, productName');

    if (error) {
        console.error('Error loading stock:', error);
        showError('ไม่สามารถโหลดข้อมูล Stock ได้');
        return;
    }

    stockData.clear();
    data.forEach(item => {
        stockData.set(item.serialNumber.toLowerCase(), item);
    });

    console.log('✓ Stock data loaded:', stockData.size, 'items');
    updateCounts();
}

async function loadCountHistory() {
    const { data, error } = await supabase
        .from(COLLECTIONS.COUNT_RECORDS)
        .select('*')
        .order('timestamp', { ascending: false });

    if (error) {
        console.error('Error loading history:', error);
        return;
    }

    countHistory = data.map(item => ({
        ...item,
        timestamp: formatTimestamp(new Date(item.timestamp), true)
    }));

    console.log('✓ Count history loaded:', countHistory.length, 'items');
    updateHistoryTable();
    updateCounts();
}

function setupRealtimeListeners() {
    // Subscribe to Stock changes
    stockSubscription = supabase
        .channel('stock-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: COLLECTIONS.STOCK }, payload => {
            console.log('Stock change:', payload);
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                stockData.set(payload.new.serialNumber.toLowerCase(), payload.new);
            } else if (payload.eventType === 'DELETE') {
                stockData.delete(payload.old.serialNumber.toLowerCase());
            }
            updateCounts();
        })
        .subscribe();

    // Subscribe to Count Records changes
    countSubscription = supabase
        .channel('count-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: COLLECTIONS.COUNT_RECORDS }, payload => {
            console.log('Count change:', payload);
            // Reload history to keep it simple and sorted
            loadCountHistory();
        })
        .subscribe();
}

// ========== Local Storage for Offline ==========
function loadPendingQueue() {
    const saved = localStorage.getItem('pendingQueue');
    if (saved) {
        try {
            pendingQueue = JSON.parse(saved);
            console.log('Loaded pending queue:', pendingQueue.length, 'items');
            if (pendingQueue.length > 0) {
                syncPendingQueue();
            }
        } catch (e) {
            console.error('Error loading pending queue:', e);
            pendingQueue = [];
        }
    }
}

function savePendingQueue() {
    localStorage.setItem('pendingQueue', JSON.stringify(pendingQueue));
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
export function showManualInput() {
    document.getElementById('manualInput').style.display = 'block';
    document.getElementById('scannerSection').style.display = 'none';

    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.error('Error stopping scanner:', err));
    }

    checkEmployeeId();
    document.getElementById('serialNumber').focus();
}
window.showManualInput = showManualInput;

export function showScanner() {
    document.getElementById('manualInput').style.display = 'none';
    document.getElementById('scannerSection').style.display = 'block';

    checkEmployeeId();
    startScanner();
}
window.showScanner = showScanner;

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
        fps: CONFIG.CAMERA_FPS,
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

    // Pause camera after scan
    if (CONFIG.PAUSE_CAMERA_AFTER_SCAN) {
        pauseScanner();
    }

    // Validate format - รองรับรูปแบบที่ใช้กับสินค้า electronic และ gadget
    const format = decodedResult.result.format.formatName;
    const supportedFormats = [
        // 1D Barcodes
        "CODE_128",      // Serial numbers, internal tracking
        "CODE_39",       // Industrial applications
        "EAN_13",        // European Article Number (ใช้บ่อยมาก)
        "EAN_8",         // EAN แบบสั้น
        "UPC_A",         // Universal Product Code (ใช้บ่อยมาก)
        "UPC_E",         // UPC แบบสั้น
        "ITF",           // Interleaved 2 of 5 (กล่องหีบห่อ)
        "CODABAR",       // บางประเภทสินค้า
        // 2D Barcodes
        "QR_CODE",       // QR Code (ใช้บ่อยมากในปัจจุบัน)
        "DATA_MATRIX",   // ชิ้นส่วนอิเล็กทรอนิกส์ขนาดเล็ก
        "PDF_417",       // 2D barcode ความจุสูง
        "AZTEC"          // Compact 2D barcode
    ];

    console.log('Scanned barcode format:', format);

    if (!supportedFormats.includes(format)) {
        showScannerResult("FAIL", `รูปแบบบาร์โค้ดไม่รองรับ: ${format}`, false);
        resumeScannerDelayed();
        return;
    }

    // Check if product exists
    const productName = getProductName(decodedText);
    if (!productName || productName === "ไม่พบสินค้า") {
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

    // Success - Save
    // showScannerResult("PASS", `S/N: ${decodedText} | ${productName}`, true); <-- Moved to saveCount
    // showPopup(`สแกนสำเร็จ: ${decodedText} (${format})`); <-- Moved to saveCount
    saveCount(decodedText, productName, format); // Pass format to saveCount

    // Resume scanner after delay
    resumeScannerDelayed();
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
export function checkAndSave() {
    const serialNumber = document.getElementById('serialNumber').value.trim();
    if (serialNumber) {
        const productName = getProductName(serialNumber);

        if (!productName || productName === "ไม่พบสินค้า") {
            showScannerResult("FAIL", `ไม่พบ S/N: ${serialNumber} ในระบบ`, false);
            return;
        }

        if (countHistory.some(record => record.serialNumber.toLowerCase() === serialNumber.toLowerCase())) {
            showScannerResult("FAIL", `S/N: ${serialNumber} ถูกนับแล้ว!`, false);
            return;
        }

        showScannerResult("PASS", `S/N: ${serialNumber} | ${productName}`, true);
        saveCount(serialNumber, productName);
    }
}
window.checkAndSave = checkAndSave;

function getProductName(code) {
    const product = stockData.get(code.trim().toLowerCase());
    const productName = product ? product.productName.substring(0, 100) : "ไม่พบสินค้า";

    const productInput = document.getElementById('productName');
    if (productInput) {
        productInput.value = productName;
    }

    return productName;
}

// ========== Save to Supabase ==========
async function saveCount(serialNumber, productName, format = 'UNKNOWN') {
    await checkEmployeeId();

    if (!lastEmployeeId) {
        showError('ต้องกรอกรหัสพนักงานก่อนบันทึก');
        return;
    }

    const record = {
        serialNumber: serialNumber.trim(),
        productName: productName,
        employeeId: lastEmployeeId,
        timestamp: new Date().toISOString() // Supabase expects ISO string
    };

    // Add to pending queue (for offline support)
    pendingQueue.push(record);
    savePendingQueue();

    // Show success feedback HERE (after successfully adding to queue)
    showScannerResult("PASS", `S/N: ${serialNumber} | ${productName}`, true);
    showPopup(`สแกนสำเร็จ: ${serialNumber} (${format})`);

    // Try to save to Supabase
    await syncPendingQueue();

    // Clear input
    const serialInput = document.getElementById('serialNumber');
    if (serialInput) {
        serialInput.value = '';
    }
}

// ========== Sync to Supabase ==========
async function syncPendingQueue() {
    if (isSyncing || pendingQueue.length === 0) {
        return;
    }

    isSyncing = true;

    try {
        // Insert all pending records
        const { error } = await supabase
            .from(COLLECTIONS.COUNT_RECORDS)
            .insert(pendingQueue);

        if (error) throw error;

        console.log('✓ Synced', pendingQueue.length, 'items to Supabase');
        pendingQueue = [];
        savePendingQueue();

        // Update UI immediately (don't wait for Realtime)
        await loadCountHistory();

        showMessage('✓ บันทึกสำเร็จ');
    } catch (error) {
        console.error('Sync error:', error);
        showError('ไม่สามารถบันทึกได้ ข้อมูลจะถูกเก็บไว้ sync ภายหลัง');
    } finally {
        isSyncing = false;
    }
}

// ========== Update UI ==========
function updateHistoryTable() {
    const historyBody = document.getElementById('historyBody');
    historyBody.innerHTML = '';

    const fragment = document.createDocumentFragment();
    countHistory.forEach(record => {
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
    document.getElementById('scannedCount').innerText = countHistory.length;
}

function updateCounts() {
    const scannedCount = countHistory.length;
    const totalStock = stockData.size;
    const remaining = Math.max(0, totalStock - scannedCount);

    document.getElementById('scannedCount').innerText = scannedCount;
    document.getElementById('remainingCount').innerText = remaining;

    // Update uncounted table
    updateUncountedTable();
}

function updateUncountedTable() {
    const uncountedBody = document.getElementById('uncountedBody');
    uncountedBody.innerHTML = '';

    const countedSerials = new Set(countHistory.map(r => r.serialNumber.toLowerCase()));
    const uncounted = [];

    stockData.forEach((product, serial) => {
        if (!countedSerials.has(serial)) {
            uncounted.push({
                serialNumber: product.serialNumber,
                productName: product.productName
            });
        }
    });

    if (uncounted.length === 0) {
        showPopup('สแกนครบทุก S/N แล้ว! 🎉');
        return;
    }

    const fragment = document.createDocumentFragment();
    uncounted.forEach(item => {
        const serialNumber = item.serialNumber || '';
        const maskedSerial = serialNumber.length > 4
            ? '**********' + serialNumber.slice(-4)
            : serialNumber.padStart(14, '*');

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${maskedSerial}</td>
            <td>${item.productName || 'ไม่ระบุ'}</td>
            <td>1</td>
        `;
        fragment.appendChild(row);
    });

    uncountedBody.appendChild(fragment);
}

// ========== Refresh ==========
export async function refreshReport() {
    await loadStockData();
    await loadCountHistory();
    showMessage('ข้อมูลอัพเดทล่าสุดแล้ว ✓');
}
window.refreshReport = refreshReport;

// ========== Reset ==========
export async function resetCount() {
    const code = prompt('กรุณากรอกรหัสยืนยัน (P12345678):');
    if (code !== 'P12345678') {
        showError('รหัสยืนยันไม่ถูกต้อง!');
        return;
    }

    if (!confirm('คุณแน่ใจหรือไม่ที่จะรีเซ็ตการนับ?')) {
        return;
    }

    try {
        showLoading(true);

        // Delete all records
        // Note: In production, you might want to just mark them as deleted or archive them
        // But for this app, we'll delete them.
        // Supabase delete requires a where clause. To delete all, we can use a condition that is always true or delete by ID.
        // Ideally, we should truncate, but we might not have permissions.
        // Let's delete where id is not null (all rows)
        const { error } = await supabase
            .from(COLLECTIONS.COUNT_RECORDS)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Hack to delete all

        if (error) throw error;

        pendingQueue = [];
        savePendingQueue();

        // Update UI immediately
        countHistory = [];
        updateHistoryTable();
        updateCounts();

        // Also reload from server to be sure
        await loadCountHistory();

        showMessage('รีเซ็ตการนับสำเร็จ! ✓');
    } catch (error) {
        showError('ไม่สามารถรีเซ็ตการนับได้: ' + error.message);
    } finally {
        showLoading(false);
    }
}
window.resetCount = resetCount;

// ========== Export ==========
export async function exportCountRecords() {
    if (countHistory.length === 0) {
        showMessage('ไม่มีข้อมูลเพื่อส่งออก');
        return;
    }

    // Create CSV
    const headers = ['Serial Number', 'Product Name', 'Timestamp', 'Employee ID'];
    const rows = countHistory.map(r => [
        r.serialNumber,
        r.productName,
        r.timestamp,
        r.employeeId
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `count_records_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showMessage('ส่งออกข้อมูลสำเร็จ! ✓');
}
window.exportCountRecords = exportCountRecords;

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
    } else {
        overlay.classList.remove('active');
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
    setTimeout(() => errorEl.innerText = '', 5000);
}

function showPopup(msg) {
    const popupEl = document.getElementById('popup');
    popupEl.innerText = msg;
    popupEl.style.display = 'block';
    setTimeout(() => popupEl.style.display = 'none', 3000);
}

console.log('✓ Supabase app loaded');
