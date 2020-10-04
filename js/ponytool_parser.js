exports.parse_pony_params = function (data) {
    let new_params = exports.parse_sheet(data.sheets[0]).data;
    new_params.Species = {};
    for(let i = 1; i < data.sheets.length; i++) {
        let sheet = exports.parse_sheet(data.sheets[i]);
        let species = sheet.title;
        new_params.Species[species] = sheet.data;
    }
    return new_params;
}

// Parse the Google Spreadsheet data into something more ledgable
exports.parse_sheet = function (sheet) {
    let parsed_sheet = {
        "title": "",
        "data": {}
    };
    parsed_sheet.title = sheet.properties.title
    // If no data return and end here
    if (!sheet.data[0].rowData) {
        return parsed_sheet;
    }
    // Create keys for the data
    for(let v = 0; v < sheet.data[0].rowData[0].values.length; v++) {
        let value = sheet.data[0].rowData[0].values[v];
        // If the value is valid, initialize the key
        if (value.formattedValue) {
            parsed_sheet.data[value.formattedValue] = [];
        }
    }
    // For each row
    for(let r = 0; r < sheet.data[0].rowData.length; r++) {
        let row = sheet.data[0].rowData[r];
        if (r != 0) {
            // For each value
            for(let v = 0; v < row.values.length; v++) {
                let value = row.values[v];
                let key = sheet.data[0].rowData[0].values[v].formattedValue;
                // If there is a value in the spot add the data to the sheet
                if (value.formattedValue) {
                    parsed_sheet.data[key].push(value.formattedValue.trim());
                }
            }
        }
    }
    return parsed_sheet;
}