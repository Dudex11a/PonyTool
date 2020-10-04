const fetch = require('node-fetch');
const parser = require("../js/ponytool_parser");

exports.handler = async function(event, context, callback) {
    const url = "https://sheets.googleapis.com/v4/spreadsheets/17fPtZaia9huJ5zzr4qS-vFKH8ZO9EKCF7GH5-5GmyYA/?key=" + process.env.littleponytales_sheet + "&includeGridData=true";
    const response = await fetch(url);
    const pony_sheet = await response.json();
    const pony_params = parser.parse_pony_params(pony_sheet);

    return {
        statusCode: 200,
        body: JSON.stringify(JSON.stringify(pony_params))
    };
};