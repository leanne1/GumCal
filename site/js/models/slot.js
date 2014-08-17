var gumCal = gumCal || {};

gumCal.Slot = Backbone.Model.extend({
	
	defaults: {
		name: '',
		email: '',
		phone: '',
		message: ''
	},

	//TODO: We may need to change this value / remove this property
	//when we wire into the scala persistence layer
	idAttribute: '_id',
	
	initialize: function(options){
		this.calSettings = options || {};
		this.autoConfirm = this.calSettings.autoConfirm;
	},
	
	//+++++++++++++++++++++++++++++++++++++++++
	//+ Book slot
	//+++++++++++++++++++++++++++++++++++++++++

	bookSlot: function(attr, context){
		if ( (context === 'seller') || (context === 'buyer' && this.autoConfirm) ) {
			attr.status = 'booked';
		} else if ( context === 'buyer' && !this.autoConfirm ) {
			attr.status = 'tentative';
		}
		this.setAttributes(attr);
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
			message: ''
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
		this.set( attr );
		this.save({wait:true, patch:true});
	}
});