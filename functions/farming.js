const fetch = require('node-fetch');
const parser = require("../js/ponytool_parser");

exports.handler = async function(event, context, callback) {
    const url = "https://sheets.googleapis.com/v4/spreadsheets/1uIIEUqCuyP0rsEg0Gc4IEVoGyb6ZP6gN7fteBFnyB-Q/?key=" + process.env.littleponytales_sheet + "&includeGridData=true";
    const response = await fetch(url);
    const farming_sheet = await response.json();
    let farming = {}
    farming.items = parser.parse_sheet(farming_sheet.sheets[0]).data;
    farming.messages = parser.parse_sheet(farming_sheet.sheets[1]).data;

    return {
        statusCode: 200,
        body: JSON.stringify(JSON.stringify(farming))
    };
};