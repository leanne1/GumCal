var gumCal = gumCal || {};

//Slot notification view
gumCal.SlotNotificationView = Backbone.View.extend({

	tagName: 'div',

	className: 'booking-notification',

	slotNotificationTemplate: Handlebars.compile($("#slotNotificationView-template").html()),
	
	initialize: function( options ){
		this.slot = options.slot;
		this.slotTime = this.slot.get('time');
		this.slotStatus = this.slot.get('status');
		
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
			status: this.status
		}));	

		this.$slotPlaceholder.append(this.$el);
	},

	close: function(){
		this.$el.parent('[data-cal-datetime]')
			.removeClass('alert alert-warning alert-success')
			.removeAttr('role')
			;
		this.remove();
	}
});
