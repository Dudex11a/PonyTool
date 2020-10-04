var CURRENTOBJECTS = [];
var PONYPARENTS = [];
var SHEETS_COMPLETE = 0;

const ITEMS = [
    "Trait Scroll",
    "Stat Scroll",
    "Mutation Scroll",
    "Fertility Scroll",
    "Hybrid Scroll",
    "One-Night-Stand Scroll",
    "Rainbow Feather"
];
const STATS = [
    "Strength",
    "Agility",
    "Intelligence",
    "Charisma",
    "Perception",
    "Stealth",
    "Magic"
];

async function init() {
    // Initialize mode
    change_mode(MODES[0]);

    // Get Pony Parameters Spreadsheet data
    get_sheet('https://sheets.googleapis.com/v4/spreadsheets/17fPtZaia9huJ5zzr4qS-vFKH8ZO9EKCF7GH5-5GmyYA/?key=AIzaSyBXseFNL191-4HO4bZV-JcgEUxnm7aW9xQ&includeGridData=true', (data) => {
        if (data) {
            parse_pony_params(data);
            $("#pony_parameters_title").text(data.properties.title);
        }
        finish_requests();
    });
    get_sheet('https://sheets.googleapis.com/v4/spreadsheets/1uIIEUqCuyP0rsEg0Gc4IEVoGyb6ZP6gN7fteBFnyB-Q/?key=AIzaSyBXseFNL191-4HO4bZV-JcgEUxnm7aW9xQ&includeGridData=true', (data) => {
        if (data) {
            FARMING.items = parse_sheet(data.sheets[0]).data;
            FARMING.messages = parse_sheet(data.sheets[1]).data;
            $("#farming_data_title").text(data.properties.title);
        }
        finish_requests();
    });

    let commits = await get_repo_commits();
    // Make changelog in the ChangeLog container and set the version number
    document.getElementById("change_log_content").append(make_changelog_ele(commits));
    document.getElementById("version_number").append(get_version_number(commits));
}

function get_sheet(url, callback) {
    $.ajax({
        url : url,
        type : 'GET',
        dataType:'json',
        success : function(data) {
            console.log(data.properties.title + " succesfully obtained.");
            callback(data);
        },
        error : function(request, error)
        {
            console.log(JSON.stringify(request));
            console.log("Failed to load " + url + " , resorting to local backup of Pony Parameters.");
            callback(null);
        }
    });
}

function make_changelog_ele(commits) {

    let ele = document.createElement("div");
    for (commit of commits) {
        let message = commit.commit.message;
        // If first character is a number
        if (!isNaN(message[0])) {
            let msg_ele = document.createElement("div");
            msg_ele.className += "change";
            msg_ele.innerHTML = message.replace("\n", "<br>");
            ele.append(msg_ele);
        }
    }

    return ele;
}

function get_version_number(commits) {
    let last_commit_msg = ""
    for (commit of commits) {
        let message = commit.commit.message;
        // If first character is a number
        if (!isNaN(message[0])) {
            return message.split("\n")[0];
        }
    }
}

async function get_repo_commits() {
    const url = "https://ponytool.netlify.com/api/git_commits";
    const response = await fetch(url, {
        "method" : "GET"
    });
    return await response.json();
}

function finish_requests() {
    // Make sure all the sheets to be loaded are complete, otherwise return
    SHEETS_COMPLETE++;
    if (SHEETS_COMPLETE < 2) {
        return;
    }
    // Remove loading screen
    $("#loading")[0].remove()
    // Add Pony Input Elements for parents
    PONYPARENTS = [
        new PonyInput("Parent 1"),
        new PonyInput("Parent 2")
    ];
    $("#breed_container").append(PONYPARENTS[0].element);
    $("#breed_container").append(PONYPARENTS[1].element);
    // Add Elements for farming
    let farm_select = create_select_element(Object.keys(FARMING.items), "farm", () => {
        update_farm_element();
    });
    $("#farm_container").append(farm_select);
    let item_select = new SelectMulti("Items", ITEMS, () => {
        if (has_item("One-Night-Stand Scroll")) {
            PONYPARENTS[1].element.addClass("hidden");
        } else {
            PONYPARENTS[1].element.removeClass("hidden");
        }
    });
    item_select.element.addClass("box1");
    $("#items").append(item_select.element);
}

