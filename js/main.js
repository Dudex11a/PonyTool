var PONYPARAMS = {}
var CURRENTPONIES = []

function init() {
    // Initialize mode
    change_mode(MODES[0]);

    // Get Pony Parameters Spreadsheet data
    $.ajax({

        url : 'https://sheets.googleapis.com/v4/spreadsheets/17fPtZaia9huJ5zzr4qS-vFKH8ZO9EKCF7GH5-5GmyYA/?key=AIzaSyBXseFNL191-4HO4bZV-JcgEUxnm7aW9xQ&includeGridData=true',
        type : 'GET',
        dataType:'json',
        success : function(data) {
            PONYSHEET = data;
            console.log("Google Sheet succesfully obtained");
            finish_request();
        },
        error : function(request,error)
        {
            console.log(JSON.stringify(request));
            alert("Failed to load Pony Parameters Spreadsheet, resorting to local backup of Pony Parameters.");
            finish_request();
        }
    });
}

function finish_request() {
    parse_pony_params();
    // Remove loading screen
    $("#loading")[0].remove()
}

function parse_pony_params() {
    let new_params = parse_sheet(PONYSHEET.sheets[0]).data;
    new_params.Species = {};
    for(let i = 1; i < PONYSHEET.sheets.length; i++) {
        let sheet = parse_sheet(PONYSHEET.sheets[i]);
        let species = sheet.title;
        new_params.Species[species] = sheet.data;
    }
    PONYPARAMS = new_params;
}

