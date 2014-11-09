var gumCal = gumCal || {};

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

	stopPoll: function(){
		window.clearInterval(this.poll);
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