function has_item(item) {
    let items = get_select_values($("#items"), ".Items");
    // If it has the item and is on breed
    return items.includes(item) && MODE === "breed";
}

function parse_pony_params(data) {
    let new_params = parse_sheet(data.sheets[0]).data;
    new_params.Species = {};
    for(let i = 1; i < data.sheets.length; i++) {
        let sheet = parse_sheet(data.sheets[i]);
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
                    parsed_sheet.data[key].push(value.formattedValue.trim());
                }
            }
        }
    }
    return parsed_sheet;
}

function roll() {
    // Empty CURRENTOBJECTS
    CURRENTOBJECTS = []
    // Clear results
    let results = $("#results")[0]
    results.innerHTML = "";
    // If the amount element is not hidden use the amount inside of it
    let amount = 1;
    let amount_ele = $("#roll_amount")[0];
    if (!amount_ele.className.includes("hidden")) {
        amount = $("#roll_amount")[0].value;
    }
    // Breed Amount
    if (MODE == MODES[1]) {
        // Fertility Scroll used
        if (has_item(ITEMS[3])) {
            amount = 3;
        } else {
            amount = random_in_array([1, 2]);
        }
    }
    // Copy all button visiblity
    $(".copy_all_button").each((index, value) => {
        if (amount > 1) {
            $(value).removeClass("hidden");
        } else {
            $(value).addClass("hidden");
        }
    });
    // The rarities to get a rare species while breeding w/ Rainbow Feather
    let rare_rarities = [
        100,
        25,
        15
    ];
    let pony1 = PONYPARENTS[0].get_pony();
    let pony2 = PONYPARENTS[1].get_pony()
    if (has_item("One-Night-Stand Scroll")) {
        // Random pony that's not rare
        pony2 = roll_adopt([true, true, false]);
    }
    // Generate a the objects to put into the result container
    for(let a = 0; a < amount; a++) {
        let element;
        let object;
        switch (MODE) {
            case "adopt":
                object = roll_adopt();
                element = object_to_html(object);
                break;
            case "breed":
                if (has_item("Rainbow Feather")) {
                    // If only rare species
                    let only_rare = true;
                    let species = pony1.Species.concat(pony2.Species);
                    for (value of species) {
                        if (!value.includes("(R)")) only_rare = false;
                    }
                    // if only_rare species then only allow rare species
                    if (only_rare) {
                        object = roll_breed(true, pony1, pony2);
                    } else {
                        object = roll_breed(chance(rare_rarities[a]), pony1, pony2);
                    }
                    
                } else {
                    object = roll_breed(false, pony1, pony2);
                }
                element = object_to_html(object);
                break;
            case "farm":
                object = roll_farm();
                update_farm_element(object);
                element = object_to_html(array_to_amounts(object), " x");
                break;
        }
        CURRENTOBJECTS.push(object);
        element.addClass(["card", "result"]);
        element.appendTo(results);
    }
}

// Order the array into an object that has the items as keys
// and the amounts of the items as their values.
function array_to_amounts(array) {
    let object = {}
    for (const item of array) {
        // initialize key
        if (!object[item]) {
            object[item] = 0;
        }
        object[item] += 1;
    }
    return object;
}

function array_to_html(array) {
    let element = $("<div>");
    let items_ele = $("<div>");
    items_ele.value = "";
    for (i in array) {
        var item = array[i];
        // Element text
        items_ele.append(item)
        // Copy text
        items_ele.value += item;
        // Add line break if not last item
        if (i < array.length - 1) {
            items_ele.append("<br>")
            items_ele.value += ", ";
        }
    }
    let copy_button = make_copy_button(items_ele.value);
    items_ele.appendTo(element);
    copy_button.appendTo(element);
    return element;
}

function object_to_html(object, separator = ": ", line_break = "\n") {
    remove_details(object);
    let param_keys = Object.keys(object);
    let result = $("<div>");
    $(param_keys).each((index, key) => {
        let value = object[key];
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
    });
    let copy_button = make_copy_button(object_to_text(object, separator, line_break));
    copy_button.appendTo(result);
    return result;
}

function make_copy_button(text) {
    let button = $("<button>");
    button.text("Copy");
    button.addClass(["copy_button", "btn-primary"]);
    button.click(() => {
        copy_to_clipboard(text);
    });
    return button;
    
}

