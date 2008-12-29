
APlan = {};

/*
 * environment setup
 */
APlan.log = console ? console.log : function() {};
APlan.log("[aplan] loadeding");

APlan.setup_envs = function()
{
	var m = document.location.toString().match(/(.*?\/)wiki/);
	this.site_root = m[1];
};

/*
 * Remoting
 */
APlan.get_tickets_from = function(qid, got)
{
	var uri = this.site_root + "report/" + qid;
	var self = this;
	$.get(uri, {}, function(data, status) {
			got(self.make_tickets_from_welm($(data)));
		}, "html");
};

APlan.do_post_ticket = function(window, props)
{
	var root = $(window.document.documentElement);
	var nedit = 0;

	if (props.summary) {
		root.find("#field-summary").val(props.summary);
		nedit++;
	};

	if (0 < nedit) {
		root.find("form#propertyform input[name=submit]").click();
		return true;
	} else {
		return false;
	}
}

APlan.post_ticket = function(tid, props, done)
{
	var tn  = tid.match(/\d+/)[0];
	var uri = this.site_root + "ticket/" + tn;
	var name = 'topost' + tn;
	console.log(uri);
	var iframe = $("<iframe class='topost' name='" + tn + "' src='" + uri + "' />");

	var close_iframe = function(done)
	{
		window.setTimeout(function()
	    {
			iframe.remove();
			if (done) { done(); }
		}, 1);
	};

	var self = this;
	iframe.one("load", function()
    {
		APlan.log("iframe loaded");
		if (self.do_post_ticket(this.contentWindow, props)) {
			iframe.one("load", function()
		    {
				APlan.log("iframe posted");
				close_iframe(done);
			});
		} else {
			APlan.log("iframe none changed.");
			close_iframe(done);
		}
	});

	$("body").append(iframe);
 }

/*
 * Data
 */
APlan.make_ticket = function(props)
{
	return props;
};

APlan.Ticket = function() {};

APlan.Ticket.parse_summary = function(str)
{
	var m = $.trim(str).match(/(.*?)\(\(/);
	return m ? m[1] : str;
};

APlan.make_tickets_from_welm = function(welm)
{
	var self = this;
	return $.map(welm.find("table.tickets tbody tr"), function(n, i) {
			var we = $(n);
			return self.make_ticket({
				id: $.trim(we.find(".ticket").text()),
				id_html: we.find(".ticket").html(),
				componnent: $.trim(we.find(".componnent").text()),
				summary: APlan.Ticket.parse_summary(we.find(".summary").text()),
				owner: $.trim(we.find(".owner").text()),
				status: $.trim(we.find(".status").text()),
				date: $.trim(we.find(".date").text()),
				slice: self.parse_slice(we.find(".summary").text())
			});
		});
}

APlan.Slice = function(est, act)
{
	if (undefined == est) { est = 0; }
	if (undefined == act) { act = 0; }

	this.estimation = function() { return est },
	this.actual = function() { return act; }

	this.update_estimation = function(val)
	{
		est = val;
	};

	this.update_actual = function(val)
	{
		act = val;
	};

	this.toString = function()
	{
		return "((" + est + ";" + act + ";" + "))";
	};
};

APlan.parse_slice = function(str)
{
	var m = str.match(/\(\((.*?);(.*?);(.*?)\)\)/);
	if (!m) {
		return null;
	}

	var est_str = $.trim(m[1]);
	var act_str = $.trim(m[2]);
	var pro_str = $.trim(m[3]);

	var ests = parseFloat(est_str) || 0
	var act  = parseFloat(act_str) || 0;

	return new APlan.Slice(ests, act);
};

APlan.post_ticket_then_reload = function(ticket, slice)
{
	console.log(ticket);
	var self = this;
	var reload = function() { self.reload(); };
	var raw_summary = ticket.summary + slice.toString()
	this.post_ticket(ticket.id, {"summary": raw_summary}, reload);
}

APlan.update_estimation = function(ticket, slice, text)
{
	slice.update_estimation(parseFloat(text));
	this.post_ticket_then_reload(ticket, slice);
};

APlan.update_actual = function(ticket, slice, text)
{
	slice.update_actual(parseFloat(text));
	this.post_ticket_then_reload(ticket, slice);
};

/*
 * UI construction
 */
APlan.make_table = function() {
	var t =$("<table id='aptable'>" +
			 "<tr>" +
			 "<th>ticket</th><th>summary</th>" +
			 "<th>planned</th><th>actual</th>" +
             "</tr>" +
			 "</table>");
	return t;
}

APlan.make_editable = function(we, onproceed)
{
	function cancel(input, last)
	{
		$(input).parent().html(last);
	};

	function proceed(input, next)
	{
		$(input).parent().html(next);
		onproceed(next);
	};

	we.bind("click", function() 
    {
		var here = $(this);
		var children = here.children("input");
		if (0 == children.length) {
			var val = here.text();
			var edit = $("<input type='text' value='" +  val + "' />");
			here.empty().append(edit);
			edit.focus();
			edit.bind("blur", function() { cancel(edit, val); });
			edit.bind("keypress", function(evt) 
			{
				switch (evt.which) {
				case 13: // enter
					proceed(edit, edit.val());
					break;
				case 0:  // escape
					cancel(edit, val);
					break;
				default:
				}
			});
		}
	});
};

APlan.fill_table = function(tickets) {
	// TODO: filter by owner.
	var self = this;
	$.each(tickets, function() {
		var tr = $("<tr />");
		
		tr.append("<td class='id'>" + this.id_html + "</td>");
		tr.append("<td class='summary'>" + this.summary + "</td>");

		var ticket = this;
		var slice = ticket.slice;
		var est = null, act = null;
		if (slice) {
			est = $("<td class='est'>" + slice.estimation() + "</td>");
			act = $("<td class='act'>" + slice.actual() + "</td>");
		} else {
			est = $("<td class='est wild'></td>");
			act = $("<td class='act wild'>0</td>");
			slice = new APlan.Slice();
		}

		self.make_editable(est, function(next)
	    {
			self.update_estimation(ticket, slice, next);
		});

		self.make_editable(act, function(next) 
	    {
			self.update_actual(ticket, slice, next);
		});

		tr.append(est);
		tr.append(act);

		self.table_welm.append(tr);
	});
}

APlan.setup_frame = function() {
	this.table_welm = this.make_table();

	this.frame_welm = $("<div class='apframe' />");
	this.frame_welm.append($("<h2 id='aptitle'>Aribais</h2>"));
	this.frame_welm.append(this.table_welm);

	var self = this;
	this.get_tickets_from("1", function(tickets) { self.fill_table(tickets); });
};

APlan.show_frame = function() {
	$("body").append(this.frame_welm);
};

APlan.reload = function()
{
	this.frame_welm.remove();
	this.init();
}

APlan.init = function()
{
	this.setup_envs();
	this.setup_frame();
	this.show_frame();
};

APlan.log("[aplan] loadeded");
if (!window.APlan_testing) {
	APlan.init();
	APlan.log("[aplan] initialized");
}
