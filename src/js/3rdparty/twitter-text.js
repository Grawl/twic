/**
* Modified Twitter Text (original https://github.com/twitter/twitter-text-js)
*/

twic.text = { };

twic.text.expr = { };

/**
 * Initialized
 * @private
 */
twic.text._initialized = false;

/**
 * @const
 */
twic.text.HTML_ENTITIES = {
	'&': '&amp;',
	'>': '&gt;',
	'<': '&lt;',
	'"': '&quot;',
	"'": '&#39;'
};

/**
 * Characters not allowed in Tweets
 * @const
 */
twic.text.INVALID_CHARACTERS = [
	// BOM
	String.fromCharCode(0xFFFE),
	String.fromCharCode(0xFEFF),

	// Special
	String.fromCharCode(0xFFFF),

	// Directional Change
	String.fromCharCode(0x202A),
	String.fromCharCode(0x202B),
	String.fromCharCode(0x202C),
	String.fromCharCode(0x202D),
	String.fromCharCode(0x202E)
];

/**
 * Builds a RegExp
 * @param {RegExp|string} regex
 * @param {string=} flags
 * @private
 */
twic.text._regexSupplant = function(regex, flags) {
	flags = flags || '';

	if (!goog.isString(regex)) {
		if (regex.global && flags.indexOf("g") < 0) {
			flags += "g";
		}

		if (regex.ignoreCase && flags.indexOf("i") < 0) {
			flags += "i";
		}

		if (regex.multiline && flags.indexOf("m") < 0) {
			flags += "m";
		}

		regex = regex.source;
	}

	return new RegExp(regex.replace(/#\{(\w+)\}/g, function(match, name) {
		var newRegex = twic.text.expr[name] || "";

		if (!goog.isString(newRegex)) {
			newRegex = newRegex.source;
		}

		return newRegex;
	}), flags);
};

/**
 * Simple string interpolation
 * @private
 */
twic.text._stringSupplant = function(str, values) {
	return str.replace(/#\{(\w+)\}/g, function(match, name) {
		return values[name] || '';
	} );
};

/**
 * @private
 * @param charClass
 * @param start
 * @param end
 */
twic.text._addCharsToCharClass = function(charClass, start, end) {
	var s = String.fromCharCode(start);

	if (end !== start) {
		s += "-" + String.fromCharCode(end);
	}

	charClass.push(s);

	return charClass;
};

