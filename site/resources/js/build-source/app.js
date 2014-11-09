Handlebars.registerHelper('ifEquals', function(v1, v2, options) {
  if(v1 === v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});

Handlebars.registerHelper('ifNotEquals', function(v1, v2, options) {
  if(v1 !== v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});;var gumCal = gumCal || {};

gumCal.Slot = Backbone.Model.extend({
	
	defaults: {
		name: '',
		email: '',
		phone: '',
		message: '',
		bookedBy: ''
	},

	idAttribute: '_id',
	
	initialize: function(options){
		this.calSettings = options || {};
		this.autoConfirm = this.calSettings.autoConfirm;
	},
	
	//+++++++++++++++++++++++++++++++++++++++++
	//+ Book slot
	//+++++++++++++++++++++++++++++++++++++++++

	//Called from booking view
	bookSlot: function(attr, context){
		if ( (context === 'private') || (context === 'public' && this.autoConfirm) ) {
			attr.status = 'booked';
		} else if ( context === 'public' && !this.autoConfirm ) {
			attr.status = 'tentative';
		}
		this.setAttributes(attr);
	},

	//+++++++++++++++++++++++++++++++++++++++++
	//+ Verify model
	//+++++++++++++++++++++++++++++++++++++++++
	
	//Check model exists in remote collection before running a callback
	verify: function(success, error){
		this.fetch({
			//Model exists in remote collection, run the callback
			success:function(){
				success && success();
			},
			//Model does not exist in remote collection
			error:function(){
				error && error();
				return;
			}
		});
	},

	//+++++++++++++++++++++++++++++++++++++++++
	//+ Cancel slot
	//+++++++++++++++++++++++++++++++++++++++++
	
	cancelSlot: function(){
		var attr = {
			status: 'available',
			name: '',
			phone: '',
			email: '',
			message: '',
			bookedBy: ''
		}
		this.setAttributes(attr);
	},

	//+++++++++++++++++++++++++++++++++++++++++
	//+ Confirm slot
	//+++++++++++++++++++++++++++++++++++++++++
	
	confirmSlot: function(){
		var attr = { 'status' : 'booked' };
		this.setAttributes(attr);
	},

	//+++++++++++++++++++++++++++++++++++++++++
	//+ Slot utils
	//+++++++++++++++++++++++++++++++++++++++++

	setAttributes: function( attr ){
		var self = this;
		this.verify(function(){
			self.set( attr );
			self.save({wait:true, patch:true});	
		});
	}
});;var gumCal = gumCal || {};

gumCal.Slots = Backbone.Collection.extend({

	//URL is set at collection instantiation as '/api/v1/' + settings.adId + '/cal/slots';

	model: gumCal.Slot, 

	initialize:function(adId){
		this.pollRemote();
		console.log('test2');
	},

	//++++++++++++++++++++++++++++++++++
	//+ Remote collection polling
	//++++++++++++++++++++++++++++++++++
	//Continually poll server for collection updates
	pollRemote: function(){
		var self = this;
		this.poll = window.setInterval(function(){
			self.fetch();
		},1000);
	},

	//++++++++++++++++++++++++++++++++++
	//+ Collection filter methods
	//++++++++++++++++++++++++++++++++++
	
	filterByDate: function(date){
		return this.filter(function(slot){
			return slot.get('date') === date;
		});
	},
	
	filterByStatus: function(status){
		return this.filter(function(slot){
			return slot.get('status') === status;
		});
	},
	
	filterByLive: function(){
		var today = new Date();
			today.setUTCHours(0,0,0,0);
			today = today.getTime()
		
		return this.filter(function(slot){
			return slot.get('date') >= today;
		});	
	},

	//++++++++++++++++++++++++++++++++++
	//+ Collection get methods
	//++++++++++++++++++++++++++++++++++
	
	//Get all tentative and booked slots
	getActiveSlots: function(){
		var tentativeSlots = this.filterByStatus('tentative'),
			bookedSlots = this.filterByStatus('booked'),
			activeSlots = tentativeSlots.concat(bookedSlots);

		return activeSlots;
	},

	//Get all slots for a given date and status
	getStatusCountByDate: function(date, status){
		var statusCountByDate,
			slotsByDate
			;

		//Filter all slots by date	
		slotsByDate = this.filterByDate(date);
		
		//Filter date slots by status	
		statusCountByDate = this.filterByStatus.call(slotsByDate, status);
		
		return statusCountByDate;
	},

	//++++++++++++++++++++++++++++++++++
	//+ Empty collection
	//++++++++++++++++++++++++++++++++++

	//Empty whole collection
	empty: function(){
		var model;
		while ( model = this.first()) {
			model.destroy();
		}
	},
	
	//Destroy live slots
	emptyLive: function(){
		var liveSlots = this.filterByLive();

		_.each(liveSlots, function(slot){
			slot.destroy();
		})		
	}
});



;var gumCal = gumCal || {};

//Cal view [master view]
gumCal.CalView = Backbone.View.extend({
	
	tagName: 'div',

	className: 'panel panel-default',

	calTemplate: Handlebars.compile($("#calview-template").html()),
	
	events: {
		'click [data-cancel-all]' : 'showCancelAllView'
	},

	initialize: function( options ){
		this.calSettings = this.extendSettings(options.settings);
		
		//Cache cal setting properties
		this.adId = this.calSettings.adId;
		this.collection = options.collection;
		this.context = this.calSettings.context;
		this.prettyStartDate = this.calSettings.prettyStartDate;
		this.prettyEndDate = this.calSettings.prettyEndDate;
		this.locationPrivate = this.calSettings.locationPrivate;
		this.autoConfirm = this.calSettings.autoConfirm;
		this.location = this.calSettings.location;
		this._$calSubmitBtn = $('[data-cal-submit="' + this.adId + '"]');

		this.lastDayViewed = undefined;
		this.currentDate = this.getCurrentDate();
		this.setSubmitState();

		console.log(this.calSettings);
		console.log(this.collection);

		//+++++++++++++++++++++++++++++++++++++++++
		//+ API event listeners
		//+++++++++++++++++++++++++++++++++++++++++
		
		//Update last day viewed property
		this.on('lastDayViewed', this.updateLastDayViewed);

		//Set state on cal submit button when collection length changed
		this.listenTo(this.collection, 'remove add', this.setSubmitState);

	},
	
	//+++++++++++++++++++++++++++++++++++++++++
	//+ Render
	//+++++++++++++++++++++++++++++++++++++++++
	
	render: function(){
		this.$el.html(this.calTemplate({
			context: this.context,
			startDate: this.prettyStartDate,
			endDate: this.prettyEndDate,
			location: this.location,
			locationPrivate: this.locationPrivate
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
	//+ Set calendar submit button state
	//+++++++++++++++++++++++++++++++++++++++++
	
	//Enable / disable submit button on cal depending on collection status	
	setSubmitState: function(){
		if(this.collection.length) {
			this._$calSubmitBtn.attr('disabled', true);
		} else {
			this._$calSubmitBtn.removeAttr('disabled');
		}
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
		if(this.context === 'private') {
			var dashboardViewOptions = _.extend({ 
				el: this.$dashboardContainer,
				collection: this.collection,
				parentView: this
			}, this.calSettings);
			this.dashboardView = new gumCal.DashboardView( dashboardViewOptions );
		}
	},
	
	//Month view
	buildMonthView: function(){
		var monthViewOptions = _.extend({ 
			el: this.$monthViewContainer,
			collection: this.collection,
			parentView: this
		}, this.calSettings);
		this.monthView = new gumCal.MonthView( monthViewOptions );
	},

	//Day view
	buildDayView: function(dayToShow){
		var dayViewOptions = _.extend({ 
				showDay: dayToShow,
				collection: this.collection,
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
		var cancelAllViewOptions = _.extend(
			{ collection:this.collection }, 
			this.calSettings
			);
		
		//Close any currently active modal view
		this.closeAllEditViews();
		this.editView = new gumCal.CancelAllView( cancelAllViewOptions );
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



















;var gumCal = gumCal || {};

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
			isLiveEmpty: !this.collection.filterByLive().length
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



















;var gumCal = gumCal || {};

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
});;var gumCal = gumCal || {};

//Day view
gumCal.DayView = Backbone.View.extend({
	
	tagName: 'div',

	dayTemplate: Handlebars.compile($("#dayview-template").html()),

	events: {
		'click [data-next-day]' : 'getNextDay',
		'click [data-prev-day]' : 'getPrevDay',
		'click [data-cal-slot]' : 'createSlot'
	},

	initialize: function( options ){
		this.calSettings = options || {};
		
		//Cache cal setting properties
		this.parentView = this.calSettings.parentView; //Cal view
		this.collection = options.collection;
		this.context = this.calSettings.context;
		this.days = this.calSettings.days;
		this.prettyDays = this.calSettings.prettyDays;
		this.showDay = this.calSettings.showDay; 
		this.date = this.calSettings.days[this.showDay];
		this.slotDuration = this.calSettings.slotDuration
		this.location = this.calSettings.location;
		this.msgSubject = this.calSettings.msgSubject;
		this.autoConfirm = this.calSettings.autoConfirm;	
		this.slotViews = [];
		
		this.slotTimes = this.makeSlotPlaceholders();
		this.prettySlotTimes = this.getPrettyTimes(this.slotTimes);

		//+++++++++++++++++++++++++++++++++++++++++
		//+ API event listeners
		//+++++++++++++++++++++++++++++++++++++++++

		//New slot added to collection - render its subview to day view
		this.listenTo(this.collection, 'add', this.appendOneSlot);

		//Check if a prevously closed slot needs to be re-appended to day view on public side
		this.listenTo(this.collection, 'change:status', this.checkSlotPreviousStatus);

		//Day view (this) or cal view removed - remove all slot subviews
		this.listenTo(this.parentView, 'calViewClosed closeDayView', this.close);
	},

	//+++++++++++++++++++++++++++++++++++++++++
	//+ Render
	//+++++++++++++++++++++++++++++++++++++++++
	
	//Returning view for immediate appending to cal view
	render: function(){
		var self = this,
			times = [],
			prettyDate = this.prettyDays[this.showDay]
			;

		//Concatenate times and pretty times for templating
		_.each(this.slotTimes, function(time, index){
			return times.push([
				time,
				self.prettySlotTimes[index]
			]);
		});
		
		this.$el.html(this.dayTemplate({
			times: times,
			prettyDate: prettyDate, 
			context: this.context,
			isInPast: this.parentView.isInPast(this.date)
		}));	

		return this;
	},

	//Close day view and all slot subviews
	close: function(){
		this.removeAllSlotViews();
		this.remove();
	},

	//++++++++++++++++++++++++++++++++++++++++++++
	//+ Build slot placeholders - 
	//+ forking for public or private context
	//++++++++++++++++++++++++++++++++++++++++++++

	makeSlotPlaceholders: function () {
		var placeholders;

		if (this.context === 'private') {
			placeholders = this.makePrivateSlotPlaceholders();
		} else {
			placeholders = this.makePublicSlotPlaceholders();
		}
		return placeholders;
	},

	makePrivateSlotPlaceholders: function(){
		var date = this.date,
			startHour = 6, 
			endHour = 24,
			increment = this.slotDuration,
			slotTimes = this.incrementTime(date, startHour, endHour, increment)
			;
		return slotTimes;
	},

	makePublicSlotPlaceholders: function(){
		var date = this.date,
			startHour = 6, 
			endHour = 24,
			increment = this.slotDuration,
			slotTimes = this.incrementTime(date, startHour, endHour, increment)
			;
	
		return slotTimes;
	},
	
	//+++++++++++++++++++++++++++++++++++++++++
	//+ Create new slot
	//+++++++++++++++++++++++++++++++++++++++++

	//Create a slot when slot placeholder clicked
	createSlot: function( e ){
		var slotIndex = parseInt(e.target.getAttribute('data-cal-slot')),
			slotTime = e.target.getAttribute('data-cal-datetime'), 
			isInPast = this.parentView.isInPast(this.date);
			; 
			
		//Check we clicked on a placeholder	to abort bubbing of slot view clicks
		//and preventing multiple instances of the same model being created	
		if (slotTime && !isInPast && this.context === 'private') { 
			this.collection.create(this.createSlotAttributes(slotIndex), {wait : true});	
		}
	},
	
	//Create the attributes to pass to new slot models	
	createSlotAttributes: function(slotIndex){
		return {
			date: this.date,
			time: this.slotTimes[slotIndex],
			prettyTime: this.prettySlotTimes[slotIndex],
			prettyDate: this.prettyDays[this.showDay],
			status: 'available',
			duration: this.slotDuration,
			location: this.location,
			msgSubject: this.msgSubject,
			autoConfirm: this.autoConfirm
		};
	},

	//+++++++++++++++++++++++++++++++++++++++++
	//+ Create and append slot views
	//+++++++++++++++++++++++++++++++++++++++++
	
	appendOneSlot: function( model ){
		var slotViewSettings = _.extend({ model: model }, this.calSettings ),
			slotView = new gumCal.SlotView( slotViewSettings )
			;
		this.slotViews.push(slotView);
		
		//Append slot view to matched placeholder
		this.$('[data-cal-datetime="'+ model.get('time') +'"]').append(slotView.render().el);
	},

	//Called by cal view at page load
	appendAllSlots: function(){
		var self = this,
			slots = this.collection.filterByDate(this.date),
			availableSlots = this.collection.filterByStatus.call(slots, 'available')
			;
		if (this.context === 'private') {
			//private cal - append all slots types for this date
			_.each(slots, function(slot){
				self.appendOneSlot(slot);
			});
		} else {
			//public cal - append only available slots for this date
			_.each(availableSlots, function(slot){
				self.appendOneSlot(slot);
			});

		}
	},

	//+++++++++++++++++++++++++++++++++++++++++
	//+ Check a slot with changed status
	//+++++++++++++++++++++++++++++++++++++++++
	
	//Re-append an available slot to public side if it has been booked/tentative and removed previously
	checkSlotPreviousStatus: function(slot){
		var updatedStatus = slot.get('status'),
			previousStatus = slot.previous('status')
			;
		if (this.context === 'public' && updatedStatus === 'available') {
			if (previousStatus === 'booked' || previousStatus === 'tentative') {
				this.appendOneSlot(slot);
			}
		}	
	},

	//++++++++++++++++++++++++++++++++++++
	//+ Remove slots views
	//++++++++++++++++++++++++++++++++++++
	
	//When day view is removed, remove all slot subviews also
	removeAllSlotViews: function(){
		_.each(this.slotViews, function(slotView){
			slotView.remove();
		});
	},	

	//++++++++++++++++++++++++++++++++++++
	//+ Prev / next day tab handlers
	//++++++++++++++++++++++++++++++++++++
	
	//Next day tab
	getNextDay: function(){
		var nextDay = this.parentView.lastDayViewed + 1;
		nextDay = nextDay > this.days.length - 1 ? this.days.length - 1 : nextDay;
		this.parentView.showDayView(nextDay);
	},

	//Prev day tab
	getPrevDay: function(){
		var prevDay = this.parentView.lastDayViewed - 1,
			isInPast
			;
		prevDay = prevDay < 0 ? 0 : prevDay;
		isInPast = this.parentView.isInPast(this.days[prevDay]);
		
		//Check if we are in private context, or if in public context, that chosen day is not in the past		
		if (this.context === 'private' || !isInPast){
			this.parentView.showDayView(prevDay);
		} else {
			return;
		}
	},

	//++++++++++++++++++++++++++++++++++++++
	//+ Slot placeholder builder utils
	//++++++++++++++++++++++++++++++++++++++

	incrementTime: function (date, startHour, endHour, increment){
		var minute = 1000 * 60,
			hour = minute * 60,
			times = [],
			date = new Date(date);
			timeZoneOffset = (date.getTimezoneOffset() / 60),
			dateTime = date.getTime();
			
			startTime = dateTime + (hour * (startHour + timeZoneOffset)), 
			endTime = dateTime + (hour * (endHour + timeZoneOffset)),
			milliSecondsIncrement = increment * minute,
			incCount = (endHour - startHour) * (60 / increment)
			;
			times.push(startTime);

		for (var i = 0; i<incCount; i++) {
			startTime = startTime + milliSecondsIncrement;
			times.push(startTime);
		};
		return times;
	},

	getPrettyTimes: function( times ){
		var prettyTimes = _.map(times, function( time ){
			var time = new Date(time),
				hour = time.getHours(),
				hour = hour === 0 ? '24' : hour, 
				hour = hour < 10 ? '0' + hour : hour,
				mins = time.getMinutes(),
				mins = mins === 0 ? '00' : mins
				;
				return hour + '.' + mins;
		});
		return prettyTimes;
	}

});;var gumCal = gumCal || {};

//Booking modal view
gumCal.BookingView = Backbone.View.extend({

	tagName: 'div',

	className: 'modal fade',

	id: 'bookModal',
	
	bookingTemplate: Handlebars.compile($("#bookingview-template").html()),
	
	events: {
		'click [data-book-submit]' : 'bookSlot'
	},
	
	initialize: function( options ){
		this.calSettings = options || {};
		
		//Cache cal setting properties
		this.context = this.calSettings.context;
		this.adId = this.calSettings.adId;
		this.collection = gumCal.Cals[this.adId].slots;
		this.msgRequired = this.calSettings.msgRequired;
		this.msgSubject = this.calSettings.msgSubject;
		this.autoConfirm = this.calSettings.autoConfirm;

		//Listen for bootstrap modal close event before removing view
		this.$el.on('hidden.bs.modal', function () {
  			this.remove();
		});

		this.render();

		//+++++++++++++++++++++++++++++++++++++++++
		//+ API event listeners
		//+++++++++++++++++++++++++++++++++++++++++
		
		//Show success notification when slot booked
		this.listenTo(this.model, 'change:status', this.showNotification);
		
		//Remove booking modal if slot is removed during a booking attempt
		this.listenTo(this.model, 'remove', this.close)

	},
	
	//+++++++++++++++++++++++++++++++++++++++++
	//+ Render
	//+++++++++++++++++++++++++++++++++++++++++

	render: function(){
		var bookingView = this.$el.html(this.bookingTemplate({
			context: this.context,
			autoConfirm: this.autoConfirm, 
			adId: this.adId,
			prettyDate: this.model.escape('prettyDate'),
			prettyTime: this.model.escape('prettyTime'),
			msgRequired: this.msgRequired,
			msgSubject: this.msgSubject,
			name: this.$('[id^="name-"]').val(),
			email: this.$('[id^="email-"]').val()
		}));	

		$('body').prepend(bookingView);	
		
		//Template is available, call bootstrap modal
		$('#'+this.id).modal();
	},

	//+++++++++++++++++++++++++++++++++++++++++
	//+ Book slot action
	//+++++++++++++++++++++++++++++++++++++++++
	
	bookSlot: function(e){
		e.preventDefault();
		var self = this,
			attr = {
			name: this.$('[id^="name-"]').val(),
			phone: this.$('[id^="phone-"]').val(),
			email: this.$('[id^="email-"]').val(),
			message: this.$('[id^="msg-"]').val(),
			bookedBy: this.context,
		};
		
		this.model.verify(function(){
			self.model.bookSlot(attr, self.context);	
		});
		
	},
		
	//+++++++++++++++++++++++++++++++++++++++++
	//+ Show notfication
	//+++++++++++++++++++++++++++++++++++++++++

	showNotification: function(){
		this.$('.success-notification').removeClass('hidden');
		this.$('[data-book-submit]').prop('disabled', true);
	},

	//+++++++++++++++++++++++++++++++++++++++++
	//+ Close modal view
	//+++++++++++++++++++++++++++++++++++++++++
	
	close: function(){
		this.$el.find('[data-dismiss="modal"]').click();
	}
});
;var gumCal = gumCal || {};

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
;var gumCal = gumCal || {};

//Slot details modal view
gumCal.DetailsView = Backbone.View.extend({

	tagName: 'div',

	className: 'modal fade',

	id: 'detailsModal',
	
	detailsTemplate: Handlebars.compile($("#detailview-template").html()),
	
	events: {
		'click [data-confirm-slot]' : 'confirmSlot',
		'click [data-cancel-slot]' : 'cancelSlot'
	},
	
	initialize: function( options ){
		this.calSettings = options || {};

		//Cache cal setting properties
		this.parentView = this.calSettings.parentView;
	
		//Listen for bootstrap modal close event before removing view
		this.$el.on('hidden.bs.modal', function () {
  			this.remove();
		});

		this.render();

		//+++++++++++++++++++++++++++++++++++++++++
		//+ API event listeners
		//+++++++++++++++++++++++++++++++++++++++++
		
		//Show success notification when slot cancelled / confirmed
		this.listenTo(this.model, 'change:status', this.showNotification);
	},

	//+++++++++++++++++++++++++++++++++++++++++
	//+ Render
	//+++++++++++++++++++++++++++++++++++++++++

	render: function(){
	var detailsView = this.$el.html(this.detailsTemplate({
			prettyDate: this.model.escape('prettyDate'),
			prettyTime: this.model.escape('prettyTime'), 
			location: this.model.escape('location'),
			name: this.model.escape('name'),
			phone: this.model.escape('phone'),
			email: this.model.escape('email'),
			msgSubject: this.model.escape('msgSubject'),
			message: this.model.escape('message'),
			status: this.model.escape('status'),
			isInPast: this.parentView.isInPast(this.model.get('date'))
		}));	
		
		$('body').prepend(detailsView);	

		//Template is available, call bootstrap modal
		$('#'+this.id).modal();
	},

	//+++++++++++++++++++++++++++++++++++++++++
	//+ Cancel slot 
	//+++++++++++++++++++++++++++++++++++++++++
	
	cancelSlot: function(){
		this.model.cancelSlot();
	},

	//+++++++++++++++++++++++++++++++++++++++++
	//+ Confirm slot 
	//+++++++++++++++++++++++++++++++++++++++++
	
	confirmSlot: function(){
		this.model.confirmSlot();
	},

	//+++++++++++++++++++++++++++++++++++++++++
	//+ Show notfications
	//+++++++++++++++++++++++++++++++++++++++++
	
	showNotification: function(){
		var status = this.model.get('status');
		if (status === 'booked') {
			this.$('.success-notification.confirm').removeClass('hidden');
		} else if (status === 'available') {
			this.$('.success-notification.cancel').removeClass('hidden');
		}
		this.$('[data-confirm-slot], [data-cancel-slot]').prop('disabled', true);
	},

});
;var gumCal = gumCal || {};

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
	
	//Destroy all live slots
	cancelCloseAllSlots: function(){
		this.collection.emptyLive();
	},

	//Revert all live tentative and booked slots to available
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
