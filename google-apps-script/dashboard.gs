function updateDaySummary() {
  var startTime = Date.now();
  dashboard.writeDaySummary(dashboard.createDaySummary());
  var executionTime = Date.now() - startTime;
  Logger.log('updateDaySummary took ' + executionTime + ' ms');
}

function updateMemoList() {
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
  
  dashboard.getSheet().getRange('B50:G59').setValues(rows);
  
  var executionTime = Date.now() - startTime;
  Logger.log('updateMemoList took ' + executionTime + ' ms');
}

function updateDashboardOnRecordsChange(updateMemo) {
  var startTime = Date.now();
  
  updateDaySummary();
  if (updateMemo) {
    updateMemoList();
  }
  
  var executionTime = Date.now() - startTime;
  Logger.log('updateDashboardOnRecordsChange took ' + executionTime + ' ms');
}

var dashboard = {};

dashboard.getSheet = function () {
  if (!dashboard.sheet) {
    dashboard.sheet = SpreadsheetApp.getActive().getSheetByName('dashboard');
  }
  return dashboard.sheet;
}

/**
 * サマリーを作るときの一レコード
 */
dashboard.DAY_SUMMARY_INTERVAL_HOUR = 1;
dashboard.DAY_SUMMARY_ROW_COUNT = 24 / dashboard.DAY_SUMMARY_INTERVAL_HOUR;
dashboard.MEMO_ROW_COUNT = 10;
dashboard.ICON = {
  unchi : '💩',
  oshikko : '💦',
  oppai : '🤱',
  milk : '🍼',
  memo : '📔'
};

dashboard.createDaySummary = function() {
  var startTime = Date.now();
  
  var date = new Date();
  var todayString = date.toLocaleDateString();
  date.setDate(date.getDate() - 1);
  var yesterdayString = date.toLocaleDateString();
  
  var retrievedRecords = records.getRecords([{
    column: COLUMN.DATE, 
    regExp: new RegExp('^(' + todayString + '|' + yesterdayString + ')$'
  )}]);
  
  var baseDateTime = new Date();
  baseDateTime.setHours(Math.floor(baseDateTime.getHours() / dashboard.DAY_SUMMARY_INTERVAL_HOUR) * dashboard.DAY_SUMMARY_INTERVAL_HOUR);
  baseDateTime.setMinutes(0);
  baseDateTime.setSeconds(0);
  
  var summaries = [];
  for (var i = 0; i < dashboard.DAY_SUMMARY_ROW_COUNT; i++) {
    var startDateTime = new Date(baseDateTime);
    startDateTime.setHours(startDateTime.getHours() - dashboard.DAY_SUMMARY_INTERVAL_HOUR * i);
    summaries.push({startDateTime: startDateTime, unchiCnt: 0, oshikkoCnt: 0, oppaiCnt: 0, milkCnt: 0, milkVolume: 0, memoCnt: 0});
  }
  
  var recordsIdx = retrievedRecords.length - 1;
  var summaryIdx = 0;
  while (recordsIdx > -1 && summaryIdx < summaries.length) {
    var summary = summaries[summaryIdx];
    var record = retrievedRecords[recordsIdx];
    var recordDateTime = new Date(record.date + ' ' + record.time);
    if (summary.startDateTime > recordDateTime) {
      summaryIdx++;
      continue;
    }
    
    switch (record.type) {
      case TYPE.UNCHI:
        summary.unchiCnt++;
        break;
      case TYPE.OSHIKKO:
        summary.oshikkoCnt++;
        break;
      case TYPE.OPPAI:
        summary.oppaiCnt++;
        break;
      case TYPE.MILK:
        summary.milkCnt++;
        summary.milkVolume += record.parameter;
        break;
      case TYPE.MEMO:
        summary.memoCnt++;
        break;
    }
    
    recordsIdx--;
  }
  Logger.log('createDaySummary : ' + JSON.stringify(summaries));
  var executionTime = Date.now() - startTime;
  Logger.log('createDaySummary took ' + executionTime + ' ms');
  return summaries;
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
    
    var summaryRangeString = '';
    if (summary.unchiCnt) {
      summaryRangeString = (summaryRangeString ? summaryRangeString + ' ' : '') + dashboard.createSummaryString(TYPE.UNCHI, summary.unchiCnt);
    }
    if (summary.oshikkoCnt) {
      summaryRangeString = (summaryRangeString ? summaryRangeString + ' ' : '') + dashboard.createSummaryString(TYPE.OSHIKKO, summary.oshikkoCnt);
    }
    if (summary.oppaiCnt) {
      summaryRangeString = (summaryRangeString ? summaryRangeString + ' ' : '') + dashboard.createSummaryString(TYPE.OPPAI, summary.oppaiCnt);
    }
    if (summary.milkCnt) {
      summaryRangeString = (summaryRangeString ? summaryRangeString + ' ' : '') + dashboard.createSummaryString(TYPE.MILK, summary.milkCnt);
    }
    if (summary.memoCnt) {
      summaryRangeString = (summaryRangeString ? summaryRangeString + ' ' : '') + dashboard.createSummaryString(TYPE.MEMO, summary.memoCnt);
    }

    rows.push([dateTimeRangeString, '', summaryRangeString, '', '', '']);    
  });
  dashboard.getSheet().getRange('B5:G28').setValues(rows);
  
  var executionTime = Date.now() - startTime;
  Logger.log('writeDaySummary took ' + executionTime + ' ms');
};

dashboard.createSummaryString = function(type, cnt) {
  var str = '';
  for (var i = 0; i < cnt; i++) {
    str = str + dashboard.ICON[type];
  }
  return str;
}