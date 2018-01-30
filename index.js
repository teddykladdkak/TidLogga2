const express = require('express')
const app = express()

const fs = require('fs');
const path = require('path');
const makeDir = require('make-dir');
const md5 = require("apache-md5"); // Skapar lösenord
var bodyParser = require('body-parser'); //Bilbiotek för att hantera post

//Parametrar till stil
var param = {
	port: 8080,
	titel: 'TidLogga',
	beskrivning: 'Tidloggning när det är som bäst! Minimalistiskt, ikonbaserat utseende för snabbare interaktion!',
	url: 'http://www.tidlogga.tk/',
	keywords: 'sjuksköterska, teddy, projekt, teddyprojekt, html, css, javascript, jquery, teddykladdkak, teddy__kladdkaka, teddysweden, eHälsa, eNursing, eHealth, medicinteknik, projekt, projektledning, tid, logg',
	link: {
		icons: 'ico/',
		style: 'style/',
		users: 'user/',
		script: 'script/'
	},
	hidelink: false
};

// Gör att man kan läsa svar från klient med json
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Datum funktion
function addzero(number){if(number <= 9){return "0" + number;}else{return number;};};
function getDate(dateannan, timeannan, milisecsave){
	if(!dateannan && !timeannan && !milisecsave){
		var date = new Date();
	}else if(!milisecsave){
		var annatdatum = dateannan.split('-');
		var annattid = timeannan.split(':');
		var date = new Date(annatdatum[0], annatdatum[1] - 1, annatdatum[2], annattid[0], annattid[1]);
	}else{
		var date = new Date(parseInt(milisecsave));
	};
	var y = date.getFullYear();
	var m = date.getMonth() + 1;
	var d = date.getDate();
	var h = date.getHours();
	var mm = date.getMinutes();
	var milisec = date.getTime();
	var datum = y + '-' + addzero(m) + '-' + addzero(d);
	var manad = y + '-' + addzero(m);
	var tid = addzero(h) + ':' + addzero(mm);
	return {"datum": datum, "tid": tid, "milisec": milisec, "manad": manad};
};
function timebetween(start, stop, millisec){
	if(!millisec){
		var sekunder = parseInt(stop) / 1000 - parseInt(start) / 1000;
	}else{
		var sekunder = parseInt(millisec) / 1000;
	};
	var t = Math.floor(sekunder / 3600);
	var m = Math.floor((sekunder / 60) - (t * 60));
	var s = Math.floor(sekunder - (m * 60) - (t * 3600));
	if(t <= 0){var t = 0;};
	if(m <= 0){var m = 0;};
	if(s <= 0){var s = 0;};
	return {"t": t, "m": m, "s": s};
};

// Kollar ifall variabel innehåller värde
function activevar(variabel){
	if(!variabel || variabel == '' || variabel.length == 0){
		return false;
	}else{
		return true;
	};
};

