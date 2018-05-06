function writeRecordsInQueue () {
  var startTime = Date.now();
  Logger.log('writeRecordsInQueue started');
  
  var newRowCount = recordsBufferCache.dequeue();
  if (newRowCount > 0) {
    dashboard.updateDashboardOnRecordsChange(true);
  }
  
  var executionTime = Date.now() - startTime;
  Logger.log('writeRecordsInQueue took ' + executionTime + ' ms');
}

function maintainCache () {
  var startTime = Date.now();
  Logger.log('maintainCache started');
  
  var cache = recordsBufferCache.getCache();
  
  [
    recordsBufferCache.QUEUE_ENQUEUE_POINTER_KEY, 
    recordsBufferCache.QUEUE_DEQUEUE_POINTER_KEY
  ].forEach(function (key) {
    var value = cache.get(key);
    cache.put(key, value, 21600);
    Logger.log('[key='+ key + ', value=' + value + ']');
  });
  
  var date = new Date();
  Object.keys(TYPE).forEach(function(typeKey) {
    recordsBufferCache.countRecords(date, TYPE[typeKey], 0, true);
  });
  recordsBufferCache.sumUpMilkVolume(date, 0);
  
  var executionTime = Date.now() - startTime;
  Logger.log('maintainCache took ' + executionTime + ' ms');
}

// for test
function removeCache() {
  recordsBufferCache.getCache().remove(recordsBufferCache.QUEUE_ENQUEUE_POINTER_KEY);
  recordsBufferCache.getCache().remove(recordsBufferCache.QUEUE_DEQUEUE_POINTER_KEY);
}

function test() {
  Logger.log(recordsBufferCache.countRecords(new Date('2018/5/5'), TYPE.UNCHI, 1));
}

var recordsBufferCache = {};

recordsBufferCache.QUEUE_CACHE_KEY_PREFIX = 'records-queue-';
recordsBufferCache.QUEUE_ENQUEUE_POINTER_KEY = 'records-queue-enqueue-pointer';
recordsBufferCache.QUEUE_DEQUEUE_POINTER_KEY = 'records-queue-dequeue-pointer';

recordsBufferCache.RECORDS_COUNT_CACHE_KEY_PREFIX = 'records-count-';
recordsBufferCache.SUM_MILK_VOLUME_CACHE_KEY_PREFIX = 'sum-milk-volume-';

recordsBufferCache.getCache = function () {
  if (!recordsBufferCache.cache) {
    recordsBufferCache.cache = CacheService.getScriptCache();
  }
  return recordsBufferCache.cache;
};

recordsBufferCache.enqueue = function(row) {
  var startTime = Date.now();
  Logger.log('enqueue started with row : ' + JSON.stringify(row));
  
  var cache = recordsBufferCache.getCache();
  var enqueuePointer = cache.get(recordsBufferCache.QUEUE_ENQUEUE_POINTER_KEY);
  if (enqueuePointer === null) {
    Logger.log('enqueuePointer is missing. Newly start from 0');
    enqueuePointer = 0;
  }
  Logger.log('enqueuePointer is ' + enqueuePointer);
  cache.put(recordsBufferCache.QUEUE_CACHE_KEY_PREFIX + enqueuePointer, JSON.stringify(row) ,21600);
  enqueuePointer++; // implicitly converted to Number
  cache.put(recordsBufferCache.QUEUE_ENQUEUE_POINTER_KEY, enqueuePointer, 21600);
  
  var executionTime = Date.now() - startTime;
  Logger.log('enqueue took ' + executionTime + ' ms');
}

