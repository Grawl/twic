twic.notifier = ( function(t) {

	var
		subscriptions = {};

	var subscribe = function(method, callback) {
		subscriptions[method] = callback;
	};
	
	chrome.extension.onRequest.addListener( function(request, sender, sendResponse) {
		console.dir(request);
	
		if (
			'method' in request
			&& request['method'] in subscriptions
		) {
			subscriptions[request['method']](request, sendResponse);
			return;
		} else {
			sendResponse({});
		}
	} );

	return {
		subscribe: subscribe
	};

} )(twic);