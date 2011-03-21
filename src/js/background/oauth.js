/**
 * Kalashnikov Igor <igor.kalashnikov@gmail.com>
 * Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported
 */

/**
 * @constructor
 * @extends twic.Request
 * @param {string} method Method (GET, POST)
 * @param {string} url Url
 */
twic.OAuthRequest = function(method, url) {
	// call the parent constructor
	twic.Request.call(this, method, url);
};

goog.inherits(twic.OAuthRequest, twic.Request);

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
 * @param {string} token OAuth token
 * @param {string} token_secret OAuth token secret
 */
twic.OAuthRequest.prototype.sign = function(token, token_secret) {
	var
		baseString = this.method + '&' + this.encodeString(this.url) + '&',
		params = [],
		key;

	if (this.method !== 'GET') {
		this.setHeader('Content-Type', 'application/x-www-form-urlencoded');
	}

	this.setRequestData('oauth_consumer_key', twic.consumer_key);
	this.setRequestData('oauth_signature_method', 'HMAC-SHA1');
	this.setRequestData('oauth_version', '1.0');
	this.setRequestData('oauth_timestamp', twic.utils.date.getCurrentTimestamp());
	this.setRequestData('oauth_nonce', this.getNonce());

	if (token) {
		this.setRequestData('oauth_token', token);
	}

	// encode the data
	for (key in this.data) {
		params.push(this.encodeString(key) + '=' + this.encodeString(this.data[key]));
	}

	// tis important to sort params
	baseString += this.encodeString(params.sort().join('&'));

	this.setRequestData('oauth_signature',
		SHA1.encode(
			this.encodeString(twic.consumer_secret) + '&' + (token_secret ? this.encodeString(token_secret) : ''),
			baseString
		)
	);
};
