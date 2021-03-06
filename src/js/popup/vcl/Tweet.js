/**
 * Kalashnikov Igor <igor.kalashnikov@gmail.com>
 * Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported
 */

/**
 * Tweet element
 * @constructor
 * @param {string} id Tweet identifier
 * @param {twic.vcl.Timeline} timeline Timeline
 */
twic.vcl.Tweet = function(id, timeline) {

	/**
	 * @type {string}
	 * @private
	 */
	this.id_ = id;

	/**
	 * @type {string}
	 * @private
	 */
	this.replyTo_ = '';

	/**
	 * @type {twic.vcl.Timeline}
	 * @private
	 */
	this.timeline_ = timeline;

	/**
	 * @type {number}
	 * @private
	 */
	this.timelineId_ = this.timeline_.getUserId();

	/**
	 * @type {Element}
	 * @private
	 */
	this.avatar_ = twic.dom.expandElement('img.avatar');

	/**
	 * @type {Element}
	 * @private
	 */
	this.avatarLink_ = twic.dom.expandElement('a.avatar');

	/**
	 * @type {Element}
	 * @private
	 */
	this.rtAvatarLink_ = twic.dom.expandElement('a.avatar.retweeter');

	/**
	 * @type {Element}
	 * @private
	 */
	this.rtAvatar_ = twic.dom.expandElement('img.avatar');

	/**
	 * @type {Element}
	 * @private
	 */
	this.wrapper_ = twic.dom.expandElement('li#' + this.id_ + '.tweet');

	/**
	 * @type {Element}
	 * @private
	 */
	this.tweetContent_ = twic.dom.expandElement('p');

	/**
	 * @type {string}
	 * @private
	 */
	this.timelineNick_ = this.timeline_.getUserNick();

	/**
	 * @type {Object}
	 * @private
	 */
	this.mentioned_ = { };

	/**
	 * @type {number}
	 * @private
	 */
	this.authorId_ = 0;

	/**
	 * @type {string}
	 * @private
	 */
	this.authorNick_ = '';

	/**
	 * @type {number}
	 * @private
	 */
	this.retweetedById_ = 0;

	/**
	 * @type {string}
	 * @private
	 */
	this.rawText_ = '';

	/**
	 * @type {Object.<string, string>}
	 * @private
	 */
	this.links_ = { };

	/**
	 * @type {number}
	 * @private
	 */
	this.unixtime_ = 0;

	/**
	 * @type {boolean}
	 * @private
	 */
	this.isProtected_ = false;

	/**
	 * @type {Array}
	 * @private
	 */
	this.geo_ = null;

	/**
	 * @type {twic.vcl.TweetEditor}
	 */
	this.replier_ = null;

	/**
	 * @type {twic.vcl.Map}
	 */
	this.map_ = null;

	/**
	 * Is map visible?
	 * @type {boolean}
	 */
	this.mapVisible_ = false;

	/**
	 * @type {Element}
	 * @private
	 */
	this.timeSpan_ = twic.dom.expandElement('span.time');

	/**
	 * @type {Element}
	 * @private
	 */
	this.otherInfo_ = twic.dom.expandElement('p.info');

	/**
	 * @type {Element}
	 * @private
	 */
	this.replyWrapper_ = twic.dom.expandElement('div');

	/**
	 * @type {Element}
	 * @private
	 */
	this.mapWrapper_ = twic.dom.expandElement('div.map');

	twic.dom.setVisibility(this.rtAvatarLink_, false);

	this.avatarLink_.appendChild(this.avatar_);
	this.rtAvatarLink_.appendChild(this.rtAvatar_);

	this.wrapper_.appendChild(this.avatarLink_);
	this.wrapper_.appendChild(this.rtAvatarLink_);
	this.wrapper_.appendChild(this.tweetContent_);
	this.wrapper_.appendChild(this.otherInfo_);
	this.wrapper_.appendChild(twic.dom.expandElement('div.clearer'));
	this.wrapper_.appendChild(this.mapWrapper_);
	this.wrapper_.appendChild(this.replyWrapper_);
};

/**
 * @type {RegExp}
 * @const
 */
twic.vcl.Tweet.REGEXP_BREAK = /\r?\n/;

/**
 * @type {string}
 * @private
 */
twic.vcl.Tweet.prototype.trAgo_ = twic.utils.lang.translate('time_ago');

/**
 * Get the tweet author id
 * @return {number}
 */
twic.vcl.Tweet.prototype.getAuthorId = function() {
	return this.authorId_;
};

/**
 * Get the tweet author nick
 * @return {string}
 */
twic.vcl.Tweet.prototype.getAuthorNick = function() {
	return this.authorNick_;
};

/**
 * Set the reply to id
 * @param {string} mmm Tweet id
 */
twic.vcl.Tweet.prototype.setReplyTo = function(mmm) {
	this.replyTo_ = mmm;
};

/**
 * Update the tweet time
 */
