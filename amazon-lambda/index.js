"use strict";
const Alexa = require('alexa-sdk'); // Alexa SDKの読み込み
const gasAccessor = require('./gas-accessor');

const handlers = {
    // インテントに紐付かないリクエスト
    'LaunchRequest': function () {
        console.log('Processing LaunchRequest');
        this.emit('AMAZON.HelpIntent');
    },
    // スキルの使い方を尋ねるインテント
    'AMAZON.HelpIntent': function () {
        console.log('Processing HelpIntent');
        this.emit(':ask', 'うんち、おしっこ、おっぱい、ミルクが記録できます。何をしますか？');
    },
    'RegisterUnchiIntent': function () {
        console.log('Processing RegisterUnchiIntent');
        gasAccessor.executeFunction('registerUnchi', function (result) {
            this.emit(':tell', '本日' + result.unchiCount + '回目のうんちです');
        }.bind(this));
    },
    'RegisterOshikkoIntent': function () {
        console.log('Processing RegisterOshikkoIntent');
        gasAccessor.executeFunction('registerOshikko', function (result) {
            this.emit(':tell', '本日' + result.oshikkoCount + '回目のおしっこです');
        }.bind(this));
    },
    'RegisterUnchiAndOshikkoIntent': function () {
        console.log('Processing RegisterUnchiAndOshikkoIntent');
        gasAccessor.executeFunction('registerUnchiAndOshikko', function (result) {
            this.emit(':tell', '本日おしっこは' + result.oshikkoCount + '回目、うんちは' + result.unchiCount + '回目です');
        }.bind(this));
    },
    'RegisterOppaiIntent': function () {
        console.log('Processing RegisterOppaiIntent');
        gasAccessor.executeFunction('registerOppai', function (result) {
            this.emit(':tell', '本日' + result.oppaiCount + '回目のおっぱいです');
        }.bind(this));
    },
    'RegisterMilkIntent': function () {
        console.log('Processing RegisterMilkIntent');
        var volume = this.event.request.intent.slots.volume.value;
        if ((!volume || volume === '?') && this.event.request.dialogState !== "COMPLETED") {
            console.warn('No volume information');
            this.emit(':delegate');
        } else {
            gasAccessor.executeFunction('registerMilk', function (result) {
                this.emit(':tell', volume + 'ミリリットルのミルクを記録しました。今日あげたミルクは' + result.sumOfMilkVolume + 'ミリリットルです');
            }.bind(this), volume);
        }
    },
    'RegisterMemoIntent': function () {
        console.log('Processing RegisterMemoIntent');
        var content = this.event.request.intent.slots.content.value;
        if ((!content || content === '?') && this.event.request.dialogState !== "COMPLETED") {
            console.warn('No content');
            this.emit(':delegate');
        } else {
            console.log('content : ' + content);
            gasAccessor.executeFunction('registerMemo', function (result) {
                this.emit(':tell', 'メモに' + content + 'を記録しました');
            }.bind(this), content);
        }
    },
    'GetDailySummaryIntent': function () {
        console.log('Processing GetDailySummaryIntent');
        var date = this.event.request.intent.slots.date.value;
        gasAccessor.executeFunction('getDailySummary', function (result) {

            var targetDate = new Date(result.targetDate);
            var messageHeader = (targetDate.getMonth() + 1) + '月' + targetDate.getDate() + '日は';

            var message = '';
            if (result.unchiCount) {
                message = (message ? message + '、' : message) + 'うんちが' + result.unchiCount + '回';
            }
            if (result.oshikkoCount) {
                message = (message ? message + '、' : message) + 'おしっこが' + result.oshikkoCount + '回';
            }
            if (result.oppaiCount) {
                message = (message ? message + '、' : message) + 'おっぱいが' + result.oppaiCount + '回';
            }
            if (result.milkCount) {
                message = (message ? message + '、' : message) + 'ミルクが' + result.milkCount + '回で' + result.milkVolume + 'ミリリットル'
            }

            if (message === '') {
                message = 'データがありません。';
            } else {
                message += 'です。'
            }
            this.emit(':tell', messageHeader + message);
        }.bind(this), date);
    },
    'GetLastUnchiIntent': function () {
        console.log('Processing GetLastUnchiIntent');
        gasAccessor.executeFunction('getTimeFromLastUnchi', function (result) {
            var time = createElapsedTimeString(result.hours, result.minutes);
            if (time) {
                this.emit(':tell', '最後のうんちは' + time + '前です。');
            } else {
                this.emit(':tell', 'データがありません');
            }
        }.bind(this));
    },
    'GetLastOshikkoIntent': function () {
        console.log('Processing GetLastOshikkoIntent');
        gasAccessor.executeFunction('getTimeFromLastOshikko', function (result) {
            var time = createElapsedTimeString(result.hours, result.minutes);
            if (time) {
                this.emit(':tell', '最後のおしっこは' + time + '前です。');
            } else {
                this.emit(':tell', 'データがありません');
            }
        }.bind(this));
    },
    'GetLastOppaiAndMilkIntent': function () {
        console.log('Processing GetLastOppaiAndMilkIntent');
        gasAccessor.executeFunction('getTimeFromLastOppaiAndMilk', function (result) {
            var message = '';
            if (result.oppai) {
                message = message + '最後のおっぱいは' + createElapsedTimeString(result.oppai.hours, result.oppai.minutes) + '前'
            }
            if (result.milk) {
                message = message ? message + '、' : message;
                message = message + '最後のミルクは' + createElapsedTimeString(result.milk.hours, result.milk.minutes) + '前で' + result.milk.volume + 'ミリリットル';
            }
            if (message) {
                this.emit(':tell', message + 'です。');
            } else {
                this.emit(':tell', 'データがありません');
            }
        }.bind(this));
    }
};

function createElapsedTimeString(hours, minutes) {
    var message = '';
    if (hours > 0) {
        message = message + hours + '時間';
    }
    if (minutes > 0 || hours === 0) {
        message = message + minutes + '分';
    }
    return message;
}

// Lambda関数のメイン処理
exports.handler = function (event, context, callback) {    
    var alexa = Alexa.handler(event, context); // Alexa SDKのインスタンス生成
    alexa.appId = process.env.APP_ID;
    alexa.registerHandlers(handlers); // ハンドラの登録
    alexa.execute();                  // インスタンスの実行
};
