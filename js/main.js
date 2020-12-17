// |________________________________________________________|
// |Made by Dudex11a, you can reach me at dudex11c@gmail.com|
// |________________________________________________________|

// The results in the #results_container
var CURRENTRESULTS = [];
// The PonyInput objects for the parents in the breed tab go in here.
var PONYPARENTS = [];
// This is mainly for the "loading database..." message,
// SHEETS_COMPLETE track the amount of api request that have been processed.
var SHEETS_COMPLETE = 0;
// If has a connection to the database, if the db key is working.
var DB_CONNECTED = false;
var MAIN_DATABASE;

function set_connected(value = DB_CONNECTED) {
    DB_CONNECTED = value;
    if (value) $(".db_hidden").removeClass("hidden");
    else $(".db_hidden").addClass("hidden");
}

const ITEMS = [
    "Trait Scroll",
    "Stat Scroll",
    "Mutation Scroll",
    "Fertility Scroll",
    "Hybrid Scroll",
    "Wildcard Scroll",
    "One-Night-Stand Scroll",
    "Rainbow Feather",
    "Illegal Ponies"
];

function wildcard_chance() {
    return has_item("Wildcard Scroll") ? 15 : 5;
}

const STATS = [
    "Strength",
    "Agility",
    "Intelligence",
    "Charisma",
    "Perception",
    "Stealth",
    "Magic"
];

// These extra inputs are mainly used in the Pony Input for some params
const EXTRA_INPUTS = [
    "Owner",
    "Pony Name",
    "Pony ID",
    "Ref Link"
];

const MODES = [
    "adopt",
    "breed",
    "farm",
    "quests",
    "database",
    "options"
]
var MODE = MODES[0];

var SITE_URL = "https://ponytool.netlify.com";
const CANT_FETCH_STRING = "\nCannot fetch data.\n";

async function init() {
    // Initialize mode
    change_mode(MODES[0]);

    // Use the site url if offline document and not local host
    let current_url = document.URL
    if (current_url.includes("localhost") || current_url.includes("https")) {
        SITE_URL = "";
    }

    // Add default option to the options in Local Storage
    add_default_options();
    // Make the options elements
    $("#options_container").append(make_options_ele().children());

    // Make requests to the API
    // I make 3 requests to different URLs. It might be better to make a
    // route get all the data instead of 3 different ones. The 3 different
    // APIs work if one goes down but that's unlikly with it all being hosted
    // by Netlify.
    let res;
    let url;
    // The url for the fetch, this is also used in some debug console.log stuff
    url = SITE_URL + "/api/ponyparams";
    // Get Pony Parameters Spreadsheet data
    res = await api_fetch(url);
    // I "try" this function because when the api_fetch fails and returns an error 
    // res.json() isn't a function and stops this function, if that happens I load
    // the offline data if there is any.
    try {
        res.json().then(data => {
            // Save offline data
            localStorage.pony_params = data;
            PONYPARAMS = JSON.parse(data);
            finish_requests();
        })
    } catch (err) {
        console.log("Using offline pony_params data.\n", err);
        // If there's offline data use it, otherwise it'll display Error.
        if (localStorage.pony_params) {
            PONYPARAMS = JSON.parse(localStorage.pony_params);
            finish_requests();
        } else {
            console.log("No offline pony_params data.");
            finish_requests(url);
        }
    };

    // These next two api_fetch follow generally the same format as above.
    // Get Farming Spreadsheet data
    url = SITE_URL + "/api/farming";
    res = await api_fetch(url);
    try {
        res.json().then(data => {
            localStorage.farming = data;
            FARMING = JSON.parse(data);
            finish_requests();
        });
    } catch (err) {
        console.log("Using offline farming data.\n", err);
        if (localStorage.farming) {
            FARMING = JSON.parse(localStorage.farming);
            finish_requests();
        } else {
            console.log("No offline farming data.");
            finish_requests(url);
        }
    };

    // Get Git Commits
    url = SITE_URL + "/api/git_commits";
    res = await api_fetch(url);
    try {
        res.json().then(commits => {
            // Make changelog in the ChangeLog container and set the version number
            document.getElementById("change_log_content").append(make_changelog_ele(commits));
            document.getElementById("version_number").append(get_version_number(commits));
        });
    } catch (err) {
        console.log("Cannot get git_commits.\n", err);
    }
    
}

async function api_fetch(url) {
    try {
        return await fetch(url);
    } catch(err) {
        console.log(url, CANT_FETCH_STRING, err);
        return err;
    }
}

// OPTIONS

