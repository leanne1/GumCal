var gumCal = gumCal || {};

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
		this.collection = gumCal.Cals[this.calSettings.adId].slots;
		this.context = this.calSettings.context;
		this.days = this.calSettings.days;
		this.prettyDays = this.calSettings.prettyDays;
		this.showDay = this.calSettings.showDay; 
		this.date = this.calSettings.days[this.calSettings.showDay]; //TODO: simplify to this.showDay when NaN bug fixed
		this.slotDuration = this.calSettings.slotDuration
		this.location = this.calSettings.location;
		this.msgSubject = this.calSettings.msgSubject;
		this.autoConfirm = this.calSettings.autoConfirm;	
		this.slotViews = [];
		
		console.log(this.calSettings);

		this.slotTimes = this.makeSlotPlaceholders();
		this.prettySlotTimes = this.getPrettyTimes(this.slotTimes);

		console.log('this.calSettings.showDay is day vew initialize')
		console.log(this.calSettings.showDay)

		console.log('this.date  in day view initialize');
		console.log(this.date)

		//+++++++++++++++++++++++++++++++++++++++++
		//+ API event listeners
		//+++++++++++++++++++++++++++++++++++++++++
		
		//New slot added to collection - render its subview to day view
		this.listenTo(this.collection, 'add', this.appendOneSlot);
		
		//Day view (this) removed - remove all slot subviews
		this.listenTo(this.parentView, 'closeDayView', this.close);

		//Close view
		this.listenTo(this.parentView, 'calViewClosed', this.close);

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

			console.log('this.slotTimes which the each iterates')
			console.log(this.slotTimes)
		//Concatenate times and pretty times for templating
		_.each(this.slotTimes, function(time, index){
			console.log('time as pushed into each loop [param]')	
			console.log(time);

			return times.push([
				time,
				self.prettySlotTimes[index]
			]);
		});

		console.log('times is');
		console.log(times);

		this.$el.html(this.dayTemplate({
			times: times,
			prettyDate: prettyDate, 
			context: this.context
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
	//+ forking for buyer or seller context
	//++++++++++++++++++++++++++++++++++++++++++++

	makeSlotPlaceholders: function () {
		var placeholders;

		if (this.context === 'seller') {
			placeholders = this.makeSellerSlotPlaceholders();
		} else {
			placeholders = this.makeBuyerSlotPlaceholders();
		}
		return placeholders;
	},

	makeSellerSlotPlaceholders: function(){
		var date = this.date,
			startHour = 6, 
			endHour = 24,
			increment = this.slotDuration,
			slotTimes = this.incrementTime(date, startHour, endHour, increment)
			;

			//!!!This is undefined!!!!
			console.log('this.date in makeSellerSlotPlaceholders')
			console.log(this.date)
	
			console.log('slotTimes in makeSellerSlotPlaceholders')
			console.log(slotTimes)

		return slotTimes;
	},

	makeBuyerSlotPlaceholders: function(){
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

	createSlot: function( e ){
		var slotIndex = parseInt(e.target.getAttribute('data-cal-slot')),
			slotTime = e.target.getAttribute('data-cal-datetime')
			; 
			
		//Check we clicked on a placeholder	to abort bubbing of slot view clicks
		//and preventing multiple instances of the same model being created	
		if (slotTime && this.context === 'seller') {
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
			slots = this.collection.filterByDate(this.date);
		_.each(slots, function(slot){
			self.appendOneSlot(slot);
		});
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
		var prevDay = this.parentView.lastDayViewed - 1;
		prevDay = prevDay < 0 ? 0 : prevDay;
		this.parentView.showDayView(prevDay);
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

});