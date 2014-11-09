var application_root = __dirname,
    express = require( 'express' ), 
    path = require( 'path' ),
    mongoose = require( 'mongoose' ); 

var app = express();

app.configure( function() {
    app.use( express.bodyParser() );
    app.use( express.methodOverride() );
    app.use( app.router );
    app.use( express.static( path.join( application_root, '../site') ) );
    app.use( express.errorHandler({ dumpExceptions: true, showStack: true }));
});

//Routes
app.get( '/api/v1/123456789/cal', function(request, response){
    response.send( 'Calendar API is now running for cal 123456789' );    
});

//Connect to database
mongoose.connect( 'mongodb://localhost/slots_database' );

//Schemas
var Slot = new mongoose.Schema({
    autoConfirm: Boolean,
    date: Number,
    duration: Number,
    email: String,
    location: String,
    message: String,
    msgSubject: String,
    name: String,
    phone: String,
    prettyDate: String,
    prettyTime: String,
    status: String,
    time: Number,
    bookedBy: String
});

//Models
var SlotModel = mongoose.model( 'Slot', Slot );

//Get a list of all slots
app.get( '/api/v1/123456789/cal/slots', function( request, response ) {
    return SlotModel.find( function( err, slots ) {
        if( !err ) {
            return response.send( slots );
        } else {
            return console.log( err );
        }
    });
});

//Insert a new slot
app.post( '/api/v1/123456789/cal/slots', function( request, response ) {
    var slot = new SlotModel({
        autoConfirm: request.body.autoConfirm,
        date: request.body.date,
        duration: request.body.duration,
        email: request.body.email,
        location: request.body.location,
        message: request.body.message,
        msgSubject: request.body.msgSubject,
        name: request.body.name,
        phone: request.body.phone,
        prettyDate: request.body.prettyDate,
        prettyTime: request.body.prettyTime,
        status: request.body.status,
        time: request.body.time,
        bookedBy: request.body.bookedBy
    });
    
    return slot.save( function( err ) {
        if( !err ) {
            console.log( 'created' );
            return response.send( slot );
        } else {
            console.log( err );
        }
    });
});

//Get a single slot by id
app.get( '/api/v1/123456789/cal/slots/:id', function( request, response ) {
    return SlotModel.findById( request.params.id, function( err, slot ) {
        if( !err ) {
            return response.send( slot );
        } else {
            return console.log( err );
        }
    });
});

//Update a slot
app.put( '/api/v1/123456789/cal/slots/:id', function( request, response ) {
    console.log( 'Updating slot ' + request.body.name );
    return SlotModel.findById( request.params.id, function( err, slot ) {
        slot.autoConfirm = request.body.autoConfirm;
        slot.date = request.body.date;
        slot.duration = request.body.duration;
        slot.email = request.body.email;
        slot.location = request.body.location;
        slot.message = request.body.message;
        slot.msgSubject = request.body.msgSubject;
        slot.name = request.body.name;
        slot.phone = request.body.phone;
        slot.prettyDate = request.body.prettyDate;
        slot.prettyTime = request.body.prettyTime;
        slot.status = request.body.status;
        slot.time = request.body.time;
        slot.bookedBy = request.body.bookedBy;

        return slot.save( function( err ) {
            if( !err ) {
                console.log( 'slot updated' );
                return response.send( slot );
            } else {
                console.log( err );
            }
        });
    });
});

//Delete a slot
app.delete( '/api/v1/123456789/cal/slots/:id', function( request, response ) {
    console.log( 'Deleting slot with id: ' + request.params.id );
    return SlotModel.findById( request.params.id, function( err, slot ) {
        return slot.remove( function( err ) {
            if( !err ) {
                console.log( 'Slot removed' );
                return response.send( '' );
            } else {
                console.log( err );
            }
        });
    });
});

//Start server
var port = 8080;
app.listen( port, function() {
    console.log( 'Express server listening on port %d in %s mode', port, app.settings.env );
}); 