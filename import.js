// Import Data Handler
import { firebaseConfig, COLLECTIONS, USE_FIREBASE } from './firebase-config-v4.js';

let parsedData = [];
let headers = [];
let db = null;
let firebaseApp = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupFileHandlers();
    if (USE_FIREBASE) {
        initFirebase();
    }
});

// Setup drag & drop
function setupFileHandlers() {
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');

    fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
}

// Initialize Firebase
async function initFirebase() {
    try {
        const { initializeApp, getFirestore } = window.firebaseModules;
        firebaseApp = initializeApp(firebaseConfig);
        db = getFirestore(firebaseApp);
        console.log('✓ Firebase initialized');
        await initAuth();
    } catch (error) {
        console.error('✗ Firebase initialization failed:', error);
        showError('ไม่สามารถเชื่อมต่อ Firebase ได้: ' + error.message);
    }
}

// Initialize Anonymous Auth
async function initAuth() {
    try {
        const { getAuth, signInAnonymously } = window.firebaseModules;
        const auth = getAuth();
        await signInAnonymously(auth);
        console.log('✓ Anonymous auth successful');
    } catch (error) {
        console.error('✗ Auth failed:', error);
        throw error;
    }
}

// Handle file selection
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

// Handle file
function handleFile(file) {
    console.log('Processing file:', file.name);

    // Show file info
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = formatFileSize(file.size);
    document.getElementById('fileType').textContent = file.type || file.name.split('.').pop().toUpperCase();
    document.getElementById('fileInfo').style.display = 'block';

    // Parse file based on type
    const extension = file.name.split('.').pop().toLowerCase();

    if (extension === 'csv') {
        parseCSV(file);
    } else if (extension === 'xlsx' || extension === 'xls') {
        parseExcel(file);
    } else {
        showError('รองรับเฉพาะไฟล์ CSV, XLSX, XLS เท่านั้น');
    }
}

// Parse CSV
function parseCSV(file) {
    Papa.parse(file, {
        complete: function (results) {
            if (results.data && results.data.length > 0) {
                headers = results.data[0];
                parsedData = results.data.slice(1).filter(row => row.some(cell => cell.trim() !== ''));
                showPreview();
            } else {
                showError('ไม่พบข้อมูลในไฟล์');
            }
        },
        error: function (error) {
            showError('ไม่สามารถอ่านไฟล์ CSV ได้: ' + error.message);
        }
    });
}

// Parse Excel
function parseExcel(file) {
    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // Get first sheet
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // Convert to array
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (jsonData && jsonData.length > 0) {
                headers = jsonData[0];
                parsedData = jsonData.slice(1).filter(row => row.some(cell => cell != null && cell.toString().trim() !== ''));
                showPreview();
            } else {
                showError('ไม่พบข้อมูลในไฟล์');
            }
        } catch (error) {
            showError('ไม่สามารถอ่านไฟล์ Excel ได้: ' + error.message);
        }
    };

    reader.readAsArrayBuffer(file);
}

