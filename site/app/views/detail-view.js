var gumCal = gumCal || {};

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
