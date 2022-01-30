const { app } = require("electron");

const functions = {
    bounce(type = "informational") {
        if (process.platform !== "darwin") return false;
    
        if (!app.dock.isVisible()) app.dock.show();
    
        return app.dock.bounce(type);
    }
};

module.exports = functions;