// Show preview
function showPreview() {
    // Show preview section
    document.getElementById('previewSection').style.display = 'block';
    document.getElementById('mappingSection').style.display = 'block';
    document.getElementById('actionButtons').style.display = 'flex';

    // Update stats
    document.getElementById('totalRows').textContent = parsedData.length;
    document.getElementById('totalColumns').textContent = headers.length;

    // Populate table
    const thead = document.getElementById('previewHead');
    const tbody = document.getElementById('previewBody');

    thead.innerHTML = '';
    tbody.innerHTML = '';

    // Headers
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // Preview first 10 rows
    const previewRows = parsedData.slice(0, 10);
    previewRows.forEach(row => {
        const tr = document.createElement('tr');
        headers.forEach((_, index) => {
            const td = document.createElement('td');
            td.textContent = row[index] || '';
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });

    // Populate column dropdowns
    populateColumnSelects();

    showMessage(`โหลดข้อมูลสำเร็จ: ${parsedData.length} รายการ`);
}

// Populate column selects
function populateColumnSelects() {
    const snSelect = document.getElementById('snColumn');
    const nameSelect = document.getElementById('nameColumn');

    snSelect.innerHTML = '';
    nameSelect.innerHTML = '';

    headers.forEach((header, index) => {
        const optionSn = document.createElement('option');
        optionSn.value = index;
        optionSn.textContent = header;
        snSelect.appendChild(optionSn);

        const optionName = document.createElement('option');
        optionName.value = index;
        optionName.textContent = header;
        nameSelect.appendChild(optionName);
    });

    // Auto-select if headers match common patterns
    headers.forEach((header, index) => {
        const lowerHeader = header.toLowerCase();
        if (lowerHeader.includes('s/n') || lowerHeader.includes('serial') || lowerHeader.includes('sn')) {
            snSelect.value = index;
        }
        if (lowerHeader.includes('name') || lowerHeader.includes('ชื่อ') || lowerHeader.includes('product')) {
            nameSelect.value = index;
        }
    });
}

// Import data to Firebase
window.importData = async function () {
    if (!USE_FIREBASE) {
        showError('Firebase ยังไม่ได้เปิดใช้งาน กรุณาตั้งค่าใน firebase-config.js');
        return;
    }

    if (!db) {
        showError('กรุณารอสักครู่... Firebase กำลังเชื่อมต่อ');
        return;
    }

    const snIndex = parseInt(document.getElementById('snColumn').value);
    const nameIndex = parseInt(document.getElementById('nameColumn').value);

    if (isNaN(snIndex) || isNaN(nameIndex)) {
        showError('กรุณาเลือก column สำหรับ S/N และชื่อสินค้า');
        return;
    }

    if (!confirm(`ต้องการ import ข้อมูล ${parsedData.length} รายการใช่หรือไม่?`)) {
        return;
    }

    try {
        showLoading(true);
        document.getElementById('progressSection').style.display = 'block';

        const { collection, doc, writeBatch } = window.firebaseModules;
        const stockCollection = collection(db, COLLECTIONS.STOCK);

        // Use batched writes (500 at a time - Firestore limit)
        const batchSize = 500;
        const batches = [];

        for (let i = 0; i < parsedData.length; i += batchSize) {
            const batch = writeBatch(db);
            const chunk = parsedData.slice(i, i + batchSize);

            chunk.forEach(row => {
                const serialNumber = (row[snIndex] || '').toString().trim();
                const productName = (row[nameIndex] || '').toString().trim();

                if (serialNumber) {
                    const docRef = doc(stockCollection, serialNumber.toLowerCase());
                    batch.set(docRef, {
                        serialNumber,
                        productName,
                        importedAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });
                }
            });

            batches.push(batch);
        }

        // Commit all batches
        let completed = 0;
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            try {
                await batch.commit();
                completed += batchSize;
                updateProgress(Math.min(completed, parsedData.length), parsedData.length);

                // Add a small delay between batches to be gentle on the backend
                if (i < batches.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            } catch (error) {
                console.error('Batch commit error:', error);
                if (error.code === 'resource-exhausted') {
                    throw new Error('โควต้าการเขียนข้อมูลประจำวันเต็ม (Daily Quota Exceeded) กรุณาลองใหม่พรุ่งนี้ หรืออัพเกรดแพ็คเกจ Firebase');
                } else {
                    throw error;
                }
            }
        }

        showMessage(`✓ Import สำเร็จ ${parsedData.length} รายการ!`);
        setTimeout(() => {
            if (confirm('ต้องการกลับไปหน้าหลักหรือไม่?')) {
                window.location.href = 'index.html';
            }
        }, 2000);

    } catch (error) {
        console.error('Import error:', error);
        showError('เกิดข้อผิดพลาดในการ import: ' + error.message);
    } finally {
        showLoading(false);
    }
};

// Clear all data
window.clearData = async function () {
    if (!USE_FIREBASE) {
        showError('Firebase ยังไม่ได้เปิดใช้งาน');
        return;
    }

    const password = prompt('กรุณากรอกรหัสยืนยัน (P12345678):');
    if (password !== 'P12345678') {
        showError('รหัสยืนยันไม่ถูกต้อง!');
        return;
    }

    if (!confirm('⚠️ คุณแน่ใจหรือไม่ที่จะลบข้อมูล Stock ทั้งหมด?')) {
        return;
    }

    try {
        showLoading(true);

        const { collection, getDocs, deleteDoc, doc } = window.firebaseModules;
        const stockCollection = collection(db, COLLECTIONS.STOCK);
        const snapshot = await getDocs(stockCollection);

        let deleted = 0;
        for (const docSnapshot of snapshot.docs) {
            await deleteDoc(doc(db, COLLECTIONS.STOCK, docSnapshot.id));
            deleted++;
        }

        showMessage(`✓ ลบข้อมูลสำเร็จ ${deleted} รายการ`);
    } catch (error) {
        showError('เกิดข้อผิดพลาดในการลบข้อมูล: ' + error.message);
    } finally {
        showLoading(false);
    }
};

// Update progress
function updateProgress(current, total) {
    const percent = Math.round((current / total) * 100);
    document.getElementById('progressFill').style.width = percent + '%';
    document.getElementById('progressText').textContent = `${current} / ${total} (${percent}%)`;
}

// Utilities
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
    messageEl.style.display = 'block';
    setTimeout(() => messageEl.style.display = 'none', 5000);
}

function showError(msg) {
    showLoading(false);
    const messageEl = document.getElementById('message');
    const errorEl = document.getElementById('error');
    errorEl.innerText = msg;
    messageEl.innerText = '';
    errorEl.style.display = 'block';
    setTimeout(() => errorEl.style.display = 'none', 5000);
}
