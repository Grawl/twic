( function(t) {

	var
		/** @type {HTMLUListElement} */ list = document.querySelector('#accounts ul');
		
	var clearList = function() {
		list.innerHTML = '';
	};
	
	var buildList = function(elements) {
		if (elements.length == 0) {
			return;
		}
		
		var frag = document.createDocumentFragment();
		
		for (var i = 0; i < elements.length; ++i) {
			var element = elements[i];
			
			var avatar = document.createElement('img');
			avatar.src = element['avatar'];
			avatar.title = element['screen_name'];
			avatar.className = 'avatar';
			
			var a = document.createElement('a');
			a.href = '#timeline#' + element['id'];
			
			a.appendChild(avatar);			
			
			var li = document.createElement('li');
			
			li.appendChild(a);
			
			frag.appendChild(li);
		}

		list.appendChild(frag);
	};
	
	document.getElementById('account_add').onclick = function() {
		this.innerHTML = chrome.i18n.getMessage('wait_auth_confirm');
	
		t.requests.send('addAccount');
	};

	t.router.handle('accounts', function(data) {
		clearList();
		
		t.requests.send('getAccountList', {}, function(list) {
			if (list) {
				buildList(list);
			}
		} );
	} );

} )(twic);
