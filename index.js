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
	port: 7788,
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
	hidelink: true,
	splacertoken: '#',
	oldprojekt: '_old_',
	activetoken: '[Pågående]'
};


// Gör att man kan läsa svar från klient med json
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Kontrollerar ifall fil existerar
function exists(path, dir){
	var wholepath = __dirname + '/' + dir + path;
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
			if(!projekt[i].indexOf(param.oldprojekt) == 0){
				if(historyprojekt == projekt[i]){
					var selected = ' selected';
				}else{
					var selected = '';
				};
				var mapp =  usermapp + projekt[i] + '/';
				if(checkinklock(mapp)){
					var active = param.activetoken;
				}else{
					var active = '';
				};
				var tohtml = tohtml + '<option value="' + projekt[i] + '"' + selected + '>' + active +  projekt[i] + '</option>';
			};
		};
	};
	return tohtml;
};
function htmlstartstoptime(inklockad, starttime, stoptime){
	var startone = '#svgstart#0 0 448 512" ';
	var starttwo = '#svginside#M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z#svgend#';
	var stopone = '#svgstart#0 0 448 512" ';
	var stoptwo = '#svginside#M400 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48z#svgend#';
	// Vilka knappar som ska visas i inloggad
		var utklockbuttons = startone + 'class="disable' + starttwo + stopone + 'class="enable" onclick="stopclock(\'nu\');' + stoptwo;
		var utklockbuttonsannat = startone + 'class="disable' + starttwo + stopone + 'class="enable" onclick="annantid(\'ut\');' + stoptwo;
		var inklockbuttons = startone + 'class="enable" onclick="startclock(\'nu\')' + starttwo + stopone + 'class="disable' + stoptwo;
		var inklockbuttonsannat = startone + 'class="enable" onclick="annantid(\'in\')' + starttwo + stopone + 'class="disable' + stoptwo;
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
function valkommenhtml(namn){if(activevar(namn)){var greeting = '<span class="watch">Välkommen </span>' + namn;}else{var greeting = '';};return greeting;};
function htmltidloggningar(loggningar){
	var tabort = '#svgstart#0 0 448 512" onclick="removesegment(this);#svginside#M32 464a48 48 0 0 0 48 48h288a48 48 0 0 0 48-48V128H32zm272-256a16 16 0 0 1 32 0v224a16 16 0 0 1-32 0zm-96 0a16 16 0 0 1 32 0v224a16 16 0 0 1-32 0zm-96 0a16 16 0 0 1 32 0v224a16 16 0 0 1-32 0zM432 32H312l-9.4-18.7A24 24 0 0 0 281.1 0H166.8a23.72 23.72 0 0 0-21.4 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16z#svgend#';
	var redigera = '#svgstart#0 0 576 512" onclick="showedit(this);#svginside#M402.6 83.2l90.2 90.2c3.8 3.8 3.8 10 0 13.8L274.4 405.6l-92.8 10.3c-12.4 1.4-22.9-9.1-21.5-21.5l10.3-92.8L388.8 83.2c3.8-3.8 10-3.8 13.8 0zm162-22.9l-48.8-48.8c-15.2-15.2-39.9-15.2-55.2 0l-35.4 35.4c-3.8 3.8-3.8 10 0 13.8l90.2 90.2c3.8 3.8 10 3.8 13.8 0l35.4-35.4c15.2-15.3 15.2-40 0-55.2zM384 346.2V448H64V128h229.8c3.2 0 6.2-1.3 8.5-3.5l40-40c7.6-7.6 2.2-20.5-8.5-20.5H48C21.5 64 0 85.5 0 112v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V306.2c0-10.7-12.9-16-20.5-8.5l-40 40c-2.2 2.3-3.5 5.3-3.5 8.5z#svgend#';
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
			var tohtml = tohtml + '<tr data-milisecin="' + sorted[i].in + '" data-milisecut="' + sorted[i].ut + '"><td>' + indobj.datum + '</td><td>' + indobj.tid + '</td><td>' + utdobj.tid + '</td><td>' + addzero(time.t) + ':' + addzero(time.m) + ':' + addzero(time.s) + '</td><td>' + tabort + redigera + '</td></tr>';
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
		var spliturltwo = url.split('/');
		var prittyurltwo = spliturltwo[spliturltwo.length - 1];
		if(prittyurl == 'login.html' || prittyurl == 'rapport.html' || prittyurl == 'stat.html' || prittyurl == 'setting.html' || prittyurl == 'hjalp.html' || prittyurltwo == 'login.html' || prittyurltwo == 'rapport.html' || prittyurltwo == 'stat.html' || prittyurltwo == 'setting.html' || prittyurltwo == 'hjalp.html'){
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
		rapport.sort();
		for (var i = rapport.length - 1; i >= 0; i--) {
			if(!rapport[i].namn.indexOf(param.oldprojekt) == 0){
				var printcheckboxes = printcheckboxes + '<span class="checkboxwrapper"><input type="checkbox" data-namn="' + rapport[i].namn + '" checked><lable>' + rapport[i].namn + '</lable></span>';
				rapport[i].datum.sort();
				for (var a = 0; a < rapport[i].datum.length; a++){
					var prittydate = rapport[i].datum[a].replace('.json', '');
					if(idexofdates.indexOf(prittydate) == -1){
						idexofdates.push(prittydate);
					};
				};
			};
		};
	};
	idexofdates.sort();
	for (var i = idexofdates.length - 1; i >= 0; i--) {
		var skrivutdatum = skrivutdatum + '<option value="' + idexofdates[i] + '">' + idexofdates[i] + '</option>';
	};
	var printcheckboxes = printcheckboxes + '</div><br>';
	var skrivutdatum = skrivutdatum + '</select><br>';
	return printcheckboxes + skrivutdatum;
};

function monthbeforeandafter(date){
	if(!date){
		return false;
	}else{
		var split = date.split('-');
		var prevar = parseInt(split[0]);
		var prevman = parseInt(split[1]) - 1;
		var nextar = parseInt(split[0]);
		var nextman = parseInt(split[1]) + 1;
		if(prevman <= 0){
			var prevman = 12;
			var prevar = prevar - 1;
		};
		if(nextman >= 13){
			var nextman = 1;
			var nextar = nextar + 1;
		};
		return {"prev": prevar + '-' + addzero(prevman), "next": nextar + '-' + addzero(nextman)};
	};
};

// Kollar hur många dagar aktuell månad har
function daysInMonth (month, year) {
    return new Date(year, month, 0).getDate();
};

function alldatesfromtoday(json, today){
	var todaysplit = today.split('-');
	var dag = daysInMonth(parseInt(todaysplit[1]),parseInt(todaysplit[0]));
	var alldates = [['Projekt']];
	for (var i = 0; i < dag; i++){
		var topush = [(i + 1) + '/' + parseInt(todaysplit[1])];
		for (var a = 0; a < json.length; a++){
			topush.push(0);
		};
		alldates.push(topush);
	};
	for (var i = 0; i < json.length; i++){
		alldates[0].push(json[i].projektnamn)
		for (var a = 0; a < json[i].instamplingar.length; a++){
			var datum = json[i].instamplingar[a].datum.split('-');
			alldates[Math.round(datum[2])][i + 1] = Math.round(((json[i].instamplingar[a].sammanlagdtid / 1000) / 60) / 60);
		};
	};
	var totext = '';
	for (var i = 0; i < alldates.length; i++){
		if(i == alldates.length - 1){
			var end = '';
		}else{
			var end = ', ';
		}
		if(i == 0){
			var totext = totext + '[\'' + alldates[i].join("', '") + '\' ' + ', { role: \'annotation\' }]' + end;
		}else{
			var inputtotext = '';
			for (var a = 0; a < alldates[i].length; a++){
				if(a == 0){
					var inputtotext = inputtotext + '"' + alldates[i][a] + '"';
				}else{
					var inputtotext = inputtotext + ', ' + alldates[i][a];
				}
			}
			var totext = totext + '[' + inputtotext + ', \'\']' + end;
		}
	}
	var totext = '[' + totext + ']';
	return totext;
};

function statstohtml(statdata, datum){
	if(!statdata){
		return '';
	}else{
		var preandnext = monthbeforeandafter(datum.join('-'));
		//var tohtml = '<div class="center"><table><tbody><tr><td>#iconstart#fas fa-arrow-circle-left fa-3x#iconextra#onclick="nextpie(\'' + preandnext.prev + '\')"#iconend#</td><td id="piedatum">' + datum.join('-') + '</td><td>#iconstart#fas fa-arrow-circle-right fa-3x#iconextra#onclick="nextpie(\'' + preandnext.next + '\')"#iconend#</td></tr></tbody></table></div>';
		var tohtml = '<div class="center"><table><tbody><tr><td>#svgstart#0 0 512 512" onclick="nextpie(\'' + preandnext.prev + '\');#svginside#M256 504C119 504 8 393 8 256S119 8 256 8s248 111 248 248-111 248-248 248zm28.9-143.6L209.4 288H392c13.3 0 24-10.7 24-24v-16c0-13.3-10.7-24-24-24H209.4l75.5-72.4c9.7-9.3 9.9-24.8.4-34.3l-11-10.9c-9.4-9.4-24.6-9.4-33.9 0L107.7 239c-9.4 9.4-9.4 24.6 0 33.9l132.7 132.7c9.4 9.4 24.6 9.4 33.9 0l11-10.9c9.5-9.5 9.3-25-.4-34.3z#svgend#</td><td id="piedatum">' + datum.join('-') + '</td><td>#svgstart#0 0 512 512" onclick="nextpie(\'' + preandnext.next + '\');#svginside#M256 8c137 0 248 111 248 248S393 504 256 504 8 393 8 256 119 8 256 8zm-28.9 143.6l75.5 72.4H120c-13.3 0-24 10.7-24 24v16c0 13.3 10.7 24 24 24h182.6l-75.5 72.4c-9.7 9.3-9.9 24.8-.4 34.3l11 10.9c9.4 9.4 24.6 9.4 33.9 0L404.3 273c9.4-9.4 9.4-24.6 0-33.9L271.6 106.3c-9.4-9.4-24.6-9.4-33.9 0l-11 10.9c-9.5 9.6-9.3 25.1.4 34.4z#svgend#</td></tr></tbody></table></div>';
		var tohtml = tohtml + '<div id="detalj" class="center"><table id="detaljtable"><tbody>';
		var sammanmanad = 0;
		var chartData = ['["Projekt", "Tid i Millisekunder"]'];
		for (var i = 0; i < statdata.length; i++){
			var sammanmanad = parseInt(sammanmanad) + parseInt(statdata[i].sammanlagdtid);
			var gettime = timebetween('', '', statdata[i].sammanlagdtid);
			var tohtml = tohtml + '<tr><td>' + statdata[i].projektnamn + '</td><td>' + addzero(gettime.t) + ':' + addzero(gettime.m) + ':' + addzero(gettime.s) + '</td></tr>';
			chartData.push('["' + statdata[i].projektnamn + '", ' + statdata[i].sammanlagdtid + ']');
		};
		var samtid = timebetween('', '', sammanmanad);
		var tohtml = tohtml + '<td colspan="2" style="font-weight: bold;text-align: center;">' + addzero(samtid.t) + ':' + addzero(samtid.m) + ':' + addzero(samtid.s) + '</td></tbody></table></div>';
		var tohtml = tohtml + '<script type="text/javascript">function drawChart(){var chartData = [' + chartData.join(', ') + '];var data = google.visualization.arrayToDataTable(chartData);var options = {chartArea:{left:0,top:0,width:\'100%\',height:\'100%\'},legend:{alignment: \'center\'}};var chart = new google.visualization.PieChart(document.getElementById(\'piechart\'));chart.draw(data, options);};google.charts.load(\'current\', {\'packages\':[\'corechart\']});google.charts.setOnLoadCallback(drawChart);</script>';
		var daysdata = alldatesfromtoday(statdata, datum.join('-'));
		var tohtml = tohtml + '<script type="text/javascript">google.charts.load("current", {packages:[\'corechart\']});google.charts.setOnLoadCallback(drawChartTable);function drawChartTable() {var data = google.visualization.arrayToDataTable(' + daysdata + ');var options = {width: \'100%\',height: 400,legend: { position: \'top\', maxLines: 3 },bar: {groupWidth: \'75%\'},isStacked: true,};var chart = new google.visualization.ColumnChart(document.getElementById(\'columnchart_stacked\'));chart.draw(data, options);}</script>';
		var tohtml = tohtml + '<script type="text/javascript">document.getElementsByTagName(\'body\')[0].setAttribute(\'onresize\', "drawChart();drawChartTable();");</script>';

		return tohtml;
	};
};
function settingtohtml(vgrid, namn, projekt){
	var plusicon = '#svgstart#0 0 448 512" onclick="addprojekt();#svginside#M400 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48zm-32 252c0 6.6-5.4 12-12 12h-92v92c0 6.6-5.4 12-12 12h-56c-6.6 0-12-5.4-12-12v-92H92c-6.6 0-12-5.4-12-12v-56c0-6.6 5.4-12 12-12h92v-92c0-6.6 5.4-12 12-12h56c6.6 0 12 5.4 12 12v92h92c6.6 0 12 5.4 12 12v56z#svgend#';
	var editiconone = '#svgstart#0 0 576 512';
	var editicontwo = '#svginside#M402.6 83.2l90.2 90.2c3.8 3.8 3.8 10 0 13.8L274.4 405.6l-92.8 10.3c-12.4 1.4-22.9-9.1-21.5-21.5l10.3-92.8L388.8 83.2c3.8-3.8 10-3.8 13.8 0zm162-22.9l-48.8-48.8c-15.2-15.2-39.9-15.2-55.2 0l-35.4 35.4c-3.8 3.8-3.8 10 0 13.8l90.2 90.2c3.8 3.8 10 3.8 13.8 0l35.4-35.4c15.2-15.3 15.2-40 0-55.2zM384 346.2V448H64V128h229.8c3.2 0 6.2-1.3 8.5-3.5l40-40c7.6-7.6 2.2-20.5-8.5-20.5H48C21.5 64 0 85.5 0 112v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V306.2c0-10.7-12.9-16-20.5-8.5l-40 40c-2.2 2.3-3.5 5.3-3.5 8.5z#svgend#';
	var showiconone = '#svgstart#0 0 576 512';
	var showicontwo = '#svginside#M572.52 241.4C518.29 135.59 410.93 64 288 64S57.68 135.64 3.48 241.41a32.35 32.35 0 0 0 0 29.19C57.71 376.41 165.07 448 288 448s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zM288 400a144 144 0 1 1 144-144 143.93 143.93 0 0 1-144 144zm0-240a95.31 95.31 0 0 0-25.31 3.79 47.85 47.85 0 0 1-66.9 66.9A95.78 95.78 0 1 0 288 160z#svgend#';
	var hideiconone = '#svgstart#0 0 640 512" style="opacity: 0.5;';
	var hideicontwo = '#svginside#M320 400c-75.85 0-137.25-58.71-142.9-133.11L72.2 185.82c-13.79 17.3-26.48 35.59-36.72 55.59a32.35 32.35 0 0 0 0 29.19C89.71 376.41 197.07 448 320 448c26.91 0 52.87-4 77.89-10.46L346 397.39a144.13 144.13 0 0 1-26 2.61zm313.82 58.1l-110.55-85.44a331.25 331.25 0 0 0 81.25-102.07 32.35 32.35 0 0 0 0-29.19C550.29 135.59 442.93 64 320 64a308.15 308.15 0 0 0-147.32 37.7L45.46 3.37A16 16 0 0 0 23 6.18L3.37 31.45A16 16 0 0 0 6.18 53.9l588.36 454.73a16 16 0 0 0 22.46-2.81l19.64-25.27a16 16 0 0 0-2.82-22.45zm-183.72-142l-39.3-30.38A94.75 94.75 0 0 0 416 256a94.76 94.76 0 0 0-121.31-92.21A47.65 47.65 0 0 1 304 192a46.64 46.64 0 0 1-1.54 10l-73.61-56.89A142.31 142.31 0 0 1 320 112a143.92 143.92 0 0 1 144 144c0 21.63-5.29 41.79-13.9 60.11z#svgend#';
	if(!projekt){
		return '';
	}else{
		var tablecontent = '';
		var dolj = []
		var visa = []
		for (var a = 0; a < projekt.length; a++){
			if(!projekt[a].indexOf(param.oldprojekt) == 0){
				var tablecontent = tablecontent + '<tr><td><p>' + projekt[a] + '</p></td><td>' + editiconone + '" onclick="edit(this);' + editicontwo + '</td><td>' + showiconone + '" data-synlig="true" onclick="togglesynlig(this);' + showicontwo + '</td></tr>';
			}else{
				var tablecontent = tablecontent + '<tr><td><p>' + projekt[a].replace(param.oldprojekt, '') + '</p></td><td>' + editiconone + '" class="disable' + editicontwo + '</td><td>' + hideiconone + '" data-synlig="false" onclick="togglesynlig(this);' + hideicontwo + '</td></tr>';
			};
		};
		var splitnamn = namn.split(' ');
		var tohmtl = '<input type="text" name="old" style="display: none;" value="' + vgrid + param.splacertoken + namn + '">';
		var tohmtl = tohmtl + '<p>Användarnamn:</p><input type="text" name="anv" value="' + vgrid + '">';
		var tohmtl = tohmtl + '<p>Förnamn:</p><input type="text" name="fnamn" value="' + splitnamn[0] + '">';
		var tohmtl = tohmtl + '<p>Efternamn:</p><input type="text" name="enamn" value="' + splitnamn.splice(1, splitnamn.length - 1).join(' ') + '">';
		var tohmtl = tohmtl + '<p>Projekt/Anställningar</p><div class="divtable"><div class="divline"><div class="divruta"><input type="text" id="projektinput"></div><div class="divruta">' + plusicon + '</div></div></div>';
		var tohmtl = tohmtl + '<table><tbody id="projektlista">';
		var tohmtl = tohmtl + tablecontent + '</tbody></table>';
		return tohmtl;
	};
};

function setdefaultdata(id, projekt, filePath){
	if(!id){
		return '';
	}else{
		var spliturl = filePath.split('\\');
		var prittyurl = spliturl[spliturl.length - 1].split('/');
		var prittyurltwo = prittyurl[prittyurl.length - 1].replace('.html', '');
		return '?anv=' + id + '&toshow=' + prittyurltwo + '&projektnamn=' + projekt;
	};
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
	var statrender = statstohtml(options.statsrender, options.statdate);
	var settings = settingtohtml(options.vgrid, options.namn, options.projekt);
	var defaultdata = setdefaultdata(options.vgrid, options.projektnamn, filePath);


	// Döljer eller visar kod som skickas till server i url
	if(!param.hidelink){var hidelinkscript = '';}else{var hidelinkscript = '<script type="text/javascript">history.pushState(null, \'\', location.href.split(\'?\')[0]);</script>';};
    var rendered = content.toString()
    	.replace('#head#', '<!DOCTYPE html><html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><title>TidLogga</title>' + hidelinkscript + '<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1"><meta content="yes" name="apple-mobile-web-app-capable"><meta content="yes" name="mobile-web-app-capable"><meta content="minimum-scale=1.0, width=device-width, maximum-scale=0.6667, user-scalable=no" name="viewport"><meta name="apple-mobile-web-app-status-bar-style" content="black"><link rel="shortcut icon" href="' + param.link.icons + 'icon.ico"><link rel="icon" type="image/vnd.microsoft.icon" href="' + param.link.icons + 'icon.ico"><link rel="icon" type="image/png" href="' + param.link.icons + 'icon196x196.png"><link rel="apple-touch-icon-precomposed" href="' + param.link.icons + 'icon180x180.png"><link rel="apple-touch-icon-precomposed" sizes="76x76" href="' + param.link.icons + 'icon76x76.png"><link rel="apple-touch-icon-precomposed" sizes="120x120" href="' + param.link.icons + 'icon120x120.png"><link rel="apple-touch-icon-precomposed" sizes="152x152" href="' + param.link.icons + 'icon152x152.png"><link rel="stylesheet" href="' + param.link.style + 'main.css"><script type="application/javascript" src="' + param.link.script + 'main.js"></script>')
    	.replace('#header#', '</head><body><div id="wrapper"><div id="head">TidLogga</div><div id="header" class="table"><div class="tr"><div id="namn" class="td" data-namn="' + options.namn + '" data-vgrid="' + options.vgrid + '">' + greeting + '</div>' + projektnamn + '</div></div>')
    	.replace('#footer#', '</div><div id="footer">2018&nbsp;©&nbsp;Mattias Lidbeck&nbsp;¦&nbsp;{<a href="https://www.teddyprojekt.se/" alt="Länk till denna sida" onclick="internlink(this, event);">www.teddyprojekt.se</a>}</div></body></html>')
    	.replace('#projektselect#', projektselect)
    	.replace(/#defaultdata#/g, defaultdata)
    	.replace('#klockbuttons#', startstoptime.main)
    	.replace('#klockbuttonsannat#', startstoptime.annat)
    	.replace('#timecount#', startstoptime.timecount)
    	.replace('#projektdatum#', projektdatum)
    	.replace('#tidloggningar#', tidloggningar)
    	.replace('#rapport#', rapport)
    	.replace('#statrender#', statrender)
    	.replace('#settingform#', settings)
    	.replace('#tillbakaknapp#', '#svgstart#0 0 512 512" class="backbutton" onclick="tillbakatillprojekt();#svginside#M256 504C119 504 8 393 8 256S119 8 256 8s248 111 248 248-111 248-248 248zm28.9-143.6L209.4 288H392c13.3 0 24-10.7 24-24v-16c0-13.3-10.7-24-24-24H209.4l75.5-72.4c9.7-9.3 9.9-24.8.4-34.3l-11-10.9c-9.4-9.4-24.6-9.4-33.9 0L107.7 239c-9.4 9.4-9.4 24.6 0 33.9l132.7 132.7c9.4 9.4 24.6 9.4 33.9 0l11-10.9c9.5-9.5 9.3-25-.4-34.3z#svgend#')
    	.replace(/#svgstart#/g, '<svg aria-hidden="true"  role="img" xmlns="http://www.w3.org/2000/svg" viewBox="')
    	.replace(/#svginside#/g, '"><path fill="currentColor" d="')
    	.replace(/#svgend#/g, '"></path></svg>')
    	.replace(/#iconstart#/g, '<i class="')
    	.replace(/#iconextra#/g, '" aria-hidden="true" ')
    	.replace(/#iconend#/g, '></i>') //#iconstart# #iconextra# #iconend#
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

app.post('/nyanvandare*', function(req, res) {
	if(!req.body.anv || req.body.anv == '' || !req.body.fnamn || req.body.fnamn == '' || !req.body.enamn || req.body.enamn == ''){
		res.redirect('/index.html');
	}else{
		var avandare = finduser(req.body.anv.toLowerCase());
		if(avandare == ''){
			var userfolder = __dirname + '/' + param.link.users;
			makeDir.sync(userfolder + rensaochsakra(req.body.anv.toLowerCase()) + param.splacertoken + rensaochsakra(req.body.fnamn) + ' ' + rensaochsakra(req.body.enamn) + '/')
			res.redirect('/index.html?anv=' + rensaochsakra(req.body.anv.toLowerCase()) + '&toshow=login&projektnamn=');
		}else{
			res.redirect('/index.html');
		};
	};
});
function rensaochsakra(vari){
	return vari.replace(/[^A-Za-z0-9\s!?\u00C5\u00C4\u00D6\u00E5\u00E4\u00F6\u002D]/g,'');
};
app.post('/edit*', function(req, res) {
	if(req.body.oldprojektname == req.body.newprojektname){}else{
		var avandare = finduser(req.query.anv);
		var userfolder = __dirname + '/' + param.link.users + avandare + '/';
		fs.renameSync(userfolder + req.body.oldprojektname, userfolder + rensaochsakra(req.body.newprojektname));
	};
	res.redirect('/index.html?anv=' + req.query.anv + '&toshow=' + req.query.toshow + '&projektnamn=');
});
app.get('/laggtillprojekt*', function(req, res) {
	var avandare = finduser(req.query.anv);
	var userfolder = __dirname + '/' + param.link.users + avandare + '/';
	makeDir.sync(userfolder + rensaochsakra(req.query.laggtillprojekt) + '/')
	res.redirect('/index.html?anv=' + req.query.anv + '&toshow=setting&projektnamn=');
});
app.get('/tooglesynlig*', function(req, res) {
	var avandare = finduser(req.query.anv);
	var userfolder = __dirname + '/' + param.link.users + avandare + '/';
	var projektnamn = req.query.projektdolja.replace(param.oldprojekt, '');
	if(req.query.visadolj == 'dolj'){
		fs.renameSync(userfolder + projektnamn, userfolder + param.oldprojekt + projektnamn);
	}else if(req.query.visadolj == 'visa'){
		fs.renameSync(userfolder + param.oldprojekt + projektnamn, userfolder + projektnamn);
	}else{
		console.log('Visa/dölj fungerar inte...')
	};
	res.redirect('/index.html?anv=' + req.query.anv + '&toshow=setting&projektnamn=');
});
app.post('/andranamn*', function(req, res) {
	var checktestsson = req.body.old.toLowerCase().split(param.splacertoken)[0];
	if(!req.body.anv || !req.body.fnamn || !req.body.enamn || checktestsson == 'test3'){
		//Error
		res.redirect('/index.html');
	}else{
		var userexist = finduser(rensaochsakra(req.body.anv.toLowerCase()))
		var nynamn = rensaochsakra(req.body.anv.toLowerCase()) + param.splacertoken + rensaochsakra(req.body.fnamn) + ' ' + rensaochsakra(req.body.enamn);
		if(req.body.old == nynamn){
			console.log('Namn har inte ändrats')
			res.redirect('/index.html?anv=' + req.query.anv.toLowerCase() + '&toshow=login&projektnamn=');
		}else{
			//Kontrollerar ifall ID redan finns
			if(userexist == '' || req.body.anv.toLowerCase() == req.body.old.split(param.splacertoken)[0]){
				console.log('Namn ändras')
				fs.renameSync(__dirname + '/' + param.link.users + req.body.old, __dirname + '/' + param.link.users + nynamn);
				res.redirect('/index.html?anv=' + req.body.anv.toLowerCase() + '&toshow=login&projektnamn=');
			}else{
				res.redirect('/index.html?anv=' + req.query.anv.toLowerCase() + '&toshow=setting&projektnamn=');
			};
		};
	};
});



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
		if(layout == 'json'){
			console.log('JSONP');
			res.jsonp(html)
		}else{
			console.log('HTML');
			res.send(html)
		};
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
	if(!anv){
		return '';
	}else{
		var anvtolo = anv.toLowerCase();
		var allaanv = fs.readdirSync(param.link.users);
			if(allaanv.indexOf('.DS_Store') == -1){}else{
		    	allaanv.splice(allaanv.indexOf('.DS_Store'), 1);
		    };
		var anvandare = false;
		for (var i = 0; i < allaanv.length; i++){
			if(allaanv[i].split(param.splacertoken)[0] == anvtolo){
				anvandare = allaanv[i];
				break;
			};
		};
		return anvandare;
	};
};

function findprojekt(anvmapp){
	var allaprojekt = fs.readdirSync(param.link.users + anvmapp + '/');
		if(allaprojekt.indexOf('.DS_Store') == -1){}else{
	    	allaprojekt.splice(allaprojekt.indexOf('.DS_Store'), 1);
	    };
	return allaprojekt;
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
	var anvandare = finduser(anv);
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
	var htmlhead = '<!DOCTYPE html> <html> <head> <title>Tidrapport - ' + manader[parseInt(datum[1]) - 1] + ' ' + datum[0] + '</title> <style type="text/css"> #dontprint{ zoom: 1.5; } #info{font-size: 18px; background-color: yellow; margin: 10px; padding: 5px;} .printedit{background-color: #CCC;} h1{font-size: 20px; margin: 3px;} p{font-size: 15px; margin: 3px;} table#header{margin-bottom: 30px; } table#header, #header tr{width: 100%; } td{border: solid 1px #000; } table, tr{border-collapse: collapse; } @media print { #dontprint, #info{ display: none; } } </style> </head> <body>';
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

function searchprojekt(projektmapp, usermapp){
	var allstuff = [];
	for (var i = projektmapp.length - 1; i >= 0; i--) {
		var manader = fs.readdirSync(usermapp + projektmapp[i] + '/');
		if(manader.indexOf('.DS_Store') == -1){}else{
	    	manader.splice(manader.indexOf('.DS_Store'), 1);
	    };
		allstuff.push({"namn": projektmapp[i], "datum": manader});
	};
	return allstuff;
};

//Laddar sidor
app.get(['/', '/index.html'], function (req, res) {
	var anv = req.query.anv;
	var checkanv = finduser(anv);
	if(req.query.toshow == 'hjalpstart'){
		res.render('hjalp', {"vgrid": "", "namn": "", "projekt": "", "projektnamn": ""})
	}else if(!anv || anv == ''){
		res.render('index', {"vgrid": "", "namn": "", "projekt": "", "projektnamn": ""})
	}else if(!checkanv){
		res.redirect('/index.html');
	}else{
		var projektmapp = findprojekt(checkanv)
		var usersplit = checkanv.split(param.splacertoken);
		var vgrid = usersplit[0];
		var namn = usersplit[1];
		var usermapp = param.link.users + vgrid + param.splacertoken + namn + '/';
		var mapp =  usermapp + req.query.projektnamn + '/';
		var projekt = projektmapp;
		var projektnamn = req.query.projektnamn;
		var toshow = req.query.toshow;
		var starttime = req.query.starttime;
		var stoptime = req.query.stoptime;
		var datetofetch = req.query.datetofetch;
		if(toshow == 'login' || toshow == 'hjalp'){
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
			var allstuff = searchprojekt(projektmapp, usermapp);
			res.render(toshow, {"vgrid": vgrid, "namn": namn, "projekt": projekt, "projektnamn": projektnamn, "rapport": allstuff})
		}else if(toshow == 'stat'){
			if(!datetofetch){
				var todayfilename = getDate().manad.split('-');
			}else{
				var todayfilename = datetofetch.split('-');
			};
			var anvandare = vgrid + param.splacertoken + namn;
			var allstuff = searchprojekt(projektmapp, usermapp);
			var allaprojekt = []
			for (var i = allstuff.length - 1; i >= 0; i--) {
				allaprojekt.push(allstuff[i].namn);
			};
			var data = makejson(anvandare, todayfilename, allaprojekt);
			res.render(toshow, {"vgrid": vgrid, "namn": namn, "projekt": projekt, "projektnamn": projektnamn, "statsrender": data, "statdate": todayfilename})
		}else if(toshow == 'setting'){
			res.render(toshow, {"vgrid": vgrid, "namn": namn, "projekt": projekt, "projektnamn": projektnamn})
		}else{
			res.render('index', {"vgrid": "", "namn": "", "projekt": "", "projektnamn": ""})
		};
	};
})

/*// 404 sida som fångar upp de flesta error
app.use(function(req, res, next){
	//param.pages.error.root = countsub(req.url);
    res.status(404).render('404', {toshow: 'start'})
});*/

app.listen(param.port, () => console.log('Lyssnar på port ' + param.port + '!'))