recordsBufferCache.dequeue = function() {
  var startTime = Date.now();
  Logger.log('dequeue started');
  
  var cache = recordsBufferCache.getCache();
  var enqueuePointer = cache.get(recordsBufferCache.QUEUE_ENQUEUE_POINTER_KEY);
  var dequeuePointer = cache.get(recordsBufferCache.QUEUE_DEQUEUE_POINTER_KEY);

  if (dequeuePointer === null) {
    Logger.log('dequeuePointer is missing. Newly start from 0');
    dequeuePointer = 0;
  }
  Logger.log('enqueuePointer is ' + enqueuePointer + ', dequeuePointer is ' + dequeuePointer);
  
  var rowCnt = 0;
  for (var i = Number(dequeuePointer); i < enqueuePointer; i++) {
    Logger.log('processing with pointer ' + i);
    var rowStr = cache.get(recordsBufferCache.QUEUE_CACHE_KEY_PREFIX + i);
    Logger.log('Write a new record : ' + rowStr);
    var row = JSON.parse(rowStr);
    records.getSheet().appendRow(row);
    
    cache.remove(recordsBufferCache.QUEUE_CACHE_KEY_PREFIX + i);
    cache.put(recordsBufferCache.QUEUE_DEQUEUE_POINTER_KEY, i + 1, 21600);
    rowCnt++;
  }
  
  var executionTime = Date.now() - startTime;
  Logger.log('dequeue took ' + executionTime + ' ms');
  
  return rowCnt;
}

recordsBufferCache.countRecords = function (date, type, enqueuedRecordsCnt, opt_reset) {
  var startTime = Date.now();
  Logger.log('countRecords started [date=' + date + ', type=' + type + ']');
  
  var dateStr = date.toLocaleDateString();
  
  var cnt = recordsBufferCache.getRecordsCount(type, dateStr);
  if (cnt === null || opt_reset) {
    Logger.log('count cache is missing. fetching from spreadsheet');
    var retrievedRecords = records.getRecords([
      {column: COLUMN.DATE, regExp: new RegExp('^' + dateStr + '$')},
      {column: COLUMN.EVENT, regExp: new RegExp('^' + TYPE_NAME[type] + '$')}
    ]);
    cnt = retrievedRecords.length;
  }
  Logger.log('retrieved count is ' + cnt);
  cnt = Number(cnt) + enqueuedRecordsCnt;
  Logger.log('new count is ' + cnt);
  recordsBufferCache.putRecordsCount(type, dateStr, cnt);
  
  var executionTime = Date.now() - startTime;
  Logger.log('countRecords took ' + executionTime + ' ms');
  
  return cnt;  
};

recordsBufferCache.getRecordsCount = function (type, dateStr) {
  var key = recordsBufferCache.RECORDS_COUNT_CACHE_KEY_PREFIX + type + '-' + dateStr;
  return recordsBufferCache.getCache().get(key);
}

recordsBufferCache.putRecordsCount = function (type, dateStr, cnt) {
  var key = recordsBufferCache.RECORDS_COUNT_CACHE_KEY_PREFIX + type + '-' + dateStr;
  return recordsBufferCache.getCache().put(key, cnt, 21600);
}


recordsBufferCache.sumUpMilkVolume = function (date, enqueuedMilkVolume, opt_reset) {
  var startTime = Date.now();
  Logger.log('sumUpMilkVolume started [date=' + date + ']');
  
  var dateStr = date.toLocaleDateString();
  var volume = recordsBufferCache.getMilkVolume(dateStr);
  if (volume === null || opt_reset) {
    Logger.log('volume cache is missing. fetching from spreadsheet');
    var retrievedRecords = records.getRecords([
      {column: COLUMN.DATE, regExp: new RegExp('^' + dateStr + '$')},
      {column: COLUMN.EVENT, regExp: new RegExp('^' + TYPE_NAME[TYPE.MILK] + '$')}
    ]);
    
    volume = 0;
    retrievedRecords.forEach(function(item) {
      var volumeInRecord = Number(item.parameter);
      if (!isNaN(volume)) {
        volume += volumeInRecord;
      }
    });
  }
  Logger.log('retrieved volume is ' + volume);
  volume = Number(volume) + enqueuedMilkVolume;
  Logger.log('new volume is ' + volume);
  recordsBufferCache.putMilkVolume(dateStr, volume);
  
  var executionTime = Date.now() - startTime;
  Logger.log('sumUpMilkVolume took ' + executionTime + ' ms');
  
  return volume; 
}
  
recordsBufferCache.getMilkVolume = function (dateStr) {
  var key = recordsBufferCache.SUM_MILK_VOLUME_CACHE_KEY_PREFIX + dateStr;
  return recordsBufferCache.getCache().get(key);
}

recordsBufferCache.putMilkVolume = function (dateStr, volume) {
  var key = recordsBufferCache.SUM_MILK_VOLUME_CACHE_KEY_PREFIX + dateStr;
  return recordsBufferCache.getCache().put(key, volume, 21600);
}