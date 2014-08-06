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
		this.prettyDays = this.calSettings.prettyDays;
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
		this.$el.html(this.monthTemplate({
			days: this.prettyDays,
			context: this.context
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