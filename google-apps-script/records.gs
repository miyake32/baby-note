function onFormSubmit(e) {
  var startTime = Date.now();
  
  var keys = Object.keys(e.namedValues);
  var dateKey;
  var eventKey;
  var milkKey;
  var memoKey;
  
  keys.forEach(function(key) {
    if (key.indexOf('日時') > -1) {
      dateKey = key;
    } else if (key.indexOf('イベント') > -1) {
      eventKey = key;
    } else if (key.indexOf('ミルク') > -1) {
      milkKey = key;
    } else if (key.indexOf('メモ') > -1) {
      memoKey = key;
    }
  });
  
  var date = e.namedValues[dateKey][0] ? new Date(e.namedValues[dateKey][0]) : new Date();
  var events = e.namedValues[eventKey][0].split(/,\s*/);
  var milkVolume = e.namedValues[milkKey][0];
  var memo = e.namedValues[memoKey][0];
    
  if (events.indexOf(TYPE_NAME.unchi) > -1) {
    records.appendJournalRecordWithSpecificDate(date, TYPE.UNCHI);
  }
  if (events.indexOf(TYPE_NAME.oshikko) > -1) {
    records.appendJournalRecordWithSpecificDate(date, TYPE.OSHIKKO);
  }
  if (events.indexOf(TYPE_NAME.oppai) > -1) {
    records.appendJournalRecordWithSpecificDate(date, TYPE.OPPAI);
  }
  
  if (milkVolume) {
    records.appendJournalRecordWithSpecificDate(date, TYPE.MILK, milkVolume);
  }
  if (memo) {
    records.appendJournalRecordWithSpecificDate(date, TYPE.MEMO, memo);
  }
  updateDashboardOnRecordsChange(!!memo);
  
  var executionTime = Date.now() - startTime;
  Logger.log('onFormSubmit took ' + executionTime + ' ms');
  
  // write debug information
  // write process takes long time, but it's okay because this function don't need speed
  dashboard.getSheet().getRange("H2").setValue(JSON.stringify({e: e, dateKey: dateKey, eventKey: eventKey, milkKey: milkKey, memoKey: memoKey, date: date, events: events, milkVolume: milkVolume, memo: memo, executionTime: executionTime}));
}

function registerUnchi() {
  var startTime = Date.now();

  records.appendJournalRecord(TYPE.UNCHI);
  updateDashboardOnRecordsChange();
  
  var values = {unchiCount: records.countRecords(TYPE.UNCHI, new Date())};
  Logger.log('registerUnchi : ' + JSON.stringify(values));
  
  var executionTime = Date.now() - startTime;
  values.executionTime = executionTime;
  Logger.log('registerUnchi took ' + executionTime + ' ms');
  return values;
}

function registerOshikko() {
  var startTime = Date.now();

  records.appendJournalRecord(TYPE.OSHIKKO);
  updateDashboardOnRecordsChange();

  var values = {oshikkoCount: records.countRecords(TYPE.OSHIKKO, new Date())};
  Logger.log('registerOshikko : ' + JSON.stringify(values));
  
  var executionTime = Date.now() - startTime;
  values.executionTime = executionTime;
  Logger.log('registerOshikko took ' + executionTime + ' ms');
  return values;
}

function registerUnchiAndOshikko() {
  var startTime = Date.now();

  records.appendJournalRecord(TYPE.UNCHI);
  records.appendJournalRecord(TYPE.OSHIKKO);
  updateDashboardOnRecordsChange();
  
  var values = {
    unchiCount: records.countRecords(TYPE.UNCHI, new Date()), 
    oshikkoCount: records.countRecords(TYPE.OSHIKKO, new Date())
  };
  Logger.log('registerUnchiAndOshikko : ' + JSON.stringify(values));
  
  var executionTime = Date.now() - startTime;
  values.executionTime = executionTime;
  Logger.log('registerUnchiAndOshikko took ' + executionTime + ' ms');
  return values;
}

function registerOppai() {
  var startTime = Date.now();

  records.appendJournalRecord(TYPE.OPPAI);
  updateDashboardOnRecordsChange();

  var values = {oppaiCount: records.countRecords(TYPE.OPPAI, new Date())};
  Logger.log('registerOppai : ' + JSON.stringify(values));
  
  var executionTime = Date.now() - startTime;
  values.executionTime = executionTime;
  Logger.log('registerOppai took ' + executionTime + ' ms');
  return values;
}

