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
			//TODO: uncomment when using RESTful API
			//slots[adId].url = '/api/v1/' + adId + '/cal/slots';
			slots[adId].fetch({ reset: true });
		
			initCalView(settings);
		};
		
		//+++++++++++++++++++++++++++++++++++++++++
		//+ Build cal view
		//+++++++++++++++++++++++++++++++++++++++++

		//Init new Backbone cal view [master view]
		initCalView = function( settings ){
			var $cal = $('#calendar'),
				options = { settings: settings, collection: slots[settings.adId] },
				calView = new gumCal.CalView( options );

			$cal.append(calView.render().el);
		};

		calConfig && initSlots( calConfig );
});