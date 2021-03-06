var should = require( 'should' ); //jshint ignore:line
var _ = require( 'lodash' );
var requestor = require( 'request' ).defaults( { jar: false } );
var debug = require( 'debug' )( 'autohost-spec:ws.adapter' );
var metrics = require( 'cluster-metrics' );
var port = 88988;
var config = {
		port: port,
		socketio: true,
		websocket: true
	};
var authProvider, passport, middleware, http, socket, socketAdapter;
var actionRoles = function( action, roles ) {
		authProvider.actions[ action ] = { roles: roles };
	};
var userRoles = function( user, roles ) {
		if( authProvider.users[ user ] ) {
			authProvider.users[ user ].roles = roles;
		} else {
			authProvider.users[ user ] = { roles: roles };
		}		
	};

describe( 'with socket adapter', function() {
	var ioClient,
		wsClient,
		wsSocket,
		cleanup = function() {
			userRoles( 'anonymous', [] );
			userRoles( 'userman', [] );
			actionRoles( 'test.call', [] );
		};

	before( function( done ) {
		authProvider = require( './auth/mock.js' )( config );
		passport = require( '../src/http/passport.js' )( config, authProvider, metrics );
		middleware = require( '../src/http/middleware.js' )( metrics );
		middleware.configure( config );
		http = require( '../src/http/http.js' )( requestor, middleware, metrics );
		socket = require( '../src/websocket/socket.js' )( config, http, middleware );
		socketAdapter = require( '../src/websocket/adapter.js' )( config, authProvider, socket, metrics );

		authProvider.tokens = { 'blorp': 'userman' };
		authProvider.users = { 
			'userman': { name: 'userman', password: 'hi', roles: [] },
			'anonymous': { name: 'anonymous', password: 'hi', roles: [] },
		};
		
		var connected = 0,
			check = function() {
				if( ++connected > 1 ) {
					done();
				}
			},
			io = require( 'socket.io-client' ),
			WebSocketClient = require('websocket').client;
		socketAdapter.action( { name: 'test' }, 'call', {
			method: 'get',
			topic: 'call',
			handle: function( env ) {
				env.reply( { data: { youSed: env.data.msg } } );
			}
		}, { topics: {} } );
		http.start( config, passport );
		socket.start( passport );
		ioClient = io( 'http://localhost:88988?token=blorp' );
		ioClient.once( 'reconnect', check );
		ioClient.once( 'connect', check );
		ioClient.io.open();

		var events = [ 
			'connect',
			'connect_error',
			'connect_timeout',
			'reconnect',
			'reconnect_attempt',
			'reconnecting',
			'reconnect_error',
			'reconnect_failed'
		];

		_.each( events, function( ev ) {
			ioClient.on( ev, function( d ) { debug( '%s JUST. HAPPENED. %s', ev, d ); } );
		} );

		wsClient = new WebSocketClient();
		wsClient.connect(
			'http://localhost:88988/websocket',
			'echo-protocol',
			'console',
			{ 'Authorization': 'Bearer blorp' }
		);
		wsClient.on( 'connect', function( cs ) {
			wsSocket = cs;
			check();
		} );
	} );

	describe( 'when using socket.io and adequate permissions', function() {
		var result;

		before( function( done ) {
			actionRoles( 'test.call', [ 'guest' ] );
			userRoles( 'anonymous', [ 'guest' ] );
			ioClient.once( 'test.call', function( env ) {
				result = env.youSed;
				done();
			} );
			ioClient.emit( 'test.call', { msg: 'hi from socket.io' } );
		} );

		it( 'should return echo', function() {
			result.should.equal( 'hi from socket.io' );
		} );

		after( cleanup );
	} );

	describe( 'when using socket.io and inadequate permissions', function() {
		var result;

		before( function( done ) {
			actionRoles( 'test.call', [ 'admin' ] );
			userRoles( 'anonymous', [ 'guest' ] );
			ioClient.once( 'test.call', function( env ) {
				result = env;
				done();
			} );
			ioClient.emit( 'test.call', { replyTo: 'test.call', msg: 'hi' } );
		} );

		it( 'should return error code', function() {
			result.should.equal( 'User lacks sufficient permission' );
		} );

		after( cleanup );
	} );

	describe( 'when using websockets and adequate permissions', function() {
		var result;

		before( function( done ) {
			actionRoles( 'test.call', [ 'guest' ] );
			userRoles( 'userman', [ 'guest' ] );
			wsSocket.once( 'message', function( msg ) {
				var json = JSON.parse( msg.utf8Data );
				if( json.topic === 'test.call' ) {
					result = json.data.youSed;
					done();
				}
			} );

			wsSocket.sendUTF( JSON.stringify( { 
				topic: 'test.call', 
				data: { msg: 'hi' }
			} ) );
		} );

		it( 'should return echo', function() {
			result.should.equal( 'hi' );
		} );

		after( cleanup );
	} );

	describe( 'when using websockets and inadequate permissions', function() {
		var result;

		before( function( done ) {
			actionRoles( 'test.call', [ 'admin' ] );
			wsSocket.once( 'message', function( msg ) {
				var json = JSON.parse( msg.utf8Data );
				if( json.topic === 'test.call' ) {
					result = json.data;
					done();
				}
			} );

			wsSocket.sendUTF( JSON.stringify( { 
				topic: 'test.call', 
				data: { replyTo: 'test.call', msg: 'hi' }
			} ) );
		} );

		it( 'should return error code', function() {
			result.should.equal( 'User lacks sufficient permission' );
		} );

		after( cleanup );
	} );

	after( function() {
		ioClient.removeAllListeners();
		socket.stop();
		http.stop();
	} );
} );