function object_to_text(object, separator = ": ", line_break = "\n") {
    let clipboard_text = "";
    let keys = Object.keys(object);
    for (let i in keys) {
        let key = keys[i];
        let param = object[key];
        if (Array.isArray(param)) {
            let formatted_param = "";
            for (let j in param) {
                let item = param[j];
                formatted_param += item
                if (j < param.length - 1) {
                    formatted_param += ", ";
                }
            }
            param = formatted_param;
        }
        clipboard_text += key + separator + param;
        // If not the last key add line_break string
        if (i < keys.length - 1) {
            clipboard_text += line_break;
        }
    }
    return clipboard_text;
}

function copy_all() {
    let ponies_text = "";
    for (let i in CURRENTOBJECTS) {
        let pony = CURRENTOBJECTS[i];
        ponies_text += object_to_text(pony) + "\n\n";
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
    let value = "Error";
    if (text) {
        value = text.toString().replace(all_details, "");
    } else {
        alert("Something went wrong somewhere, please send Dudex a screenshot of all the ponies so he can fix the problem.")
    }
    return value;
}

function roll_adopt(rarities = [
    $('#common_species').is(":checked"), // Common 0
    $('#uncommon_species').is(":checked"), //Uncommon 1
    $('#rare_species').is(":checked") // Rare 2
]) {
    let pony = {}

    // Determine Species Allowed
    let all_species = Object.keys(PONYPARAMS.Species);
    let available_species = [];
    $(all_species).each((index, value) => {
        let detail = find_rarities(value);
        if (detail) {
            if (detail[0] == "(U)" && rarities[1]) {
                available_species.push(value);
            }
            if (detail[0] == "(R)" && rarities[2]) {
                available_species.push(value);
            }
        } else {
            if (rarities[0]) {
                available_species.push(value);
            }
        }
    });
    if (available_species.length <= 0) {
        alert("There are no Species with these settings.\nSetting all Species on.");
        available_species = all_species;
        // Check the boxes
        $( "#common_species" ).prop( "checked", true );
        $( "#uncommon_species" ).prop( "checked", true );
        $( "#rare_species" ).prop( "checked", true );
    }

    let species = special_random(available_species, [], false);
    pony = roll_pony(species);
    return pony;
}

function find_rarities(string) {
    return string.match(/\(\S*\)/g);
}

function roll_breed(rare = true, pony1 = PONYPARENTS[0].get_pony(), pony2 = PONYPARENTS[1].get_pony()) {
    let params = combine_objects_w_arrays(pony1, pony2);

    // Remove rare species from params
    if (!rare && params.Species) {
        params.Species = params.Species.filter(value => {
            // If not rare
            if (find_rarities(value)) {
                return !find_rarities(value).includes("(R)");
            }
            return true
        });
    }

    params["Palette Place"] = get_species_params(params.Species)["Palette Place"];
    
    return roll_pony(params.Species, params);
}

function roll_pony(species, params = null) {
    // Make species an array if not
    if (!Array.isArray(species)) species = [species];

    // If no params are given just use species params
    if (!params) {
        params = get_species_params(species);
    }

    // Remove the duplicate
    species = clean_array(species);

    // Sort rare and common species
    let common_species = [];
    let rare_species = [];
    common_species = species.filter(value => {
        if (find_rarities(value)) {
            if (find_rarities(value).includes("(R)")) {
                rare_species.push(value);
                return false;
            };
        }
        return true;
    });

    // If there is more than 1 species set multiple_species to true
    let multiple_species = species.length > 1;
    // If there is no Rainbow Feather when there is no Rainbow Feather there needs to be further testing
    if (multiple_species && !has_item("Rainbow Feather")) {
        multiple_species = common_species.length > 1;
    }

    // If hybrid
    let hybrid_chance = 30;
    if (has_item("Hybrid Scroll")) {
        hybrid_chance = 60;
    }
    if (multiple_species) {
        // If it will be a hybrid and the species given is an array
        if (chance(hybrid_chance)) {
            let species_limit = 2;
            // If there are more than the species limit in species given
            if (species.length > species_limit) {
                let hybrid_species = [];
                // Push a random species in until the species limit is hit
                for (let i = 0; i < species_limit; i++) {
                    if (has_item("Rainbow Feather") && rare_species.length > 0) {
                        hybrid_species.push(special_random(rare_species, hybrid_species, false));
                        // Filter out the species just added from the rare_species
                        rare_species = rare_species.filter(value => value != hybrid_species[i]);
                    } else {
                        hybrid_species.push(special_random(common_species, hybrid_species, false));
                    }
                }
                species = hybrid_species;
            }
        } else {
            // Random species out of what was given
            species = random_species(common_species, rare_species);
            // Change the params so they only include ones associated with species
            let keys = Object.keys(params);
            let species_params = get_species_params(species);
            let pplaces = species_params["Palette Place"];
            // Set Species params palette place to all the palettes that species can have
            // This is so the match array later can match with the pplaces
            for(let pplace of pplaces) {
                species_params[pplace] = species_params.Palette;
            }
            for (let key of keys) {
                let species_param = species_params[key];
                // If the species_params has the key being matched
                if (species_param) {
                    // Make param an array if not
                    if (!Array.isArray(params[key])) {
                        params[key] = [params[key]];
                    }
                    params[key] = match_array(params[key], species_param);
                }
            }
        }
    } else {
        // // If there are no common species use rare if Rainbow Feather
        // if (has_item("Rainbow Feather") && common_species.length === 0) {
        //     // Not multiple species
        //     species = random_species(species);
        // } else {
        //     // Not multiple species
        species = random_species(common_species, rare_species);
        // }
    }

    let pony = {
        "Species": species
    }

    pony.Sex = special_random(PONYPARAMS.Sex, [], false);

    // Palettes
    for(let i in params["Palette Place"]) {
        let place = params["Palette Place"][i];
        // If there is a palette place in the params randomize between those
        // If not pull from all the Palettes
        if (params[place]) {
            pony[place] = [special_random(params[place])];
        } else {
            pony[place] = [special_random(params.Palette)];
        }
    }

    // The parameters and odds of each parameter being rolled
    let odds = {
        "Trait" :[
            100,
            80,
            65,
            30,
            15
        ],
        "Mutation": [
            15,
            10,
            5
        ]
    }

    // Markings has the same odds as trait
    odds["Markings"] = odds.Trait;

    // Trait Scroll used
    if (has_item("Trait Scroll")) {
        for (let i in odds.Trait) {
            odds.Trait[i] += 35;
        }
    }

    // Mutation Scroll used
    if (has_item("Mutation Scroll")) {
        for (let i in odds.Mutation) {
            odds.Mutation[i] += 35;
        }
        odds.Mutation[0] = 100;
    }

    // Stats Scroll used
    if (has_item(ITEMS[1])) {
        let stat_name = random_in_array(STATS);
        let stat_boost = random_in_array([1, 2, 3, 4, 5]);
        pony["Stats"] = "+" + stat_boost + " " + stat_name;
    }

    // These keys will be Trait, Mutation, and Markings
    let keys = Object.keys(odds);

    // Initialize arrays in the keys of the pony
    for (let key of keys) {
        pony[key] = [];
    }

    // Roll for each odd
    for (let key of keys) {
        let odd_values = odds[key];
        for (odd of odd_values) {
            if (chance(odd)) {
                let rolled_value = special_random(params[key], pony[key], true);
                if (rolled_value) pony[key].push(rolled_value);
            }
        }
    }

    // If there are no mutations delete the field
    if (pony.Mutation.length <= 0) {
        delete pony.Mutation;
    }

    return pony;
}

function random_species(common_species, rare_species) {
    let species;
    switch (MODE) {
        case MODES[0]:
            // Adopt
            // If adopt combine the rare and common species to roll
            species = random_in_array(common_species.concat(rare_species));
            break;
        case MODES[1]:
            // Breed
            if (has_item("Rainbow Feather") && rare_species.length > 0) {
                species = random_in_array(rare_species);
                break;
            }
            // Error message if there are no common species
            if (common_species.length <= 0) alert("Error:\nThere are no common species to choose from.\nDo you need to use a Rainbow Feather?");
            species = random_in_array(common_species);
            break;
    }
    // If species is undefined or something went wrong let the species display the first species
    if (!species) {
        species = [Object.keys(PONYPARAMS.Species)[0]];
    }
    return species;
}

function roll_farm() {
    let items = [];
    let item_amount = 3;
    if (chance(50)) {
        item_amount = 6;
    }
    for (let i = 0; i < item_amount; i++) {
        items.push(random_in_array(FARMING.items[get_farm_location()]));
    }
    return items;
}

function update_farm_element(items = CURRENTOBJECTS[0]) {
    let text_ele = $("#farm_message p")[0];
    let id_ele = $("#farm_message input")[0];
    let id = id_ele.value - 1;
    let location = get_farm_location();
    let message = FARMING.messages[location][id];
    // If the message or the items doesn't exist or if it's the wrong data, clear the text exit the function
    if (!message || !items || items.Marking) {
        text_ele.innerText = "";
        return;
    }
    let text = message;
    // Replace codes with their respective text.
    text = text.replace("<p>", location);
    text = text.replace("<i>", object_to_text(array_to_amounts(items), " x", ", "));

    text_ele.innerText = text;
}

function get_farm_location() {
    return $("select.farm").val();
}

function match_array(array1, array2) {
    return array1.filter(item => array2.includes(item));
}

function combine_objects_w_arrays(object1, object2) {
    // Copy Object1
    delete new_object;
    let new_object;
    new_object = object1;
    let object2_keys = Object.keys(object2);
    // Combine species and default parameters
    for (i in object2_keys) {
        let key = object2_keys[i];
        let obj2_value = object2[key];
        // If key exists combine the default and species parameter
        if (new_object[key]) {
            new_object[key] = new_object[key].concat(obj2_value);
        // If the key does not exist set the value to object2's
        } else {
            new_object[key] = obj2_value;
        }
    }
    
    new_object = clean_object(new_object);
    return new_object;
}

// Delete duplicate values from object arrays and sort
function clean_object(object) {
    // Delete duplicate values from object arrays and sort
    let object_keys = Object.keys(object);
    for (i in object_keys) {
        let array = object[object_keys[i]];
        array = clean_array(array);
    }
    return object;
}

function clean_array(array) {
    // Remove dupes
    array = [...new Set(array)];
    // Taken from https://stackoverflow.com/a/1129270
    // Sorts alphabetically
    array.sort((a,b) => (a > b) ? 1 : ((b > a) ? -1 : 0));
    return array;
}

function get_species_params(species) {
    // Copy default pony params into object
    let params = {};
    params = Object.assign(params, PONYPARAMS);
    // Remove Species from params
    delete params.Species;

    // If multiple other species are given, this is used for hybrids
    // This copies the species specific params over
    if (Array.isArray(species)) {
        for (i in species) {
            let value = species[i];
            params = combine_objects_w_arrays(params, PONYPARAMS.Species[value]);
        }
    } else {
        params = combine_objects_w_arrays(params, PONYPARAMS.Species[species]);
    }
    
    return params;
}

function get_all_params() {
    return get_species_params(Object.keys(PONYPARAMS.Species));
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
        // Wildcard chance if the array is undefined
        if (wildcard && chance(5)) {
            item = "Wildcard"
        } else {
            item = random_in_array(array);
        }
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
    "breed",
    "farm"
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

function create_select_element(options, id = "", on_change = null) {
    let select = $("<select>");
    for (i in options) {
        select.append($("<option>").text(options[i]));
    }
    if (id != "") {
        select.addClass(id);
    }
    // Callback runs onchange
    if (on_change) {
        select.change(() => {
            on_change();
        });
    }
    return select;
}

function get_select_values(element, id) {
    let values = [];
    let selects = element.find(id);
    // Make array if not
    for (i in selects) {
        let value = selects[i].value;
        if (typeof value === "string") {
            values.push(selects[i].value);
        }
    }
    return values;
}

class PonyInput {

    constructor(title) {
        // Create a HTML element for Pony Input
        this.element = $("<div>")
        this.element.append($("<h2>").text(title));

        this.param_container = $("<div>");

        this.param_eles = [];

        // Create species select element
        let keys = Object.keys(PONYPARAMS.Species);
        this.species_select = new SelectMulti("Species", keys, () => {
            // When the species select is changed, update the species params
            this.update_species_parameters();
        });
        this.species_select.create_select();
        this.species_select.element.addClass("parent_param");
        this.element.append(this.species_select.element);

        this.element.append(this.param_container);
        this.update_species_parameters()
    }

    get_species() {
        return get_select_values(this.element, ".Species");
    }

    get_pony() {
        // ----- Make the keys for the Pony Object -----
        let keys = Object.keys(PONYPARAMS);
        let all_species = this.get_species();
        // Combine the Palette Places into the keys
        // Default Palette Places
        keys = keys.concat(PONYPARAMS["Palette Place"]);
        // Species Palette Places
        for (i in all_species) {
            let species = all_species[i];
            let pp = PONYPARAMS.Species[species]["Palette Place"];
            if (pp) {
                keys = keys.concat(pp);
            }
        }
        // Remove unwanted keys from array
        keys = keys.filter(item => ![
            "Palette",
            "Palette Place"
        ].includes(item));
        // ----- Done making keys -----
        // Create Object
        let pony = {}
        // Create parameters
        for (i in keys) {
            let key = keys[i];
            // Initialize Param
            pony[key] = get_select_values(this.element, "." + key);
        }
        return pony
    }

    import_pony(pony) {
        
        let species_select = this.element.find("." + "Species");
        console.log($(species_select).val());
        this.update_species_parameters();

        let keys = Object.keys(pony);
        for (let key of keys) {
            let param = pony[key];
            let select = this.element.find("." + key);
            for (let element of select) {
                // Is a select multi
                let is_multi = $(element).parent().parent().parent().hasClass("select_multi");
                if (is_multi) {
                    // The index of the element
                    var index = $(element).parent().index();
                    if (param[index]) {
                        $(element).val(param[index]);
                    }
                } else {
                    $(element).val(param);
                }
            }
        }
    }

    create_param(name, options, parent = this.param_container, on_change = null) {
        let container = $("<div>");

        // Select
        let select = create_select_element(options, name);
        if (on_change) {
            select.change(() => {
                on_change();
            });
        }

        // Title
        container.append($("<p>").text(name));
        
        container.addClass("parent_param");
        container.append(select);
        parent.append(container);
        return select;
    }

    update_species_parameters() {
        // Remove old parameters
        this.param_container.children().each((index, value) => {
            value.remove();
        });

        // Get the params of all the species in the Pony
        let params = get_species_params(this.get_species());

        // Add palettes
        let pps = params["Palette Place"];
        let ps = params["Palette"];
        for (i in pps) {
            let place = pps[i];
            // Create elements for each Palette Place
            let select = create_select_element(ps, place);
            let palette_container = $("<div>");
            palette_container.append($("<p>").text(place));
            palette_container.append(select);
            palette_container.addClass("parent_param");
            this.param_container.append(palette_container);
        }

        let select_multis = [
            new SelectMulti("Trait", params.Trait),
            new SelectMulti("Markings", params.Markings),
            new SelectMulti("Mutation", params.Mutation)
        ];
        select_multis[0].create_select();
        select_multis[1].create_select();
        // Add each select_multi element to the container
        for (i in select_multis) {
            let select = select_multis[i];
            select.element.addClass("parent_param");
            this.param_container.append(select.element);
        }
    }
}

class SelectMulti {
    constructor(name, options, on_change = null) {
        this.name = name;
        this.options = options;
        this.on_change = on_change;
        this.element = $("<div>");
        // Button to add select element to self
        this.add_button = $("<button>").text("Add");
        this.add_button.addClass("add_button");
        this.add_button.click(() => {
            this.create_select();
            if (on_change) {
                this.on_change();
            }
        });
        // Select container for all the selects created
        this.select_container = $("<div>");
        this.element.addClass("select_multi");
        this.element.append($("<span>").text(name));
        this.element.append(this.add_button);
        this.element.append(this.select_container);
    }

    create_select() {
        let container = $("<div>");
        let select = create_select_element(this.options, this.name);
        if (this.on_change) {
            select.change(() => this.on_change());
        }
        let remove_button = $("<button>").text("X");
        remove_button.addClass("close_button");
        // Remove this select on click
        remove_button.click((value) => {
            container.remove();
            if (this.on_change) this.on_change();
        });
        container.append(select);
        container.append(remove_button);
        this.select_container.append(container);
    }
}