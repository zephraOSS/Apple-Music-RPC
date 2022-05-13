if (appData.get("zephra.userId")) {
    fetch("https://api.zephra.cloud/checkUser", {
        headers: {
            "userid": appData.get("zephra.userId")
        }
    }, function (error, meta, body) {
        if (!body || error) return console.log(`Error ${error}. Can't access zephra API`);

        if (meta.responseHeaders.checkuser.length > 0) logSuccess("API", "Found zephra user");
        else logError("API", "Couldn't find zephra user");

        appData.set("zephra.userAuth", (meta.responseHeaders.checkuser.length > 0));
        appData.set("zephra.lastAuth", +new Date());
    });

    // fetch("https://api.zephra.cloud/getUser", {
    //     headers: {
    //         "authorization": "s2EclohmdwU-zDAVOR8Zr!PB6y9IkS",
    //         "appid": 46028040
    //     }
    // }, function (error, meta, body) {
    //     if (!body || error) return console.log(`Error ${error}. Can't access zephra API`);
    //     body = JSON.parse(body.toString());

    //     console.log("AUTH BODY", body);
    // });
}