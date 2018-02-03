const express = require('express')
const app = express()

const fs = require('fs');
const path = require('path');
const makeDir = require('make-dir');
const md5 = require("apache-md5"); // Skapar lösenord
var bodyParser = require('body-parser'); //Bilbiotek för att hantera post
var request = require('sync-request');

//Parametrar till stil
var param = {
	port: 3333,
	titel: 'TidLogga',
	beskrivning: 'Tidloggning när det är som bäst! Minimalistiskt, ikonbaserat utseende för snabbare interaktion!',
	url: 'http://www.tidlogga.tk/',
	keywords: 'sjuksköterska, teddy, projekt, teddyprojekt, html, css, javascript, jquery, teddykladdkak, teddy__kladdkaka, teddysweden, eHälsa, eNursing, eHealth, medicinteknik, projekt, projektledning, tid, logg',
	link: {
		icons: 'ico/',
		style: 'style/',
		users: '../../Spara/user/',
		script: 'script/'
	},
	hidelink: false,
	splacertoken: '#'
};


// Gör att man kan läsa svar från klient med json
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Kontrollerar ifall fil existerar
function exists(path, dir){
	var wholepath = __dirname + '/' + dir + path;
//	console.log(wholepath);
	if (fs.existsSync(wholepath)) {
		return true;
	}else{
		return false;
	};
};

if(!exists(param.link.users, '')){
	makeDir(param.link.users).then(path => {
		console.log('Mappen users skapades');
	});
};

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
	if(t <= 0 || isNaN(t)){var t = 0;};
	if(m <= 0 || isNaN(m)){var m = 0;};
	if(s <= 0 || isNaN(s)){var s = 0;};
	return {"t": t, "m": m, "s": s};
};

// Kollar ifall variabel innehåller värde
function activevar(variabel){
	//console.log(variabel)
	if(!variabel || variabel == '' || variabel.length == 0){
		return false;
	}else{
		return true;
	};
};

