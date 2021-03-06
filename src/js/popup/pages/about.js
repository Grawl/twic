/**
 * About page implementation
 *
 * Kalashnikov Igor <igor.kalashnikov@gmail.com>
 * Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported
 */

/**
 * @constructor
 * @extends twic.Page
 */
twic.pages.AboutPage = function() {
	twic.Page.call(this);
};

goog.inherits(twic.pages.AboutPage, twic.Page);

twic.pages.AboutPage.prototype.initOnce = function() {
	var
		req = new XMLHttpRequest(),
		manifest;

	twic.inject.js('http://api.flattr.com/js/0.6/load.js?mode=auto');

	req.open('GET', chrome.extension.getURL('manifest.json'), false);
	req.send(null);
	manifest = JSON.parse(req.responseText);

	twic.dom.findElement('#aname').innerHTML = twic.name + ' ' + manifest['version'];
	twic.dom.findElement('#awhat').innerHTML = twic.utils.lang.translate('about_what');

	twic.dom.findElement('#about .toolbar p').innerHTML = twic.utils.lang.translate('toolbar_about');
	twic.dom.findElement('#about .toolbar a').innerHTML = twic.utils.lang.translate('toolbar_accounts');

	twic.dom.findElement('#aauthor').innerHTML = twic.utils.lang.translate('about_author');
	twic.dom.findElement('#acontributors').innerHTML = twic.utils.lang.translate('about_contributors');
	twic.dom.findElement('#athanks').innerHTML = twic.utils.lang.translate('about_thanks');

	twic.dom.findElement('#acollaborate').innerHTML = twic.utils.lang.translate(
		'about_collaborate', [
			'<a href="https://github.com/silentroach/twic/issues" title="github" target="_blank">', '</a>',
			'<a href="http://groups.google.com/group/twicrome" title="google groups" target="_blank">', '</a>',
			'<a href="https://github.com/silentroach/twic" title="github" target="_blank">', '</a>'
		]
	);

	twic.dom.findElement('#atranslate').innerHTML = twic.utils.lang.translate(
		'about_translate', [
			'<a href="https://github.com/silentroach/twic-i18n" title="github" target="_blank">', '</a>'
		]
	);
};
