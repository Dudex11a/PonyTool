var PONYPARAMS = {}
var CURRENTPONIES = []

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
    CURRENTPONIES = []
    let results = $("#results")[0]
    results.innerHTML = "";
    let amount = $("#pony_amount")[0].value
    if (amount > 1) {
        $(".copy_all_button").each((index, value) => {
            value.style.visibility = "visible";
        });
    } else {
        $(".copy_all_button").each((index, value) => {
            value.style.visibility = "hidden";
        });
    }
    for(let a = 0; a < amount; a++) {
        CURRENTPONIES.push(roll_pony())
        let pony = CURRENTPONIES[a]
        let param_keys = Object.keys(pony)
        let result = $("<div>")
        $(param_keys).each((index, key) => {
            let value = pony[key];
            if (key != "Clipboard") {
                if (Array.isArray(value)) {
                    let formatted_value = "";
                    for (let i in value) {
                        let item = value[i];
                        formatted_value += item;
                        // If it's not the last value
                        if (i < value.length - 1) {
                            formatted_value += ", ";
                        }
                    }
                    value = formatted_value
                }
                let table_key = $('<td>').html(key + ":");
                table_key.addClass("table_key");
                let table_value = $('<td>').html(value);
                table_value.addClass("table_value");
                let table_row = $("<tr>").append(
                    table_key,
                    table_value
                );
                table_row.appendTo(result);
            }
        });
        let copy_button = $("<button>");
        copy_button.text("Copy");
        copy_button.addClass(["copy_button", "btn-primary"]);
        copy_button.click(() => {
            copy_to_clipboard(CURRENTPONIES[a].Clipboard)
        });
        copy_button.appendTo(result);
        result.addClass(["card", "result"]);
        result.appendTo(results);
    }
}

function copy_all() {
    let ponies_text = "";
    for (let i in CURRENTPONIES) {
        let pony = CURRENTPONIES[i];
        ponies_text += pony.Clipboard + "\n";
    }
    copy_to_clipboard(ponies_text);
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

    // Palettes
    for(let i in species_params["Palette Place"]) {
        let place = species_params["Palette Place"][i]
        pony[place] = wildcard_roll(species_params.Palette)
    }

    // Traits
    pony.Traits = []
    pony.Traits.push(wildcard_roll(species_params.Trait, pony.Traits))
    let exceptions = find_matches(species_params.Trait, pony.Traits)
    if (chance(80)) {
        pony.Traits.push(wildcard_roll(species_params.Trait, pony.Traits.concat(exceptions)))
        exceptions = find_matches(species_params.Trait, pony.Traits)
    }
    if (chance(65)) {
        pony.Traits.push(wildcard_roll(species_params.Trait, pony.Traits.concat(exceptions)))
        exceptions = find_matches(species_params.Trait, pony.Traits)
    }
    if (chance(30)) {
        pony.Traits.push(wildcard_roll(species_params.Trait, pony.Traits.concat(exceptions)))
        exceptions = find_matches(species_params.Trait, pony.Traits)
    }
    if (chance(15)) {
        pony.Traits.push(wildcard_roll(species_params.Trait, pony.Traits.concat(exceptions)))
    }

    // Markings
    pony.Markings = []
    exceptions = []
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

    // Clipboard text
    let clipboard_text = "";
    for (let i in Object.keys(pony)) {
        let key = Object.keys(pony)[i];
        let param = pony[key];
        if (Array.isArray(param)) {
            let formatted_param = "";
            for (let i in param) {
                let item = param[i];
                formatted_param += item
                if (i < param.length - 1) {
                    formatted_param += ", ";
                }
            }
            param = formatted_param;
        }
        clipboard_text += key + ": " + param + "\n"
    }
    pony.Clipboard = clipboard_text

    return pony;
}

function find_matches(params, values) {
    let exceptions = []
    for (let v in values) {
        let value = values[v];
        // Regex for finding something in brackets
        let id_finder = /\[[\S]*\]/g;
        // Id for the value exception (i.e. "[W]")
        let v_id = id_finder.exec(value);
        if (v_id) {
            for (let p in params) {
                let param = params[p];
                // Reinitizalize Regex
                id_finder = /\[[\S]*\]/g;
                let p_id = id_finder.exec(param);
                if (p_id) {
                    // If Ids match add the exception
                    if (v_id[0] == p_id[0]) {
                        exceptions.push(param);
                    }
                }
            }
        }
    }
    return exceptions;
}

function copy_to_clipboard(text) {
    navigator.clipboard.writeText(text);
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