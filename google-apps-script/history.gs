function updateHistorySheets() {
  history.updateHourlySummary();
  history.updateDailySummary();
  history.updateMemoHistory();
}

var history = {};

history.getHourlyHistorySheet = function () {
  if (!history.hourlyHistorySheet) {
    history.hourlyHistorySheet = SpreadsheetApp.getActive().getSheetByName('history-hourly');
  }
  return history.hourlyHistorySheet;
}

history.getDailyHistorySheet = function () {
  if (!history.dailyHistorySheet) {
    history.dailyHistorySheet = SpreadsheetApp.getActive().getSheetByName('history-daily');
  }
  return history.dailyHistorySheet;
}

history.getMemoHistorySheet = function () {
  if (!history.memoHistorySheet) {
    history.memoHistorySheet = SpreadsheetApp.getActive().getSheetByName('history-memo');
  }
  return history.memoHistorySheet;
}

history.getAllRecords = function () {
  if (!history.allRecords) {
    history.allRecords = records.getRecords([{column: 'date', regExp: /./}]);
  }
  return history.allRecords;
}

history.updateHourlySummary = function () {
  var startTime = Date.now();
  
  var targetRecords = history.getAllRecords();
  var summaries = records.aggregateRecords(targetRecords, 1);
  
  var rows = [];
  summaries.forEach(function(summary, index) {
    if (index === 0) {
      return;
    }
    var startDateTime = summary.startDateTime;
    var endDateTime = new Date(startDateTime);
    endDateTime.setHours(endDateTime.getHours() + 1);
    endDateTime.setSeconds(-1);
    var dateTimeRangeString = startDateTime.getYear() + '年' + (startDateTime.getMonth() + 1) + '月' + startDateTime.getDate() + '日 ' + startDateTime.toTimeString().replace(/:\d{2}\s.*/, '') + '~' + endDateTime.toTimeString().replace(/:\d{2}\s.*/, '');
    var summaryRangeString = ICON.createIconString(summary.unchiCnt, summary.oshikkoCnt, summary.oppaiCnt, summary.milkCnt, summary.memoCnt);
    rows.push([dateTimeRangeString, summaryRangeString]);    
  });
  var hourlySummaryRange = history.getHourlyHistorySheet().getRange(5, 2, rows.length, 2);
  hourlySummaryRange.setValues(rows);
  hourlySummaryRange.setBorder(true, true, true, true, false, true);
  hourlySummaryRange.setVerticalAlignment('middle');
  
  history.getHourlyHistorySheet().getRange(5, 3, rows.length, 1).setFontSize(14);
  
  var executionTime = Date.now() - startTime;
  Logger.log('updateHourlySummary took ' + executionTime + ' ms for ' + targetRecords.length + ' records and ' + summaries.length + ' summaries');
}

history.updateDailySummary = function () {
  var startTime = Date.now();
  
  var targetRecords = history.getAllRecords();
  var summaries = records.aggregateRecords(targetRecords, 24);

  var rows = [];
  summaries.forEach(function(summary, index) {
    if (index === 0) {
      // skip today
      return;
    }
    rows.push([summary.startDateTime.toLocaleDateString(), summary.unchiCnt, summary.oshikkoCnt, summary.oppaiCnt, summary.milkCnt, summary.milkVolume]);    
  });
  
  var dailySummaryRange = history.getDailyHistorySheet().getRange(6, 2, rows.length, 6);
  dailySummaryRange.setValues(rows);
  dailySummaryRange.setVerticalAlignment('middle');
  dailySummaryRange.setBorder(true, true, true, true, true, true);
  dailySummaryRange.setNumberFormats(history.createNumberFormats(rows.length));
  
  var executionTime = Date.now() - startTime;
  Logger.log('updateDailySummary took ' + executionTime + ' ms for ' + rows.length + ' rows');
}

history.createNumberFormats = function (rowCnt) {
  var formats = [];
  var rowFormats = ['yyyy年mm月dd日', '0回', '0回', '0回', '0回', '0 \\m\\L'];
  while (formats.length < rowCnt) {
    formats.push(rowFormats);
  }
  return formats;
}

history.updateMemoHistory = function() {
  var targetRecords = history.getAllRecords().filter(function (record) {
    return record.type === TYPE.MEMO;
  }).reverse();
  var rows = [];
  targetRecords.forEach(function (record) {
    rows.push([new Date(record.date + ' ' + record.time), record.parameter]);
  });
  
  var memoHistoryRange = history.getMemoHistorySheet().getRange(5, 2, rows.length, 2);
  memoHistoryRange.setValues(rows);
  memoHistoryRange.setBorder(true, true, true, true, true, true);
  memoHistoryRange.setVerticalAlignment('middle');
  memoHistoryRange.setWrap(true);
  memoHistoryRange.setNumberFormat('yyyy年mm月dd日 hh時MM分');
};