function registerMilk(volume) {
  var startTime = Date.now();

  records.appendJournalRecord(TYPE.MILK, volume || 0);
  updateDashboardOnRecordsChange();
  
  var dateStr = new Date().toLocaleDateString();
  var retrievedRecords = records.getRecords([
    {column: COLUMN.DATE, regExp: new RegExp('^' + dateStr + '$')},
    {column: COLUMN.EVENT, regExp: new RegExp('^' + TYPE_NAME[TYPE.MILK] + '$')}
  ]);
  
  var sum = 0;
  retrievedRecords.forEach(function(item) {
    var volume = Number(item.parameter);
    if (!isNaN(volume)) {
      sum += volume;
    }
  })
  
  var values = {sumOfMilkVolume: sum};
  Logger.log('registerMilk : ' + JSON.stringify(values));
  
  var executionTime = Date.now() - startTime;
  values.executionTime = executionTime;
  Logger.log('registerMilk took ' + executionTime + ' ms');
  return values;
}

function registerMemo(content) {
  var startTime = Date.now();

  records.appendJournalRecord(TYPE.MEMO, content);
  updateDashboardOnRecordsChange(true);
  
  values = {};

  var executionTime = Date.now() - startTime;
  values.executionTime = executionTime;
  Logger.log('registerMemo took ' + executionTime + ' ms');
  return values;
}

function getDailySummary(date_str) {
  var startTime = Date.now();

  var date = date_str ? new Date(date_str) : new Date();
  var retrievedRecords = records.getRecords([{column: COLUMN.DATE, regExp: new RegExp(date.toLocaleDateString())}]);
  
  var values =  {
    targetDate: date.toLocaleDateString(),
    unchiCount: 0,
    oshikkoCount: 0,
    oppaiCount: 0,
    milkCount: 0,
    milkVolume: 0
  }
  
  retrievedRecords.forEach(function(record) {
    switch (record.type) {
      case TYPE.UNCHI:
        values.unchiCount++;
        break;
      case TYPE.OSHIKKO:
        values.oshikkoCount++;
        break;
      case TYPE.OPPAI:
        values.oppaiCount++;
        break;
      case TYPE.MILK:
        values.milkCount++;
        values.milkVolume += record.parameter;
    }
  });
  Logger.log('getDailySummary : ' + JSON.stringify(values));
  
  var executionTime = Date.now() - startTime;
  values.executionTime = executionTime;
  Logger.log('getDailySummary took ' + executionTime + ' ms');
  return values;
}

function getTimeFromLastUnchi() {
  var startTime = Date.now();

  var values = records.getTimeElapsedFrom(records.getLastRecord(TYPE.UNCHI)[TYPE.UNCHI]);
  Logger.log('getTimeFromLastUnchi : ' + JSON.stringify(values));
  
  var executionTime = Date.now() - startTime;
  values.executionTime = executionTime;
  Logger.log('getTimeFromLastUnchi took ' + executionTime + ' ms');
  return values;
}

function getTimeFromLastOshikko() {
  var startTime = Date.now();

  var values = records.getTimeElapsedFrom(records.getLastRecord(TYPE.OSHIKKO)[TYPE.OSHIKKO]);
  Logger.log('getTimeFromLastOshikko : ' + JSON.stringify(values));
  
  var executionTime = Date.now() - startTime;
  values.executionTime = executionTime;
  Logger.log('getTimeFromLastOshikko took ' + executionTime + ' ms');
  return values;
}

function getTimeFromLastOppaiAndMilk() {
  var startTime = Date.now();

  var lastRecords = records.getLastRecord(TYPE.OPPAI, TYPE.MILK);
  var values = {};
  if (lastRecords[TYPE.OPPAI]) {
    values.oppai = records.getTimeElapsedFrom(lastRecords[TYPE.OPPAI]);
  }
  if (lastRecords[TYPE.MILK]) {
    values.milk = records.getTimeElapsedFrom(lastRecords[TYPE.MILK]);
    values.milk.volume = lastRecords[TYPE.MILK].parameter;
  }
  Logger.log('getTimeFromLastOppaiAndMilk : ' + JSON.stringify(values));
  
  var executionTime = Date.now() - startTime;
  values.executionTime = executionTime;
  Logger.log('getTimeFromLastOppaiAndMilk took ' + executionTime + ' ms');
  return values;
}


var records = {};

records.getSheet = function () {
  if (!records.sheet) {
    records.sheet = SpreadsheetApp.getActive().getSheetByName('records');
  }
  return records.sheet;
}

