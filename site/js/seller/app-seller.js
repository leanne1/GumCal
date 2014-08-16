var gumCal = gumCal || {};
	gumCal.Cals = gumCal.Cals || {};


//Seller side initialise
$(function(){
	var initialiseCal, getUserSettings,
		calConfigs = document.querySelectorAll('[data-ad-config]'),
		cals = [], slots = {};
		;
		
	//+++++++++++++++++++++++++++++++++++++++++
	//+ Initialise gumcal app
	//+++++++++++++++++++++++++++++++++++++++++
	initialiseCal = function( el, adId ){
		var submitBtn = el.querySelector('[data-cal-submit]'),
			myCalTab = document.querySelector('[data-cal-tab="'+ adId +'"]')
		;
		
		//Instantiate jQuery date-pickers on date inputs
		$('#date-from-' + adId).datepicker({
	        dateFormat: 'yy-mm-dd'
	    });    
		$('#date-to-' + adId).datepicker({
	        dateFormat: 'yy-mm-dd'
	    }); 

		//Check if app has already been initialised; if not then initialise 
		submitBtn.addEventListener('click', function( e ){
			e.preventDefault();
			initCal(e, adId, el);
			
		});
		myCalTab.addEventListener('click', function( e ){
			initCal(e, adId, el);
		});
		//TODO: add an eventlister to the 'my cal' tab if source data-has-cal ==== true

	};	

	//+++++++++++++++++++++++++++++++++++++++++
	//+ Init cal
	//+++++++++++++++++++++++++++++++++++++++++
	
	initCal = function( e, adId, el ) {
		cals[adId] && cals[adId].close();
		cals[adId] = null;		
		getUserSettings(e, adId, el);	
	};

	//+++++++++++++++++++++++++++++++++++++++++
	//+ Get user settings
	//+++++++++++++++++++++++++++++++++++++++++
	
	//Get user settings from form submit
	getUserSettings = function( e, adId, el ){
		e.preventDefault();
		var userSettings = {};

		userSettings.context = 'seller';
		userSettings.adId = adId;
		userSettings.slotDuration = parseInt(el.querySelector('[id^="slot-duration"]').value);
		userSettings.startDate = el.querySelector('[id^="date-from"]').value;
		userSettings.endDate = el.querySelector('[id^="date-to"]').value;
		userSettings.location = el.querySelector('[id^="location"]').value;
		userSettings.locationPrivate = el.querySelector('[id^="location-private"]').checked ? true : false;
		userSettings.msgRequired = el.querySelector('[id^="buyer-msg-required"]').checked ? true : false;
		userSettings.msgSubject = el.querySelector('[id^="msg-subject"]').value;
		userSettings.autoConfirm = el.querySelector('[id^="auto-confirm"]').checked ? true : false;

		initSlots( userSettings );
	};

	//+++++++++++++++++++++++++++++++++++++++++
	//+ Create collection
	//+++++++++++++++++++++++++++++++++++++++++

	//App entry point - init new Backbone slots collection for this cal instance
	initSlots = function( settings ){
		var adId = settings.adId;
			
		//TODO: initialising with new empry array literal yokes the two seller-side cal collections
		//If need to do the above, try to do with empty array
		slots[adId] = new gumCal.Slots(adId);
		
		///TODO: uncomment when using RESTful API
		slots[adId].url = '/api/v1/123456789/cal/slots';
		//slots[adId].url = '/api/v1/' + adId + '/cal/slots';
		slots[adId].fetch({ reset: true });

		cals[adId] = initCalView(settings, slots[adId]);
	};

	//+++++++++++++++++++++++++++++++++++++++++
	//+ Build cal view
	//+++++++++++++++++++++++++++++++++++++++++

	//Init new Backbone cal view [master view]
	initCalView = function( settings, collection ){
		var $cal = $('#cal-' + settings.adId),
			options = { settings: settings, collection: collection },
			calView = new gumCal.CalView( options );
			$cal.append(calView.render().el);

		return calView;
	};

	//Listen for each calconfig on the page
	_.each(calConfigs, function( el, index ) {
		var adId = el.getAttribute('data-ad-id');
		gumCal.Cals[adId] = {};
		initialiseCal( el, adId );
	});
});