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
		this.collection = gumCal.Cals[this.calSettings.adId].slots;
	
		//Listen for bootstrap modal close event before removing view
		this.$el.on('hidden.bs.modal', function () {
  			this.remove();
		});

		this.render();

		//+++++++++++++++++++++++++++++++++++++++++
		//+ API event listeners
		//+++++++++++++++++++++++++++++++++++++++++
		
		//Show success notification when slot cancelled
		this.listenTo(this.collection, 'change:status destroy', this.showNotification);

	},
	
	//+++++++++++++++++++++++++++++++++++++++++
	//+ Render
	//+++++++++++++++++++++++++++++++++++++++++

	render: function(){
		this.bookedSlots = this.collection.filterByStatus( 'booked' );
		this.availableSlots = this.collection.filterByStatus( 'available' );
		this.tentativeSlots = this.collection.filterByStatus( 'tentative' );

		var cancelAllView = this.$el.html(this.cancelAllTemplate({
			bookedCount: this.bookedSlots.length,
			slotCount: this.availableSlots.length,
			tentativeCount: this.tentativeSlots.length,
			cancelledSlotCount: (this.bookedSlots.length + this.tentativeSlots.length),
			activeSlots: !!(this.bookedSlots.length + this.tentativeSlots.length)
		}));	
		$('body').prepend(cancelAllView);
		
		//Template is available, call bootstrap modal
		$('#'+this.id).modal();
			
	},

	//+++++++++++++++++++++++++++++++++++++++++
	//+ Show notfication
	//+++++++++++++++++++++++++++++++++++++++++
	
	showNotification: function(){
		this.render();
		this.$('.success-notification.cancel-all').removeClass('hidden');
		this.$('[data-cancel-all-keep], [data-cancel-all-close]').prop('disabled', true);
	},

	//+++++++++++++++++++++++++++++++++++++++++
	//+ Cancel all slots
	//+++++++++++++++++++++++++++++++++++++++++
	
	//Destroy all slots
	cancelCloseAllSlots: function(){
		this.collection.empty();
	},

	//Revert tentative and booked slots to available
	cancelKeepAllSlots: function(){
		var activeSlots = this.collection.getActiveSlots();
		
		if (activeSlots.length){
			_.each(activeSlots, function(model){
				model.setAttributes({status:'available'});
			});			
		}
	}

});