twic.text._initialize = function() {
	if (twic.text._initialized) {
		return true;
	}

	/**
	 * Space is more than %20, U+3000 for example is the full-width space used with Kanji. Provide a short-hand
	 * to access both the list of characters and a pattern suitible for use with String#split
	 * Taken from: ActiveSupport::Multibyte::Handlers::UTF8Handler::UNICODE_WHITESPACE
	 */
	var unicode_spaces = [
		String.fromCharCode(0x0020), // White_Space # Zs       SPACE
		String.fromCharCode(0x0085), // White_Space # Cc       <control-0085>
		String.fromCharCode(0x00A0), // White_Space # Zs       NO-BREAK SPACE
		String.fromCharCode(0x1680), // White_Space # Zs       OGHAM SPACE MARK
		String.fromCharCode(0x180E), // White_Space # Zs       MONGOLIAN VOWEL SEPARATOR
		String.fromCharCode(0x2028), // White_Space # Zl       LINE SEPARATOR
		String.fromCharCode(0x2029), // White_Space # Zp       PARAGRAPH SEPARATOR
		String.fromCharCode(0x202F), // White_Space # Zs       NARROW NO-BREAK SPACE
		String.fromCharCode(0x205F), // White_Space # Zs       MEDIUM MATHEMATICAL SPACE
		String.fromCharCode(0x3000)  // White_Space # Zs       IDEOGRAPHIC SPACE
	];

	var nonLatinHashtagChars = [];

	// White_Space # Cc   [5] <control-0009>..<control-000D>
	twic.text._addCharsToCharClass(unicode_spaces, 0x009, 0x00D);
	// White_Space # Zs  [11] EN QUAD..HAIR SPACE
	twic.text._addCharsToCharClass(unicode_spaces, 0x2000, 0x200A);

	twic.text.expr['spaces_group'] = twic.text._regexSupplant(unicode_spaces.join(""));
	twic.text.expr['spaces'] = twic.text._regexSupplant("[" + unicode_spaces.join("") + "]");
	twic.text.expr['punct'] = /\!'#%&'\(\)*\+,\\\-\.\/:;<=>\?@\[\]\^_{|}~/;
	twic.text.expr['atSigns'] = /[@＠]/;
	twic.text.expr['extractMentions'] = twic.text._regexSupplant(/(^|[^a-zA-Z0-9_])(#{atSigns})([a-zA-Z0-9_]{1,20})(?=(.|$))/g);

	// Cyrillic
	twic.text._addCharsToCharClass(nonLatinHashtagChars, 0x0400, 0x04ff); // Cyrillic
	twic.text._addCharsToCharClass(nonLatinHashtagChars, 0x0500, 0x0527); // Cyrillic Supplement
	twic.text._addCharsToCharClass(nonLatinHashtagChars, 0x2de0, 0x2dff); // Cyrillic Extended A
	twic.text._addCharsToCharClass(nonLatinHashtagChars, 0xa640, 0xa69f); // Cyrillic Extended B
	// Hangul (Korean)
	twic.text._addCharsToCharClass(nonLatinHashtagChars, 0x1100, 0x11ff); // Hangul Jamo
	twic.text._addCharsToCharClass(nonLatinHashtagChars, 0x3130, 0x3185); // Hangul Compatibility Jamo
	twic.text._addCharsToCharClass(nonLatinHashtagChars, 0xA960, 0xA97F); // Hangul Jamo Extended-A
	twic.text._addCharsToCharClass(nonLatinHashtagChars, 0xAC00, 0xD7AF); // Hangul Syllables
	twic.text._addCharsToCharClass(nonLatinHashtagChars, 0xD7B0, 0xD7FF); // Hangul Jamo Extended-B
	twic.text._addCharsToCharClass(nonLatinHashtagChars, 0xFFA1, 0xFFDC); // half-width Hangul
	// Japanese and Chinese
	twic.text._addCharsToCharClass(nonLatinHashtagChars, 0x30A1, 0x30FA); // Katakana (full-width)
	twic.text._addCharsToCharClass(nonLatinHashtagChars, 0x30FC, 0x30FE); // Katakana Chouon and iteration marks (full-width)
	twic.text._addCharsToCharClass(nonLatinHashtagChars, 0xFF66, 0xFF9F); // Katakana (half-width)
	twic.text._addCharsToCharClass(nonLatinHashtagChars, 0xFF70, 0xFF70); // Katakana Chouon (half-width)
	twic.text._addCharsToCharClass(nonLatinHashtagChars, 0xFF10, 0xFF19); // \
	twic.text._addCharsToCharClass(nonLatinHashtagChars, 0xFF21, 0xFF3A); //  - Latin (full-width)
	twic.text._addCharsToCharClass(nonLatinHashtagChars, 0xFF41, 0xFF5A); // /
	twic.text._addCharsToCharClass(nonLatinHashtagChars, 0x3041, 0x3096); // Hiragana
	twic.text._addCharsToCharClass(nonLatinHashtagChars, 0x3099, 0x309E); // Hiragana voicing and iteration mark
	twic.text._addCharsToCharClass(nonLatinHashtagChars, 0x3400, 0x4DBF); // Kanji (CJK Extension A)
	twic.text._addCharsToCharClass(nonLatinHashtagChars, 0x4E00, 0x9FFF); // Kanji (Unified)
	twic.text._addCharsToCharClass(nonLatinHashtagChars, 0x2A700, 0x2B73F); // Kanji (CJK Extension C)
	twic.text._addCharsToCharClass(nonLatinHashtagChars, 0x2B740, 0x2B81F); // Kanji (CJK Extension D)
	twic.text._addCharsToCharClass(nonLatinHashtagChars, 0x2F800, 0x2FA1F); // Kanji (CJK supplement)
	twic.text._addCharsToCharClass(nonLatinHashtagChars, 0x3005, 0x3005); // Kanji iteration mark
	twic.text._addCharsToCharClass(nonLatinHashtagChars, 0x303B, 0x303B); // Han iteration mark

	twic.text.expr['nonLatinHashtagChars'] = twic.text._regexSupplant(nonLatinHashtagChars.join(""));
	// Latin accented characters (subtracted 0xD7 from the range, it's a confusable multiplication sign. Looks like "x")
	twic.text.expr['latinAccentChars'] = twic.text._regexSupplant("ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþş\\303\\277");

	twic.text.expr['endScreenNameMatch'] = twic.text._regexSupplant(/^(?:#{atSigns}|[#{latinAccentChars}]|:\/\/)/);

	// A hashtag must contain characters, numbers and underscores, but not all numbers.
	twic.text.expr['hashtagBoundary'] = twic.text._regexSupplant(/(?:^|$|#{spaces}|「|」|。|、|\.|!|！|\?|？|,)/);
	twic.text.expr['hashtagAlpha'] = twic.text._regexSupplant(/[a-z_#{latinAccentChars}#{nonLatinHashtagChars}]/i);
	twic.text.expr['hashtagAlphaNumeric'] = twic.text._regexSupplant(/[a-z0-9_#{latinAccentChars}#{nonLatinHashtagChars}]/i);
	twic.text.expr['extractHash'] = twic.text._regexSupplant(/(#{hashtagBoundary})(#|＃)(#{hashtagAlphaNumeric}*#{hashtagAlpha}#{hashtagAlphaNumeric}*)/gi);

	// URL related hash regex collection
	twic.text.expr['invalidDomainChars'] = twic.text._stringSupplant("\u00A0#{punct}#{spaces_group}", twic.text.expr);
	twic.text.expr['validPrecedingChars'] = twic.text._regexSupplant(/(?:[^-\/"':!=A-Za-z0-9_@＠]|^|\:)/);

	twic.text.expr['validSubdomain'] = twic.text._regexSupplant(/(?:[^#{invalidDomainChars}](?:[_-]|[^#{invalidDomainChars}])*)?[^#{invalidDomainChars}]\./);
	twic.text.expr['validDomainName'] = twic.text._regexSupplant(/(?:[^#{invalidDomainChars}](?:[-]|[^#{invalidDomainChars}])*)?[^#{invalidDomainChars}]/);
	twic.text.expr['validDomain'] = twic.text._regexSupplant(/(#{validSubdomain})*#{validDomainName}\.(?:xn--[a-z0-9]{2,}|[a-z]{2,})(?::[0-9]+)?/i);

	twic.text.expr['validGeneralUrlPathChars'] = twic.text._regexSupplant(/[a-z0-9!\*';:=\+\$\/%#\[\]\-_,~|#{latinAccentChars}]/i);
	// Allow URL paths to contain balanced parens
	//  1. Used in Wikipedia URLs like /Primer_(film)
	//  2. Used in IIS sessions like /S(dfd346)/
	twic.text.expr['wikipediaDisambiguation'] = twic.text._regexSupplant(/(?:\(#{validGeneralUrlPathChars}+\))/i);
	// Allow @ in a url, but only in the middle. Catch things like http://example.com/@user
	twic.text.expr['validUrlPathChars'] = twic.text._regexSupplant(/(?:#{wikipediaDisambiguation}|@#{validGeneralUrlPathChars}+\/|[\.,]?#{validGeneralUrlPathChars}?)/i);

	// Valid end-of-path chracters (so /foo. does not gobble the period).
	// 1. Allow =&# for empty URL parameters and other URL-join artifacts
	twic.text.expr['validUrlPathEndingChars'] = twic.text._regexSupplant(/(?:[\+\-a-z0-9=_#\/#{latinAccentChars}]|#{wikipediaDisambiguation})/i);
	twic.text.expr['validUrlQueryChars'] = /[a-z0-9!\*'\(\);:&=\+\$\/%#\[\]\-_\.,~|]/i;
	twic.text.expr['validUrlQueryEndingChars'] = /[a-z0-9_&=#\/]/i;
	twic.text.expr['extractUrl'] = twic.text._regexSupplant(
		'('                                                          + // $1 total match
		'(#{validPrecedingChars})'                                   + // $2 Preceeding chracter
		'('                                                          + // $3 URL
		'(https?:\\/\\/)'                                            + // $4 Protocol
		'(#{validDomain})'                                           + // $5 Domain(s) and optional post number
		'(\\/'                                                       + // $6 URL Path
		'(?:'                                                        +
		'#{validUrlPathChars}+#{validUrlPathEndingChars}|'           +
		'#{validUrlPathChars}+#{validUrlPathEndingChars}?|'          +
		'#{validUrlPathEndingChars}'                                 +
		')?'                                                         +
		')?'                                                         +
		'(\\?#{validUrlQueryChars}*#{validUrlQueryEndingChars})?'    + // $7 Query String
		')'                                                          +
		')'
	, "gi");

	twic.text._initialized = true;
};

twic.text.processUrls = function(text, callback) {
	twic.text._initialize();

	return text.replace(twic.text.expr['extractUrl'], function(match, all, before, url, protocol, domain, path, query) {
		if (protocol) {
			return before + callback(url);
		}

		return '';
	} );
};

twic.text.extractUrls = function(text) {
	var
		urls = [];

	twic.text._initialize();

	text.replace(twic.text.expr['extractUrl'], function(match, all, before, url, protocol, domain, path, query) {
		urls.push(url);
	} );

	return urls;
};

twic.text.processHashes = function(text, callback) {
	twic.text._initialize();

	return text.replace(twic.text.expr['extractHash'], function(match, before, hash, hashText) {
		return before + callback(hashText);
	} );
};

twic.text.processMentions = function(text, callback) {
	twic.text._initialize();

	return text.replace(twic.text.expr['extractMentions'], function(match, before, atSign, screenName, after) {
		if (!after.match(twic.text.expr['endScreenNameMatch'])) {
			return before + callback(screenName);
		}
	} );
};
