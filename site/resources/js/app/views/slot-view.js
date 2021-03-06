var gumCal = gumCal || {};

//Slot view
gumCal.SlotView = Backbone.View.extend({

	tagName: 'div',

	slotTemplate: Handlebars.compile($("#slotview-template").html()),
	
	events: {
		'click [data-delete-slot]' : 'deleteSlot',
		'click [data-book-slot]' : 'verifySlot',
		'click [data-view-slot]' : 'showEditView'
	},
	
	initialize: function( options ){
		this.calSettings = options || {};
		
		//Cache cal setting properties
		this.adId = this.calSettings.adId;
		this.parentView = this.calSettings.parentView;
		this.autoConfirm = this.calSettings.autoConfirm;
		this.context = this.calSettings.context;
		this.collection = gumCal.Cals[this.adId].slots;

		//+++++++++++++++++++++++++++++++++++++++++
		//+ API event listeners
		//+++++++++++++++++++++++++++++++++++++++++
		
		//Update slot view when model status changes	
		this.listenTo(this.model, 'change:status', this.updateSlotView);

		//Remove slot view when its model is removed from remote collection	
		this.listenTo(this.model, 'remove', this.close);
	},
	
	//+++++++++++++++++++++++++++++++++++++++++
	//+ Render
	//+++++++++++++++++++++++++++++++++++++++++
	
	//Returning view for immediate appending to day view
	render: function(){
		//Set status class on slot
		this.$el
			.removeClass()
			.addClass('slot')
			.addClass('is-'+this.model.get('status'))
			.addClass(this.context);
		
		this.$el.html(this.slotTemplate({
			prettyTime: this.model.escape('prettyTime'),
			status: this.model.escape('status'),
			name: this.model.escape('name'),
			context: this.context,
			isInPast: this.parentView.isInPast(this.model.get('date'))
		}));	

		return this;
	},

	//+++++++++++++++++++++++++++++++++++++++++
	//+ Delete slot 
	//+++++++++++++++++++++++++++++++++++++++++
	
	//Delete slot model
	deleteSlot: function(){
		this.model.destroy();
	},

	//Remove slot view
	close: function(){
		this.remove();
	},

	//+++++++++++++++++++++++++++++++++++++++++
	//+ Update slot views
	//+++++++++++++++++++++++++++++++++++++++++

	//Handling of slot view rendering or removal on slot status change
	//according to new status and whether view is public or private
	updateSlotView: function(slot){
		var updatedStatus, previousStatus, bookedBy;
		if(this.context === 'private'){
			//private side slot view updates
			this.render();
		} else {
			//public side slot view updates
			updatedStatus = slot.get('status');
			previousStatus = slot.previous('status');
			bookedBy = slot.get('bookedBy');

			if (updatedStatus === 'available') {
				if (previousStatus === 'tentative' || previousStatus === 'booked') {
					this.close();		
				}
				this.render();
			} else if (updatedStatus === 'booked') {
				if (bookedBy === 'public') {
					this.$el.addClass('is-booked').removeClass('is-available');	
				} else if (bookedBy === 'private') {
					this.close();	
				}
			} else if (updatedStatus === 'tentative') {
				this.$el.addClass('is-tentative').removeClass('is-available');	
			}
		}
	},

	//+++++++++++++++++++++++++++++++++++++++++
	//+ Verify slot
	//+++++++++++++++++++++++++++++++++++++++++
	
	//Check model still exists in remote collection before booking
	verifySlot: function( e ){
		var self = this;
		this.model.verify(function(){
			self.showEditView(e);
		});
	},

	//+++++++++++++++++++++++++++++++++++++++++
	//+ Show slot editing views 
	//+++++++++++++++++++++++++++++++++++++++++

	showEditView: function( e ){
		var book = $(e.target).is('[data-book-slot]'),
			view = $(e.target).is('[data-view-slot]'),
			viewSettings = _.extend({ model: this.model }, this.calSettings )
			;

		// Remove any existing details or booking views
		this.parentView.closeAllEditViews();

		//Check which button was clicked and build relevant view
		if ( book ) {
			this.parentView.editView = new gumCal.BookingView( viewSettings );	
		} else if ( view ) {
			this.parentView.editView = new gumCal.DetailsView( viewSettings );	
		}	
	}
	
});
