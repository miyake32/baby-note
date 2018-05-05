function reflectManualEdit() {
  dashboard.updateDashboardOnRecordsChange(true)
}

var dashboard = {};

dashboard.getSheet = function () {
  if (!dashboard.sheet) {
    dashboard.sheet = SpreadsheetApp.getActive().getSheetByName('dashboard');
  }
  return dashboard.sheet;
}

dashboard.MEMO_ROW_COUNT = 10;
dashboard.MEMO_RANGE = 'B50:G59';

dashboard.DAY_SUMMARY_INTERVAL_HOUR = 1;
dashboard.DAY_SUMMARY_RANGE = 'B5:G28';


dashboard.updateDashboardOnRecordsChange = function (updateMemo) {
  var startTime = Date.now();
  
  dashboard.updateDaySummary();
  if (updateMemo) {
    dashboard.updateMemoList();
  }
  
  var executionTime = Date.now() - startTime;
  Logger.log('updateDashboardOnRecordsChange took ' + executionTime + ' ms');
}

dashboard.updateMemoList = function () {
  var startTime = Date.now();
  
  var retrievedRecords = records.getRecords([{
    column: COLUMN.EVENT, 
    regExp: new RegExp('^' + TYPE_NAME.memo + '$')
  }]);
  
  var recordsIdx = retrievedRecords.length - 1;
  var memoIdx = 0;
  var rows = [];
  while (memoIdx < dashboard.MEMO_ROW_COUNT) {
    var record = retrievedRecords[recordsIdx];

    if (record) {
      rows.push([record.date, record.time, record.parameter, '', '', '']);
    } else {
      rows.push(['', '', '', '', '', '']);
    }
    recordsIdx--;
    memoIdx++;
  }
  
  dashboard.getSheet().getRange(dashboard.MEMO_RANGE).setValues(rows);
  
  var executionTime = Date.now() - startTime;
  Logger.log('updateMemoList took ' + executionTime + ' ms');
}

dashboard.updateDaySummary = function () {
  var startTime = Date.now();
  
  var date = new Date();
  var todayString = date.toLocaleDateString();
  date.setDate(date.getDate() - 1);
  var yesterdayString = date.toLocaleDateString();
  
  var summaryTargetRecords = records.getRecords([{
    column: COLUMN.DATE, 
    regExp: new RegExp('^(' + todayString + '|' + yesterdayString + ')$'
  )}]);
  dashboard.writeDaySummary(records.aggregateRecords(summaryTargetRecords, 1, 24));
  
  var executionTime = Date.now() - startTime;
  Logger.log('updateDaySummary took ' + executionTime + ' ms');
}

dashboard.writeDaySummary = function(summaries) {
  var startTime = Date.now();
  
  var rows = [];
  summaries.forEach(function(summary, index) {
    var startDateTime = summary.startDateTime;
    var endDateTime = new Date(startDateTime);
    endDateTime.setHours(endDateTime.getHours() + dashboard.DAY_SUMMARY_INTERVAL_HOUR);
    endDateTime.setSeconds(-1);
    var dateTimeRangeString = (startDateTime.getMonth() + 1) + '月' + startDateTime.getDate() + '日 ' + startDateTime.toTimeString().replace(/:\d{2}\s.*/, '') + '~' + (index > 0 ? endDateTime.toTimeString().replace(/:\d{2}\s.*/, '') : '');    
    var summaryRangeString = ICON.createIconString(summary.unchiCnt, summary.oshikkoCnt, summary.oppaiCnt, summary.milkCnt, summary.memoCnt);
    rows.push([dateTimeRangeString, '', summaryRangeString, '', '', '']);    
  });
  dashboard.getSheet().getRange(dashboard.DAY_SUMMARY_RANGE).setValues(rows);
  
  var executionTime = Date.now() - startTime;
  Logger.log('writeDaySummary took ' + executionTime + ' ms');
};