records.appendJournalRecord = function (type, opt_parameter) {
  var startTime = Date.now();

  var currentDateTime = new Date();
  records.appendJournalRecordWithSpecificDate(currentDateTime, type, opt_parameter);
  
  var executionTime = Date.now() - startTime;
  Logger.log('appendJournalRecord took ' + executionTime + ' ms');
};

records.appendJournalRecordWithSpecificDate = function (date, type, opt_parameter) {
  var startTime = Date.now();
  
  var row = [];
  row.push("'" + date.toLocaleDateString());
  row.push("'" + date.toLocaleTimeString().replace(/[^:0-9]/g, ''));
  row.push(TYPE_NAME[type]);
  if (opt_parameter) {
      row.push(opt_parameter);
  }
  
  records.getSheet().appendRow(row);
  
  var executionTime = Date.now() - startTime;
  Logger.log('appendJournalRecordWithSpecificDate took ' + executionTime + ' ms');
};

records.countRecords = function (type, opt_date) {
  var date = opt_date ? new Date(opt_date) : new Date();
  var dateStr = date.toLocaleDateString();

  var retrievedRecords = records.getRecords([
    {column: COLUMN.DATE, regExp: new RegExp('^' + dateStr + '$')},
    {column: COLUMN.EVENT, regExp: new RegExp('^' + TYPE_NAME[type] + '$')}
  ]);
  
  return retrievedRecords.length;  
};

records.getLastRecord = function () {
  var retrievedRecords = records.getRecords();
  
  var types = [].slice.call(arguments);
  var recordByType = {};

  types.forEach(function(type) {
    for (var i = retrievedRecords.length - 1; i > 0; i--) {
      var record = retrievedRecords[i];
      if (record.type === type) {
        recordByType[type] = record;
        return;
      }
    }
  });
  Logger.log('getLastRecord : ' + JSON.stringify(recordByType));
  return recordByType;
}

records.GET_RECORDS_MAX_ROWS = 100;

records.getRecords = function (opt_filters) {
  var startTime = Date.now();
  
  var rows = records.getSheet().getDataRange().getValues();
  var keys = rows.slice(0, 1)[0];
  
  var filter;
  if (opt_filters) {
    var indices = opt_filters.map(function(filter) {
      return keys.indexOf(filter.column);
    });
    filter = function(row) {
      for (var i = 0; i < opt_filters.length; i++) {
        var filterRegExp = opt_filters[i].regExp;
        var index = indices[i];
        
        if (filterRegExp.test(row[index])) {
            continue;
        }
        return false;
      }
      return true;
    };
            
  } else {
    filter = function() {
      return true;
    };
  }

  var createdRecords = []; 
  // limit number of records up to 100 when filter is not used
  var initialIndex = rows.length < records.GET_RECORDS_MAX_ROWS + 1 ? 1 : rows.length - records.GET_RECORDS_MAX_ROWS;
  // start from 1 to skip header row
  for (var i = initialIndex; i < rows.length; i++) {
    var row = rows[i];
    if (filter(row)) {
      createdRecords.push(records.createRecordFromRow(row, keys)); 
    }
  }
  createdRecords.sort(function(record1, record2) {
    var dateCompareResult = record1.date.localeCompare(record2.date);
    if (dateCompareResult !== 0) {
      return dateCompareResult;
    }
    var time1 = record1.time.replace(/^(?=\d:)/, '0');
    var time2 = record2.time.replace(/^(?=\d:)/, '0');
    return time1.localeCompare(time2);
  });
  Logger.log('getRecords(' + JSON.stringify(opt_filters) + ') : ' + JSON.stringify(createdRecords));
  
  var executionTime = Date.now() - startTime;
  Logger.log('getRecords took ' + executionTime + ' ms');
  return createdRecords;
}

records.createRecordFromRow = function (row, keys) {
  var record = {};
  row.forEach(function(item, index) {
    record[keys[index]] = item;
    if (keys[index] === COLUMN.EVENT) {
      record['type'] = TYPE_BY_NAME[item];
    }
  });
  return record;
}

records.getTimeElapsedFrom = function (lastRecord) {
  if (!lastRecord) {
    return null;
  }
  
  var lastUpdate = new Date(lastRecord.date + ' ' + lastRecord.time);
  var milliseconds = Date.now() - lastUpdate.getTime();
  var minutes = Math.round(milliseconds / 1000 / 60);
  var hours = Math.floor(minutes / 60);

  if (hours < 2) {
    return {hours: hours, minutes: minutes % 60};
  } else if (hours >= 3) {
    return {hours: hours, minutes: 0};
  } else {
    return {hours: hours, minuts: Math.round((minutes % 60) / 10) * 10};
  }
}
