function showhide(hide, show){if(hide == 'none'){}else{document.getElementById(hide).setAttribute('style', 'display: none;');};if(show == 'none'){}else{document.getElementById(show).removeAttribute('style');};};
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
function removechilds(parent){while (parent.hasChildNodes()) {parent.removeChild(parent.firstChild);};};
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
function tillbakatillprojekt(){
	var anv = document.getElementById('namn').getAttribute('data-vgrid');
	var projektnamn = document.getElementById('projektnamn').getAttribute('data-projektnamn');
	window.open('/index.html?anv=' + anv + '&toshow=login&projektnamn=' + projektnamn,'_self')
};