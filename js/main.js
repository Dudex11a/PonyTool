
function ParseSpreadsheet(data) {
    PONYPARAMS = {}
    console.log(data)
    $(data.feed.entry).each((index, entry) => {
        console.log(entry.content.$t)
    })
}

function html_loaded() {
    // Get Pony Parameters Spreadsheet data
    $.ajax({

        url : 'https://sheets.googleapis.com/v4/spreadsheets/17fPtZaia9huJ5zzr4qS-vFKH8ZO9EKCF7GH5-5GmyYA/?key=AIzaSyBXseFNL191-4HO4bZV-JcgEUxnm7aW9xQ&includeGridData=true',
        type : 'GET',
        dataType:'json',
        success : function(data) {              
            PONYPARAMS = data;
            parse_pony_params();
        },
        error : function(request,error)
        {
            console.log(JSON.stringify(request));
            alert("Failed to load Pony Parameters Spreadsheet, resorting to local backup of Pony Parameters.");
        }
    });
}

function parse_pony_params() {
    let new_params = parse_sheet(PONYPARAMS.sheets[0]).data
    new_params.Species = {}
    for(let i = 1; i < PONYPARAMS.sheets.length; i++) {
        let sheet = parse_sheet(PONYPARAMS.sheets[i])
        let species = sheet.title
        new_params.Species[species] = parse_sheet(PONYPARAMS.sheets[i]).data
    }
    PONYPARAMS = new_params
}

function parse_sheet(sheet) {
    let parsed_sheet = {
        "title": "",
        "data": {}
    };
    parsed_sheet.title = sheet.properties.title
    // Create keys for the data
    for(let v = 0; v < sheet.data[0].rowData[0].values.length; v++) {
        let value = sheet.data[0].rowData[0].values[v];
        parsed_sheet.data[value.formattedValue] = []
    }
    for(let r = 0; r < sheet.data[0].rowData.length; r++) {
        let row = sheet.data[0].rowData[r];
        if (r != 0) {
            for(let v = 0; v < row.values.length; v++) {
                let value = row.values[v];
                let key = sheet.data[0].rowData[0].values[v].formattedValue;
                if (value.formattedValue) {
                    parsed_sheet.data[key].push(value.formattedValue)
                }
            }
        }
    }
    return parsed_sheet;
}

function Roll() {
    // $("#result").innerText = JSON.stringify(roll_pony())
}

function roll_pony() {
    let pony = {}
    pony.sex = random_in_array(PONYPARAMS.sex)
    pony.species = random_in_array(PONYPARAMS.species)
    pony.body = random_in_array(PONYPARAMS.palette)
    pony.haircolor = random_in_array(PONYPARAMS.palette)
    pony.haircolor2 = random_in_array(PONYPARAMS.palette)
    pony.markingcolor = random_in_array(PONYPARAMS.palette)
    pony.markingcolor2 = random_in_array(PONYPARAMS.palette)
    pony.trait = random_in_array(PONYPARAMS.trait)

    pony.markings = []
    pony.markings.push(wildcard_roll(PONYPARAMS.marking, pony.markings))
    if (chance(80)) {
        pony.markings.push(wildcard_roll(PONYPARAMS.marking, pony.markings))
    }
    if (chance(65)) {
        pony.markings.push(wildcard_roll(PONYPARAMS.marking, pony.markings))
    }
    if (chance(30)) {
        pony.markings.push(wildcard_roll(PONYPARAMS.marking, pony.markings))
    }
    if (chance(15)) {
        pony.markings.push(wildcard_roll(PONYPARAMS.marking, pony.markings))
    }
    pony.mutations = random_in_array(PONYPARAMS.palette)
    return pony
}

function wildcard_roll(data, exceptions) {
    let result = random_in_array(data, exceptions)
    if (chance(5)) {result = "Wildcard"}
    return result
}

function random_in_array(array, exceptions = []) {
    $(exceptions).each((index, exception) => {
        // Filter the exceptions out of the array
        array = array.filter(item => item != exception)
    })
    let item = array[Math.floor(Math.random()*array.length)]
    return item
}

function chance(percent) {
    return (Math.floor(Math.random() * 100) + 1 <= percent)
}