const default_options = {
    // The id of the option
    /*"example": {
        // The type to use when making the option for the options tab
        "type" : "boolean",
        // The name to use for the options tab
        "name" : "Example",
        // The default value
        "value" : true
        // A function to run after the value is set
        "action" : function(){}
    },*/
    "scrolling_bg": {
        "type" : "boolean",
        "name" : "Scrolling Background",
        "value" : false,
        "action" : function(value) {
            // If scrolling background is on set the animation name to scroll
            if (value) $("main").css("animation-name", "background_scroll");
            else $("main").css("animation-name", "_");
        }
    },
    "primary_color": {
        "type" : "color",
        "name" : "Primary Theme Color",
        "value" : tinycolor("#0ad150").toHsl(),
        "action" : function(hsl) {
            // Apply color to element
            this.ele.val("#" + tinycolor(hsl).toHex());
            // Apply color to css
            let prefix = "pri";
            let suffixs = ["h", "s", "l"];
            let types = ["deg", "%", "%"];
            let values = Object.values(hsl);
            // Change css variables for the suffixs
            for (let i in suffixs) {
                let suffix = suffixs[i];
                let type = types[i];
                let value = values[i];
                // Change the value around if the type is a %
                if (type === "%") {
                    // Remove % and change to a number
                    value = Number(value.replaceAll(type, ""));
                }
                value = Math.round(value);
                $(":root").css(`--${prefix}_${suffix}`, value + type);
            }
        }
    },
    "secondary_color": {
        "type" : "color",
        "name" : "Secondary Theme Color",
        "value" : tinycolor("#f3fbfc").toHsl(),
        "action" : function(hsl) {
            // Apply color to element
            this.ele.val("#" + tinycolor(hsl).toHex());
            // Apply color to css
            let prefix = "sec";
            let suffixs = ["h", "s", "l"];
            let types = ["deg", "%", "%"];
            let values = Object.values(hsl);
            // Change css variables for the suffixs
            for (let i in suffixs) {
                let suffix = suffixs[i];
                let type = types[i];
                let value = values[i];
                // Change the value around if the type is a %
                if (type === "%") {
                    // Remove % and change to a number
                    value = Number(value.replaceAll(type, ""));
                }
                value = Math.round(value);
                $(":root").css(`--${prefix}_${suffix}`, value + type);
            }
        }
    },
    "reset_theme" : {
        "type" : "button",
        "name" : "Reset Theme",
        "action" : function() {
            // Set defaults for defined options
            let option_names = ["primary_color", "secondary_color"];
            for (let option_name of option_names) {
                let option = default_options[option_name];
                set_option(option_name, option.value);
                option.action(option.value);
            }
        }
    },
    // "test_number": {
    //     "type" : "number",
    //     "name" : "Test Number",
    //     "value" : 1
    // },
    // "test_select": {
    //     "type" : "select",
    //     "name" : "Test Select",
    //     "value" : "1",
    //     "values" : [
    //         "1",
    //         "two",
    //         "3"
    //     ]
    // },
    // This has no type so it doesn't automatically add itself to options
    "db_pass": {
        "value" : ""
    }
}

// ---- Save and load json data from local storage
function save_object(id, data) {
    localStorage[id] = JSON.stringify(data);
}

function load_object(id) {
    return localStorage[id] ? JSON.parse(localStorage[id]) : {};
}
// ----

function save_offline_pony(pony) {
    let ponies = load_object("ponies");
    const offline_prefix = "o_";

    let id = pony["Pony ID"];
    // If the pony has no ID make new one
    if (!id) {
        alert("The pony you're trying to save doesn't have an ID.\nGenerating new id...");
        // All offline pony ids
        let all_ids = Object.keys(ponies);
        let number = 0;
        while(!id) {
            number += 1;
            let new_id = offline_prefix + number;
            // If the new id doesn't already exist, use that id
            if (!all_ids.includes(new_id)) id = new_id;
        }
    }
    // If the id doesn't start with an "o_", make it start with one
    if (id.slice(0, 2) !== offline_prefix) id = offline_prefix + id;
    // Save the id back into the pony
    pony["Pony ID"] = id;

    // If the pony already exists
    let suffix = " pony " + id + ".";
    if (ponies[id]) {
        alert("Updated" + suffix);
    } else {
        alert("Added" + suffix);
    }
    ponies[id] = pony;
    save_object("ponies", ponies);
    // If there is a main database, update the values inside it
    // if (MAIN_DATABASE) MAIN_DATABASE.update_ponies(ponies);
    return ponies;
}

function get_options() {
    // return JSON.parse(localStorage.options ? localStorage.options : "{}");
    return load_object("options");
}

function set_options(options) {
    // localStorage.options = JSON.stringify(options);
    save_object("options", options);
    return options;
}

function get_option(option) {
    // return JSON.parse(localStorage.options)[option];
    return get_options()[option];
}

function set_option(option, value) {
    // let options = get_options();
    // options[option] = value;
    // localStorage.options = JSON.stringify(options);
    let options = get_options();
    options[option] = value;
    set_options(options);
    return options;
}

function add_default_options() {
    for (let key of Object.keys(default_options)) {
        let option = default_options[key];
        // If the default option is not the current options.
        // This is so if I add more default options down the line
        // it'll automatically add them to the options.
        if (!get_options()[key]) {
            set_option(key, option.value);
        }
    }
}

function make_options_ele() {
    let ele = $("<div>");
    for (let key of Object.keys(default_options)) {
        let option = default_options[key];
        let current_value = get_options()[key];
        if (option.type) {
            let option_ele = $("<div>");
            // Make title
            let title_ele = $("<label>").text(option.name)
            // Set label to be connected to the input
            title_ele.attr("for", key);
            option_ele.append(title_ele);
            // Need to init the input_ele here so it doesn't "redeclare it".
            let input_ele;
            // Value of the option
            let val;
            switch (option.type) {
                case "boolean":
                    input_ele = $("<input type='checkbox'>");
                    input_ele.attr("id", key);
                    input_ele.prop("checked", current_value);
                    // On input change, set option
                    input_ele.change(() => {
                        val = input_ele.is(":checked");
                        set_option(key, val);
                        if (option.action) option.action(val);
                    });
                    break;
                case "number":
                    input_ele = $("<input type='number'>");
                    input_ele.attr("id", key);
                    input_ele.val(current_value);
                    input_ele.change(() => {
                        val = input_ele.val();
                        set_option(key, val);
                        if (option.action) option.action(val);
                    });
                    break;
                case "select":
                    input_ele = $("<select>");
                    for (let input_option_ele of option.values) {
                        input_ele.append($("<option>").text(input_option_ele));
                    }
                    input_ele.attr("id", key);
                    input_ele.val(current_value);
                    input_ele.change(() => {
                        val = input_ele.val();
                        set_option(key, val);
                        if (option.action) option.action(val);
                    });
                    break;
                case "color":
                    input_ele = $("<input type='color'>");
                    input_ele.change(e => {
                        // Set the value through tinycolor, I might want to make my own code for this later
                        // so I don't need the 33KB tinycolor package.
                        val = tinycolor(input_ele.val()).toHsl();
                        set_option(key, val);
                        if (option.action) option.action(val);
                    });
                    break;
                case "button":
                    input_ele = $("<button>");
                    input_ele.click(e => {
                        if (option.action) option.action(val);
                    });
                    break;
            }
            // Add input ele if there is one
            if (input_ele) {
                option_ele.append(input_ele);
                option.ele = input_ele;
            }
            // Run the option's action with the current_value
            if (option.action && option.value) option.action(current_value);
            ele.append(option_ele);
        }
    }
    return ele;
}

