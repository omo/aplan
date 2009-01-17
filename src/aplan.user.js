// ==UserScript==
// @name           aplan
// @namespace      http://dodgson.org/aplan
// @description    Aribai Plan - Trac-Parasited Time Tracker
// @include        http://localhost:8080/env/wiki/AribaiPlan*
// ==/UserScript==

(function() {
	var log = (unsafeWindow.console ? unsafeWindow.console.log : 
			   function(msg) { /* do nothing */ });

	// read aplan setting
	var pres = document.getElementsByTagName("pre");
	for (var i=0; i<pres.length; ++i) {
		if ("wiki" == pres[i].getAttribute("class") &&
			pres[i].innerHTML.match(/aplan_config/)) {
			try {
				eval(pres[i].innerHTML);
				document.aplan_config = aplan_config;
			} catch (err) {
				alert("error on reading aplan_config!");
				throw err;
			}
			break;
		}
	}

	if (!document.aplan_config) {
		alert("[aplan] cannot find configuration!");
		return;
	}

	try {
		// TODO: load jquery if it is not given yet
		// load aplan 
		var head = document.getElementsByTagName("head")[0];

		var aplan_script = document.createElement("script");
		var script_url = document.aplan_config.root + "aplan.js";
		aplan_script.setAttribute("src", script_url);
		head.appendChild(aplan_script);

		var aplan_style = document.createElement("link");
		var style_url = document.aplan_config.root + "aplan.css";
		aplan_style.setAttribute("rel", "stylesheet");
		aplan_style.setAttribute("href", style_url);
		head.appendChild(aplan_style);

	} catch (err) {
		alert("error!" + err);
	}
})();