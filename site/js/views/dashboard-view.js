var gumCal = gumCal || {};

//Dashboard view
gumCal.DashboardView = Backbone.View.extend({
	
	//el is set at instantiation as parentView.$dashboardContainer

	dashboardTemplate: Handlebars.compile($("#dashboardview-template").html()),
	
	initialize: function( options ){
		this.calSettings = options || {};
		
		//Cache cal setting properties
		this.adId = this.calSettings.adId;
		this.parentView = this.calSettings.parentView;
		this.collection = options.collection;
		this.locationPrivate = this.calSettings.locationPrivate;
		this.autoConfirm = this.calSettings.autoConfirm;
		this.location = this.calSettings.location;
		
		this.updateDashboard();

		//+++++++++++++++++++++++++++++++++++++++++
		//+ API event listeners
		//+++++++++++++++++++++++++++++++++++++++++
		
		//Update dashboard values
		this.listenTo(this.collection, 'reset add change:status destroy', this.updateDashboard);

		//Close view
		this.listenTo(this.parentView, 'calViewClosed', this.close);
	},
	
	//+++++++++++++++++++++++++++++++++++++++++
	//+ Render
	//+++++++++++++++++++++++++++++++++++++++++
	
	render: function(){
		this.$el.html(this.dashboardTemplate({
			liveBookedCount: this.liveBookedSlots.length,
			liveSlotCount: this.liveAvailableSlots.length,
			liveTentativeCount: this.liveTentativeSlots.length,
			locationPrivate: this.locationPrivate,
			autoConfirm: this.autoConfirm,
			location: this.location,
			isEmpty: !this.collection.length 
		}));
	},

	close: function(){
		this.remove();
	},

	//+++++++++++++++++++++++++++++++++++++++++
	//+ Update dashboard
	//+++++++++++++++++++++++++++++++++++++++++
	
	//Get count of slot but status, only if slot not in past	
	updateDashboard: function(){
		var liveSlots = this.collection.filterByLive();
		this.liveBookedSlots = this.collection.filterByStatus.call(liveSlots, 'booked' );
		this.liveAvailableSlots = this.collection.filterByStatus.call(liveSlots, 'available' );
		this.liveTentativeSlots = this.collection.filterByStatus.call(liveSlots, 'tentative' );
		this.render();
	},

});



















