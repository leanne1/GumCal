var gumCal = gumCal || {};

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
});