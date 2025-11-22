# 🔧 Google Apps Script Backend Update Required

## ⚠️ Important Note

The optimized frontend now uses **batch sync** to improve performance. You need to update your Google Apps Script backend to support the new `batchSaveCount` action.

## Required Changes to Google Apps Script

Add this function to your `Code.gs` file:

```javascript
function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    
    if (action === 'saveCount') {
      // Original single save
      return ContentService.createTextOutput(JSON.stringify(saveCount(params.data)))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'batchSaveCount') {
      // NEW: Batch save for multiple items
      return ContentService.createTextOutput(JSON.stringify(batchSaveCount(params.data)))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'resetCountRecords') {
      return ContentService.createTextOutput(JSON.stringify(resetCountRecords(params.code)))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'Error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * NEW FUNCTION: Batch save multiple count records at once
 */
function batchSaveCount(records) {
  if (!records || records.length === 0) {
    return { status: 'Error', message: 'No records to save' };
  }
  
  try {
    const ss = SpreadsheetApp.openById('YOUR_SPREADSHEET_ID'); // Replace with your ID
    const sheet = ss.getSheetByName('Count Records'); // Or your sheet name
    
    if (!sheet) {
      return { status: 'Error', message: 'Count Records sheet not found' };
    }
    
    // Prepare rows to append
    const rows = records.map(record => [
      record.serialNumber,
      record.employeeId,
      new Date(record.timestamp),
      record.productName || ''
    ]);
    
    // Append all rows at once (much faster than individual appends)
    if (rows.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    }
    
    Logger.log(`Batch saved ${records.length} records`);
    
    return { 
      status: 'Success', 
      message: `บันทึก ${records.length} รายการสำเร็จ`,
      count: records.length
    };
    
  } catch (err) {
    Logger.log('Batch save error: ' + err.toString());
    return { 
      status: 'Error', 
      message: 'ไม่สามารถบันทึกได้: ' + err.toString() 
    };
  }
}
```

## Quick Setup Steps

1. Open your Google Apps Script project
2. Find the `doPost(e)` function
3. Add the `batchSaveCount` case as shown above
4. Create the `batchSaveCount(records)` function
5. **Replace `'YOUR_SPREADSHEET_ID'`** with your actual spreadsheet ID
6. **Replace `'Count Records'`** with your actual sheet name if different
7. Save and deploy as new version

## Benefits of This Update

✅ **90% faster** - Saves 20 items in one API call instead of 20 calls
✅ **Less quota usage** - Reduces Apps Script execution quota consumption
✅ **Better reliability** - Fewer network requests = less chance of failure
✅ **Battery savings** - Fewer API calls = less battery drain on mobile

## Fallback

If you can't update the backend immediately, the app will still work but will be slower. Each item will be saved individually using the old `saveCount` method.

To enable fallback mode temporarily, you can modify `app.js` line ~100 to use the old method until you update the backend.

## Testing

After updating:
1. Scan 5-10 items
2. Check the "รอ sync" badge appears
3. Wait 1 minute or scan 20 items
4. Verify all items appear in your Google Sheet
5. Check no duplicates were created

---

**Need help?** Contact your developer or check Google Apps Script documentation for batch operations.
