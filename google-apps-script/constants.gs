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


var ICON = {
  unchi : '💩',
  oshikko : '💦',
  oppai : '🤱',
  milk : '🍼',
  memo : '📔'
};


ICON.createIconString = function(unchiCnt, oshikkoCnt, oppaiCnt, milkCnt, memoCnt) {
  var str = '';
  if (unchiCnt) {
    str = (str ? str + ' ' : str) + ICON.multiplyIconString(TYPE.UNCHI, unchiCnt);
  }
  if (oshikkoCnt) {
    str = (str ? str + ' ' : str) + ICON.multiplyIconString(TYPE.OSHIKKO, oshikkoCnt);
  }
  if (oppaiCnt) {
    str = (str ? str + ' ' : str) + ICON.multiplyIconString(TYPE.OPPAI, oppaiCnt);
  }
  if (milkCnt) {
    str = (str ? str + ' ' : str) + ICON.multiplyIconString(TYPE.MILK, milkCnt);
  }
  if (memoCnt) {
    str = (str ? str + ' ' : str) + ICON.multiplyIconString(TYPE.MEMO, memoCnt);
  }
  return str;
};

ICON.multiplyIconString = function(type, cnt) {
  var str = '';
  for (var i = 0; i < cnt; i++) {
    str = str + ICON[type]
  }
  return str;
};
