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
		this.dates = this.calSettings.days;
		this.prettyDates = this.calSettings.prettyDates;
		this.monthYear = this.calSettings.monthYearString;
		this.context = this.calSettings.context;
		this.collection = options.collection;
		this.days = [];

		this.render();

		//+++++++++++++++++++++++++++++++++++++++++
		//+ API event listeners
		//+++++++++++++++++++++++++++++++++++++++++

		//Close view
		this.listenTo(this.parentView, 'calViewClosed', this.close);

		//Update month view when collection
		this.listenTo(this.collection, 'reset add change:status destroy remove', this.render);
		
	},
	
	//+++++++++++++++++++++++++++++++++++++++++
	//+ Render
	//+++++++++++++++++++++++++++++++++++++++++

	render: function(){
		this.availableCount = this.collection.filterByStatus('available').length;
		this.bookedCount = this.collection.filterByStatus('booked').length;
		this.tentativeCount = this.collection.filterByStatus('tentative').length;

		this.getDayData();
		
		this.$el.html(this.monthTemplate({
			monthYear: this.monthYear,
			days: this.days,
			context: this.context,
			activeDay: this.parentView.lastDayViewed
		}));			
	},

	close: function(){
		this.remove();
	},
	
	//+++++++++++++++++++++++++++++++++++++++++
	//+ Get day data
	//+++++++++++++++++++++++++++++++++++++++++
	
	//Get data to show in each day cell of month view, and push each created array to this.days
	//0: PrettyDate number; 
	//1: booked count for date; 
	//2: tentative count for date 
	//3. available count  for date
	//4. Whether day is in past
	getDayData:function(){
		var self = this;
			this.days = [];
		_.each(this.dates, function(date, dateIndex){
			var dayData = [],
				bookedCount, tentativeCount, availableCount;
			
			//Push the date the day's data array			
			dayData.push(self.prettyDates[dateIndex]);

			//Push the count for each status to the day's data array	
			dayData.push(self.collection.getStatusCountByDate(date, 'booked').length);
			dayData.push(self.collection.getStatusCountByDate(date, 'tentative').length);
			dayData.push(self.collection.getStatusCountByDate(date, 'available').length);
			dayData.push(self.parentView.isInPast(self.dates[dateIndex]));
			
			self.days.push(dayData);
		});
	},

	//+++++++++++++++++++++++++++++++++++++++++
	//+ Show day view
	//+++++++++++++++++++++++++++++++++++++++++
	
	//Handle 'day' click event by passing to cal view object
	showDayView: function( e ){
		var day = parseInt($(e.currentTarget).attr('data-cal-day')),
			isInPast = $(e.currentTarget).hasClass('is-past')
			;
		//Only show day view if we are in private context, or in public context if the day is not in the past
		if (this.context === 'private' || !isInPast) {
			this.parentView.showDayView( day );
		} else {
			return;
		}
	}
});