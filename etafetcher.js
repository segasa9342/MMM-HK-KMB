/* Magic Mirror
 * Node Helper: MMM-HK-KMB - ETAFetcher
 *
 * By Winston / https://github.com/winstonma
 * AGPL-3.0 Licensed.
 */

const Log = require("../../js/logger.js");
const Kmb = require('js-kmb-api').default;

/**
 * Responsible for requesting an update on the set interval and broadcasting the data.
 *
 * @param {string} stop stop object
 * @param {number} reloadInterval Reload interval in milliseconds.
 * @class
 */
const ETAFetcher = function (stop, reloadInterval) {
  const self = this;

  let reloadTimer = null;
  let item = null;
  const kmb = new Kmb;

  let fetchFailedCallback = function () { };
  let itemsReceivedCallback = function () { };

  if (reloadInterval < 1000) {
    reloadInterval = 1000;
  }

  /* private methods */

  /**
   * Request the ETA
   */
  const fetchETA = function () {
    clearTimeout(reloadTimer);
    reloadTimer = null;
    item = [];

    stop.getEtas()
      .then(data => {
        item = data;
        self.broadcastItems();
        scheduleTimer();
      })
      .catch(error => {
        fetchFailedCallback(self, error);
        scheduleTimer();
      })
  };

  /**
   * Schedule the timer for the next update.
   */
  const scheduleTimer = function () {
    clearTimeout(reloadTimer);
    reloadTimer = setTimeout(function () {
      fetchETA();
    }, reloadInterval);
  };

  /* public methods */

  /**
   * Clear the existing timer
   */
  this.clearTimer = function () {
    clearTimeout(reloadTimer);
    reloadTimer = null;
  }

  /**
   * Update the reload interval, but only if we need to increase the speed.
   *
   * @param {number} interval Interval for the update in milliseconds.
   */
  this.setReloadInterval = function (interval) {
    if (interval > 1000 && interval < reloadInterval) {
      reloadInterval = interval;
    }
  };

  /**
   * Initiate fetchETA();
   */
  this.startFetch = function () {
    fetchETA();
  };

  /**
   * Broadcast the existing item.
   */
  this.broadcastItems = function () {
    if (item.length <= 0) {
      Log.info(`ETA-Fetcher: No item for route ${stop.variant.route.number}`);
      return;
    }
    Log.info(`ETA-Fetcher: Broadcasting item for route ${stop.variant.route.number}`);
    itemsReceivedCallback(self);
  };

  this.onReceive = function (callback) {
    itemsReceivedCallback = callback;
  };

  this.onError = function (callback) {
    fetchFailedCallback = callback;
  };

  this.route = function () {
    return stopInfo.Route;
  }

  this.items = function () {
    return item;
  };
};

module.exports = ETAFetcher;
