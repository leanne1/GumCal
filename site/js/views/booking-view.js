var gumCal = gumCal || {};

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
		var attr = {
			name: this.$('[id^="name-"]').val(),
			phone: this.$('[id^="phone-"]').val(),
			email: this.$('[id^="email-"]').val(),
			message: this.$('[id^="msg-"]').val()
		};
		
		this.model.bookSlot(attr, this.context);
	},
	
	//+++++++++++++++++++++++++++++++++++++++++
	//+ Show notfication
	//+++++++++++++++++++++++++++++++++++++++++

	showNotification: function(){
		this.$('.success-notification').removeClass('hidden');
		this.$('[data-book-submit]').prop('disabled', true);
	}

});
