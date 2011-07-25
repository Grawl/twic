/**
 * OAuth Request
 *
 * Kalashnikov Igor <igor.kalashnikov@gmail.com>
 * Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported
 */

/**
 * @constructor
 * @extends twic.HTTPRequest
 * @param {string} method Method (GET, POST)
 * @param {string} url Url
 */
twic.OAuthRequest = function(method, url) {
	this.OAuthData = {};

	// call the parent constructor
	twic.HTTPRequest.call(this, method, url);
};

/**
 * Offset to correct the timestamp property
 * @type {number}
 */
twic.OAuthRequest.timestampOffset = 0;

goog.inherits(twic.OAuthRequest, twic.HTTPRequest);

/**
 * Set request service POST data
 * @param {string} key Key
 * @param {string|number} value Value
 */
twic.OAuthRequest.prototype.setOAuthData = function(key, value) {
	this.OAuthData[key] = value;
};

/**
 * Get all the data
 * @override
 * @return {Array.<string>}
 */
twic.OAuthRequest.prototype.getData = function() {
	var
		self = this,
		data = twic.HTTPRequest.prototype.getData.call(self),
		key = '';

	for (key in self.OAuthData) {
		data.push(self.encodeString(key) + '=' + self.encodeString(self.OAuthData[key]));
	}

	return data;
};

/**
 * Get the random OAuth nonce
 * @return {string}
 */
twic.OAuthRequest.prototype.getNonce = function() {
	var
		/**
		 * Nonce charset for random string
		 * @const
		 */
		nonce_chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz',
		result = '',
		i;

	for (i = 0; i < 6; ++i) {
		result += nonce_chars[Math.floor(Math.random() * nonce_chars.length)];
	}

	return result;
};

/**
 * Sign the request
 * @param {string=} token OAuth token
 * @param {string=} token_secret OAuth token secret
 */
twic.OAuthRequest.prototype.sign = function(token, token_secret) {
	var
		self = this,
		baseString = self.method + '&' + self.encodeString(self.url) + '&';

	if (self.method !== 'GET') {
		self.setHeader('Content-Type', 'application/x-www-form-urlencoded');
	}

	self.setOAuthData('oauth_consumer_key', twic.consumer_key);
	self.setOAuthData('oauth_signature_method', 'HMAC-SHA1');
	self.setOAuthData('oauth_version', '1.0');
	self.setOAuthData('oauth_timestamp', Math.floor(((new Date()).getTime() + twic.OAuthRequest.timestampOffset) / 1000));
	self.setOAuthData('oauth_nonce', self.getNonce());

	if (token) {
		self.setOAuthData('oauth_token', token);
	}

	// tis important to sort params
	baseString += self.encodeString(self.getData().sort().join('&'));

	self.setOAuthData('oauth_signature',
		SHA1.encode(
			self.encodeString(twic.consumer_secret) + '&' + (token_secret ? self.encodeString(token_secret) : ''),
			baseString
		)
	);
};

/**
 * Send the request
 * @override
 * @param {function(?twic.ResponseError, ?XMLHttpRequest)} callback Callback
 * @param {string=} token OAuth token
 * @param {string=} token_secret OAuth token secret
 */
twic.OAuthRequest.prototype.send = function(callback, token, token_secret) {
	var
		isRetry = false,
		self = this;

	var checkTimestamp = function(req) {
		var
			i,
			checkHeader,
			newOffset,
			remoteDate,
			checkFields = ['Last-Modified', 'Date'];

		for (i = 0; i < checkFields.length; ++i) {
			checkHeader = req.getResponseHeader(checkFields[i]);

			if (
				checkHeader
				&& !goog.isString(checkHeader)
			) {
				remoteDate = Date.parse(checkHeader);

				if (remoteDate) {
					newOffset = remoteDate - (new Date()).getTime();

					if (twic.OAuthRequest.timestampOffset !== newOffset) {
						if (Math.abs(newOffset - twic.OAuthRequest.timestampOffset) > 5000) {
							twic.debug.log('OAuth timestamp offset is now ' + newOffset + 'ms');
						}

						twic.OAuthRequest.timestampOffset = newOffset;

						return true;
					}
				}
			}
		}

		return false;
	};

	var sendRequest = function() {
		if (
			token
			&& token_secret
		) {
			self.sign(token, token_secret);
		} else {
			self.sign();
		}

		// parent sender with own callback checker
		twic.HTTPRequest.prototype.send.call(self, function(error, req) {
			if (
				error
				&& twic.ResponseError.UNAUTHORIZED === error.code
				&& !isRetry
				&& checkTimestamp(error.request)
			) {
				isRetry = true;

				// !!! WARNING !!!
				delete self.OAuthData['oauth_signature'];
				sendRequest();
			} else {
				callback(error, req);
			}
		} );
	};

	sendRequest();
};
