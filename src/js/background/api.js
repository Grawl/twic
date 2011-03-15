/**
 * Kalashnikov Igor <igor.kalashnikov@gmail.com>
 * Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported
 */

/**
 * Something to work with Twitter API
 */
twic.api = ( function() {

	var
		/**
		 * @const
		 * @type {string}
		 */
		baseUrl = 'https://api.twitter.com/1/',
		/**
		 * @const
		 * @type {string}
		 */
		authUrl = 'https://twitter.com/oauth/',
		/**
		 * @type {boolean|number}
		 */
		ratelimit_remains = false,
		/**
		 * @type {boolean|number}
		 */
		ratelimit_reset = false,
		/**
		 * @type {boolean|string}
		 */
		oauth_token = false,
		/**
		 * @type {boolean|string}
		 */
		oauth_token_secret = false;

	/**
	 * Get the request limit values from request response headers
	 * @param {XMLHttpRequest} req
	 */
	var parseGlobalLimit = function(req) {
		var
			tmpRemains = req.getResponseHeader('X-RateLimit-Remaining'),
			tmpReset   = req.getResponseHeader('X-RateLimit-Reset');

		if (tmpRemains && tmpReset) {
			ratelimit_remains = tmpRemains;
			ratelimit_reset   = tmpReset;

			twic.debug.info('Ratelimit', ratelimit_remains, ratelimit_reset);
		}
	};

	/**
	 * Reset the request token after auth
	 */
	var resetToken = function() {
		oauth_token = false;
		oauth_token_secret = false;
	};

	/**
	 * Get the app request token
	 * @param {function(string, string)} callback Callback function
	 */
	var getRequestToken = function(callback) {
		if (oauth_token) {
			callback(oauth_token, oauth_token_secret);
			return;
		}

		var req = new twic.OAuthRequest('POST', authUrl + 'request_token');
		req.sign();

		req.send( function(r) {
			var obj = twic.Request.queryStringToObject(r.responseText);

			oauth_token        = obj['oauth_token'];
			oauth_token_secret = obj['oauth_token_secret'];

			callback(oauth_token, oauth_token_secret);
		} );
	};

	/**
	 * Get the user access token
	 * @param {string} pin Pin code
	 * @param {function(Object)} callback Callback function
	 */
	var getAccessToken = function(pin, callback) {
		var req = new twic.OAuthRequest('POST', authUrl + 'access_token');
		req.setData('oauth_verifier', pin);

		getRequestToken( function(token, secret) {
			req.sign(token, secret);

			req.send( function(data) {
				callback(twic.Request.queryStringToObject(data.responseText));
			} );
		} );
	};

	/**
	 * Open the new tab with user request to confirm the access
	 * @param {string} token OAuth token
	 */
	var tryGrantAccess = function(token) {
		chrome.tabs.create( {
			'url': 'https://api.twitter.com/oauth/authorize?oauth_token=' + token
		} );
	};

	/**
	 * Get the user info
	 * @param {number|string} id User identifier or screen name
	 * @param {function()} callback Callback function
	 */
	var getUserInfo = function(id, callback) {
		var req = new twic.Request('GET', baseUrl + 'users/show/' + id + '.json');
		req.send( function(data) {
			parseGlobalLimit(data);

			var obj = JSON.parse(data.responseText);

			if (obj) {
				callback(obj);
			}
		} );
	};

	/**
	 * Get user timeline
	 * @param {number} id User identifier
	 * @param {boolean|number} since_id Since id
	 * @param {string} token OAuth token
	 * @param {string} token_secret OAuth token secret
	 * @param {function(Array.<Object>)} callback Callback function
	 */
	var homeTimeline = function(id, since_id, token, token_secret, callback) {
		var req = new twic.OAuthRequest('GET', baseUrl + 'statuses/home_timeline/' + id + '.json');

		if (since_id) {
			req.setData('since_id', since_id);
		}

		req.sign(token, token_secret);

		twic.debug.info('updating home time line for ' + id + (since_id ? ' since id ' + since_id : ''));

		req.send( function(obj) {
			var data = JSON.parse(obj.responseText);

			if (
				data
				&& callback
			) {
				callback(data);
			}
		} );
	};

	/**
	 * Update user status
	 * @param {string} status New user status
	 * @param {string} token OAuth token
	 * @param {string} token_secret OAuth token secret
	 * @param {function(Array.<Object>)} callback Callback function
	 */
	var updateStatus = function(status, token, token_secret, callback) {
		var req = new twic.OAuthRequest('POST', baseUrl + 'statuses/update.json');

		req.setData('status', status);

		// do not request additional user info cause it is about us
		req.setData('trim_user', 1);

		req.sign(token, token_secret);

		twic.debug.info('sending the new tweet: ' + status);

		req.send( function(r) {
			var data = JSON.parse(r.responseText);

			if (
				data
				&& callback
			) {
				callback(data);
			}
		} );
	};

	// todo reorder, rename and comment
	return {
		getRequestToken: getRequestToken,
		resetToken: resetToken,
		tryGrantAccess: tryGrantAccess,
		getAccessToken: getAccessToken,
		getUserInfo: getUserInfo,
		homeTimeline: homeTimeline,
		updateStatus: updateStatus
	};

}() );
