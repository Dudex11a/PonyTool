const fetch = require('node-fetch');

exports.handler = async function(event, context, callback) {

    // Github Commits
    const token = process.env.littleponytails_github;
    const headers = {
        // "Authorization" : "Basic " + btoa("LittlePonyTales:" + token)
        "Authorization" : "Token " + token
    }
    const url = "https://api.github.com/repos/Dudex11c/PonyTool/commits";
    const response = await fetch(url, {
        "method" : "GET",
        "headers": headers
    });
    commits = await response.json();
    return {
        statusCode: 200,
        body: JSON.stringify(commits)
    };
};