
xui.extend({
	text: function(){
		var result = [];
		if(this.length >= 1){
			var el = this[0];
			for (var i = 0; i < el.childNodes.length; i++) {
    			var n = el.childNodes[i];
    			if (n.nodeName === "#text")result.push(n.nodeValue);
    		}
		}
		return result;
	}
});
