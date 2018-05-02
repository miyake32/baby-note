const google = require('googleapis');
const OAuth2 = google.auth.OAuth2;

const CLIENT_ID = process.env['CLIENT_ID'];
const CLIENT_SECRET = process.env['CLIENT_SECRET'];
const ACCESS_TOKEN = process.env['ACCESS_TOKEN'];
const REFRESH_TOKEN = process.env['REFRESH_TOKEN'];
const SCRIPT_ID = process.env['SCRIPT_ID'];

const gasAccessor = {};

gasAccessor.executeFunction = function (functionName, callback, opt_parameter) {
    var startTime = Date.now();
    
    console.log('executeFunction started [functionName=' + functionName + ', parameter=' + opt_parameter);
    const auth = new OAuth2(CLIENT_ID, CLIENT_SECRET);
    auth.setCredentials({
        access_token: ACCESS_TOKEN,
        refresh_token: REFRESH_TOKEN
    });
    const script = google.script('v1');
    script.scripts.run({
        auth: auth,
        scriptId: SCRIPT_ID,
        resource: {
            function: functionName,
            parameters: [opt_parameter],
            devMode: true
        }
    }, (err, result) => {
        var turnAroundTime = Date.now() - startTime;
        console.log(functionName + ' execution took ' + turnAroundTime + ' ms');
        if (err) {
            console.error(err);
        } else {
            console.log(result.data.response.result);
            callback(result.data.response.result);
            var callbackExecutionTime = Date.now() - startTime - turnAroundTime;
            console.log('callback execution took ' + callBackExecutionTime + ' ms');
        }
    });
};

module.exports = gasAccessor;