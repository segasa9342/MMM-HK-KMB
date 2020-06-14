/* Magic Mirror
 * Module: MMM-HK-KMB
 *
 * By Winston / https://github.com/winstonma
 * MIT Licensed.
 */

const got = require('got');
const querystring = require('querystring');

const etaUrl = "http://etav3.kmb.hk/?"

/* ETAFetcher

 * Responsible for requesting an update on the set interval and broadcasting the data.
 *
 * attribute url string - URL of the news feed.
 * attribute reloadInterval number - Reload interval in milliseconds.
 */

var ETAFetcher = function (stopInfo, reloadInterval) {
  var self = this;
  reloadInterval = (reloadInterval < 1000) ? 1000 : reloadInterval;

  var reloadTimer = null;
  var items = [];

  var fetchFailedCallback = function () { };
  var itemsReceivedCallback = function () { };

  // Generate Url
  const parseQueryString = {
    action: "geteta",
    lang: "tc",
    route: stopInfo.Route,
    bound: stopInfo.Bound,
    stop: stopInfo.BSICode,
    stop_seq: stopInfo.Seq
  };
  const url = etaUrl + querystring.stringify(parseQueryString);

  /* private methods */

	/* fetchETA()
	 * Request the ETA.
	 */
  var fetchETA = function () {
    clearTimeout(reloadTimer);
    reloadTimer = null;
    items = [];

    (async () => {
      try {
        const { body } = await got(url, {
          responseType: 'json'
        });
        body.stopInfo = stopInfo;
        items.push(body);
        self.broadcastItems();
        scheduleTimer();
      } catch (error) {
        console.log(error);
        fetchFailedCallback(self, error);
        scheduleTimer();
      }
    })();
  };

	/* scheduleTimer()
	 * Schedule the timer for the next update.
	 */
  var scheduleTimer = function () {
    //console.log('Schedule update timer.');
    clearTimeout(reloadTimer);
    reloadTimer = setTimeout(function () {
      fetchETA();
    }, reloadInterval);
  };

  /* public methods */

	/* setReloadInterval()
	 * Update the reload interval, but only if we need to increase the speed.
	 *
	 * attribute interval number - Interval for the update in milliseconds.
	 */
  this.setReloadInterval = function (interval) {
    if (interval > 1000 && interval < reloadInterval) {
      reloadInterval = interval;
    }
  };

	/* startFetch()
	 * Initiate fetchETA();
	 */
  this.startFetch = function () {
    fetchETA();
  };

	/* broadcastItems()
	 * Broadcast the existing items.
	 */
  this.broadcastItems = function () {
    if (items.length <= 0) {
      //console.log('No items to broadcast yet.');
      return;
    }
    //console.log('Broadcasting ' + items.length + ' items.');
    itemsReceivedCallback(self);
  };

  this.onReceive = function (callback) {
    itemsReceivedCallback = callback;
  };

  this.onError = function (callback) {
    fetchFailedCallback = callback;
  };

  this.url = function () {
    return url;
  };

  this.route = function () {
    return stopInfo.Route;
  }

  this.items = function () {
    return items[0];
  };
};

module.exports = ETAFetcher;
