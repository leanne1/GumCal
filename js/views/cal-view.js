var gumCal = gumCal || {};

//Cal view [master view]
gumCal.CalView = Backbone.View.extend({
	
	tagName: 'div',

	calTemplate: Handlebars.compile($("#calview-template").html()),
	
	events: {
		'click [data-cancel-all]' : 'showCancelAllView'
	},

	initialize: function( options ){
		this.calSettings = this.extendSettings(options.settings);
		
		//Cache cal setting properties
		this.adId = this.calSettings.adId;
		this.collection = gumCal.Cals[this.adId].slots;
		this.context = this.calSettings.context;
		this.prettyStartDate = this.calSettings.prettyStartDate;
		this.prettyEndDate = this.calSettings.prettyEndDate;
		this.locationPrivate = this.calSettings.locationPrivate;
		this.autoConfirm = this.calSettings.autoConfirm;
		this.location = this.calSettings.location;

		this.lastDayViewed = undefined;
		this.currentDate = this.getCurrentDate();

		//+++++++++++++++++++++++++++++++++++++++++
		//+ API event listeners
		//+++++++++++++++++++++++++++++++++++++++++
		
		//Update last day viewed property
		this.on('lastDayViewed', this.updateLastDayViewed);
	},
	
	//+++++++++++++++++++++++++++++++++++++++++
	//+ Render
	//+++++++++++++++++++++++++++++++++++++++++
	
	render: function(){
		this.$el.html(this.calTemplate({
			context: this.context,
			startDate: this.prettyStartDate,
			endDate: this.prettyEndDate
		}));

		//Cache subview containers
		this.$dashboardContainer = this.$('[data-view="dashboard"]');
		this.$monthViewContainer = this.$('[data-view="month"]');
		this.$dayViewContainer = this.$('[data-view="day"]');
		
		//Call at end of cal view render - when containers are available
		this.buildDashboard();
		this.buildMonthView();

		return this;
	},

	//+++++++++++++++++++++++++++++++++++++++++
	//+ Close master and subviews
	//+++++++++++++++++++++++++++++++++++++++++
	
	//Close master view and all subviews, and remove listeners
	close: function(){
		this.off('lastDayViewed');
		this.trigger('calViewClosed');
		this.remove();
	},

	//+++++++++++++++++++++++++++++++++++++++++
	//+ Augment calendar settings
	//+++++++++++++++++++++++++++++++++++++++++
	
	//Build out required settings values programatically for augmentation of user settings
	extendSettings:function(settings){
		settings.dayCount = this.getDayCount(settings.startDate, settings.endDate);
		settings.days = this.incrementDays(settings.startDate, settings.dayCount);
		settings.prettyDays = this.getPrettyDays(settings.startDate, settings.dayCount);
		settings.prettyStartDate = settings.prettyDays[0];
		settings.prettyEndDate = settings.prettyDays[(settings.prettyDays.length)-1];
		settings.prettyDates = this.getPrettyDates(settings.days);
		settings.monthYearString = this.getMonthYear(settings.days);	
		settings.currentDate = this.currentDate;
		return settings;
	},

	//+++++++++++++++++++++++++++++++++++++++++
	//+ Build subviews
	//+++++++++++++++++++++++++++++++++++++++++
	
	//Dashboard
	buildDashboard: function(){
		if(this.context === 'seller') {
			var dashboardViewOptions = _.extend({ 
				el: this.$dashboardContainer,
				parentView: this
			}, this.calSettings);
			this.dashboardView = new gumCal.DashboardView( dashboardViewOptions );
		}
	},
	
	//Month view
	buildMonthView: function(){
		var monthViewOptions = _.extend({ 
			el: this.$monthViewContainer,
			parentView: this
		}, this.calSettings);
		this.monthView = new gumCal.MonthView( monthViewOptions );
	},

	//Day view
	buildDayView: function(dayToShow){
		var dayViewOptions = _.extend({ 
				showDay: dayToShow,
				parentView: this
			}, this.calSettings);
		this.dayView = new gumCal.DayView( dayViewOptions );
	},

	//+++++++++++++++++++++++++++++++++++++++++
	//+ Set up and show day view
	//+++++++++++++++++++++++++++++++++++++++++

	//Show or build day view
	showDayView: function( dayToShow ){
		if ( dayToShow !== this.lastDayViewed ) {
			//Trigger closeDayView day view event and build new day view
			this.trigger('closeDayView');
			this.buildDayView(dayToShow);
	
			//Render day view and append to day view container
			this.$dayViewContainer.html(this.dayView.render().el).show();
			
			//Render all slot subviews to day view
			this.dayView.appendAllSlots();

			//Show focus on month view day cell
			this.$monthViewContainer.find('[data-cal-day]').removeClass('is-active');
			this.$monthViewContainer.find('[data-cal-day="'+ dayToShow +'"]').addClass('is-active');

		};
		//Update last day viewed to current day
		this.trigger('lastDayViewed', dayToShow);
	},

	//Update last day viewed var so we can go back to last day viewed on day tab
	updateLastDayViewed: function( day ){
		this.lastDayViewed = day;
	},

	//+++++++++++++++++++++++++++++++++++++++++
	//+ Switch to month view
	//+++++++++++++++++++++++++++++++++++++++++

	showMonthView: function(){
		this.$dayViewContainer.hide();
		this.$monthViewContainer.show();
	},

	//+++++++++++++++++++++++++++++++++++++++++
	//+ Show cancel modal
	//+++++++++++++++++++++++++++++++++++++++++

	showCancelAllView: function(){
		//Close any currently active modal view
		this.closeAllEditViews();
		this.editView = new gumCal.CancelAllView( this.calSettings );
	},

	//+++++++++++++++++++++++++++++++++++++++++
	//+ Close all edit views
	//+++++++++++++++++++++++++++++++++++++++++

	closeAllEditViews: function(){
		this.editView && this.editView.remove();
	},
	
	//+++++++++++++++++++++++++++++++++++++++++
	//+ Calendar utils
	//+++++++++++++++++++++++++++++++++++++++++

	//Boolean flag to check if given date is in the past
	isInPast: function(date){
		return this.currentDate > date;
	},

	//+++++++++++++++++++++++++++++
	//+ Settings object utils
	//+++++++++++++++++++++++++++++

	getDayCount: function (startDate, endDate) {
		return this.countDays(startDate, endDate);
	},

	getPrettyDays: function(startDate, dayCount){
		return this.incrementPrettyDays(this.incrementDays(startDate, dayCount));
	},

	getPrettyDates: function(days){
		return _.map(days, function(day){
			var date = new Date(day);
			return date.getDate();
		});
	},

	countDays: function (startDate, endDate){
		var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
		var firstDate = new Date(startDate);
		var secondDate = new Date(endDate);
		var diffDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime())/(oneDay)));
		return diffDays + 1; //inclusive of end date
	},
	
	incrementDays: function (startDate, dayCount){
		var day, days = [],
			oneDay = 24*60*60*1000, // hours*minutes*seconds*milliseconds
			firstDate = new Date(startDate).getTime();
		
		for (var i=0; i<dayCount; i++){
			day = firstDate + (oneDay * i);
			days.push(day);	
		};
		return days;
	},
	
	incrementPrettyDays: function ( days ){
		var prettyDays = []; 
		for (var i=0; i<days.length; i++){
			prettyDays.push(this.getPrettyDate(new Date(days[i])));	
		};
		return prettyDays;
	},
	
	getPrettyDate: function( date ) {
		var _date = new Date(date),
			date, day, month, year, prettyDate
			;
		date = _date.getDate();
		day =  _date.getDay();
		month =  _date.getMonth();
		year =  _date.getFullYear();
		
		

		var days = [
			'Sunday',
			'Monday',
			'Tuesday',
			'Wednesday',
			'Thursday',
			'Friday',
			'Saturday'
		];

		day = days[day];
		month = this.getPrettyMonth(month);
		prettyDate = day + ',' + ' ' + date + ' ' + month + ' ' + year;	
		return prettyDate;
	}, 

	getPrettyMonth: function(month){
		var months = [
			'January',
			'Febuary',
			'March',
			'April',
			'May',
			'June',
			'July',
			'August',
			'September',
			'October',
			'November',
			'December'
		];
		return months[month];
	},

	//Get a string of month/s and year/s for which the current calendar spans
	getMonthYear:function(days){
		var strMonthYear = '', 
			startDate = new Date(days[0]),
			endDate = new Date(days[days.length-1]),
			startMonth = this.getPrettyMonth(startDate.getMonth()),
			endMonth = this.getPrettyMonth(endDate.getMonth()),
			startYear = startDate.getFullYear(),
			endYear = endDate.getFullYear()
			;

		//Concatenate month string/s
		if (startMonth === endMonth) {
			strMonthYear += startMonth + ', ';
		} else {
			strMonthYear += startMonth + ' - ' + endMonth + ', ';
		}
		
		//Concatenate years string/s
		if (startYear === endYear) {
			strMonthYear += startYear;
		} else {
			strMonthYear += startYear + '/' + endYear;
		}
		
		return strMonthYear;
	},

	//Get current date, normalised to UTC midnight
	getCurrentDate: function(){
		var today = new Date();
		today.setUTCHours(0,0,0,0);	
		return today;
	}
});



















