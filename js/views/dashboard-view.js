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
		this.listenTo(this.collection, 'add change:status destroy', this.updateDashboard);

		//Close view
		this.listenTo(this.parentView, 'calViewClosed', this.close);
	},
	
	//+++++++++++++++++++++++++++++++++++++++++
	//+ Render
	//+++++++++++++++++++++++++++++++++++++++++
	
	render: function(){
		this.$el.html(this.dashboardTemplate({
			bookedCount: this.bookedSlots.length,
			slotCount: this.availableSlots.length,
			tentativeCount: this.tentativeSlots.length,
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
	
	updateDashboard: function(){
		this.bookedSlots = this.collection.filterByStatus( 'booked' );
		this.availableSlots = this.collection.filterByStatus( 'available' );
		this.tentativeSlots = this.collection.filterByStatus( 'tentative' );

		this.render();
	},

});



















