var gumCal = gumCal || {};
	gumCal.Cals = gumCal.Cals || {};

//Buyer side initialise
$(function(){
	
	//Instantiate a cal app 
	var calConfig = gumCal.config,
		adId = calConfig ? calConfig.adId : undefined,
		slots = {}
		;
		
		gumCal.Cals[adId] = {};

		//+++++++++++++++++++++++++++++++++++++++++
		//+ Create collection
		//+++++++++++++++++++++++++++++++++++++++++

		//App entry point - init new Backbone slots collection for this cal instance
		//retrieving any existing models from persistence layer
		//Note: don't use fetch in production code to boostrap - use a JSON object printed to the source from the server
		initSlots = function( settings ){
			var adId = settings.adId;
			
			slots[adId] = new gumCal.Slots(adId);
			
			///TODO: When using RESTful API, change this to be actual url
			slots[adId].url = '/api/v1/123456789/cal/slots';
			slots[adId].fetch({ reset: true });
			
			initCalView(settings, slots[adId]);
		};
		
		//+++++++++++++++++++++++++++++++++++++++++
		//+ Build cal view
		//+++++++++++++++++++++++++++++++++++++++++

		//Init new Backbone cal view [master view]
		initCalView = function( settings, collection ){
			var $cal = $('#calendar'),
				options = { settings: settings, collection: collection },
				calView = new gumCal.CalView( options );

			$cal.append(calView.render().el);
		};

		calConfig && initSlots( calConfig );
});