twic.vcl.Tweet.prototype.updateTime = function() {
	if (0 === this.unixtime_) {
		return;
	}

	var
		desc = '',
		now = twic.utils.date.getCurrentTimestamp(),
		df = now - this.unixtime_;

	// less than minute ago
	if (df < 60) {
		desc = twic.utils.lang.translate('time_less_minute') + ' ' + this.trAgo_;
	} else
	// less than hour ago
	if (df < 60 * 60) {
		desc = twic.utils.lang.plural( Math.floor(df / 60), [
			'time_minute_one',
			'time_minute_much',
			'time_minute_many'
		] ) + ' ' + this.trAgo_;
	} else
	// less than day ago
	if (df < 60 * 60 * 24) {
		desc = twic.utils.lang.plural( Math.floor(df / 60 / 60), [
			'time_hour_one',
			'time_hour_much',
			'time_hour_many'
		] ) + ' ' + this.trAgo_;
	} else {
		var
			dt = new Date(this.unixtime_ * 1000);

		desc = dt.getDate() + ' ' +
			twic.utils.lang.translate('time_month_' + (dt.getMonth() + 1));
	}

	this.timeSpan_.innerText = desc;
};

/**
 * Set the tweet text
 * @param {string} text
 */
twic.vcl.Tweet.prototype.setText = function(text) {
	var
		txt = twic.utils.url.processText(text, this.links_),
		tweet = this;

	this.rawText_ = text;

	// preparing hashtags
	txt = twic.text.processHashes(txt, function(hash) {
		return '<a class="hash" target="_blank" href="http://search.twitter.com/search?q=%23' + hash + '">#' + hash + '</a>';
	} );

	// preparing nicks
	txt = twic.text.processMentions(txt, function(nick) {
		var
			nickLowered = nick.toLowerCase();

		if (nick === tweet.timelineNick_) {
			// this tweet is with our mention
			tweet.wrapper_.classList.add('mention');
		}

		tweet.mentioned_[nickLowered] = '@' + nick;

		return '<a class="nick" href="#profile#' + nickLowered + '">@' + nick + '</a>';
	} );

	// preparing line breaks
	txt = txt.replace(
		twic.vcl.Tweet.REGEXP_BREAK,
		'<br />'
	);

	this.tweetContent_.innerHTML = txt + '<br />';
};

/**
 * Set the time
 * @param {number} newUnixTime New unix time
 */
twic.vcl.Tweet.prototype.setUnixTime = function(newUnixTime) {
	this.unixtime_ = newUnixTime;

	this.updateTime();
	this.otherInfo_.appendChild(this.timeSpan_);
};

/**
 * Set the tweet as protected
 */
twic.vcl.Tweet.prototype.setProtected = function() {
	this.isProtected_ = true;
};

/**
 * Add the separator
 */
twic.vcl.Tweet.prototype.setSeparator = function() {
	this.wrapper_.classList.add('separator');
};

/**
 * Set the tweet shortened links hash
 * @param {Object.<string, string>} linksHash Links hash
 */
twic.vcl.Tweet.prototype.setLinks = function(linksHash) {
	this.links_ = linksHash;
};

/**
 * Set retweeter info
 * @param {number} id Retweet author identifier
 * @param {string} nick Retweet author nick
 * @param {string} av User avatar src
 */
twic.vcl.Tweet.prototype.setRetweeter = function(id, nick, av) {
	this.retweetedById_ = id;

	if (this.retweetedById_ === this.timelineId_) {
		this.wrapper_.classList.add('me');
	}

	this.rtAvatarLink_.title = twic.utils.lang.translate('title_retweeted_by', '@' + nick);
	this.rtAvatarLink_.href = '#profile#' + nick;

	this.rtAvatar_.src = av;

	this.rtAvatarLink_.style.display = 'block';

	this.wrapper_.classList.add('retweet');
};

/**
 * Set author info
 * @param {number} id Author identifier
 * @param {string} nick Tweet author nick
 * @param {string} av User avatar src
 */
twic.vcl.Tweet.prototype.setAuthor = function(id, nick, av) {
	this.authorId_ = id;
	this.authorNick_ = nick;

	if (this.authorId_ === this.timelineId_) {
		this.wrapper_.classList.add('me');
	}

	this.avatarLink_.title = '@' + nick;
	this.avatarLink_.href = '#profile#' + nick;

	this.avatar_.src = av;
};

twic.vcl.Tweet.prototype.getCanConversation = function() {
	return '' !== this.replyTo_;
};

/**
 * Can reply to tweet?
 * @return {!boolean}
 */
twic.vcl.Tweet.prototype.getCanReply = function() {
	return true;
};

/**
 * Get the tweet element
 * @return {Element}
 */
twic.vcl.Tweet.prototype.getElement = function() {
	return this.wrapper_;
};

/**
 * Get the tweet raw text
 * @return {string}
 */
twic.vcl.Tweet.prototype.getRawText = function() {
	return this.rawText_;
};

/**
 * Tweet id
 * @return {string}
 */
twic.vcl.Tweet.prototype.getId = function() {
	return this.id_;
};

