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
		users: 'user/'
	}
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
	var tid = addzero(h) + ':' + addzero(mm);
	return {"datum": datum, "tid": tid, "milisec": milisec};
};

//Mall kod
app.engine('html', function (filePath, options, callback) {
  fs.readFile(filePath, function (err, content) {
  	var projektselect = '';
	if(!options.projekt || options.projekt == '' || options.projekt.length == 0){}else{
		for (var i =  options.projekt.length - 1; i >= 0; i--) {
			var projektselect = projektselect + '<option value="' +  options.projekt[i] + '">' +  options.projekt[i] + '</option>';
		};
	};
	var utklockbuttons = '<i class="fa fa-play fa-3x in disable" aria-hidden="true"></i><i class="fa fa-stop fa-3x ut enable" aria-hidden="true" onclick="stopclock(\'nu\');"></i>'
	var utklockbuttonsannat = '#iconstart#play in disable#iconextra##iconend##iconstart#stop ut enable#iconextra#onclick="annantid(\'ut\')"#iconend#'
	var inklockbuttons = '#iconstart#play fa-3x in enable#iconextra#onclick="startclock(\'nu\')"#iconend##iconstart#stop fa-3x ut disable#iconextra##iconend#'
	var inklockbuttonsannat = '#iconstart#play in enable#iconextra#onclick="annantid(\'in\')"#iconend##iconstart#stop ut disable#iconextra##iconend#'
	var timecount = '';
	if(!options.inklockad || options.inklockad == ''){
		//Person är inte inte inklockad
		if(!options.starttime || options.starttime == ''){
			var klockbuttons = inklockbuttons;
			var klockbuttonsannat = inklockbuttonsannat;
		}else{
			var klockbuttons = utklockbuttons;
			var klockbuttonsannat = utklockbuttonsannat;
			var timecount = ' data-milisec=' + options.starttime;
		};
	}else{
		//Person är inklockad
		if(!options.stoptime || options.stoptime == ''){
			var klockbuttons = utklockbuttons;
			var klockbuttonsannat = utklockbuttonsannat;
			var timecount = ' data-milisec=' + options.inklockad;
		}else{
			var klockbuttons = inklockbuttons;
			var klockbuttonsannat = inklockbuttonsannat;
		};
	};
	if(!options.namn){
		var greeting = '';
	}else{
		var greeting = 'Välkommen ' + options.namn;
	};
    var rendered = content.toString()
    	.replace('#head#', '<!DOCTYPE html><html><head><title>TidLogga</title><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1"><meta content="yes" name="apple-mobile-web-app-capable"><meta content="yes" name="mobile-web-app-capable"><meta content="minimum-scale=1.0, width=device-width, maximum-scale=0.6667, user-scalable=no" name="viewport"><meta name="apple-mobile-web-app-status-bar-style" content="black"><link rel="shortcut icon" href="' + param.link.icons + 'icon.ico"><link rel="icon" type="image/vnd.microsoft.icon" href="' + param.link.icons + 'icon.ico"><link rel="icon" type="image/png" href="' + param.link.icons + 'icon196x196.png"><link rel="apple-touch-icon-precomposed" href="' + param.link.icons + 'icon180x180.png"><link rel="apple-touch-icon-precomposed" sizes="76x76" href="' + param.link.icons + 'icon76x76.png"><link rel="apple-touch-icon-precomposed" sizes="120x120" href="' + param.link.icons + 'icon120x120.png"><link rel="apple-touch-icon-precomposed" sizes="152x152" href="' + param.link.icons + 'icon152x152.png"><link rel="stylesheet" href="' + param.link.style + 'font-awesome/css/font-awesome.css"><link rel="stylesheet" href="' + param.link.style + 'main.css">')
    	.replace('#header#', '</head><body onload="history.pushState(null, \'\', location.href.split(\'?\')[0]);"><div id="wrapper"><div id="head">TidLogga</div><div id="header" class="table"><div class="tr"><div id="namn" class="td" data-namn="' + options.namn + '" data-vgrid="' + options.vgrid + '">' + greeting + '</div><div id="projektnamn" class="td" data-projektnamn="' + options.projektnamn + '">' + options.projektnamn + '</div></div></div>')
    	.replace('#footer#', '</div><div id="footer">2018&nbsp;©&nbsp;Mattias Lidbeck&nbsp;¦&nbsp;{<a href="https://www.teddyprojekt.tk/" alt="Länk till denna sida" onclick="internlink(this, event);">www.teddyprojekt.tk</a>}</div></body></html>')
    	.replace('#projektselect#', projektselect)
    	.replace('#klockbuttons#', klockbuttons)
    	.replace('#klockbuttonsannat#', klockbuttonsannat)
    	.replace(/#iconstart#/g, '<i class="fa fa-')
    	.replace(/#iconextra#/g, '" aria-hidden="true" ')
    	.replace(/#iconend#/g, '></i>')
    	.replace('#timecount#', timecount)
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
	if(exists(dobj.datum + '.json', mapp)){
		var data = JSON.parse(fs.readFileSync(mapp + dobj.datum + '.json', 'utf8'));
			data.push({"in": millisec, "ut": ""});
	}else{
		var data = [{"in": millisec, "ut": ""}];
	};
	fs.writeFile(mapp + dobj.datum + '.json', JSON.stringify(data, null, ' '), (err) => {
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
		res.render('index', {anv: '', projekt: '', projektnamn: ''})
	}else{
		for (var i = users.length - 1; i >= 0; i--) {
			if(users[i].vgrid == anv){
				if(req.query.toshow == 'login'){
					res.render(req.query.toshow, {vgrid: users[i].vgrid, namn: users[i].namn, projekt: users[i].projekt, projektnamn: ''})
				}else if(req.query.toshow == 'klocka'){
					var mapp = param.link.users + users[i].vgrid + '#' + users[i].namn + '/' + req.query.projektnamn + '/';
					var vgrid = users[i].vgrid;
					var namn = users[i].namn;
					var projekt = users[i].projekt;
					var projektnamn = req.query.projektnamn;
					var toshow = req.query.toshow;
					if(!req.query.starttime){
						var sendstarttime = '';
					}else{
						var sendstarttime = req.query.starttime;
					};
					if(!req.query.stoptime){
						var sendstoptime = '';
					}else{
						var sendstoptime = req.query.stoptime;
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