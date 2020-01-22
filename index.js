console.log("Logging in to tunr_db database...");

const express = require('express');
const methodOverride = require('method-override');
const pg = require('pg');

// Initialise postgres client
const configs = {
        user: 'samuelhuang',
        host: '127.0.0.1',
        database: 'tunr_db',
        port: 5432,
};

const pool = new pg.Pool(configs);

pool.on('error', function (err) {
        console.log('idle client error', err.message, err.stack);
});

/**
 * ===================================
 * Configurations and set up
 * ===================================
 */

// Init express app
const app = express();

app.use(express.json());
app.use(express.urlencoded({
        extended: true
}));

app.use(methodOverride('_method'));

// Set react-views to be the default view engine
const reactEngine = require('express-react-views').createEngine();
app.set('views', __dirname + '/views');
app.set('view engine', 'jsx');
app.engine('jsx', reactEngine);

/**
 * ===================================
 * Routes
 * ===================================
 */

const home = (request,response) => {
    let insertQueryText = 'SELECT * FROM artists';

    pool.query(insertQueryText, (err, result)=>{
        let data = {
            artists: result.rows
        }
        if( err ){
            console.log("Error!", err);
            response.send("error");
        } else{
            response.render('home',data);
        }
    });
}

const postForm = (request,response) => {
    let insertQueryText = 'INSERT INTO artists (name, photo_url, nationality) VALUES ($1, $2, $3) RETURNING *';

    const values = [
        request.body.name,
        request.body.photo,
        request.body.nationality,
    ];

    pool.query(insertQueryText, values, (err, result)=>{
        if( err ){
            console.log("Error!", err);
            response.send("error");
        } else{
            let selectQueryAll = 'SELECT * FROM artists'
            pool.query(selectQueryAll, (allErr, allResult)=>{
                let data = {
                    artists: allResult.rows
                }
                response.render("home", data);
            });
        }
    });
}

const view = (request,response) => {
    let values = [request.params.id];
    let insertQueryText = 'SELECT * FROM artists WHERE id=$1';

    pool.query(insertQueryText, values, (err,result) => {
        let results = result.rows[0];

        let data = {
            id: results.id,
            name: results.name,
            img: results.photo_url,
            nationality: results.nationality
        }
    response.render('view', data)
    })
};

const songs = (request,response) => {
    let values = [request.params.id];
    let insertQueryText = 'SELECT * FROM artists WHERE id=$1';

    pool.query(insertQueryText, values, (err,result) => {
        let artist_id = [result.rows[0].id];
        let songQueryText = 'SELECT * FROM songs WHERE artist_id=$1';


        response.redirect('/artists');

            // instead of redirect you can use this as well too
    //     pool.query(songQueryText, artist_id, (songErr, songResult) => {

    //     let results = result.rows[0];
    //     let songs = songResult.rows;

    //         var data = {
    //         id: results.id,
    //         name: results.name,
    //         img: results.photo_url,
    //         nationality: results.nationality,
    //         songs: songs
    //         }
    //         response.render('home', data);
    //     })
    });
}

app.get('/artists', home);
app.get('/artists/new', (request, response) => {
    response.render('new');
});
app.get('/artists/:id', view);
app.get('/artists/:id/songs', songs);
app.post('/artists', postForm);
app.get('/', (request, response) => {
    response.redirect('/artists');
})

/**
 * ===================================
 * Listen to requests on port 3000
 * ===================================
 */
const server = app.listen(3000, () => console.log('~~~ Tuning in to the waves of port 3000 ~~~'));

let onClose = function(){

        console.log("closing");

        server.close(() => {

                console.log('Process terminated');

                pool.end( () => console.log('Shut down db connection pool'));
        })
};

process.on('SIGTERM', onClose);
process.on('SIGINT', onClose);