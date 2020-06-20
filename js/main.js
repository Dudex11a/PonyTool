
function BodyLoad() {
    
}

function Test() {
    console.log(roll_pony());
}

function roll_pony() {
    let pony = {}
    pony.sex = random_in_array(PONYINFO.sex)
    pony.species = random_in_array(PONYINFO.species)
    pony.body = random_in_array(PONYINFO.palette)
    pony.haircolor = random_in_array(PONYINFO.palette)
    pony.haircolor2 = random_in_array(PONYINFO.palette)
    pony.markingcolor = random_in_array(PONYINFO.palette)
    pony.markingcolor2 = random_in_array(PONYINFO.palette)
    pony.trait = random_in_array(PONYINFO.trait)

    pony.markings = random_in_array(PONYINFO.marking)
    pony.mutations = random_in_array(PONYINFO.palette)
    return pony
}

function random_in_array(array, exceptions = []) {
    $(exceptions).each((index, exception) => {
        // Filter the exceptions out of the array
        array = array.filter(item => item != exception)
    })
    let item = array[Math.floor(Math.random()*array.length)]
    return item
}