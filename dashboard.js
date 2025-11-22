// ================================================
// Stock Counting Dashboard - Real-time Analytics
// ================================================

import { firebaseConfig, COLLECTIONS } from './firebase-config.js';

// Global State
let db = null;
let progressChart = null;
let employeeChart = null;
let stockData = new Map();
let countHistory = [];
let employeeStats = new Map();

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await initFirebase();
});

// ========== Firebase Initialization ==========
async function initFirebase() {
    try {
        showLoading(true);

        const { initializeApp, getFirestore, collection, onSnapshot, query, orderBy, limit } = window.firebaseModules;

        const firebaseApp = initializeApp(firebaseConfig);
        db = getFirestore(firebaseApp);

        console.log('✓ Dashboard Firebase initialized');

        // Setup real-time listeners
        setupStockListener(collection, onSnapshot);
        setupCountListener(collection, onSnapshot, query, orderBy, limit);

        // Initialize charts
        initCharts();

    } catch (error) {
        console.error('Firebase initialization error:', error);
        showError('ไม่สามารถเชื่อมต่อ Firebase ได้');
    } finally {
        showLoading(false);
    }
}

// ========== Real-time Listeners ==========
function setupStockListener(collection, onSnapshot) {
    const stockCollection = collection(db, COLLECTIONS.STOCK);

    onSnapshot(stockCollection, (snapshot) => {
        stockData.clear();

        snapshot.forEach((doc) => {
            const data = doc.data();
            stockData.set(doc.id, data);
        });

        console.log('✓ Stock data updated:', stockData.size, 'items');
        updateDashboard();
    });
}

function setupCountListener(collection, onSnapshot, query, orderBy, limit) {
    const countCollection = collection(db, COLLECTIONS.COUNT_RECORDS);
    const q = query(countCollection, orderBy('timestamp', 'desc'), limit(50));

    onSnapshot(q, (snapshot) => {
        countHistory = [];
        employeeStats.clear();

        snapshot.forEach((doc) => {
            const data = doc.data();
            const record = {
                id: doc.id,
                serialNumber: data.serialNumber,
                productName: data.productName,
                employeeId: data.employeeId,
                timestamp: data.timestamp?.toDate() || new Date()
            };

            countHistory.push(record);

            // Track employee stats
            const count = employeeStats.get(data.employeeId) || 0;
            employeeStats.set(data.employeeId, count + 1);
        });

        console.log('✓ Count history updated:', countHistory.length, 'items');
        updateDashboard();
    });
}

// ========== Update Dashboard ==========
function updateDashboard() {
    const totalStock = stockData.size;
    const totalScanned = countHistory.length;
    const totalRemaining = Math.max(0, totalStock - totalScanned);
    const progress = totalStock > 0 ? Math.round((totalScanned / totalStock) * 100) : 0;

    // Update stats cards
    document.getElementById('totalScanned').textContent = totalScanned.toLocaleString();
    document.getElementById('totalRemaining').textContent = totalRemaining.toLocaleString();
    document.getElementById('totalStock').textContent = totalStock.toLocaleString();
    document.getElementById('totalEmployees').textContent = employeeStats.size;

    // Update progress
    document.getElementById('progressPercentage').textContent = progress + '%';
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('progressText').textContent =
        `${totalScanned.toLocaleString()} / ${totalStock.toLocaleString()} รายการ`;

    // Update change indicators
    const todayCount = countHistory.filter(r => isToday(r.timestamp)).length;
    document.getElementById('scannedChange').textContent = `+${todayCount} วันนี้`;

    const remainingPercent = totalStock > 0 ? Math.round((totalRemaining / totalStock) * 100) : 0;
    document.getElementById('remainingPercent').textContent = remainingPercent + '%';

    // Update tables and feeds
    updateActivityFeed();
    updateLeaderboard();
    updateRecentScansTable();
    updateCharts();
}

// ========== Activity Feed ==========
function updateActivityFeed() {
    const feedEl = document.getElementById('activityFeed');
    feedEl.innerHTML = '';

    const recentActivities = countHistory.slice(0, 10);

    if (recentActivities.length === 0) {
        feedEl.innerHTML = '<div class="activity-item placeholder"><div class="activity-icon">⏳</div><div class="activity-content"><p class="activity-text">ยังไม่มีกิจกรรม</p></div></div>';
        return;
    }

    recentActivities.forEach(record => {
        const item = document.createElement('div');
        item.className = 'activity-item';

        const timeAgo = getTimeAgo(record.timestamp);

        item.innerHTML = `
            <div class="activity-icon">✅</div>
            <div class="activity-content">
                <p class="activity-text">
                    <strong>${record.employeeId}</strong> สแกน 
                    <span class="highlight">${record.serialNumber}</span>
                </p>
                <span class="activity-time">${timeAgo}</span>
            </div>
        `;

        feedEl.appendChild(item);
    });
}

