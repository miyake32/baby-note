var COLUMN = {
  DATE: 'date',
  TIME: 'time',
  EVENT: 'event',
  PARAMETER: 'parameter'
}

var TYPE = {
  UNCHI: 'unchi', 
  OSHIKKO: 'oshikko', 
  OPPAI: 'oppai', 
  MILK: 'milk',
  MEMO: 'memo'
};

var TYPE_NAME = {
  'unchi': 'うんち',
  'oshikko': 'おしっこ',
  'oppai': 'おっぱい',
  'milk': 'ミルク',
  'memo': 'メモ'
};

var TYPE_BY_NAME = {};
Object.keys(TYPE_NAME).forEach(function(key) {
  TYPE_BY_NAME[TYPE_NAME[key]] = key;
});

var RECORDS_SHEET_NAME = 'records';
var DASHBOARD_SHEET_NAME = 'dashboard';
