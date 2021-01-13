const fetch = require('node-fetch');
const parser = require("../js/ponytool_parser");

exports.handler = async function(event, context, callback) {
    const url = "https://sheets.googleapis.com/v4/spreadsheets/1uIIEUqCuyP0rsEg0Gc4IEVoGyb6ZP6gN7fteBFnyB-Q/?key=" + process.env.littleponytales_sheet + "&includeGridData=true";
    const response = await fetch(url);
    const misc_sheet = await response.json();
    let misc = { farming: {} }
    misc.farming.items = parser.parse_sheet(misc_sheet.sheets[0]).data;
    misc.farming.messages = parser.parse_sheet(misc_sheet.sheets[1]).data;
    misc.list = parser.parse_sheet(misc_sheet.sheets[2]).data;

    return {
        statusCode: 200,
        body: JSON.stringify(JSON.stringify(misc))
    };
};