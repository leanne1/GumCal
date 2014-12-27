##Backbone Calendar application
===================
###About the application
The calendar application was built by me as Gumtree UK's submission to eBay's internal annual Tech Con, 2014. The app placed third in the competition. The purpose of the app is to improve the ease with which classified ad buyers and sellers can arrange meetings to transact. Please note that the code and opinions below are mine only and do not reflect any code, policy or product of eBay inc, eBay Classifieds Group or any of its related companies.

Currently, meetings between Gumtree UK buyers and sellers must be arranged via email and manually managed. The idea behind the calendar app is to allow sellers to publish a calendar on their View Item Page [the page detailing the goods or services they are selling] containing bookable time slots for buyer viewings. Buyers can then book one of these slots with a couple of mouse clicks. 

The app is built in Backbone.js, a javascript client-side MV* framework, with a MongoDB persistence layer storing calendar slots. There are two instances of the app, dependent on the context:

####Private instance
The private instance of the calendar is the calendar owner's instance. The calendar owner is the seller who publishes the calendar on their View Item Page. This instance of the calendar would be available to signed-in sellers when creating their ad in the 'post ad' flow, and later in their 'manage ads' dashboard. They can set various config options for the calendar before publishing it:  
 
- Start and end dates of meetings period
- Duration of meeting slots
- The meeting location and whether this is published publically with the calendar  or sent privately to those making bookings
- Optionally specifying if buyers should include a message when booking a meeting
- Setting appointment booking to auto-confirm or seller manual confirm

Once published, the calendar owner can create bookable slots in the calendar for buyers to book. They can also view booking details, confirm or delete bookings on a one-by-one basis, or clear the calendar of all appointments and bookable slots.

####Public instance
The public instance of the calendar runs from the same code base but has a more limited functionality. This instance of the app would be available to buyers on the view item pages. Buyers can see all currently available unbooked slots and can make a booking.

####Syncing
The two instances of the app are continually synced to the server so that changes to the private instance are instantly available to all running public instances and vice versa.

####Demo application
The demo here is a self-contained, fully-functioning app that can be run up locally. In reality, the app would be run in the Gumtree UK site and would integrate with signed-in buyer and seller backend applications, providing data about current users. In addition, emails and other forms of communication would be sent between buyers and sellers communicating booking status and booking status changes when certain calendar events are fired.

###Stub data
The public version of the app bootstraps from a config object in the page source and contains the various config options set by the calendar owner when the calendar was published. Because this is a self-contained demo, this config object is hard-coded into the public instance demo source code based on pre-set config options in the private instance demo source code. A small script also sets the start and end dates of the booking period to arround the current date so that the demo can be run up and work meaningfully without the need for any settings to be added or changed. In reality, this config object would be created at the time of calendar publication, saved to a persistence layer and be added to the View Item Page's source code by the back-end application.


###Running the app
- The app runs off a Node Express server using MongoDB as a persistence layer. You need to install <a href="http://nodejs.org/">Node</a> and <a href="http://www.mongodb.org/">Mongo</a>, then download and the app source from here and run it locally to demo the calendar app.
- Once Node and Mongo are installed, start up mongo with ```mongod```
- In your local copy of the project, navigate to the server folder and run ```node server``` to start the app
- Open two tabs in your broswer: 
	- http://localhost:8080/cal-private.html - the private instance of the calendar
	- http://localhost:8080/cal-public.html - the public instance of the calendar

###Using the app
- In the private instance of the app click 'publish cal', and add some slots
- Your slots can then be booked in the public instance of the calendar, and booked, viewed and deleted in the private instance of the calendar. You can also clear the whole calendar from the private instance's calendar dashboard


###What's missing
There are a few things missing from the code that will be added when time permits:

- Form valiation - there is currently no validation on the data imputed via forms e.g when bookings are made
- Tests - currently no JS unit tests on the app
- Polling: The two app instances [private and multiple public instances] are currently synced to the server using simple ajax polling running on a timer. This could be optimised by running the app on WebSockets
- Server-side templating - currently the demo app pages are built in static html with handlebars client-side templating for Backbone. Ideally, the private and public instance app pages would be built from a server-side templating engine also.



