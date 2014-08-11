var gumCal = gumCal || {};

//Cancel Slot modal view
gumCal.CancelAllView = Backbone.View.extend({

	tagName: 'div',

	className: 'modal fade',

	id: 'cancelAll',
	
	cancelAllTemplate: Handlebars.compile($("#cancelallview-template").html()),
	
	events: {
		'click [data-cancel-all-close]' : 'cancelCloseAllSlots',
		'click [data-cancel-all-keep]' : 'cancelKeepAllSlots'
	},
	
	initialize: function( options ){
		var self = this;

		this.calSettings = options || {};
		
		//Cache cal setting properties
		this.adId = this.calSettings.adId;
		this.collection = this.calSettings.collection;

		//Listen for bootstrap modal close event before removing view
		this.$el.on('hidden.bs.modal', function () {
  			this.remove();
		});

		this.render();

		//+++++++++++++++++++++++++++++++++++++++++
		//+ API event listeners
		//+++++++++++++++++++++++++++++++++++++++++
		
		//Show success notification when slots closed
		this.listenTo(this.collection, 'change:status', this.showCancelNotification);

		//Show success notification when slots cancelled
		this.listenTo(this.collection, 'destroy', this.showCloseNotification);

	},
	
	//+++++++++++++++++++++++++++++++++++++++++
	//+ Render
	//+++++++++++++++++++++++++++++++++++++++++

	render: function(){
		var liveSlots = this.collection.filterByLive();
		this.liveBookedSlots = this.collection.filterByStatus.call(liveSlots, 'booked' );
		this.liveAvailableSlots = this.collection.filterByStatus.call(liveSlots, 'available' );
		this.liveTentativeSlots = this.collection.filterByStatus.call(liveSlots, 'tentative' );
		this.cancelledSlotCount = this.liveBookedSlots.length + this.liveTentativeSlots.length;

		var cancelAllView = this.$el.html(this.cancelAllTemplate({
			bookedCount: this.liveBookedSlots.length,
			slotCount: this.liveAvailableSlots.length,
			tentativeCount: this.liveTentativeSlots.length,
			cancelledSlotCount: this.cancelledSlotCount,
			updatedSlotCount: this.liveAvailableSlots.length + this.cancelledSlotCount,
			activeSlots: !!(this.liveBookedSlots.length + this.liveTentativeSlots.length)
		}));	
		$('body').prepend(cancelAllView);
		
		//Template is available, call bootstrap modal
		$('#'+this.id).modal();
			
	},

	//+++++++++++++++++++++++++++++++++++++++++
	//+ Show notfication
	//+++++++++++++++++++++++++++++++++++++++++
	
	showCancelNotification: function(){
		this.$('.success-notification.cancel-all-keep').removeClass('hidden');
		this.$('[data-cancel-all-keep], [data-cancel-all-close]').prop('disabled', true);
	},

	showCloseNotification: function(){
		this.$('.success-notification.cancel-all-close').removeClass('hidden');
		this.$('[data-cancel-all-keep], [data-cancel-all-close]').prop('disabled', true);
	},

	//+++++++++++++++++++++++++++++++++++++++++
	//+ Cancel all slots
	//+++++++++++++++++++++++++++++++++++++++++
	
	//Destroy all slots
	cancelCloseAllSlots: function(){
		this.collection.emptyLive();
	},

	//Revert tentative and booked slots to available
	cancelKeepAllSlots: function(){
		var activeSlots = this.collection.getActiveSlots(),
			liveSlots = this.collection.filterByLive.call(activeSlots);
		
		if (liveSlots.length){
			_.each(liveSlots, function(model){
				model.setAttributes({status:'available'});
			});			
		}
	}

});
