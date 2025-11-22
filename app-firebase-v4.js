// ================================================
// Stock Counting System - Firebase Version
// Real-time Sync + Offline Support
// ================================================

import { firebaseConfig, COLLECTIONS, USE_FIREBASE } from './firebase-config-v4.js';

// Global State
let stockData = new Map();
let countHistory = [];
let lastEmployeeId = null;
let lastEmployeeIdTime = null;
let lastScannedCode = null;
let lastScanTime = 0;
let html5QrCode = null;

// Firebase State
let db = null;
let firebaseApp = null;
let unsubscribeStock = null;
let unsubscribeCount = null;

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
    if (USE_FIREBASE) {
        await initFirebase();
    } else {
        showError('Firebase ยังไม่ได้เปิดใช้งาน กรุณาตั้งค่าใน firebase-config.js');
    }
});

// ========== Firebase Initialization ==========
async function initFirebase() {
    try {
        showLoading(true);

        const { initializeApp } = window.firebaseModules;
        const { getFirestore, collection, onSnapshot, query, orderBy, limit, doc, setDoc, addDoc, serverTimestamp, deleteDoc, getDocs } = window.firebaseModules;

        // Store for global use
        window.firebaseDB = {
            getFirestore,
            collection,
            onSnapshot,
            query,
            orderBy,
            limit,
            doc,
            setDoc,
            addDoc,
            serverTimestamp,
            deleteDoc,
            getDocs
        };

        firebaseApp = initializeApp(firebaseConfig);
        db = getFirestore(firebaseApp);

        console.log('✓ Firebase initialized');

        // Load pending queue from localStorage
        loadPendingQueue();

        // Setup real-time listeners
        setupStockListener();
        setupCountListener();

        // Check employee ID
        await checkEmployeeId();

        showMessage('✓ เชื่อมต่อ Firebase สำเร็จ');
    } catch (error) {
        console.error('Firebase initialization error:', error);
        showError('ไม่สามารถเชื่อมต่อ Firebase ได้: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// ========== Real-time Listeners ==========
function setupStockListener() {
    const { collection, onSnapshot } = window.firebaseDB;

    const stockCollection = collection(db, COLLECTIONS.STOCK);

    unsubscribeStock = onSnapshot(stockCollection, (snapshot) => {
        stockData.clear();

        snapshot.forEach((doc) => {
            const data = doc.data();
            stockData.set(doc.id, {
                serialNumber: data.serialNumber,
                productName: data.productName
            });
        });

        console.log('✓ Stock data updated:', stockData.size, 'items');
        updateCounts();
    }, (error) => {
        console.error('Stock listener error:', error);
        showError('ไม่สามารถโหลดข้อมูล stock ได้');
    });
}

function setupCountListener() {
    const { collection, onSnapshot, query, orderBy: fbOrderBy } = window.firebaseDB;

    const countCollection = collection(db, COLLECTIONS.COUNT_RECORDS);
    const q = query(countCollection, fbOrderBy('timestamp', 'desc'));

    unsubscribeCount = onSnapshot(q, (snapshot) => {
        countHistory = [];

        snapshot.forEach((doc) => {
            const data = doc.data();
            countHistory.push({
                id: doc.id,
                serialNumber: data.serialNumber,
                productName: data.productName,
                employeeId: data.employeeId,
                timestamp: formatTimestamp(data.timestamp?.toDate() || new Date(), true)
            });
        });

        console.log('✓ Count history updated:', countHistory.length, 'items');
        updateHistoryTable();
        updateCounts();
    }, (error) => {
        console.error('Count listener error:', error);
    });
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

    // Validate format
    const format = decodedResult.result.format.formatName;
    if (format !== "CODE_128" && format !== "CODE_39") {
        showScannerResult("FAIL", `ไม่ใช่บาร์โค้ด Code 128 หรือ Code 39!`, false);
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
    showScannerResult("PASS", `S/N: ${decodedText} | ${productName}`, true);
    showPopup(`สแกนสำเร็จ: ${decodedText} (${format})`);
    saveCount(decodedText, productName);

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

// ========== Save to Firebase ==========
async function saveCount(serialNumber, productName) {
    await checkEmployeeId();

    if (!lastEmployeeId) {
        showError('ต้องกรอกรหัสพนักงานก่อนบันทึก');
        return;
    }

    const record = {
        serialNumber: serialNumber.trim(),
        productName: productName,
        employeeId: lastEmployeeId,
        timestamp: new Date()
    };

    // Add to pending queue (for offline support)
    pendingQueue.push(record);
    savePendingQueue();

    // Try to save to Firebase
    await syncPendingQueue();

    // Clear input
    const serialInput = document.getElementById('serialNumber');
    if (serialInput) {
        serialInput.value = '';
    }
}

// ========== Sync to Firebase ==========
async function syncPendingQueue() {
    if (isSyncing || pendingQueue.length === 0) {
        return;
    }

    isSyncing = true;

    try {
        const { collection, addDoc, serverTimestamp } = window.firebaseDB;
        const countCollection = collection(db, COLLECTIONS.COUNT_RECORDS);

        for (const record of pendingQueue) {
            await addDoc(countCollection, {
                serialNumber: record.serialNumber,
                productName: record.productName,
                employeeId: record.employeeId,
                timestamp: serverTimestamp()
            });
        }

        console.log('✓ Synced', pendingQueue.length, 'items to Firebase');
        pendingQueue = [];
        savePendingQueue();

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
    showMessage('ข้อมูลอัพเดทอัตโนมัติแบบ real-time แล้ว ✓');
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

        const { collection, getDocs, deleteDoc, doc } = window.firebaseDB;
        const countCollection = collection(db, COLLECTIONS.COUNT_RECORDS);
        const snapshot = await getDocs(countCollection);

        for (const docSnapshot of snapshot.docs) {
            await deleteDoc(doc(db, COLLECTIONS.COUNT_RECORDS, docSnapshot.id));
        }

        pendingQueue = [];
        savePendingQueue();

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

console.log('✓ Firebase app loaded');
