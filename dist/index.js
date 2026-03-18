'use strict';

var fs = require('fs');
var https = require('https');
var path = require('path');
var teams_apps = require('@microsoft/teams.apps');
var logging = require('@microsoft/teams.common/logging');
var teams_dev = require('@microsoft/teams.dev');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var fs__default = /*#__PURE__*/_interopDefault(fs);
var https__default = /*#__PURE__*/_interopDefault(https);
var path__default = /*#__PURE__*/_interopDefault(path);

const sslOptions = {
  key: process.env.SSL_KEY_FILE ? fs__default.default.readFileSync(process.env.SSL_KEY_FILE) : void 0,
  cert: process.env.SSL_CRT_FILE ? fs__default.default.readFileSync(process.env.SSL_CRT_FILE) : void 0
};
const plugins = [new teams_dev.DevtoolsPlugin()];
if (sslOptions.cert && sslOptions.key) {
  plugins.push(new teams_apps.HttpPlugin(https__default.default.createServer(sslOptions)));
}
const app = new teams_apps.App({
  logger: new logging.ConsoleLogger("tab", { level: "debug" }),
  plugins
});
app.tab("home", path__default.default.join(__dirname, "./client"));
(async () => {
  await app.start(+(process.env.PORT || 3978));
})();
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map