/**
 * Is replying?
 * @returns {boolean}
 */
twic.vcl.Tweet.prototype.isReplying = function() {
	return null !== this.replier_;
};

/**
 * Inner reset the tweet replier
 * @private
 */
twic.vcl.Tweet.prototype.resetTweetEditor_ = function() {
	this.wrapper_.classList.remove('replying');
	this.replier_ = null;
};

/**
 * Reset the tweet replier
 */
twic.vcl.Tweet.prototype.resetEditor = function() {
	if (this.isReplying()) {
		this.replier_.close();
		this.resetTweetEditor_();
	}
};

/**
 * Can retweet?
 * @returns {boolean}
 */
twic.vcl.Tweet.prototype.getCanRetweet = function() {
	return !this.isProtected_
		&& this.authorId_ !== this.timelineId_
		&& this.retweetedById_ !== this.timelineId_;
};

/**
 * Can unretweet?
 * @returns {boolean}
 */
twic.vcl.Tweet.prototype.getCanUnRetweet = function() {
	return this.retweetedById_ === this.timelineId_;
};

/**
 * Can delete?
 * @returns {boolean}
 */
twic.vcl.Tweet.prototype.getCanDelete = function() {
	return this.authorId_ === this.timelineId_;
};

/**
 * Toggle the map
 */
twic.vcl.Tweet.prototype.toggleMap_ = function() {
	var
		tweet = this;

	if (!this.map_) {
		this.map_ = new twic.vcl.Map(this.mapWrapper_, this.geo_[0], this.geo_[1]);
	}

	if (!this.mapVisible_) {
		tweet.onMapShow.call(tweet);

		this.wrapper_.classList.add('map');
		this.mapWrapper_.style.display = 'block';
	} else {
		this.wrapper_.classList.remove('map');
		this.mapWrapper_.style.display = 'none';
	}

	this.mapVisible_ = !this.mapVisible_;
};

/**
 * Reply the tweet
 * @param {boolean=} all Reply to all mentioned
 */
twic.vcl.Tweet.prototype.reply = function(all) {
	var
		tweet = this,
		/** @type {string} **/ replyNick = this.authorNick_,
		/** @type {string} **/ nickList = '@' + replyNick + ' ';

	if (all) {
		var
			/** @type {string} **/ nick = '',
			nicks = this.mentioned_;

		if (replyNick.toLowerCase() in nicks) {
			delete nicks[replyNick.toLowerCase()];
		}

		for (nick in nicks) {
			nickList += nicks[nick] + ' ';
		}
	}

	this.replier_ = new twic.vcl.TweetEditor(this.timelineId_, this.replyWrapper_, this.id_);
	this.replier_.toggleGeo(this.timeline_.geoEnabled);
	this.replier_.autoRemovable = true;
	this.replier_.setConstTextIfEmpty(nickList);
	this.replier_.setFocus();

	this.replier_.onTweetSend = function(editor, tweetObj, replyTo, callback) {
		tweet.onReplySend.call(tweet, editor, tweetObj, replyTo, callback);
	};

	this.replier_.onClose = function() {
		tweet.resetTweetEditor_.call(tweet);
	};

	this.replier_.onGetSuggestList = function(startPart, callback) {
		tweet.timeline_.onReplierGetSuggestList.call(tweet.replier_, startPart, callback);
	};

	this.wrapper_.classList.add('replying');

	if (this.mapVisible_) {
		this.toggleMap_();
	}
};

/**
 * Set the source
 * @param {string} newSource Tweet source (client)
 */
twic.vcl.Tweet.prototype.setSource = function(newSource) {
	var
		clientSpan = twic.dom.expandElement('span.client');

	clientSpan.innerHTML = (0 !== this.unixtime_ ? ' ' + twic.utils.lang.translate('via') + ' ' : '') +
		newSource.replace('<a ', '<a target="_blank" ') + '<br />';
	this.otherInfo_.appendChild(clientSpan);
};

/**
 * Set geo info
 * @param {Array} info Geo info
 */
twic.vcl.Tweet.prototype.setGeo = function(info) {
	var
		tweet = this,
		markerSpan = twic.dom.expandElement('span.geo');

	markerSpan.innerHTML = '&nbsp;&nbsp;';

	markerSpan.addEventListener('click', function(e) {
		tweet.toggleMap_.call(tweet);
	}, false);

	this.geo_ = info;

	if (this.unixtime_) {
		this.otherInfo_.insertBefore(markerSpan, this.timeSpan_);
	} else {
		this.otherInfo_.appendChild(markerSpan);
	}
};

/**
 * Handler for tweet send process
 * @param {twic.vcl.TweetEditor} editor Editor
 * @param {twic.cobj.Tweet} tweet Tweet common object
 * @param {string=} replyTo Reply to tweet
 * @param {function()=} callback Callback
 */
twic.vcl.Tweet.prototype.onReplySend = function(editor, tweet, replyTo, callback) { };

/**
 * Handler for the tweet map show
 */
twic.vcl.Tweet.prototype.onMapShow = function() { };
