var gumCal = gumCal || {};

//Slot view
gumCal.SlotView = Backbone.View.extend({

	tagName: 'div',

	slotTemplate: Handlebars.compile($("#slotview-template").html()),
	
	events: {
		'click [data-delete-slot]' : 'deleteSlot',
		'click [data-book-slot]' : 'bookSlot',
		'click [data-view-slot]' : 'showEditView'
	},
	
	initialize: function( options ){
		this.calSettings = options || {};
		
		//Cache cal setting properties
		this.adId = this.calSettings.adId;
		this.parentView = this.calSettings.parentView;
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

	//Handling of slot view rendering or removal on slot status change
	//according to new status and whether view is buyer or seller
	updateSlotView: function(slot){

		//TODO: Update notification panel on booked - remove name or find another way to do this

		var updatedStatus;
		if(this.context === 'seller'){
			this.render();
		} else {
			updatedStatus = slot.get('status');
			if (updatedStatus === 'available') {
				this.render();
			} else if (updatedStatus === 'booked' || updatedStatus === 'tentative') {
				this.close();
			}
		}
	},

	//+++++++++++++++++++++++++++++++++++++++++
	//+ Book slot
	//+++++++++++++++++++++++++++++++++++++++++

	bookSlot: function( e ){
		if (this.context === 'buyer') {
			if (!this.parentView.slotBooked) {
				this.parentView.slotBooked = true;
				this.showEditView( e );
			} else {
				return false;
			}
		} else {
			this.showEditView( e );
		}
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