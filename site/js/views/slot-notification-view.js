var gumCal = gumCal || {};

//Slot notification view
gumCal.SlotNotificationView = Backbone.View.extend({

	slotNotificationTemplate: Handlebars.compile($("#slotNotificationView-template").html()),
	
	initialize: function( options ){
		this.slot = options.slot;
		this.slotTime = this.slot.get('time');
		this.slotStatus = this.slot.get('status');
		this.prettyTime = this.slot.escape('prettyTime')
		
		this.$slotPlaceholder = $('[data-cal-datetime="' + this.slotTime + '"]');
		this.status = this.slotStatus === 'booked' ? 'Booked' : 'Awaiting confirmation';
		this.className =  this.slotStatus === 'booked' ? 'success' : 'warning';

		this.render();
	},

    //+++++++++++++++++++++++++++++++++++++++++
	//+ Render
	//+++++++++++++++++++++++++++++++++++++++++
	
	//Replace slot placeholder html with this rendered notification template
	render: function(){
		this.$slotPlaceholder
			.addClass('alert')
			.addClass('alert-' + this.className)
			.attr('role', 'alert')
			;

		this.$el.html(this.slotNotificationTemplate({
			prettyTime: this.prettyTime,
			status: this.status
		}));	

		this.$slotPlaceholder.html(this.$el);
	},
});