//Skapar html utifrån variabler
function htmldatumlist(projektdatum){
	var tohtml = '';
	if(activevar(projektdatum)){
		for (var i = projektdatum.length - 1; i >= 0; i--) {
			var tohtml = tohtml + '<option value="' + projektdatum[i] + '">' + projektdatum[i] + '</option>'
		};
	};
	return tohtml;
};
function htmlprojektselect(projekt){
	var tohtml = '';
	if(activevar(projekt)){
		for (var i =  projekt.length - 1; i >= 0; i--) {
			var tohtml = tohtml + '<option value="' +  projekt[i] + '">' +  projekt[i] + '</option>';
		};
	};
	return tohtml;
};
function htmlstartstoptime(inklockad, starttime, stoptime){
	// Vilka knappar som ska visas i inloggad
		var utklockbuttons = '#iconstart#play fa-3x in disable#iconextra##iconend##iconstart#stop fa-3x ut enable#iconextra#onclick="stopclock(\'nu\');"#iconend#'
		var utklockbuttonsannat = '#iconstart#play in disable#iconextra##iconend##iconstart#stop ut enable#iconextra#onclick="annantid(\'ut\')"#iconend#'
		var inklockbuttons = '#iconstart#play fa-3x in enable#iconextra#onclick="startclock(\'nu\')"#iconend##iconstart#stop fa-3x ut disable#iconextra##iconend#'
		var inklockbuttonsannat = '#iconstart#play in enable#iconextra#onclick="annantid(\'in\')"#iconend##iconstart#stop ut disable#iconextra##iconend#'
		var timecount = '';
	if(!activevar(inklockad)){
		//Person är inte inte inklockad
		if(!activevar(starttime)){
			var klockbuttons = inklockbuttons;
			var klockbuttonsannat = inklockbuttonsannat;
		}else{
			var klockbuttons = utklockbuttons;
			var klockbuttonsannat = utklockbuttonsannat;
			var timecount = ' data-milisec=' + starttime;
		};
	}else{
		//Person är inklockad
		if(!activevar(stoptime)){
			var klockbuttons = utklockbuttons;
			var klockbuttonsannat = utklockbuttonsannat;
			var timecount = ' data-milisec=' + inklockad;
		}else{
			var klockbuttons = inklockbuttons;
			var klockbuttonsannat = inklockbuttonsannat;
		};
	};
	return {"main": klockbuttons, "annat": klockbuttonsannat, "timecount": timecount};
};
function valkommenhtml(namn){if(activevar(namn)){var greeting = 'Välkommen ' + namn;}else{var greeting = '';};return greeting;};
function htmltidloggningar(loggningar){
	var tohtml = '';
	if(activevar(loggningar)){
		for (var i = loggningar.length - 1; i >= 0; i--) {
			var indobj = getDate('', '', loggningar[i].in);
			if(activevar(loggningar[i].ut)){
				var utdobj = getDate('', '', loggningar[i].ut);
			}else{

			};
			var time = timebetween('', '', (loggningar[i].ut - loggningar[i].in));
			var tohtml = tohtml + '<tr data-milisecin="' + loggningar[i].in + '" data-milisecut="' + loggningar[i].ut + '"><td>' + indobj.datum + '</td><td>' + indobj.tid + '</td><td>' + utdobj.tid + '</td><td>' + addzero(time.t) + ':' + addzero(time.m) + ':' + addzero(time.s) + '</td><td><i class="fa fa-trash fa-3x" aria-hidden="true" onclick="removesegment(this);"></i><i class="fa fa-pencil-square-o fa-3x" aria-hidden="true" onclick="showedit(this);"></i></td></tr>';
		};
	};
	console.log(tohtml);
	return tohtml;
};