// function apply_options() {

// }

function make_changelog_ele(commits) {

    let ele = document.createElement("div");
    for (let commit of commits) {
        let message = commit.commit.message;
        // If first character is a number
        if (!isNaN(message[0])) {
            let msg_ele = document.createElement("div");
            message = message.replaceAll("- ", "<br>- ");
            msg_ele.innerHTML = message;
            ele.append(msg_ele);
        }
    }

    return ele;
}

function get_version_number(commits) {
    let last_commit_msg = ""
    for (let commit of commits) {
        let message = commit.commit.message;
        // If first character is a number
        if (!isNaN(message[0])) {
            return message.split("\n")[0];
        }
    }
}

function finish_requests(error = undefined) {
    // If there is a error getting the data make the loading div display Error
    if (error) {
        $("#loading h1")[0].innerText = "Error";
        return;
    }
    // Make sure all the sheets to be loaded are complete, otherwise return
    SHEETS_COMPLETE++;
    if (SHEETS_COMPLETE < 2) {
        return;
    }
    // Remove loading screen
    $("#loading")[0].remove();
    // Add Database Element for the database_container
    MAIN_DATABASE = new PonyDatabase();
    // Set the actions of the MAIN_DATABASE, the reason why I
    // don't do this in the constructor is because I need
    // the database to already be initialized.
    // Right now the database will only be loaded with offline ponies.
    MAIN_DATABASE.actions = {
        "delete" : function() {
            save_object("ponies", MAIN_DATABASE.ponies);
            MAIN_DATABASE.update_ponies();
        },
        "update_ponies" : function() {
            MAIN_DATABASE.ponies = load_object("ponies");
        }
    }
    // Update the database with the ponies
    MAIN_DATABASE.update_ponies();
    // Save the version of the database
    // This is so if I need to make any changes to the local database I can use this
    // version number to tell if there are any changes I need to make
    let db_version = load_object("db_version");
    if (db_version > 1) {}
    save_object("db_version", 1);
    // Add Pony Input Elements for parents
    PONYPARENTS = [
        new PonyInput("Parent 1"),
        new PonyInput("Parent 2")
    ];
    for (let pony of PONYPARENTS) {
        $("#breed_container").append(pony.element);
        pony.actions = {
            "save_offline" : function() {
                MAIN_DATABASE.update_ponies();
            }
        }
    }
    $("#breed_container").append(PONYPARENTS[0].element);
    $("#breed_container").append(PONYPARENTS[1].element);
        // { // Test Data
        //     "123" : {
        //         "Pony ID" : "123",
        //         "Pony Name" : "N1",
        //         "Owner" : "O1",
        //         "Species" : "S1",
        //         "Ref Link" : "R1",
        //         "Offline" : true
        //     },
        //     "124" : {
        //         "Pony ID" : "124",
        //         "Pony Name" : "N2",
        //         "Owner" : "O2",
        //         "Species" : "S2",
        //         "Ref Link" : "https://google.com",
        //         "Offline" : true
        //     }
        // }
    $("#database_container").append(MAIN_DATABASE.element);
    // Add Elements for farming
    let farm_select = create_select_element("farm", Object.keys(FARMING.items), () => {
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
    // item_select.element.addClass("box1");
    $("#items").append(item_select.element);
    // Set the visibility of elements that should be hidden if not connected to the db
    set_connected();
}

function has_item(item) {
    let items = get_select_values($("#items"), ".Items");
    // If it has the item and is on breed
    return items.includes(item) && MODE === "breed";
}

function roll() {
    // Make results visible, this a really minor visual effect that bothers me.
    $("#results_container").removeClass("hidden");
    // Empty CURRENTRESULTS
    CURRENTRESULTS = []
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
    let copy_buttons = $(".copy_all_button");
    for (let button of copy_buttons) {
        if (amount > 1) {
            $(button).removeClass("hidden");
        } else {
            $(button).addClass("hidden");
        }
    }
    // The rarities to get a rare species while breeding w/ Rainbow Feather
    let rare_rarities = [
        100,
        25,
        15
    ];
    let pony1 = PONYPARENTS[0].get_pony_simple();
    let pony2 = PONYPARENTS[1].get_pony_simple();
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
        CURRENTRESULTS.push(object);
        element.appendTo(results);
    }
}

// Order the array into an object that has the items as keys
// and the amounts of the items as their values.
function array_to_amounts(array) {
    let object = {}
    for (let item of array) {
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
    for (let i in array) {
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
    result.addClass("clear_box");
    for (let key of param_keys) {
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
    }
    let copy_button = make_copy_button(object_to_text(object, separator, line_break));
    copy_button.appendTo(result);
    return result;
}

function make_copy_button(text) {
    let button = $("<button>");
    button.text("Copy");
    button.addClass(["copy_button", "on"]);
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
    let prefix = "";
    switch (MODE) {
        case "breed":
            prefix = "Offspring"
            break;
        case "adopt":
            prefix = "Geno"
            break;
    }
    for (let i in CURRENTRESULTS) {
        let pony = CURRENTRESULTS[i];
        // Set the prefix if there is one
        let full_prefix = prefix;
        if (full_prefix !== "") full_prefix = full_prefix + " " + String(parseInt(i) + 1) + "\n";
        ponies_text += full_prefix + object_to_text(pony) + "\n\n";
    }
    copy_to_clipboard(ponies_text);
}

function remove_details(pony) {
    let param_keys = Object.keys(pony)
    for (let key of param_keys) {
        let value = pony[key];
        if (Array.isArray(value)) {
            for (let i in value) {
                pony[key][i] = remove_detail(pony[key][i]);
            }
        } else {
            pony[key] = remove_detail(pony[key]);
        }
    }
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
    for (let species of all_species) {
        let detail = find_rarities(species);
        if (detail) {
            if (detail[0] == "(U)" && rarities[1]) {
                available_species.push(species);
            }
            if (detail[0] == "(R)" && rarities[2]) {
                available_species.push(species);
            }
        } else {
            if (rarities[0]) {
                available_species.push(species);
            }
        }
    }
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

function roll_breed(rare = true, pony1 = PONYPARENTS[0].get_pony_simple(), pony2 = PONYPARENTS[1].get_pony_simple()) {
    let params = combine_objects(pony1, pony2);

    // Don't need this because roll_pony takes care of this.
    // Keeping this incase there are any problems later.
    // Remove rare species from params
    // if (!rare && params.Species) {
    //     params.Species = params.Species.filter(value => {
    //         // If not rare
    //         if (find_rarities(value)) {
    //             return !find_rarities(value).includes("(R)");
    //         }
    //         return true
    //     });
    // }

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

    // Unreference species and params
    species = clean_array(species);
    params = {...params}

    // Remove the duplicate
    params = clean_object(params);

    // Sort rare and common species
    let common_species = [];
    let rare_species = [];
    common_species = species.filter(value => {
        if (find_rarities(value)) {
            if (find_rarities(value).includes("(R)")) {
                rare_species.push(value);
                return false;
            }
        }
        return true;
    });

    // If there is more than 1 species set multiple_species to true
    let multiple_species = species.length > 1;

    // If hybrid
    let hybrid_chance = 30;
    if (has_item("Hybrid Scroll")) {
        hybrid_chance = 60;
    }

    // If there is no Rainbow Feather when there are multiple species (like "Earth Pony, Alicorn")
    // just use the common species.
    if (multiple_species && !has_item("Rainbow Feather")) {
        species = [...common_species];
    }

    let species_params;
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
        }

        // Change the params so they only include ones associated with species
        let keys = Object.keys(params);
        // I redo this line here because the species might be changed
        species_params = get_species_params(species);
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
                // Only keep parameters related to the species
                if (!has_item("Illegal Ponies")) params[key] = match_array(params[key], species_param);
                
            }
        }
    } else {
        species = random_species(common_species, rare_species);
        // Set species params for later use
        species_params = get_species_params(species);
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

    // Roll for some of the params (i.e. Traits, Markings...)
    // This will go to each param and then each odd in the odds object.
    for (let key of keys) {
        let odd_values = odds[key];
        for (let odd of odd_values) {
            if (chance(odd)) {
                // Values that the pony has can't be used again, they are an exception.
                let exceptions = pony[key];
                // Find matches for potential other bodypart values. This is mainly for Traits.
                exceptions = exceptions.concat(find_matches(params[key], pony[key]));
                let rolled_value = special_random(params[key], exceptions, true);
                if (rolled_value) pony[key].push(rolled_value);
            }
        }
    }

    // If there are no mutations delete the field
    if (pony.Mutation.length <= 0) {
        delete pony.Mutation;
    }

    // Roll extra parts
    // Seprate parts into an object
    const parts = find_matches(Object.keys(species_params), ["[P]"]);
    // Roll for each part
    for (let part of parts) {
        const part_name = remove_detail(part);
        // Input a random for the pony
        pony[part_name] = [special_random(params[part])];
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
        console.log("Something went wrong with the species in 'roll_pony'.");
        species = [Object.keys(PONYPARAMS.Species)[0]];
    }
    return [species];
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

function update_farm_element(items = CURRENTRESULTS[0]) {
    let text_ele = $("#farm_message p")[0];
    // This code was going to be used to randomize messages, I don't use it right now
    // let id_ele = $("#farm_message input")[0];
    // let id = id_ele.value - 1;
    let id = 0
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

// Combine objects and mainly, combine the arrays with the objects if the keys match
function combine_objects(obj1, obj2) {
    // Copy obj 1 and 2 to different objects, this is so they aren't references to
    // the actual objects and I acidentally edit those.
    if (Array.isArray(obj1)) obj1 = [...obj1];
    else if (typeof obj1 === "object") obj1 = {...obj1}
    if (Array.isArray(obj2)) obj2 = [...obj2];
    else if (typeof obj2 === "object") obj2 = {...obj2}

    let object = obj1;
    
    // If they're both arrays combine them, the is the bread and butter
    if (Array.isArray(object) && Array.isArray(obj2)) {
        object = object.concat(obj2);
    }
    // If we're going into the object, I only check obj2 here because
    // if somethings wrong it'll just default to valid object.
    // It's not nessesary to make sure I only continue with a object.
    else if (!Array.isArray(obj2) && typeof obj2 === "object") {
        // Loop through the keys
        for (let key of Object.keys(obj2)) {
            // If both objects have the same key
            if (object[key] && obj2[key]) {
                object[key] = combine_objects(object[key], obj2[key]);
            }
            // If obj1 doesn't have the key that obj2 has, add it to obj1
            else if (obj2[key]) {
                object[key] = obj2[key];
            }
        }
    }
    // If there is no obj1 and there is obj2, make it that.
    if (!object && obj2) {
        object = obj2;
    }

    return object;
}

// Delete duplicate values from object arrays and sort
function clean_object(object) {
    let value = object;
    // If it's an array just clean that bad boy
    if (Array.isArray(value)) {
        value = clean_array(value);
    }
    // If it's an object and not an array go through the keys and
    // clean those objects. Clean object first checks if it's an array
    // so it'll sort that.
    else if (typeof value === "object") {
        for (let key of Object.keys(value)) {
            value[key] = clean_object(value[key]);
        }
    }
    return value;
}

function clean_array(array) {
    // Remove dupes
    array = [...new Set(array)];
    // Taken from https://stackoverflow.com/a/1129270
    // Sorts alphabetically and numerically
    array.sort((a,b) => (a > b) ? 1 : ((b > a) ? -1 : 0));
    return array;
}

function get_species_params(species) {
    // Copy default pony params into object
    let params = {...PONYPARAMS};
    // Remove Species from params
    delete params.Species;
    
    // If multiple other species are given, this is used for hybrids
    // This copies the species specific params over
    if (species.length > 1) {
        for (let value of species) {
            params = combine_objects(params, PONYPARAMS.Species[value]);
        }
    } else {
        params = combine_objects(params, PONYPARAMS.Species[species]);
    }
    params = clean_object(params);

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

function special_random(array, exceptions = [], wildcard = true) {
    for (let exception of exceptions) {
        // Filter the exceptions out of the array
        array = array.filter(item => item != exception)
    }
    let item;
    // If it's an array of Strings (I only check the first value
    if (typeof array[0] == "string") {
        let common = array;
        let uncommon = [];
        let rare = [];
        // To remove from the common array later on
        let to_remove = [];
        // Sort by rarity into different arrays
        for (let value of common) {
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
        }
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
            push_into_array(rarities, "wildcard", wildcard_chance());
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
        if (wildcard && chance(wildcard_chance())) {
            item = "Wildcard";
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

function change_mode(mode) {
    // Set mode
    MODE = mode

    // Hide all mode based elements
    // For each mode
    for (let i in MODES) {
        // Current mode in loop
        let m = MODES[i];
        $("." + m).addClass(["hidden"]);
    }
    // Unhide all elements of the mode
    $("." + mode).removeClass(["hidden"]);

    // Default navigiation button styles
    let buttons = $("nav button");
    buttons.removeClass("on");
    buttons.addClass("off");
    // Add button style to current mode
    let active_button = $("#" + mode);
    active_button.removeClass("off");
    buttons.addClass("on");
    // Custom mode behavior
    switch (mode) {
        case "options":
            // Hide the results when going to options
            $("#results_container").addClass("hidden");
            break;
        default:
            $("#results_container").removeClass("hidden");
            break;
    }
}

function create_select_element(name = "", options, on_change = null) {
    let select = $("<select>");
    for (let option of options) {
        select.append($("<option>").text(option));
    }
    if (name != "") {
        select.addClass(idify(name));
    }
    // Callback runs onchange
    if (on_change) {
        select.change(() => {
            on_change();
        });
    }
    return select;
}

function create_titled_select_element(name, options, on_change) {
    let container = $("<div>");

    // Select
    let select = create_select_element(name, options);
    if (on_change) {
        select.change(() => {
            on_change();
        });
    }

    // Title
    container.append($("<p>").text(name));
    
    container.append(select);
    return container;
}

function get_select_values(element, id) {
    let values = [];
    let selects = element.find(id);
    // Make array if not
    for (let select of selects) {
        let value = select.value;
        if (typeof value === "string") {
            values.push(value);
        }
    }
    return values;
}

function create_popup_element(ele_innards) {
    let obj = {}
    let ele = $("<div>");
    ele.addClass("popup_container");
    let center_ele = $("<div>");
    // Allow for arrays, if it's not array just append it normal
    if (Array.isArray(ele_innards)) {
        for (let element of ele_innards) center_ele.append(element);
    } else {
        center_ele.append(ele_innards);
    }
    // ---- Close button
    let close_button = $("<button>").text("Close");
    close_button.addClass("wide red_button");
    center_ele.append(close_button);
    // ----
    ele.append(center_ele);
    // Append it to the document
    $("body").append(ele);
    obj = {
        "element" : ele,
        "close" : function() {
            ele.remove();
        }
    }
    close_button.click(() => {
        obj.close();
    });
    return obj;
}

// I should of made this sooner, this turns any string into a id.
// Right now it just replaces spaces with _.
function idify(name) {
    let id = name;
    // Replace [0] with [1]
    let replacements = [
        [" ", "_"],
        ["[", ""],
        ["]", ""]
    ]
    for (let replacement of replacements) id = id.replaceAll(...replacement);
    return id;
}

// Undoes above
// function unidify(unid) {
//     return unid.replaceAll("_", " ");
// }

class PonyInput {

    constructor(title = "PonyInput", has_load_db_btn = true, has_show_more_btn = true, actions = {}) {
        // Create a HTML element for Pony Input
        this.element = $("<div>");
        this.element.addClass("clear_box pony_input");
        this.element.append($("<h2>").text(title));
        // Initialize actions, these are functions set to run when certain functions are ran
        this.actions = actions;
        // Initialize the select multis, this will be used later to edit them in batch
        this.select_multis = [];

        // Refresh Button
        let reset_button = $("<button>").text("Reset");
        reset_button.addClass("top_right red_button");
        reset_button.click(() => {
            // Reset fields to whatever species is first
            this.reset_params();
        });
        this.element.append(reset_button);

        // Load Pony from database button (this will only be visible when connected to the database)
        if (has_load_db_btn) {
            // Need a reference to this
            let input = this;
            let load_btn = $("<button>").text("Load Pony from Database");
            load_btn.addClass("wide");
            // Move database into popup
            load_btn.click(() => {
                // Stop if there is no MAIN_DATABASE, this should never happen.
                if (!MAIN_DATABASE) return;
                // Create database for popup
                // Initialize this function for use later
                let close_popup = function(ponies){}
                let db = new PonyDatabase(MAIN_DATABASE.ponies);
                db.actions = {
                    // What to do when the "Select" button is pressed
                    "select" : function(ponies) {
                        close_popup(ponies);
                    },
                    // Save to the offline database and update the main database
                    "delete" : function() {
                        save_object("ponies", db.ponies);
                        db.update_ponies();
                        MAIN_DATABASE.update_ponies();
                    },
                    "update_ponies" : function() {
                        db.ponies = load_object("ponies");
                        // Update the main database aswell
                        MAIN_DATABASE.update_ponies();
                    }
                }
                db.update_ponies();

                // Create the popup for the database
                let popup = create_popup_element(db.element);
                close_popup = function(ponies) {
                    input.import_pony(ponies[0]);
                    popup.close();
                }
            });
            this.element.append(load_btn);
        }

        // Create species select element
        let keys = Object.keys(PONYPARAMS.Species);
        this.species_select = new SelectMulti("Species", keys, () => {
            // When the species select is changed, update the species params
            this.update_species_parameters();
        });
        this.species_select.create_select();

        // Container for the species specific params
        this.param_container = $("<div>");

        // **** PARAMS2 ****
        // More params container (holds Stat input, Pony Name, Pony ID, and the ref link)
        this.param2_container = $("<div>");
        this.param2_container.addClass("pi_extra");
        // Stat Input
        let stat_input = $("<div>");
        stat_input.addClass("stats");
        for (let stat of STATS) {
            let container = $("<div>");
            // Abreviation of the stat
            container.append($("<p>").text(stat.slice(0, 3)));
            // Add stat in class as identifier
            container.addClass(stat);
            // I need to add number parameter to this element
            container.append($("<input type='number' value='0'>"));
            stat_input.append(container);
        }
        // Save to DB buttons
        let buttons_ele = $("<div>");
        buttons_ele.addClass("flex_buttons");
        let offline_btn = $("<button>").text("Save Offline");
        let online_btn = $("<button>").text("Save Online");
        offline_btn.click(() => {
            let ponies = save_offline_pony(this.get_pony());
            let a = this.actions["save_offline"];
            if (a) {
                a();
            }
        });
        // ---- Button only visible if connected to db
        online_btn.addClass("db_hidden");
        if (!DB_CONNECTED) online_btn.addClass("hidden");
        // ----
        buttons_ele.append(offline_btn);
        buttons_ele.append(online_btn);
        // Details elements to go/append into the details container
        let details_elements = [];
        let inputs = EXTRA_INPUTS;
        for (let input_name of inputs) {
            let input_ele = $("<div>");
            input_ele.addClass(idify(input_name));
            input_ele.append($("<p>").text(input_name));
            input_ele.append($("<input>"));
            details_elements.push(input_ele);
        }
        // Sex select
        let sex_id = "Sex";
        let sex_cont = $("<div>").addClass(sex_id);
        sex_cont.append($("<p>").text(sex_id));
        let sex_select = $("<select>");
        for (let gender of PONYPARAMS[sex_id]) {
            sex_select.append($("<option>").text(gender));
        }
        sex_cont.append(sex_select);
        details_elements.push(sex_cont);

        details_elements = details_elements.concat([
            $("<h4>").text("Stat Modifiers"),
            stat_input
        ]);
        for (let ele of details_elements) {
            this.param2_container.append(ele);
        }
        
        // Move details button (toggles visibility of the more details container)
        let details_button = $("<button>").text("Show More");
        details_button.addClass("wide");
        let btn = details_button;
        let ctn = this.param2_container;
        // Toggle visibility of the details container on button press
        details_button.click(() => {
            if (ctn.hasClass("hidden")) {
                ctn.removeClass("hidden");
                btn.text("Show Less");
            } else {
                ctn.addClass("hidden");
                btn.text("Show More");
            }
        });
        // The base container for param2
        let param2_base = $("<div>");
        if (has_show_more_btn) {
            this.param2_container.addClass("hidden");
        } else {
            details_button.addClass("hidden");
        }
        param2_base.append(details_button);
        param2_base.append(this.param2_container);
        // ****   ****
        // Append containers in certain order
        if (has_show_more_btn) {
            this.element.append(this.species_select.element);
            this.element.append(this.param_container);
            param2_base.find(".pi_extra").append(buttons_ele);
            this.element.append(param2_base);
        } else {
            this.element.append(param2_base);
            this.element.append(this.species_select.element);
            this.element.append(this.param_container);
            this.element.append(buttons_ele);
        }

        // Refresh and reset the params
        this.reset_params();
    }

    get_species() {
        let arr = [];
        for (let ele of this.species_select.element.find(".Species")) arr.push(ele.value);
        return arr;
    }

    // Get's the Pony data from this Input, the reason this is simple
    // is because it doesn't need to get all the values for the breeding roller.
    get_pony_simple() {
        // ----- Make the keys for the Pony Object -----
        let keys = Object.keys(PONYPARAMS);
        let all_species = this.get_species();
        // Append species specific keys (i.e. parts)
        for (let species of all_species) keys = keys.concat(Object.keys(PONYPARAMS["Species"][species]));
        // Remove dupe keys
        keys = [...keys]
        // Combine the Palette Places into the keys
        // Default Palette Places
        keys = keys.concat(PONYPARAMS["Palette Place"]);
        // Species Palette Places
        for (let i in all_species) {
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
        for (let key of keys) pony[key] = get_select_values(this.element, "." + idify(key));
        return pony;
    }

    // Get the whole pony
    get_pony() {
        // Get initial Pony
        let pony = this.get_pony_simple()
        // Details Params
        // Init the stats object
        pony["Stat Mod"] = {}
        // for each param
        let details_params = STATS.concat(EXTRA_INPUTS);
        details_params.push("Sex");
        for (let d_param of details_params) {
            // Get the select or input of the id
            let jqry_base = "." + idify(d_param) + " ";
            // Jquery for finding the values of the select and input elements of the details paramters
            let full_jqry = jqry_base + "input, " + jqry_base + "select";
            let value = this.param2_container.find(full_jqry).val();
            // If it's a stat put it under the stats, just some orginization stuff.
            if (STATS.includes(d_param)) {
                pony["Stat Mod"][d_param] = value;
            } else {
                pony[d_param] = value;
            }
        }
        return pony;
    }

    import_pony(pony) {

        // Make the species an array if it's not, this lets me loop through
        // without having to worry it's a string and loop through each character.
        let s = pony["Species"];
        if (!Array.isArray(s)) s = [s];

        this.update_species_parameters(s);

        // Remove old select elements from the multi selects
        for (let select of this.select_multis) {
            select.remove_all_select();
            let param = pony[select.name];
            if (param) {
                for (let value of param) {
                    select.create_select(value);
                }
            }
        }

        // I have this object so I can edit values of the pony if nessesary
        let filtered_pony = {...pony}
        // Remove the species since that's already taken care of.
        delete filtered_pony["Species"];
        // Params
        let keys = Object.keys(filtered_pony);
        for (let key of keys) {
            let param = filtered_pony[key];
            let select = this.element.find("." + key);
            for (let element of select) {
                // If is not a select multi
                let is_multi = $(element).parent().parent().parent().hasClass("select_multi");
                 if (!is_multi) $(element).val(param);
            }
        }
        // Params 2
        let param_names = EXTRA_INPUTS.concat(STATS.concat(["Sex"]));
        for (let param_name of param_names) {
            // If the param exists
            let param = filtered_pony[param_name];
            // Change the param to the correct stats param if it's a stat
            if (STATS.includes(param_name)) {
                let stats = filtered_pony["Stat Mod"];
                if (stats) param = stats[param_name];
            }
            if (param) {
                // input or select element
                let jqry_base = "." + idify(param_name);
                // Change value of the param in the PonyInput
                this.param2_container.find(jqry_base + " input, " + jqry_base + " select").val(param);
            }
        }

    }

    update_species_parameters(species = null) {

        // If species are given, update the species element
        if (species) {
            this.species_select.remove_all_select();
            for (let value of species) {
                let sel = this.species_select.create_select().find("select")[0];
                sel.value = value;
            }
        }

        // Remove old parameters
        for (let child of this.param_container.children()) {
            child.remove();
        }

        // Get the params of all the species in the Pony
        let params = get_species_params(this.get_species());

        // Add palettes
        let pps = params["Palette Place"];
        let ps = params["Palette"];
        let palette_place_ele = $("<div>").html("<h4>Palettes</h4>");
        palette_place_ele.addClass("group");
        for (let i in pps) {
            let place = pps[i];
            // Create elements for each Palette Place
            let select = create_select_element(place, ps);
            let palette_container = $("<div>");
            palette_container.append($("<p>").text(place));
            palette_container.append(select);
            // palette_container.addClass("param");
            palette_place_ele.append(palette_container);
        }
        this.param_container.append(palette_place_ele);
        
        // Add parts input if nessesary.
        // Get any parts
        const parts = find_matches(Object.keys(params), ["[P]"]);
        // If there are any parts, make the elements for them.
        if (parts.length) {
            // Create a select for each part
            let parts_ele = $("<div>").html("<h4>Parts</h4>");
            parts_ele.addClass("group");
            for (const part of parts) parts_ele.append(create_titled_select_element(part, params[part]));
            this.param_container.append(parts_ele);
        }

        this.select_multis = [
            new SelectMulti("Trait", params.Trait),
            new SelectMulti("Markings", params.Markings),
            new SelectMulti("Mutation", params.Mutation)
        ];
        this.select_multis[0].create_select();
        this.select_multis[1].create_select();
        // Add each select_multi element to the container
        for (let select of this.select_multis) {
            this.param_container.append(select.element);
        }
    }

    // I use this in more than one place, I want easy access
    reset_params() {
        this.update_species_parameters([Object.keys(PONYPARAMS["Species"])[0]]);
    }
}

class SelectMulti {
    constructor(name, options, on_change = null) {
        this.name = name;
        this.options = clean_array(options);
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

    create_select(value = null) {
        let container = $("<div>");
        let select = create_select_element(this.name, this.options);
        // If there's a value, set the select to that value
        if (value) select.val(value);
        if (this.on_change) {
            select.change(() => this.on_change());
        }
        let remove_button = $("<button>").text("Remove");
        remove_button.addClass("red_button");
        // Remove this select on click
        remove_button.click((value) => {
            container.remove();
            if (this.on_change) this.on_change();
        });
        container.append(select);
        container.append(remove_button);
        this.select_container.append(container);
        return container;
    }

    remove_all_select() {
        this.select_container.children().remove();
    }
}

// The prefix for the Pony ID of the ID for the element
const ID_PREFIX = "Pony_";

// Pony database interface
class PonyDatabase {
    constructor(ponies = {}, actions = {}) {
        // Overall container
        this.element = $("<div>");
        this.element.addClass("pony_db clear_box");
        // Table for the ponies
        this.table = $("<div>");
        this.table.addClass("pony_table");
        this.element.append(this.table);
        // The data for the ponies
        this.ponies = ponies;
        // These are functions that will run when certain buttons are pressed
        this.actions = actions;
        // Update the table with this.ponies
        // this.update_ponies();
        // An array of the IDs selected
        this.selection = [];
        // The buttons to control the database
        this.buttons = $("<div>");
        this.buttons.addClass("flex_buttons");
        // Select
        let select_b = $("<button>").text("Load");
        select_b.addClass("select");
        select_b.click(() => {
            let a = this.actions["select"];
            if (a) a(this.get_ponies_by_ids());
        });
        // Edit
        let edit_b = $("<button>").text("Edit");
        // I use this class to hide the button under certain conditions
        edit_b.addClass("edit");
        edit_b.click(() => {
            this.edit_pony(this.selection[0]);
        });
        // Delete
        let delete_b = $("<button>").text("Delete");
        delete_b.addClass("red_button");
        delete_b.click(() => {
            this.delete_ids();
        });
        // Save Online
        let save_on_b = $("<button>").text("Save Online");
        save_on_b.addClass("db_hidden");
        if (!DB_CONNECTED) {
            save_on_b.addClass("hidden");
        }
        save_on_b.click(() => {
            let a = this.actions["save_online"];
            if (a) a(this.get_ponies_by_ids());
        });
        // Save Offline
        let save_off_b = $("<button>").text("Save Offline");
        save_off_b.click(() => {
            for (let pony_id of this.selection) {
                save_offline_pony(this.ponies[pony_id]);
            }
        });
        // New Pony
        let new_b = $("<button>").text("New Pony");
        new_b.addClass("wide");
        new_b.click(() => {
            this.edit_pony();
        });
        // Append Buttons
        for (let button of [select_b, edit_b, delete_b, save_on_b, save_off_b]) {
            this.buttons.append(button);
        }
        this.element.append(this.buttons);
        this.element.append(new_b);
        // I select nothing here to update some appearances of buttons
        this.select_ids();
    }

    update_ponies() {
        // Remove selection
        this.select_ids();
        let a = this.actions["update_ponies"];
        if (a) a();
        // Clear the table
        this.table.empty();
        // ---- Make titles for each row
        let titles_container = $("<div>");
        let titles = ["ID", "Name", "Owner", "Species", "Ref"];
        for (let title of titles) {
            let ele = $("<div>").text(title);
            titles_container.append(ele);
        }
        this.table.append(titles_container);
        for (let key of Object.keys(this.ponies)) {
            let pony = this.ponies[key];
            let item = this.create_table_item(pony);
            this.table.append(item);
        }
        // ----
    }

    create_table_item(params = {}) {
        // Init item
        let item = $("<div>");
        /* ID, Name, Owner, Species, Link, Offline */
        let elements = {
            "Pony ID" : $("<p>"),
            "Pony Name" : $("<p>"),
            "Owner" : $("<p>"),
            "Species" : $("<p>"),
            "Ref Link" : $("<a target='_blank'>")
            // "Offline" : $("<input type='checkbox'>")
        }
        // Iterate through each text element
        for (let key of Object.keys(elements)) {
            let value = params[key];
            // If the params have the key for the element set the param value
            let element = elements[key];
            if (value) {
                switch(element[0].tagName) {
                    case "P":
                        element.text(value);
                        break;
                    case "A":
                        element.text("Ref");
                        // Set the link
                        element.attr("href", value)
                        break;
                    case "INPUT":
                        // Set checkbox value
                        element.prop("checked", value);
                        // No changing checkbox value
                        element.prop("disabled", true); // NOT WORKING
                        break;
                }
            }
            // Append the part of the item to the item
            item.append(element);
        }
        item.click(() => {
            this.select_ids([params["Pony ID"]]);
        });
        // Add class as pony_(id) to the element
        item.addClass(ID_PREFIX + params["Pony ID"]);
        // return the item
        return item;
    }

    select_ids(ids = []) {
        // Remove old selections
        for (let id of this.selection) {
            let element = this.get_id_element(id);
            element.removeClass("selected");
            this.selection = this.selection.filter(val => {
                return val !== id;
            });
        }
        // Activate selection on selected elements
        for (let id of ids) {
            let element = this.get_id_element(id);
            element.addClass("selected");
            this.selection = this.selection.concat([id]);
        }
        // Set visibilty of buttons base on what's selected
        let sel_amm = this.selection.length;
        let edit_b = this.buttons.find(".edit");
        let select_b = this.buttons.find(".select");
        // If at least one item is selected
        if (sel_amm === 1) {
            // If select has a function in the database, then allow it to be visible
            if (this.actions["select"]) {
                select_b.removeClass("hidden");
            }
            edit_b.removeClass("hidden");
        } else {
            select_b.addClass("hidden");
            edit_b.addClass("hidden");
        }
        // If one or more are selected
        if (sel_amm >= 1) {
            // Let the buttons be visible
            this.buttons.removeClass("hidden");
        }
        // If none are selected
        else {
            // Hide buttons
            this.buttons.addClass("hidden");
        }
    }

    get_id_element(id) {
        return this.table.find("." + ID_PREFIX + id);
    }

    // Get some ponies by id, this is mainly for ponies that are selected
    get_ponies_by_ids(ids = this.selection) {
        let ponies = [];
        for (let id of ids) {
            let pony = this.ponies[id];
            // If the pony exists
            if (pony) {
                ponies.push(pony);
            } else {
                console.log("Error: Pony ID " + id + " doesn't exist in this PonyDatabase.")
            }
        }
        return ponies;
    }

    // Make PonyInput element and some more buttons to edit a pony
    edit_pony(id) {
        // Get Pony
        let pony;
        let title = "Adding new pony";
        // This sets up the pony data if there's an ID, if there isn't it'll assume you're adding a pony
        if (id) {
            pony = this.ponies[id];
            title = "Editing " + id;
        }
        // Make Pony input
        let db = this;
        let pi = new PonyInput(title, false, false, {
            "save_offline" : function() {
                db.update_ponies();
            }
        });

        // Fullscrene element to cover the whole screne
        create_popup_element(pi.element);

        // Update the element to match the pony's parameters IF we are editing a pony
        if (pony) pi.import_pony(pony);
    }

    // Remove ids and run delete action
    delete_ids(ids = this.selection) {
        // Deletion alert
        if (!confirm("Are you sure you would like to delete these ponies?")) return;
        // Remove ponies with matching ids as the ones to remove
        for (let id of ids) {
            if (Object.keys(this.ponies).includes(id)) {
                // Delete pony from the ponies
                delete this.ponies[id];
                // Remove the element
                this.get_id_element(id).remove();
                // Update the selection to be none
                this.select_ids();
            }
        }
        // Run action if exists
        let a = this.actions["delete"];
        if (a) {
            a(ids);
        }
    }

}