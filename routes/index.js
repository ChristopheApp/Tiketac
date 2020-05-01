var express = require('express');
var router = express.Router();

let journeyModel = require('../models/connection');
let userModel = require('../models/users');

var city = ["Paris","Marseille","Nantes","Lyon","Rennes","Melun","Bordeaux","Lille"]
var date = ["2018-11-20","2018-11-21","2018-11-22","2018-11-23","2018-11-24"]



/* GET home page. */
router.get('/', function(req, res, next) {
  req.session.myTickets = null;
  req.session.user = null;
  res.render('login');
});

router.get('/homepage', function(req, res, next) {
  res.render('homepage', {user: req.session.user});
});



// Cette route est juste une verification du Save.
// Vous pouvez choisir de la garder ou la supprimer.
router.get('/result', function(req, res, next) {

  // Permet de savoir combien de trajets il y a par ville en base
  for(i=0; i<city.length; i++){

    journeyModel.find( 
      { departure: city[i] } , //filtre
  
      function (err, journey) {

          console.log(`Nombre de trajets au départ de ${journey[0].departure} : `, journey.length);
      }
    )

  }


  res.render('index', { title: 'Express' });
});

// Route qui s'active quand on choisit 2 villes et une date
router.post('/find-way', async function(req, res){
  let departure = req.body.fromCityFromFront;
  let arrival = req.body.toCityFromFront;
  let date = req.body.dateFromFront;
  date = new Date(date);
  let month = date.toLocaleString('default', {month: '2-digit'});
  let day = date.toLocaleString('default', { day: '2-digit'});
  let findJourney = await journeyModel.find({departure: departure, arrival: arrival, date: req.body.dateFromFront});
  // console.log(findJourney);
  if(findJourney.length < 1){
    
    res.redirect('/not-found');
  } else {
    res.render('found', {findJourney, month, day, user: req.session.user});
  }
});

// Si la recherche n'a rien donné
router.get('/not-found', function(req, res, next){
  res.render('notFound', {user: req.session.user});
});


// Route qui s'active quand on choisi un trajet et renvoi à la liste de nos trajet
router.get('/my-ticket', async function(req, res, next){
  if(!req.session.myTickets){
    console.log('pas de session');
    res.redirect('/');
  } else {
    console.log(req.session.myTickets);
    let journeyId = req.query.id;
    req.session.myTickets.push(journeyId);
    console.log(req.session.myTickets);

    let tableau = [];

    for(let i=0; i<req.session.myTickets.length; i++){
     let trajet = await journeyModel.findById({_id: req.session.myTickets[i]});
      tableau.push(trajet);
      console.log('tableau')
      console.log(tableau);
    }
    res.render('myTickets', {tickets: tableau, user: req.session.user});
  }
});




router.get('/confirm', async function(req, res, next){
  user = await userModel.findById(req.session.user.id);

  for(let i=0; i<req.session.myTickets.length; i++){
    user.journeys.push(req.session.myTickets[i]);
  }
  await user.save();
  req.session.myTickets = [];
  res.redirect('/homepage');
});


router.get('/myLastTrips', async function(req, res, next){
  if(!req.session.user){
    res.redirect('/');
  } else {
    let lastTrips = [];
    let user = await userModel.findById(req.session.user.id);

    for(let i=0; i<user.journeys.length; i++){
      let journeys = await journeyModel.findById(user.journeys[i]);
      lastTrips.push(journeys);
    }
    res.render('lastTrips', {lastTrips, user: req.session.user});
  }

});

module.exports = router;