// Parse the Google Spreadsheet data into something more ledgable
function parse_sheet(sheet) {
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
    // Copy all button visiblity
    $(".copy_all_button").each((index, value) => {
        if (amount > 1) {
            $(value).removeClass("hidden");
        } else {
            $(value).addClass("hidden");
        }
    });
    for(let a = 0; a < amount; a++) {
        CURRENTPONIES.push(roll_pony());
        let pony = CURRENTPONIES[a];
        remove_details(pony);
        let param_keys = Object.keys(pony);
        let result = $("<div>");
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

function remove_details(pony) {
    let param_keys = Object.keys(pony)
    $(param_keys).each((index, key) => {
        let value = pony[key];
        if (Array.isArray(value)) {
            for (let i in value) {
                pony[key][i] = remove_detail(pony[key][i]);
            }
        } else {
            pony[key] = remove_detail(pony[key]);
        }
    });
    return pony
}

function remove_detail(text) {
    let all_details = /(\s*?\[\S*\])|(\s*?\<\S*\>)|(\s*?\(\S*\))/g;
    return text.toString().replace(all_details, "");
}

function roll_pony() {
    let pony = {}

    // Determine Species Allowed
    let species = Object.keys(PONYPARAMS.Species);
    let available_species = [];
    $(species).each((index, value) => {
        let detail = value.match(/\(\S*\)/g);
        if (detail) {
            if (detail[0] == "(U)" && $('#uncommon_species').is(":checked")) {
                available_species.push(value);
            }
            if (detail[0] == "(R)" && $('#rare_species').is(":checked")) {
                available_species.push(value);
            }
        } else {
            if ($('#common_species').is(":checked")) {
                available_species.push(value);
            }
        }
    });
    if (available_species.length <= 0) {
        alert("There are no Species with these settings.\nSetting all Species on.");
        available_species = species;
        // Check the boxes
        $( "#common_species" ).prop( "checked", true );
        $( "#uncommon_species" ).prop( "checked", true );
        $( "#rare_species" ).prop( "checked", true );
    }

    // else PONYPARAMS.Species adopt

    pony.Species = special_random(available_species, [], false);
    // Combine all the regular params and species specific params for randomizing
    let species_params = get_species_params(pony.Species);

    pony.Sex = special_random(species_params.Sex, [], false)

    // Palettes
    for(let i in species_params["Palette Place"]) {
        let place = species_params["Palette Place"][i]
        pony[place] = special_random(species_params.Palette)
    }

    // Traits
    pony.Traits = []
    pony.Traits.push(special_random(species_params.Trait, pony.Traits))
    let exceptions = find_matches(species_params.Trait, pony.Traits)
    if (chance(80)) {
        pony.Traits.push(special_random(species_params.Trait, pony.Traits.concat(exceptions)))
        exceptions = find_matches(species_params.Trait, pony.Traits)
    }
    if (chance(65)) {
        pony.Traits.push(special_random(species_params.Trait, pony.Traits.concat(exceptions)))
        exceptions = find_matches(species_params.Trait, pony.Traits)
    }
    if (chance(30)) {
        pony.Traits.push(special_random(species_params.Trait, pony.Traits.concat(exceptions)))
        exceptions = find_matches(species_params.Trait, pony.Traits)
    }
    if (chance(15)) {
        pony.Traits.push(special_random(species_params.Trait, pony.Traits.concat(exceptions)))
    }
    // If a Trait is undefined delete it
    // I have to have this here because if a species doesn't have enough triats
    // the traits will start coming back undefined and mess other processes up.
    // I also need to iterate through it backwords to not mess up order while going along.
    for (let t = pony.Traits.length - 1; t >= 0; t--) {
        if (!pony.Traits[t]) {
            pony.Traits.splice(t);
        }
    }
    // Markings
    pony.Markings = []
    exceptions = []
    pony.Markings.push(special_random(species_params.Marking, pony.Markings))
    if (chance(80)) {
        pony.Markings.push(special_random(species_params.Marking, pony.Markings))
    }
    if (chance(65)) {
        pony.Markings.push(special_random(species_params.Marking, pony.Markings))
    }
    if (chance(30)) {
        pony.Markings.push(special_random(species_params.Marking, pony.Markings))
    }
    if (chance(15)) {
        pony.Markings.push(special_random(species_params.Marking, pony.Markings))
    }

    pony.Mutations = []
    if (chance(15)) {
        pony.Mutations.push(special_random(species_params.Mutation, pony.Mutations));
    }
    if (chance(10)) {
        pony.Mutations.push(special_random(species_params.Mutation, pony.Mutations));
    }
    if (chance(5)) {
        pony.Mutations.push(special_random(species_params.Mutation, pony.Mutations));
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

function get_species_params(species) {
    let species_params = {};
    // Get keys to loop through
    let species_keys = Object.keys(PONYPARAMS.Species[species]);
    for (i in species_keys) {
        let key = species_keys[i];
        let value = PONYPARAMS.Species[species][key];
        // Set the values exclusive to the species
        species_params[key] = value;
    }
    // Get the default keys so I know what Params to add to the species_params later
    let default_keys = Object.keys(PONYPARAMS);
    // Remove unwanted keys
    default_keys = default_keys.filter((value) => {
        return value != "Species";
    });
    // Combine species and default parameters
    for (i in default_keys) {
        let key = default_keys[i];
        let value = PONYPARAMS[key];
        // If key exists combine the default and species parameter
        if (species_params[key]) {
            species_params[key] = species_params[key].concat(value);
        // If the key does not exist, set it to the default value
        } else {
            species_params[key] = value;
        }
    }

    return species_params;
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

// function special_random(array, exceptions = []) {
//     let result = special_random(array, exceptions);
//     if (chance(5)) {result = "Wildcard"};
//     return result;
// }

function special_random(array, exceptions = [], wildcard = true) {
    $(exceptions).each((index, exception) => {
        // Filter the exceptions out of the array
        array = array.filter(item => item != exception)
    });
    let item;
    // If it's an array of Strings (I only check the first value
    if (typeof array[0] == "string") {
        let common = array;
        let uncommon = [];
        let rare = [];
        // To remove from the common array later on
        let to_remove = [];
        // Sort by rarity into different arrays
        $(common).each((index, value) => {
            let detail = value.match(/\(\S*\)/g);
            if (detail) {
                if (detail[0] == "(U)") {
                    uncommon.push(value);
                    to_remove.push(value);
                }
                if (detail[0] == "(R)") {
                    rare.push(value);
                    to_remove.push(value);
                }
            }
        });
        for (let ri in to_remove) {
            let remove = to_remove[ri];
            // Filter out the uncommon and rares
            common = common.filter(item => item != remove);
        }

        // Rolling rarity
        let rarities = []
        if (uncommon.length > 0) {
            push_into_array(rarities, "uncommon", 20);
        }
        if (rare.length > 0) {
            push_into_array(rarities, "rare", 5);
        }
        if (wildcard) {
            push_into_array(rarities, "wildcard", 5);
        }
        if (common.length > 0) {
            push_into_array(rarities, "common", Math.abs(rarities.length - 100));
        }
        let rarity = random_in_array(rarities);
        // Match / Switch rarity
        let rarity_array = array;
        switch(rarity) {
            case "common":
                rarity_array = common;
                break;
            case "uncommon":
                rarity_array = uncommon;
                break;
            case "rare":
                rarity_array = rare;
                break;
            case "wildcard":
                rarity_array = ["Wildcard"];
        }
        item = random_in_array(rarity_array);
    } else {
        item = random_in_array(array);
    }
    return item;
}

function push_into_array(array, item, amount = 1) {
    for (let i = 0; i < amount; i++) {
        array.push(item);
    }
    return array;
}

function random_in_array(array) {
    return array[Math.floor(Math.random()*array.length)];
}

function chance(percent) {
    return (Math.floor(Math.random() * 100) + 1 <= percent);
}

const MODES = [
    "adopt",
    "breed"
]

var MODE = MODES[0];

function change_mode(mode) {
    // Set mode
    MODE = mode

    // Hide all mode based elements
    // For each mode
    for (i in MODES) {
        // Current mode in loop
        let m = MODES[i];
        $("." + m).addClass(["hidden"]);
    }
    // Unhide all elements of the mode
    $("." + mode).removeClass(["hidden"]);

    // Default navigiation button styles
    let buttons = $("nav button");
    buttons.removeClass("btn-primary");
    buttons.addClass("btn-secondary");
    // Add button style to current mode
    let active_button = $("#" + mode);
    active_button.removeClass("btn-secondary");
    buttons.addClass("btn-primary");
}

// Create a HTML element for Pony Input
function create_pony_input(title) {
    let element = $("<div>")
    element.append($("<h2>").text(title));
    // Create Species Element
    let select = $("<select>")
    let keys = Object.keys(PONYPARAMS.Species);
    // Add each Species
    for (i in keys) {
        let species = keys[i];
        let species_ele = $("<option>").text(remove_detail(species));
        species_ele.addClass(species);
        select.append(species_ele);
    }
    element.append(select);
    return element;
}