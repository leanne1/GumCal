var gumCal = gumCal || {};

gumCal.Slots = Backbone.Collection.extend({

	//URL is set at collection instantiation as '/api/v1/' + settings.adId + '/cal/slots';

	model: gumCal.Slot, 

	//TODO: for dev only until RESTful API wired in
	localStorage: new Backbone.LocalStorage('gumCal-backbone'),

	initialize:function(adId){
		//Override local storage namespace for this collection
		//TODO: for dev only until RESTful API wired in
		this.localStorage = new Backbone.LocalStorage('gumCal-backbone-' + adId);		
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

	empty: function(){
		var model;
		while ( model = this.first()) {
			model.destroy();
		}
	}
});



