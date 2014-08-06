var gumCal = gumCal || {};

var Slots = Backbone.Collection.extend({

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
	
	//++++++++++++++++++++++++++++++++++
	//+ Collection get methods
	//++++++++++++++++++++++++++++++++++
	
	getActiveSlots: function(){
		var tentativeSlots = this.filterByStatus('tentative'),
			bookedSlots = this.filterByStatus('booked'),
			activeSlots = tentativeSlots.concat(bookedSlots);

		return activeSlots;
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



