'use strict';

/**
 * WebGL Ball Game Server
 *
 * @author Kevin Fitzgerald / @kftzg / http://kevinfitzgerald.net
 * Git: https://github.com/kfitzgerald/webgl-ball-game
 * Last Updated: 8/22/13 9:23 AM CST
 *
 * Copyright 2013 Kevin Fitzgerald
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http: *www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const Async = require('async');
const Hapi = require('hapi');
const IO = require('socket.io');
const Inert = require('inert');
const Path = require('path');
const BallGameSocketAPI = require('./lib/BallGameSocketAPI');

const port = parseInt(process.argv[process.argv.length-1]) || 3000; // e.g. node . 8080

Async.waterfall([

    // Init HAPI server
    (next) => {
        const server = new Hapi.Server();
        server.connection({ port, host: 'localhost' });
        next(null, server);
    },

    // Init socket.io
    (server, next) => {
        const io = IO(server.listener);
        next(null, server, io);
    },

    // Register inert (static assets)
    (server, io, next) => {
        server.register(Inert, (err) => {
            if (err) return next(err);

            server.route({
                method: 'GET',
                path: '/{param*}',
                handler: {
                    directory: {
                        path: Path.join(__dirname, 'static'),
                        listing: false
                    }
                },
            });

            next(null, server, io);
        });
    },

    // Register the socket game api
    (server, io, next) => {
        BallGameSocketAPI(io);
        next(null, server, io);
    },

    // Start the party
    (server, io, next) => {
        server.start((err) => {
            if (err) return next(err);

            console.log(`Server running at: ${server.info.uri}`);
            next();
        });
    }

], (err) => {
    if (err) {
        console.error(err);
        throw err;
    }
});