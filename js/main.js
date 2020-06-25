var PONYPARAMS = {}
var CURRENTPONY = {}

function html_loaded() {
    // Get Pony Parameters Spreadsheet data
    $.ajax({

        url : 'https://sheets.googleapis.com/v4/spreadsheets/17fPtZaia9huJ5zzr4qS-vFKH8ZO9EKCF7GH5-5GmyYA/?key=AIzaSyBXseFNL191-4HO4bZV-JcgEUxnm7aW9xQ&includeGridData=true',
        type : 'GET',
        dataType:'json',
        success : function(data) {
            PONYSHEET = data;
            console.log("Google Sheet succesfully obtained")  
            parse_pony_params();
        },
        error : function(request,error)
        {
            console.log(JSON.stringify(request));
            alert("Failed to load Pony Parameters Spreadsheet, resorting to local backup of Pony Parameters.");
            parse_pony_params();
        }
    });
}

function parse_pony_params() {
    let new_params = parse_sheet(PONYSHEET.sheets[0]).data
    new_params.Species = {}
    for(let i = 1; i < PONYSHEET.sheets.length; i++) {
        let sheet = parse_sheet(PONYSHEET.sheets[i])
        let species = sheet.title
        new_params.Species[species] = parse_sheet(PONYSHEET.sheets[i]).data
    }
    PONYPARAMS = new_params
}

// Parse the Google Spreadsheet data into something more ledgable
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

function roll() {
    CURRENTPONY = roll_pony()
    let result = $("#result")[0]
    result.innerHTML = ""
    let param_keys = Object.keys(CURRENTPONY)
    $(param_keys).each((index, key) => {
        let value = CURRENTPONY[key];
        $("<tr>").append(
            $('<td>').text(key + ":"),
            $('<td>').text(value)
        ).appendTo(result);
    });
}

function roll_pony() {
    let pony = {}


    pony.Species = random_in_array(Object.keys(PONYPARAMS.Species))
    // Combine all the regular params and species specific params for randomizing
    let species_params = {};
    // Get keys to loop through
    let pony_keys = Object.keys(PONYPARAMS);
    for (let i in pony_keys) {
        let key = pony_keys[i];
        let species_param = PONYPARAMS.Species[pony.Species][key]
        // Initialize the species params with the default values
        species_params[key] = PONYPARAMS[key]
        // If the parameter exists in the species combine that with the default parameters
        if (species_param != undefined) {
            species_params[key] = species_params[key].concat(species_param)
        }
    }
    // Delete the species parameter because we don't need that as a parameter to randomize
    if (species_params.Species) {
        delete species_params.Species
    }

    pony.Sex = random_in_array(species_params.Sex)

    pony.Body = wildcard_roll(species_params.Palette)
    pony.Hair = wildcard_roll(species_params.Palette)
    pony.Hair2 = wildcard_roll(species_params.Palette)
    pony.Marking = wildcard_roll(species_params.Palette)
    pony.Marking2 = wildcard_roll(species_params.Palette)

    // Traits
    pony.Traits = []
    pony.Traits.push(wildcard_roll(species_params.Trait, pony.Traits))
    if (chance(80)) {
        pony.Traits.push(wildcard_roll(species_params.Trait, pony.Traits))
    }
    if (chance(65)) {
        pony.Traits.push(wildcard_roll(species_params.Trait, pony.Traits))
    }
    if (chance(30)) {
        pony.Traits.push(wildcard_roll(species_params.Trait, pony.Traits))
    }
    if (chance(15)) {
        pony.Traits.push(wildcard_roll(species_params.Trait, pony.Traits))
    }

    // Markings
    pony.Markings = []
    pony.Markings.push(wildcard_roll(species_params.Marking, pony.Markings))
    if (chance(80)) {
        pony.Markings.push(wildcard_roll(species_params.Marking, pony.Markings))
    }
    if (chance(65)) {
        pony.Markings.push(wildcard_roll(species_params.Marking, pony.Markings))
    }
    if (chance(30)) {
        pony.Markings.push(wildcard_roll(species_params.Marking, pony.Markings))
    }
    if (chance(15)) {
        pony.Markings.push(wildcard_roll(species_params.Marking, pony.Markings))
    }

    pony.Mutations = []
    if (chance(15)) {
        pony.Mutations.push(wildcard_roll(species_params.Mutation, pony.Mutations));
    }
    if (chance(10)) {
        pony.Mutations.push(wildcard_roll(species_params.Mutation, pony.Mutations));
    }
    if (chance(5)) {
        pony.Mutations.push(wildcard_roll(species_params.Mutation, pony.Mutations));
    }
    if (pony.Mutations.length <= 0) {
        delete pony.Mutations;
    }

    return pony
}

function combine_species_params(species) {
    let species_param
    if (species_param) {

    }
    return PONYSHEET[parameter].concat(PONYSHEET.Species[species][parameter])
}

function wildcard_roll(array, exceptions = []) {
    let result = random_in_array(array, exceptions)
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