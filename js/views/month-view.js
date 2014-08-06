var gumCal = gumCal || {};

//Month view
gumCal.MonthView = Backbone.View.extend({
	
	//el is set at instantiation as 'data-view="month"' in parent view

	monthTemplate: Handlebars.compile($("#monthview-template").html()),

	events: {
		'click [data-cal-day]' : 'showDayView'
	},

	initialize: function( options ){
		this.calSettings = options || {};
		
		//Cache cal setting properties
		this.adId = this.calSettings.adId;
		this.parentView = this.calSettings.parentView;
		this.prettyDates = this.calSettings.prettyDates;
		this.monthYear = this.calSettings.monthYearString;
		this.context = this.calSettings.context;
		this.collection = gumCal.Cals[this.adId].slots;

		this.render();

		//+++++++++++++++++++++++++++++++++++++++++
		//+ API event listeners
		//+++++++++++++++++++++++++++++++++++++++++

		//Close view
		this.listenTo(this.parentView, 'calViewClosed', this.close);

		//Update month view when collection
		this.listenTo(this.collection, 'add change:status destroy', this.render);
	},
	
	//+++++++++++++++++++++++++++++++++++++++++
	//+ Render
	//+++++++++++++++++++++++++++++++++++++++++

	render: function(){
		
		//TODO: 'days' needs to be an array with: 
		//1. date; 2. avail count; 3. booked count; 4. tentative count
		//Then in the template you need to check if the count is gt 0 and only show badge when true <==== can current conditional do this? 
		this.availableCount = this.collection.filterByStatus('available').length;
		this.bookedCount = this.collection.filterByStatus('booked').length;
		this.tentativeCount = this.collection.filterByStatus('tentative').length;

		this.$el.html(this.monthTemplate({
			monthYear: this.monthYear,
			days: this.prettyDates,
			context: this.context,
			availableCount: this.availableCount,
			bookedCount: this.bookedCount,
			tentativeCount: this.tentativeCount
		}));			
	},

	close: function(){
		this.remove();
	},

	//+++++++++++++++++++++++++++++++++++++++++
	//+ Show day view
	//+++++++++++++++++++++++++++++++++++++++++
	
	//Handle 'day' click event by passing to cal view object
	showDayView: function( e ){
		var day = parseInt(e.target.getAttribute('data-cal-day'));
		this.parentView.showDayView( day );
	}
});