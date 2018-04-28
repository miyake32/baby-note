var TYPE = {
  UNCHI: 'unchi', 
  OSHIKKO: 'oshikko', 
  OPPAI: 'oppai', 
  MILK: 'milk'
};

function registerUnchi() {
  appendJournalRecord(TYPE.UNCHI);
  var values = {unchiCount: countRecords(TYPE.UNCHI, new Date())};
  Logger.log('registerUnchi : ' + JSON.stringify(values));
  return values;
}

function registerOshikko() {
  appendJournalRecord(TYPE.OSHIKKO);
  var values = {oshikkoCount: countRecords(TYPE.OSHIKKO, new Date())};
  Logger.log('registerOshikko : ' + JSON.stringify(values));
  return values;
}

function registerUnchiAndOshikko() {
  appendJournalRecord(TYPE.UNCHI);
  appendJournalRecord(TYPE.OSHIKKO);
  var values = {
    unchiCount: countRecords(TYPE.UNCHI, new Date()), 
    oshikkoCount: countRecords(TYPE.OSHIKKO, new Date())
  };
  Logger.log('registerUnchiAndOshikko : ' + JSON.stringify(values));
  return values;
}

function registerOppai() {
  appendJournalRecord(TYPE.OPPAI);
  var values = {oppaiCount: countRecords(TYPE.OPPAI, new Date())};
  Logger.log('registerOppai : ' + JSON.stringify(values));
  return values;
}

function registerMilk(volume) {
  appendJournalRecord(TYPE.MILK, volume || 0);
  
  var dateStr = new Date().toLocaleDateString();
  var records = getRecords([
    {column: 'date', regExp: new RegExp('^' + dateStr + '$')},
    {column: 'event', regExp: new RegExp('^' + TYPE_NAME[TYPE.MILK] + '$')}
  ]);
  
  var sum = 0;
  records.forEach(function(item) {
    var volume = Number(item.parameter);
    if (!isNaN(volume)) {
      sum += volume;
    }
  })
  
  var values = {sumOfMilkVolume: sum};
  Logger.log('registerMilk : ' + JSON.stringify(values));
  return values;
}

function getDailySummary(date_str) {
  var date = date_str ? new Date(date_str) : new Date();
  var records = getRecords([{column: 'date', regExp: new RegExp(date.toLocaleDateString())}]);
  
  var values =  {
    targetDate: date.toLocaleDateString(),
    unchiCount: 0,
    oshikkoCount: 0,
    oppaiCount: 0,
    milkCount: 0,
    milkVolume: 0
  }
  
  records.forEach(function(record) {
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
  return values;
}

function getTimeFromLastUnchi() {
  var values = getTimeElapsedFrom(getLastRecord(TYPE.UNCHI)[TYPE.UNCHI]);
  Logger.log('getTimeFromLastUnchi : ' + JSON.stringify(values));
  return values;
}

function getTimeFromLastOshikko() {
  var values = getTimeElapsedFrom(getLastRecord(TYPE.OSHIKKO)[TYPE.OSHIKKO]);
  Logger.log('getTimeFromLastOshikko : ' + JSON.stringify(values));
  return values;
}

function getTimeFromLastOppaiAndMilk() {
  var lastRecords = getLastRecord(TYPE.OPPAI, TYPE.MILK);
  var values = {};
  if (lastRecords[TYPE.OPPAI]) {
    values.oppai = getTimeElapsedFrom(lastRecords[TYPE.OPPAI]);
  }
  if (lastRecords[TYPE.MILK]) {
    values.milk = getTimeElapsedFrom(lastRecords[TYPE.MILK]);
    values.milk.volume = lastRecords[TYPE.MILK].parameter;
  }
  Logger.log('getTimeFromLastOppaiAndMilk : ' + JSON.stringify(values));
  return values;
}

// ====================
//  private functions
// ====================
var RECORDS_SHEET_NAME = 'records';
var TYPE_NAME = {
  'unchi': 'うんち',
  'oshikko': 'おしっこ',
  'oppai': 'おっぱい',
  'milk': 'ミルク'
};
var TYPE_BY_NAME = {};
Object.keys(TYPE_NAME).forEach(function(key) {
  TYPE_BY_NAME[TYPE_NAME[key]] = key;
});
    

function appendJournalRecord(type, opt_parameter) {
  var row = [];
  var currentTime = new Date();
  row.push("'" + currentTime.toLocaleDateString());
  row.push("'" + currentTime.toLocaleTimeString().replace(/[^:0-9]/g, ''));
  row.push(TYPE_NAME[type]);
  if (type === TYPE.MILK) {
      row.push(opt_parameter);
  }
  
  var sheet = SpreadsheetApp.getActive().getSheetByName(RECORDS_SHEET_NAME);
  sheet.appendRow(row);
}

function countRecords(type, opt_date) {
  var date = opt_date ? new Date(opt_date) : new Date();
  var dateStr = date.toLocaleDateString();

  var records = getRecords([
    {column: 'date', regExp: new RegExp('^' + dateStr + '$')},
    {column: 'event', regExp: new RegExp('^' + TYPE_NAME[type] + '$')}
  ]);
  
  return records.length;  
}

function getLastRecord() {
  var sheet = SpreadsheetApp.getActive().getSheetByName(RECORDS_SHEET_NAME);
  var rows = sheet.getDataRange().getValues();
  var keys = rows.slice(0, 1)[0];
  
  var indexOfEvent = keys.indexOf('event');
  var typeNames = [].slice.call(arguments).map(function(type) {
    return TYPE_NAME[type];
  });

  var recordByType = {};

  typeNames.forEach(function(typeName) {
    for (var i = rows.length - 1; i > 0; i--) {
      var row = rows[i];
      if (row[indexOfEvent] === typeName) {
        recordByType[TYPE_BY_NAME[typeName]] = createRecordFromRow(row, keys);      
        return;
      }
    }
  });
  Logger.log('getLastRecord : ' + JSON.stringify(recordByType));
  return recordByType;
}

function getRecords(opt_filters) {
  var sheet = SpreadsheetApp.getActive().getSheetByName(RECORDS_SHEET_NAME);
  var rows = sheet.getDataRange().getValues();
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

  var records = [];  
  // start from 1 to skip header row
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    if (filter(row)) {
      records.push(createRecordFromRow(row, keys)); 
    }
  }
  Logger.log('getRecords(' + JSON.stringify(opt_filters) + ') : ' + JSON.stringify(records));
  return records;
}

function createRecordFromRow(row, keys) {
  var record = {};
  row.forEach(function(item, index) {
    record[keys[index]] = item;
    if (keys[index] === 'event') {
      record['type'] = TYPE_BY_NAME[item];
    }
  });
  return record;
}

function getTimeElapsedFrom(lastRecord) {
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
