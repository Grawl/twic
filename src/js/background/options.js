/**
 * Options storage
 *
 * Kalashnikov Igor <igor.kalashnikov@gmail.com>
 * Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported
 */

twic.options = ( function() {

	var
		options = { },
		// options storage with default values
		storage = { 
			// use short links expander
			'expander': true
		},
		// hash for existand db keys
		inDB = { };
	
	/**
	 * Get the value
	 * @param {string} key Options key
	 */	
	options.getValue = function(key) {
		if (key in storage) {
			return storage[key];
		}
		
		return false;
	};
	
	/**
	 * Set the key value
	 * @param {string} key Key
	 * @param {*} value Value
	 */
	options.setValue = function(key, value) {
		if (key in storage) {
			twic.db.execQuery(
				key in inDB 
					? 'update options set val = ? where key = ?'
					: 'insert into options (val, key) values (?, ?)',
				[value.toString(), key],
				function() {
					storage[key] = value;
				}
			);
		}
	};
	
	twic.db.openQuery('select key, val from options', [], 
		/**
		 * @this {SQLResultSetRowList}
		 */
		function(rows) {
			var 
				row,
				key,
				val,
				i;
			
			for (i = 0; i < this.length; ++i) {
				row = this.item(i);
				key = row['key'];
			
				if (key in storage) {
					inDB[key] = 1;
				
					switch (typeof storage[key]) {
						case 'boolean':
							val = row['val'] === true.toString();
							break;
						default:
							val = row['val'];			
					}
				
					storage[key] = val;
				} else {
					// removing the key from database
					twic.db.execQuery('delete from options where key = ?', [key]);
				}
			}
		} 
	);
	
	twic.requests.subscribe('getOpt', function(data, sendResponse) {
		sendResponse( options.getValue(data) );
	} );
	
	twic.requests.subscribe('setOpt', function(data, sendResponse) {
		sendResponse( { } );
		
		options.setValue(data['key'], data['val']);
	} );
	
	return options;

}() );