//Skapar html utifrån variabler
function htmldatumlist(projektdatum, todayfilename){
	var tohtml = '';
	if(activevar(projektdatum)){
		for (var i = projektdatum.length - 1; i >= 0; i--) {
			if(!todayfilename){
				var selected = '';
			}else{
				var todayfilename = todayfilename.replace('.json', '');
				if(todayfilename == projektdatum[i]){
					var selected = ' selected';
				}else{
					var selected = '';
				};
			};
			var tohtml = tohtml + '<option value="' + projektdatum[i] + '"' + selected + '>' + projektdatum[i] + '</option>'
		};
	};
	return tohtml;
};
function htmlprojektselect(projekt, historyprojekt, namn, vgrid){
	var usermapp = param.link.users + vgrid + param.splacertoken + namn + '/';
	var tohtml = '';
	if(activevar(projekt)){
		for (var i =  projekt.length - 1; i >= 0; i--) {
			if(historyprojekt == projekt[i]){
				var selected = ' selected';
			}else{
				var selected = '';
			};
			var mapp =  usermapp + projekt[i] + '/';
			if(checkinklock(mapp)){
				var active = '*';
			}else{
				var active = '';
			};
			var tohtml = tohtml + '<option value="' + projekt[i] + '"' + selected + '>' + active +  projekt[i] + '</option>';
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
		var tosort = [];
		for (var i = loggningar.length - 1; i >= 0; i--) {
			tosort.push(loggningar[i].in);
		};
		var sorted = []
		for (var i = tosort.length - 1; i >= 0; i--) {
			for (var a = loggningar.length - 1; a >= 0; a--) {
				if(loggningar[a].in == tosort[i]){
					sorted.push(loggningar[a]);
				};
			};
		};
		for (var i = sorted.length - 1; i >= 0; i--) {
			var indobj = getDate('', '', sorted[i].in);
			if(activevar(sorted[i].ut)){
				var utdobj = getDate('', '', sorted[i].ut);
			}else{
				var utdobj = {tid: ''};
			};
			var time = timebetween('', '', (sorted[i].ut - sorted[i].in));
			var tohtml = tohtml + '<tr data-milisecin="' + sorted[i].in + '" data-milisecut="' + sorted[i].ut + '"><td>' + indobj.datum + '</td><td>' + indobj.tid + '</td><td>' + utdobj.tid + '</td><td>' + addzero(time.t) + ':' + addzero(time.m) + ':' + addzero(time.s) + '</td><td><i class="fa fa-trash fa-3x" aria-hidden="true" onclick="removesegment(this);"></i><i class="fa fa-pencil-square-o fa-3x" aria-hidden="true" onclick="showedit(this);"></i></td></tr>';
		};
	};
	return tohtml;
};
function htmlprojektnamn(url, projektnamn){
	if(!url || !projektnamn || projektnamn == 'none'){
		return '<div id="projektnamn" class="td" data-projektnamn="' + projektnamn + '"></div>';
	}else{
		var spliturl = url.split('\\');
		var prittyurl = spliturl[spliturl.length - 1];
		console.log(prittyurl)
		var spliturltwo = url.split('/');
		var prittyurltwo = spliturltwo[spliturltwo.length - 1];
		console.log(prittyurltwo)
		if(prittyurl == 'login.html' || prittyurl == 'rapport.html' || prittyurltwo == 'login.html' || prittyurltwo == 'rapport.html'){
			return '<div id="projektnamn" class="td" data-projektnamn="' + projektnamn + '"></div>';
		}else{
			return '<div id="projektnamn" class="td" data-projektnamn="' + projektnamn + '">' + projektnamn + '</div>';
		};
	};
};
function rapporttohtml(rapport){
	var printcheckboxes = '<div id="printcheckboxes">';
	var skrivutdatum = '<select id="skrivutdatum">';
	var idexofdates = [];
	if(!rapport){return false;}else{
		for (var i = rapport.length - 1; i >= 0; i--) {
			var printcheckboxes = printcheckboxes + '<span class="checkboxwrapper"><input type="checkbox" data-namn="' + rapport[i].namn + '" checked><lable>' + rapport[i].namn + '</lable></span>';
			for (var a = rapport[i].datum.length - 1; a >= 0; a--) {
				var prittydate = rapport[i].datum[a].replace('.json', '');
				if(idexofdates.indexOf(prittydate) == -1){
					idexofdates.push(prittydate);
					var skrivutdatum = skrivutdatum + '<option value="' + prittydate + '">' + prittydate + '</option>';
				};
			};
		};
	};
	var printcheckboxes = printcheckboxes + '</div><br>';
	var skrivutdatum = skrivutdatum + '</select><br>';
	return printcheckboxes + skrivutdatum;
};

//Mall kod
app.engine('html', function (filePath, options, callback) {
  fs.readFile(filePath, function (err, content) {
  	var projektdatum = htmldatumlist(options.projektdatum, options.todayfilename);
  	var tidloggningar = htmltidloggningar(options.tidloggningar);
  	var projektselect = htmlprojektselect(options.projekt, options.projektnamn, options.namn, options.vgrid);
	var startstoptime = htmlstartstoptime(options.inklockad, options.starttime, options.stoptime);
	var greeting = valkommenhtml(options.namn);
	var projektnamn = htmlprojektnamn(filePath, options.projektnamn);
	var rapport = rapporttohtml(options.rapport);

	// Döljer eller visar kod som skickas till server i url
	if(!param.hidelink){var hidelinkscript = '';}else{var hidelinkscript = '<script type="text/javascript">history.pushState(null, \'\', location.href.split(\'?\')[0]);</script>';};
    var rendered = content.toString()
    	.replace('#head#', '<!DOCTYPE html><html><head><title>TidLogga</title>' + hidelinkscript + '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1"><meta content="yes" name="apple-mobile-web-app-capable"><meta content="yes" name="mobile-web-app-capable"><meta content="minimum-scale=1.0, width=device-width, maximum-scale=0.6667, user-scalable=no" name="viewport"><meta name="apple-mobile-web-app-status-bar-style" content="black"><link rel="shortcut icon" href="' + param.link.icons + 'icon.ico"><link rel="icon" type="image/vnd.microsoft.icon" href="' + param.link.icons + 'icon.ico"><link rel="icon" type="image/png" href="' + param.link.icons + 'icon196x196.png"><link rel="apple-touch-icon-precomposed" href="' + param.link.icons + 'icon180x180.png"><link rel="apple-touch-icon-precomposed" sizes="76x76" href="' + param.link.icons + 'icon76x76.png"><link rel="apple-touch-icon-precomposed" sizes="120x120" href="' + param.link.icons + 'icon120x120.png"><link rel="apple-touch-icon-precomposed" sizes="152x152" href="' + param.link.icons + 'icon152x152.png"><link rel="stylesheet" href="' + param.link.style + 'font-awesome/css/font-awesome.css"><link rel="stylesheet" href="' + param.link.style + 'main.css"><script type="application/javascript" src="' + param.link.script + 'main.js"></script>')
    	.replace('#header#', '</head><body><div id="wrapper"><div id="head">TidLogga</div><div id="header" class="table"><div class="tr"><div id="namn" class="td" data-namn="' + options.namn + '" data-vgrid="' + options.vgrid + '">' + greeting + '</div>' + projektnamn + '</div></div>')
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
    	.replace('#rapport#', rapport)
    return callback(null, rendered)
  })
}).set('views', './views').set('view engine', 'html').use(express.static('public'))



function addutklock(vgrid, namn, projektnamn, millisec){
	var mapp = param.link.users + vgrid + param.splacertoken + namn + '/' + projektnamn + '/';
	var projekttider = fs.readdirSync(mapp);
		if(projekttider.indexOf('.DS_Store') == -1){}else{
	    	projekttider.splice(projekttider.indexOf('.DS_Store'), 1);
	    };
	if(projekttider.length == 0){}else{
		for (var a = projekttider.length - 1; a >= 0; a--) {
			var data = JSON.parse(fs.readFileSync(mapp + projekttider[a], 'utf8'));
			for (var b = data.length - 1; b >= 0; b--) {
				if(data[b].ut == ''){
					data[b].ut = millisec;
					var datatosave = data;
					fs.writeFileSync(mapp + projekttider[a], JSON.stringify(datatosave, null, ' '))
					break;
				};
			};
		};
	};
};

function addinklock(vgrid, namn, projektnamn, millisec){
	var mapp = param.link.users + vgrid + param.splacertoken + namn + '/' + projektnamn + '/';
	var dobj = getDate('', '', millisec)
	if(exists(dobj.manad + '.json', mapp)){
		var data = JSON.parse(fs.readFileSync(mapp + dobj.manad + '.json', 'utf8'));
			data.push({"in": millisec, "ut": ""});
	}else{
		var data = [{"in": millisec, "ut": ""}];
	};
	fs.writeFileSync(mapp + dobj.manad + '.json', JSON.stringify(data, null, ' '))
};

function checkinklock(mapp){
	var projekttider = fs.readdirSync(mapp);
		if(projekttider.indexOf('.DS_Store') == -1){}else{
	    	projekttider.splice(projekttider.indexOf('.DS_Store'), 1);
	    };
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
	return inklockad;
};

// https://api.dryg.net/dagar/v2.1/2018/2
// Läser in vilka dagar man kan räkna med
var manader = ['Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni', 'Juli', 'Augusti', 'September', 'Oktober', 'Noveber', 'December'];
//Skapr fil
app.get('/download*', function (req, res) {
	if(!req.query.datum){
		res.send('<h1>Inget datum finns att hämta</h1>')
	}else if(!req.query.anv){
		res.send('<h1>Ingen användare är definierad</h1>')
	}else if(!req.query.layout){
		res.send('<h1>Ingen layout är vald</h1>')
	}else if(!req.query.projektnamn){
		res.send('<h1>Inga projekt är valda</h1>')
	}else{
		var anv = req.query.anv;
		var datum = req.query.datum.split('-');
		var layout = req.query.layout;
		var projektnamn = req.query.projektnamn.split('||||');
		if(layout == "vgrutanob"){
			var html = makerapportutanob(anv, datum, projektnamn);
		}else{
			//json rapport
			var html = makerapport(layout, anv, datum, projektnamn);
		};
		
		res.send(html)
	};
});

function makejson(anvandare, datum, projekt){
	var loggningar = [];
	for (var i = 0; i < projekt.length; i++){
		var filelink = param.link.users + anvandare + '/' + projekt[i] + '/' + datum.join('-') + '.json';
		if(exists(filelink, '')){
			//Varje projekt
			var datearray = [];
			var data = JSON.parse(fs.readFileSync(filelink, 'utf8'));
			if(!data){}else{
				for (var a = 0; a < data.length; a++){
					if(data[a].ut == ''){}else{
						var datut = getDate('', '', data[a].ut);
						var datin = getDate('', '', data[a].in);
						var mellan = parseInt(data[a].ut) - parseInt(data[a].in);
						var datatopush = {"tidin": datin.tid, "tidut": datut.tid, "mellan": mellan};
					};
					var finnsredan = false;
					var nummer = 0;
					for (var b = datearray.length - 1; b >= 0; b--) {
						if(datearray[b].datum == datin.datum){
							var finnsredan = true;
							var nummer = b;
						};
					};
					if(finnsredan){
						datearray[nummer].sammanlagdtid = parseInt(datearray[nummer].sammanlagdtid) + (parseInt(data[a].ut) - parseInt(data[a].in));
						datearray[nummer].loggningar.push(datatopush)
					}else{
						if(datearray.length == 0){
							datearray.push({"datum": datin.datum, "sammanlagdtid": (parseInt(data[a].ut) - parseInt(data[a].in)), "loggningar": [datatopush]})
						}else{
							if(datearray[0].datum.replace(/-/g, '') >= datin.datum.replace(/-/g, '')){
								datearray.unshift({"datum": datin.datum, "sammanlagdtid": (parseInt(data[a].ut) - parseInt(data[a].in)), "loggningar": [datatopush]})
							}else{
								datearray.push({"datum": datin.datum, "sammanlagdtid": (parseInt(data[a].ut) - parseInt(data[a].in)), "loggningar": [datatopush]})
							};
						};
					};
				};
			};
			//Räkna ut sammanlagd summa för projeket
			var projektsumma = 0;
			for (var a = datearray.length - 1; a >= 0; a--) {
				var projektsumma = projektsumma + datearray[a].sammanlagdtid;
			};
			loggningar.push({"projektnamn": projekt[i], "sammanlagdtid": projektsumma, "instamplingar": datearray});
		};
	};
	return loggningar;
};

function finduser(anv){
	var allaanv = fs.readdirSync(param.link.users);
		if(allaanv.indexOf('.DS_Store') == -1){}else{
	    	allaanv.splice(allaanv.indexOf('.DS_Store'), 1);
	    };
	var anvandare = '';
	for (var i = 0; i < allaanv.length; i++){
		if(allaanv[i].split(param.splacertoken)[0] == anv){
			anvandare = allaanv[i];
			break;
		};
	};
	return anvandare;
};

function makerapport(layout, anv, datum, projekt){
	var anvandare = finduser(anv);
	if(!anvandare){
		console.log('Användare kunde inte hittas..');
	}else{
		var loggningar = makejson(anvandare, datum, projekt);
	};
	if(layout == 'json'){return loggningar;};
	var htmltosend = '<!DOCTYPE html> <html> <head> <title>Tidrapport för ' + datum.join('-') + '</title> <style type="text/css"> #dontprint{ zoom: 1.5; } table, tr{width: 100%; border-collapse: collapse; } td, th{border: solid 1px #000; text-align: center;} thead tr th, .head{font-weight: bold; border-bottom: solid 2px #000; text-align: left;} thead tr th:first-child, .head{border-right: solid 2px #000; } .wrapperhead{ border-top: solid 2px #000; } @media print { #dontprint, #info{ display: none; } } </style> </head> <body>';
	var htmltosend = htmltosend + '<input type="button" value="Skriv ut" onclick="window.print();" id="dontprint"><h1>Tidrapport för ' + datum.join('-') + '</h1><h2>' + anvandare.split(param.splacertoken)[1] + '</h2><table>';
	var htmltosend = htmltosend + '<thead><tr><th>Projekt</th><th>Datum</th><th>Start</th><th>Slut</th><th>Sammanlagt Dag</th><th>Sammanlagt projekt</th><th>Sammanlagt månad</th></tr></thead>';
	var htmltosend = htmltosend + '<tbody>';
	var tablehtml = '';
	var alllines = 0;
	var sammanmanad = 0;
	for (var i = 0; i < loggningar.length; i++){
		var rowspanprojekt = 0;
		var projekthtml = '';
		var projekthtml = projekthtml + '<tr class="wrapperhead"><td#rowspanprojekt# class="head">' + loggningar[i].projektnamn + '</td>';
		var sammanprojekt = 0;
		for (var a = 0; a < loggningar[i].instamplingar.length; a++){
			var datumhtml = '';
			var datumhtml = datumhtml + '<td#rowspandag#>' + loggningar[i].instamplingar[a].datum + '</td>';
			var rowspandag = 0;
			var sammandagrak = 0;
			for (var b = 0; b < loggningar[i].instamplingar[a].loggningar.length; b++){
				rowspanprojekt++;
				rowspandag++;
				alllines++;
				var tidobjc = loggningar[i].instamplingar[a].loggningar[b];
				var sammandagrak = sammandagrak + tidobjc.mellan;
				var sammanprojekt = sammanprojekt + tidobjc.mellan;
				var sammanmanad = sammanmanad + tidobjc.mellan;
				if(b == 0){
					var datumhtml = datumhtml + '<td>' + tidobjc.tidin + '</td><td>' + tidobjc.tidut + '</td><td#rowspandag#>#sammandag#</td>';
				}else{
					var datumhtml = datumhtml + '<td>' + tidobjc.tidin + '</td><td>' + tidobjc.tidut + '</td></tr>';
				};
				if(b == 0 && a == 0){
					var datumhtml = datumhtml + '<td#rowspanprojekt#>#sammanprojekt#</td>';
				}else if(b == 0 && !a == 0){
					var datumhtml = datumhtml + '</tr>';
				};
				if(b== 0 && a == 0 && i == 0){
					var datumhtml = datumhtml + '#sammanmanad#</tr>';
				}else if(b== 0 && a == 0){
					var datumhtml = datumhtml + '</tr>';
				};
			};
			var sammandagrakobj = timebetween('', '', sammandagrak);
			var projekthtml = projekthtml + datumhtml.replace(/#rowspandag#/g, ' rowspan="' + rowspandag + '"').replace(/#sammandag#/g, addzero(sammandagrakobj.t) + ':' + addzero(sammandagrakobj.m) + ':' + addzero(sammandagrakobj.s));
		};
		var sammanprojektobj = timebetween('', '', sammanprojekt);
		var tablehtml = tablehtml + projekthtml.replace(/#rowspanprojekt#/g, ' rowspan="' + rowspanprojekt + '"').replace(/#sammanprojekt#/g, addzero(sammanprojektobj.t) + ':' + addzero(sammanprojektobj.m) + ':' + addzero(sammanprojektobj.s));
			
	};
	var sammanmanadobj = timebetween('', '', sammanmanad);
	var lasttablehtml = tablehtml.replace(/#sammanmanad#/g, '<td rowspan="' + alllines + '">' + addzero(sammanmanadobj.t) + ':' + addzero(sammanmanadobj.m) + ':' + addzero(sammanmanadobj.s) + '</td>');
	var htmltosend = htmltosend + lasttablehtml + '</tbody></table></body></html>'
	return htmltosend;
};
function makerapportutanob(anv, datum, projekt){
	var rodadatum = JSON.parse(request('GET', 'https://api.dryg.net/dagar/v2.1/' + datum[0] + '/' + datum[1]).getBody('utf8'));
	var datumtouse = [];
	for (var i = 0; i < rodadatum.dagar.length; i++){
		if(rodadatum.dagar[i]['arbetsfri dag'] == 'Nej' && rodadatum.dagar[i]['röd dag'] == 'Nej'){
			datumtouse.push(rodadatum.dagar[i].datum);
		};
	};
	var tidsomkanreggas = datumtouse.length * 8;
	var allaanv = fs.readdirSync(param.link.users);
		if(allaanv.indexOf('.DS_Store') == -1){}else{
	    	allaanv.splice(allaanv.indexOf('.DS_Store'), 1);
	    };
	var anvandare = '';
	for (var i = 0; i < allaanv.length; i++){
		if(allaanv[i].split(param.splacertoken)[0] == anv){
			anvandare = allaanv[i];
			break;
		};
	};
	if(!anvandare){
		console.log('Användare kunde inte hittas..');
	}else{
		var summa = 0;
		for (var i = 0; i < projekt.length; i++){
			var filelink = param.link.users + anvandare + '/' + projekt[i] + '/' + datum.join('-') + '.json';
			if(exists(filelink, '')){
				var data = JSON.parse(fs.readFileSync(filelink, 'utf8'));
				if(!data){}else{
					for (var a = 0; a < data.length; a++){
						if(data[a].ut == ''){}else{
							var summa = summa + (parseInt(data[a].ut) - parseInt(data[a].in));
						};
					};
				};
			};
		};
		var alltid = timebetween('', '', summa);
	};
	var fileparam = {telefon: 'XXXX-XXXXXX', namnchef: 'XXXX XXXXXXX', titel: 'XXXXXXX', personnr: 'XXXXXX-XXXX', namn: anvandare.split(param.splacertoken)[1], ansvar: 'XXXXXX'};
	var timetoday = (parseInt(alltid.t) / 8).toString().split('.');
	var hoursleft = alltid.t - (timetoday[0] * 8);
	var minutertilltimme = Math.ceil(((alltid.m / 60) * 10)) / 10;
	var htmlhead = '<!DOCTYPE html> <html> <head> <title>Tidrapport - ' + manader[parseInt(datum[1])] + ' ' + datum[0] + '</title> <style type="text/css"> #dontprint{ zoom: 1.5; } #info{font-size: 18px; background-color: yellow; margin: 10px; padding: 5px;} .printedit{background-color: #CCC;} h1{font-size: 20px; margin: 3px;} p{font-size: 15px; margin: 3px;} table#header{margin-bottom: 30px; } table#header, #header tr{width: 100%; } td{border: solid 1px #000; } table, tr{border-collapse: collapse; } @media print { #dontprint, #info{ display: none; } } </style> </head> <body>';
	var htmlhead = htmlhead + '<input type="button" value="Skriv ut" onclick="window.print();" id="dontprint"><div id="info">Observera att denna blanketten tar bort all OB. Den räknar ihop sammanlagd tid du registrerat under månaden. Kollar med register vilka dagar som inte är OB på och lägger in heldagar fram till att timmarna är fyllda.</div>'
	var htmlheader = '<table id="header"><tr><td colspan="4"><h1>Tjänstgöringsrapport timavlönad Sahlgrenska Universitetssjukhuset</h1></td></tr><tr><td><p>Anställd:</p><p>' + fileparam.namn + '</p></td><td><p>Pers nr:</p><p class="printedit" contenteditable="true">' + fileparam.personnr + '</p></td><td><p>Titel:</p><p class="printedit" contenteditable="true">' + fileparam.titel + '</p></td><td><p>Ansvarsenhet:</p><p class="printedit" contenteditable="true">' + fileparam.ansvar + '</p></td></tr><tr><td colspan="4"><p>Attesterande chef:<br/><br/></p></td></tr><tr><td colspan="4"><p>Namnförtydligande: <span class="printedit" contenteditable="true">' + fileparam.namnchef + '</span></p></td></tr><tr><td colspan="4"><p>Telefon: <span class="printedit" contenteditable="true">' + fileparam.telefon + '</span></p></td></tr></table>';
	var htmlrapport = '<table><tr><td colspan="3">Månad: ' + manader[parseInt(datum[1]) - 1] + ' ' + datum[0] + '</td></tr><tr><td>Datum</td><td>Arbetat tid</td><td>Timmar</td></tr>';
	var htmlrapportbody = '';
	var datenumber = 0;
	for (var i = 0; i < timetoday[0]; i++){
		var datenumber = i;
		var htmlrapportbody = htmlrapportbody + '<tr style="text-align: center;"><td>' + datumtouse[i] + '</td><td>8:00-16:45</td><td>8</td></tr>';
	};
	var htmlrapportbody = htmlrapportbody + '<tr style="text-align: center;"><td>' + datumtouse[datenumber + 1] + '</td><td>8:00-' + addzero(hoursleft + 8) + ':' + addzero(alltid.m) + '</td><td>' + (hoursleft + minutertilltimme) + '</td></tr>';
	var htmlrapport = htmlrapport + htmlrapportbody + '<tr><td colspan="2">Summa:</td><td style="text-align: center;">' + (alltid.t + minutertilltimme) + '</td></tr></table>';
	var htmlend = '</body></html>';
	return htmlhead + htmlheader + htmlrapport + htmlend;
};

//Laddar sidor
app.get(['/', '/index.html'], function (req, res) {
	var anv = req.query.anv;
	var users = fs.readdirSync(param.link.users);
		if(users.indexOf('.DS_Store') == -1){}else{
	    	users.splice(users.indexOf('.DS_Store'), 1);
	    };
	if(!anv || anv == '' || users.length == 0){
		res.render('index', {"anv": "", "projekt": "", "projektnamn": ""})
	}else{
		for (var i = users.length - 1; i >= 0; i--) {
			var projektmapp = fs.readdirSync(param.link.users + users[i] + '/');
				if(projektmapp.indexOf('.DS_Store') == -1){}else{
			    	projektmapp.splice(projektmapp.indexOf('.DS_Store'), 1);
			    };
			var usersplit = users[i].split(param.splacertoken);
			users[i] = {vgrid: usersplit[0], namn: usersplit[1], projekt: projektmapp};
			if(users[i].vgrid == anv){
				var usermapp = param.link.users + users[i].vgrid + param.splacertoken + users[i].namn + '/';
				var mapp =  usermapp + req.query.projektnamn + '/';
				var vgrid = users[i].vgrid;
				var namn = users[i].namn;
				var projekt = users[i].projekt;
				var projektnamn = req.query.projektnamn;
				var toshow = req.query.toshow;
				var starttime = req.query.starttime;
				var stoptime = req.query.stoptime;
				var datetofetch = req.query.datetofetch;
				if(toshow == 'login'){
					res.render(toshow, {"vgrid": vgrid, "namn": namn, "projekt": projekt, "projektnamn": projektnamn})
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
					var inklockad = checkinklock(mapp);
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
				}else if(toshow == 'logg'){
					if(!req.query.remove){}else{
						var remove = JSON.parse(req.query.remove);
						var findloggning = JSON.parse(fs.readFileSync(mapp + datetofetch + '.json', 'utf8'));
						for (var c = findloggning.length - 1; c >= 0; c--) {
							if(remove.in == findloggning[c].in){
								if(!remove.ut == '' && remove.ut == findloggning[c].ut){
									findloggning.splice(c, 1);
									var borttaget = true;
								};
							};
						};
						if(findloggning.length == 0){
							fs.unlinkSync(mapp + datetofetch + '.json');
						}else{
							fs.writeFileSync(mapp + datetofetch + '.json', JSON.stringify(findloggning, null, ' '))
						};
						if(!req.query.change || !borttaget){}else{
							var change = JSON.parse(req.query.change);
							if(!change.in || change.in == ''){}else{
								addinklock(vgrid, namn, projektnamn, change.in);
								if(!change.ut || change.ut == ''){}else{
									addutklock(vgrid, namn, projektnamn, change.ut)
								};
							};
						};
					};
					var datum = fs.readdirSync(mapp);
						if(datum.indexOf('.DS_Store') == -1){}else{
					    	datum.splice(datum.indexOf('.DS_Store'), 1);
					    };
					if(datum.length == 0){
						res.render('login', {"vgrid": vgrid, "namn": namn, "projekt": projekt, "projektnamn": projektnamn})
					}else{
						for (var i = datum.length - 1; i >= 0; i--) {
							datum[i] = datum[i].replace(/.json/g, '');
						};
						if(!datetofetch){
							var todayfilename = getDate().manad + '.json';
						}else{
							var todayfilename = datetofetch + '.json';
						};
						if(exists(todayfilename, mapp)){
							var loggningar = JSON.parse(fs.readFileSync(mapp + todayfilename, 'utf8'));
							res.render(toshow, {"vgrid": vgrid, "namn": namn, "projekt": projekt, "projektnamn": projektnamn, "projektdatum": datum, "tidloggningar": loggningar, "todayfilename": todayfilename})
						}else{
							var todayfilename = datum[datum.length - 1] + '.json';
							var loggningar = JSON.parse(fs.readFileSync(mapp + todayfilename, 'utf8'));
							res.render(toshow, {"vgrid": vgrid, "namn": namn, "projekt": projekt, "projektnamn": projektnamn, "projektdatum": datum, "tidloggningar": loggningar, "todayfilename": todayfilename})
						};
					};
				}else if(toshow == 'rapport'){
					var allstuff = []
					for (var i = projektmapp.length - 1; i >= 0; i--) {
						var manader = fs.readdirSync(usermapp + projektmapp[i] + '/');
							if(manader.indexOf('.DS_Store') == -1){}else{
						    	manader.splice(manader.indexOf('.DS_Store'), 1);
						    };
						allstuff.push({"namn": projektmapp[i], "datum": manader});
					};
					res.render(toshow, {"vgrid": vgrid, "namn": namn, "projekt": projekt, "projektnamn": projektnamn, "rapport": allstuff})
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