// ========== Leaderboard ==========
function updateLeaderboard() {
    const leaderboardEl = document.getElementById('leaderboard');
    leaderboardEl.innerHTML = '';

    // Sort employees by count
    const sorted = Array.from(employeeStats.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    if (sorted.length === 0) {
        leaderboardEl.innerHTML = '<div class="leaderboard-item placeholder"><div class="employee-info"><span class="employee-name">ยังไม่มีข้อมูล</span></div></div>';
        return;
    }

    sorted.forEach(([employeeId, count], index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';

        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

        item.innerHTML = `
            <div class="rank">${medal || (index + 1)}</div>
            <div class="employee-info">
                <span class="employee-name">${employeeId}</span>
            </div>
            <div class="employee-count">${count}</div>
        `;

        leaderboardEl.appendChild(item);
    });
}

// ========== Recent Scans Table ==========
function updateRecentScansTable() {
    const tbody = document.getElementById('recentScansBody');
    tbody.innerHTML = '';

    if (countHistory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">ยังไม่มีข้อมูล</td></tr>';
        return;
    }

    countHistory.forEach((record, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><code>${record.serialNumber}</code></td>
            <td>${record.productName || '-'}</td>
            <td><span class="badge">${record.employeeId}</span></td>
            <td>${formatTimestamp(record.timestamp)}</td>
        `;
        tbody.appendChild(row);
    });
}

// ========== Charts ==========
function initCharts() {
    // Progress Donut Chart
    const progressCtx = document.getElementById('progressChart').getContext('2d');
    progressChart = new Chart(progressCtx, {
        type: 'doughnut',
        data: {
            labels: ['สแกนแล้ว', 'คงเหลือ'],
            datasets: [{
                data: [0, 100],
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(248, 113, 113, 0.3)'
                ],
                borderColor: [
                    'rgba(102, 126, 234, 1)',
                    'rgba(248, 113, 113, 0.5)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#ffffff',
                        font: {
                            size: 14,
                            family: 'Inter'
                        }
                    }
                }
            }
        }
    });

    // Employee Bar Chart
    const employeeCtx = document.getElementById('employeeChart').getContext('2d');
    employeeChart = new Chart(employeeCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'จำนวนที่สแกน',
                data: [],
                backgroundColor: 'rgba(0, 242, 254, 0.6)',
                borderColor: 'rgba(0, 242, 254, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#ffffff',
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#ffffff',
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function updateCharts() {
    const totalStock = stockData.size;
    const totalScanned = countHistory.length;
    const totalRemaining = Math.max(0, totalStock - totalScanned);

    // Update progress chart
    if (progressChart) {
        progressChart.data.datasets[0].data = [totalScanned, totalRemaining];
        progressChart.update('none');
    }

    // Update employee chart
    if (employeeChart) {
        const sorted = Array.from(employeeStats.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        employeeChart.data.labels = sorted.map(([id]) => id);
        employeeChart.data.datasets[0].data = sorted.map(([, count]) => count);
        employeeChart.update('none');
    }
}

// ========== Export Report ==========
window.exportReport = function () {
    if (countHistory.length === 0) {
        showError('ไม่มีข้อมูลเพื่อส่งออก');
        return;
    }

    // Create detailed report
    const headers = ['#', 'Serial Number', 'Product Name', 'Employee ID', 'Timestamp'];
    const rows = countHistory.map((r, i) => [
        i + 1,
        r.serialNumber,
        r.productName || '-',
        r.employeeId,
        formatTimestamp(r.timestamp)
    ]);

    // Add summary
    const summary = [
        [],
        ['SUMMARY'],
        ['Total Stock', stockData.size],
        ['Total Scanned', countHistory.length],
        ['Remaining', Math.max(0, stockData.size - countHistory.length)],
        ['Progress', Math.round((countHistory.length / stockData.size) * 100) + '%'],
        [],
        ['TOP PERFORMERS'],
        ['Employee ID', 'Count']
    ];

    const topPerformers = Array.from(employeeStats.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([id, count]) => [id, count]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
        ...summary.map(row => row.join(',')),
        ...topPerformers.map(row => row.join(','))
    ].join('\n');

    // Download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `stock_counting_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showMessage('✓ ส่งออกรายงานสำเร็จ');
}

// ========== Utility Functions ==========
function formatTimestamp(date) {
    if (!date) return '-';
    const d = date instanceof Date ? date : new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear() + 543;
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function getTimeAgo(date) {
    if (!date) return '-';
    const d = date instanceof Date ? date : new Date(date);
    const seconds = Math.floor((new Date() - d) / 1000);

    if (seconds < 60) return 'เมื่อสักครู่';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} นาทีที่แล้ว`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} ชั่วโมงที่แล้ว`;
    return `${Math.floor(seconds / 86400)} วันที่แล้ว`;
}

function isToday(date) {
    if (!date) return false;
    const d = date instanceof Date ? date : new Date(date);
    const today = new Date();
    return d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();
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
    alert(msg); // Simple for now
}

function showError(msg) {
    alert('Error: ' + msg);
}

console.log('✓ Dashboard loaded');