//Mall kod
app.engine('html', function (filePath, options, callback) {
  fs.readFile(filePath, function (err, content) {
  	var projektdatum = htmldatumlist(options.projektdatum);
  	var tidloggningar = htmltidloggningar(options.tidloggningar);
  	var projektselect = htmlprojektselect(options.projekt);
	var startstoptime = htmlstartstoptime(options.inklockad, options.starttime, options.stoptime);
	var greeting = valkommenhtml(options.namn);

	
	// Döljer eller visar kod som skickas till server i url
	if(!param.hidelink){var hidelinkscript = '';}else{var hidelinkscript = '<script type="text/javascript">history.pushState(null, \'\', location.href.split(\'?\')[0]);</script>';};
    var rendered = content.toString()
    	.replace('#head#', '<!DOCTYPE html><html><head><title>TidLogga</title>' + hidelinkscript + '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1"><meta content="yes" name="apple-mobile-web-app-capable"><meta content="yes" name="mobile-web-app-capable"><meta content="minimum-scale=1.0, width=device-width, maximum-scale=0.6667, user-scalable=no" name="viewport"><meta name="apple-mobile-web-app-status-bar-style" content="black"><link rel="shortcut icon" href="' + param.link.icons + 'icon.ico"><link rel="icon" type="image/vnd.microsoft.icon" href="' + param.link.icons + 'icon.ico"><link rel="icon" type="image/png" href="' + param.link.icons + 'icon196x196.png"><link rel="apple-touch-icon-precomposed" href="' + param.link.icons + 'icon180x180.png"><link rel="apple-touch-icon-precomposed" sizes="76x76" href="' + param.link.icons + 'icon76x76.png"><link rel="apple-touch-icon-precomposed" sizes="120x120" href="' + param.link.icons + 'icon120x120.png"><link rel="apple-touch-icon-precomposed" sizes="152x152" href="' + param.link.icons + 'icon152x152.png"><link rel="stylesheet" href="' + param.link.style + 'font-awesome/css/font-awesome.css"><link rel="stylesheet" href="' + param.link.style + 'main.css"><script type="application/javascript" src="' + param.link.script + 'main.js"></script>')
    	.replace('#header#', '</head><body><div id="wrapper"><div id="head">TidLogga</div><div id="header" class="table"><div class="tr"><div id="namn" class="td" data-namn="' + options.namn + '" data-vgrid="' + options.vgrid + '">' + greeting + '</div><div id="projektnamn" class="td" data-projektnamn="' + options.projektnamn + '">' + options.projektnamn + '</div></div></div>')
    	.replace('#footer#', '</div><div id="footer">2018&nbsp;©&nbsp;Mattias Lidbeck&nbsp;¦&nbsp;{<a href="https://www.teddyprojekt.tk/" alt="Länk till denna sida" onclick="internlink(this, event);">www.teddyprojekt.tk</a>}</div></body></html>')
    	.replace('#projektselect#', projektselect)
    	.replace('#klockbuttons#', startstoptime.main)
    	.replace('#klockbuttonsannat#', startstoptime.annat)
    	.replace(/#iconstart#/g, '<i class="fa fa-')
    	.replace(/#iconextra#/g, '" aria-hidden="true" ')
    	.replace(/#iconend#/g, '></i>')
    	.replace('#timecount#', startstoptime.timecount)
    	.replace('#projektdatum#', projektdatum)
    	.replace('#tidloggningar#', tidloggningar)
    return callback(null, rendered)
  })
}).set('views', './views').set('view engine', 'html').use(express.static('public'))

var users = [];
function searchusers(){
	fs.readdir(param.link.users, function(err, mappedusers) {
		for (var i = mappedusers.length - 1; i >= 0; i--) {
			var user = mappedusers[i].split('#');
			fs.readdir(param.link.users + mappedusers[i] + '/', function(err, mappedprojekt) {
				users.push({vgrid: user[0], namn: user[1], projekt: mappedprojekt});
			});
		};
	});
};
searchusers();


function addutklock(vgrid, namn, projektnamn, millisec){
	var mapp = param.link.users + vgrid + '#' + namn + '/' + projektnamn + '/';
	fs.readdir(mapp, function(err, projekttider) {
		if(projekttider.length == 0){}else{
			for (var a = projekttider.length - 1; a >= 0; a--) {
				var data = JSON.parse(fs.readFileSync(mapp + projekttider[a], 'utf8'));
				for (var b = data.length - 1; b >= 0; b--) {
					if(data[b].ut == ''){
						data[b].ut = millisec;
						var datatosave = data;
						fs.writeFile(mapp + projekttider[a], JSON.stringify(datatosave, null, ' '), (err) => {
							if (err){
								console.log('Något gick fel i skapandet av ny fil.')
							}else{};
						});
						break;
					};
				};
			};
		};
	});
};

function addinklock(vgrid, namn, projektnamn, millisec){
	var mapp = param.link.users + vgrid + '#' + namn + '/' + projektnamn + '/';
	var dobj = getDate('', '', millisec)
	if(exists(dobj.manad + '.json', mapp)){
		var data = JSON.parse(fs.readFileSync(mapp + dobj.manad + '.json', 'utf8'));
			data.push({"in": millisec, "ut": ""});
	}else{
		var data = [{"in": millisec, "ut": ""}];
	};
	fs.writeFile(mapp + dobj.manad + '.json', JSON.stringify(data, null, ' '), (err) => {
		if (err){
			console.log('Något gick fel i skapandet av ny fil.')
		}else{
			console.log('".in" sparades.')
		};
	});
};

//Kontrollerar ifall fil existerar
function exists(path, dir){
	var wholepath = __dirname + '/' + dir + path;
	if (fs.existsSync(wholepath)) {
		return true;
	}else{
		return false;
	};
};

app.get(['/', '/index.html'], function (req, res) {
	var anv = req.query.anv;
	if(!anv || anv == ''){
		res.render('index', {"anv": "", "projekt": "", "projektnamn": ""})
	}else{
		for (var i = users.length - 1; i >= 0; i--) {
			if(users[i].vgrid == anv){
				var mapp = param.link.users + users[i].vgrid + '#' + users[i].namn + '/' + req.query.projektnamn + '/';
				var vgrid = users[i].vgrid;
				var namn = users[i].namn;
				var projekt = users[i].projekt;
				var projektnamn = req.query.projektnamn;
				var toshow = req.query.toshow;
				var starttime = req.query.starttime;
				var stoptime = req.query.stoptime;
				if(toshow == 'login'){
					res.render(toshow, {"vgrid": vgrid, "namn": namn, "projekt": projekt, "projektnamn": ""})
				}else if(toshow == 'klocka'){
					if(!starttime){
						var sendstarttime = '';
					}else{
						var sendstarttime = starttime;
					};
					if(!stoptime){
						var sendstoptime = '';
					}else{
						var sendstoptime = stoptime;
					};
					fs.readdir(mapp, function(err, projekttider) {
						var inklockad = false;
						if(projekttider.length == 0){}else{
							for (var a = projekttider.length - 1; a >= 0; a--) {
								var data = JSON.parse(fs.readFileSync(mapp + projekttider[a], 'utf8'));
								for (var b = data.length - 1; b >= 0; b--) {
									if(data[b].ut == ''){
										inklockad = data[b].in;
									};
								};
							};
						};
						if(!inklockad || inklockad == ''){
							//Person är inte inte inklockad
							if(!sendstarttime || sendstarttime == ''){}else{
								addinklock(vgrid, namn, projektnamn, sendstarttime);
							};
						}else{
							if(!sendstoptime || sendstoptime == ''){}else{
								addutklock(vgrid, namn, projektnamn, sendstoptime);
							};
						};
						res.render(req.query.toshow, {"vgrid": vgrid, "namn": namn, "projekt": projekt, "projektnamn": projektnamn, "starttime": sendstarttime, "stoptime": sendstoptime, "inklockad": inklockad})
					});
				}else if(toshow == 'logg'){
					fs.readdir(mapp, function(err, datum) {
						for (var i = datum.length - 1; i >= 0; i--) {
							datum[i] = datum[i].replace(/.json/g, '');
						};
						var todayfilename = getDate().manad + '.json';
						if(exists(todayfilename, mapp)){
							var loggningar = JSON.parse(fs.readFileSync(mapp + todayfilename, 'utf8'));
							res.render(toshow, {"vgrid": vgrid, "namn": namn, "projekt": projekt, "projektnamn": projektnamn, "projektdatum": datum, "tidloggningar": loggningar})
						};
					});
				}else{
					res.render('index', {"vgrid": "", "namn": "", "projekt": "", "projektnamn": ""})
				};
			};
		};
	};
})

/*// 404 sida som fångar upp de flesta error
app.use(function(req, res, next){
	//param.pages.error.root = countsub(req.url);
    res.status(404).render('404', {toshow: 'start'})
});*/

app.listen(param.port, () => console.log('Lyssnar på port ' + param.port + '!'))