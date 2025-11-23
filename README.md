# 📦 ระบบนับสต็อก - Stock Counting System

A modern, beautiful web application for inventory stock counting with barcode scanning and Google Sheets integration.

## ✨ Features

- 📷 **Barcode Scanner** - Camera-based scanning for 12+ barcode formats (Code 128/39, EAN-13/8, UPC-A/E, QR Code, Data Matrix, and more)
- ⌨️ **Manual Entry** - Manual serial number input option
- 📊 **Real-time Dashboard** - Live count summary of scanned vs remaining items
- 📋 **Count History** - Complete history of all counted items with timestamps
- ⏱️ **Uncounted Items** - Track remaining items that need to be counted
- 🔐 **Employee Tracking** - Session-based employee ID management (30-minute timeout)
- 📤 **CSV Export** - Download count records for reporting
- 🔄 **Auto-sync** - Real-time synchronization with Google Sheets
- 💫 **Premium UI** - Modern glassmorphism design with smooth animations

## 🚀 Quick Start

### 1. Start Local Server

You need to run a local web server because the barcode scanner requires HTTPS or localhost:

**Using Python:**
```bash
cd /Users/astronien/Desktop/stock
python3 -m http.server 8000
```

**Using Node.js:**
```bash
cd /Users/astronien/Desktop/stock
npx http-server -p 8000
```

### 2. Open in Browser

Navigate to: `http://localhost:8000`

### 3. Start Counting!

1. Click **"ใช้กล้องสแกน"** to use camera scanning, or
2. Click **"กรอก S/N ด้วยมือ"** to enter serial numbers manually
3. Enter your employee ID when prompted
4. Start scanning/entering serial numbers!

## 📱 Camera Permissions

The camera scanner requires permission to access your device camera:
- **Desktop**: Allow camera access when prompted by your browser
- **Mobile**: Ensure camera permissions are enabled for your browser
- **HTTPS Required**: For production deployment, use HTTPS (localhost works for testing)

## 🔧 Configuration

The Google Sheets backend URL is configured in `app.js`:

```javascript
const CONFIG = {
    GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbyhvaI8Att7DL2dDpdwbN_rzu3XJYrK0un1m1Mkjb5BMWPRN3Q_c3F0tMCf-Cy0lsZ5/exec',
    EMPLOYEE_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    SCAN_COOLDOWN: 2000, // 2 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000
};
```

## 📊 Google Sheets Integration

The app connects to your existing Google Sheets:
- **Data Source**: [Google Spreadsheet](https://docs.google.com/spreadsheets/d/1pOSSZF8WDltZjbowMAp-bMku_t5p5p6dOgE3ySvOtMg/edit?usp=sharing)
- **Backend API**: Google Apps Script Web App

### API Endpoints

The app uses these Google Apps Script functions:
- `getStockData()` - Fetch all stock items
- `getCountData()` - Get counted and uncounted items
- `saveCount(record)` - Save a new count
- `resetCountRecords(code)` - Reset all counts (requires password: P12345678)
- `exportCountRecords()` - Export count data as CSV

## 🎨 Design Features

- **Glassmorphism**: Modern frosted glass effects
- **Gradient Backgrounds**: Vibrant color gradients
- **Smooth Animations**: Micro-interactions and transitions
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Dark Mode**: Beautiful dark theme optimized for low light
- **Custom Fonts**: Inter font family for premium typography

## 🔒 Security

- **Employee Session**: 30-minute timeout for employee ID
- **Reset Protection**: Password-required (P12345678) for count reset
- **Data Privacy**: Serial numbers are masked in uncounted items list

## 📦 Files Structure

```
stock/
├── index.html      # Main HTML structure
├── styles.css      # Premium CSS styling
├── app.js          # Core JavaScript functionality
└── README.md       # This file
```

## 🌐 Browser Compatibility

- ✅ Chrome/Edge (Recommended)
- ✅ Safari
- ✅ Firefox
- ✅ Mobile browsers with camera support

## 🛠️ Troubleshooting

**Camera not working:**
- Ensure you're running on HTTPS or localhost
- Check browser camera permissions
- Try a different browser

**Data not loading:**
- Check internet connection
- Verify Google Apps Script URL is correct
- Check browser console for errors

**Scan not registering:**
- Supported formats: Code 128/39, EAN-13/8, UPC-A/E, ITF, CODABAR, QR Code, Data Matrix, PDF-417, AZTEC
- Hold camera steady and ensure good lighting
- Try manual entry if scanning fails

## 📝 License

© 2025 Stock Counting System

---

Made with ❤️ for efficient inventory management
# Test Auto Deploy - Sun Nov 23 02:58:44 +07 2025
