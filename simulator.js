var aocc=[];
var steps=0; var b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
function simulate(pm,plambda,paht,paat,pslt){

//alert("Simulator invoked: parms="+pm+'/'+plambda+'/'+paht+'/'+paat+'/'+pslt);
//Ext.Msg.alert('Simulation started!','Wait, it may take several seconds'); 
// global parameters
    
var globalTime=0;  // modeling time
var globalTimeMax=3000; // time interval e.g. 15 min
var numRealizations=30; // number of model instances - e.g. number of agents


var sationaryFactor=1; //in %%

var slSeconds=20;
if (pslt) slSeconds=pslt;
var slPoints=slSeconds*points;
// temporaty variables
var lambda=plambda; 
//alert('simulator, lambda='+lambda)
var m=pm;
var aht=paht;
var mu=1/aht;
var aat=paat;
var nu=1/aat;

var points=Math.max(lambda,mu,nu); // number of calls in 1 second

//mean variables

var asa=0;

var singleModel = {
	queue:[],
	agents:[],
	queueTime2agent:0,
	queueNumb2agent:0,
	queueNumbGood2agent:0,
	queueTime2aband:0,
	queueNumb2aband:0,
	numCallGenerated:0,
	numCallQueued:0,
	numCallsAbandoned:0,
	
	move2agent:function(){
		//alert ("Queue call leaves, qlength="+this.queue.length);
		if (this.queue.length>0) {
		//	alert ("Queue call leaves, qlength="+this.queue.length);
			var call=this.queue.pop();
			this.queueTime2agent += globalTime-call;
			this.queueNumb2agent++; 
			if (globalTime-call<=slPoints) this.queueNumbGood2agent++;
			this.agents.push(globalTime);
			};
	},
	move2aband:function(){
		//alert ("Agent call abandoned, t=");
		 
		for (var i=0;i<this.queue.length;i++){
		    if(poissonN(nu)){
		 	  var call=this.queue.splice(i,1); i--;
		 	  this.queueTime2aband += globalTime-call; 
			  this.queueNumb2aband++;
			  //alert ("Agent call leaves, t="+call);	
		    }
		}
	},
	leaveAgents:function(){
		//alert ("Agent call leaves 0, t="+this.agents.length);
	 /*	if(poissonN(mu*this.agents.length)){
			this.agents.pop();
			this.move2agent();			
		} */
	 	 for (var i=0;i<this.agents.length;i++){
		    if(poissonN(mu)){
		 	  var call=this.agents.splice(i,1); i--;
			  //alert ("Agent call leaves, t="+call);	
			  this.move2agent();		  
		    }
		}   
	},
	generateCall:function(){
		if(poissonN(lambda)){
			this.numCallGenerated++;
			if (this.agents.length>=m) {
				this.queue.push(globalTime); 
		 		this.numCallQueued++;
				} 
			else {this.agents.push(globalTime); 
				this.queueNumb2agent++;
				this.queueNumbGood2agent++;};
		};
	},
	makeOneStep:function(){
		//alert('Make one step 1');
		this.leaveAgents();
		this.move2aband();
		this.generateCall();
		//alert('Make one step 2');
		var rasa=this.queueNumb2agent>0? this.queueTime2agent/this.queueNumb2agent :0;
		var rar=(this.queueNumb2aband+this.queueNumb2agent)>0? 100*this.queueNumb2aband/(this.queueNumb2aband+this.queueNumb2agent) :0;
		var rao=m>0? 100*this.agents.length/m :0;
	//	var rsl=this.numCallGenerated>0? 100*this.queueNumbGood2agent/this.numCallGenerated :0;
	 	var rsl= (this.queueNumb2aband+this.queueNumb2agent)>0? 100*this.queueNumbGood2agent/(this.queueNumb2aband+this.queueNumb2agent) :0;
		var rawc=(this.queueNumb2aband+this.queueNumb2agent)>0? 100*this.numCallQueued/(this.queueNumb2aband+this.queueNumb2agent):0;
		var raql=100*this.queue.length; 
		var rata=this.queueNumb2aband>0? 100*this.queueTime2aband/this.queueNumb2aband :0;
		return {'asa':rasa,'ar':rar,'ao':rao,'sl':rsl, 'awc':rawc,'aql':raql,'ata':rata};
	},	
};

	// create array of models
	var models=[];
		for(var i=0;i<numRealizations;i++){
			var md = Object.create(singleModel); 
			md.agents = new Array();
			md.queue = new Array();
			models.push(md);
			//models.push(Object.create(singleModel));
			};
	
	aocc=[];
	//var results={};
	var aver_occ=0;
	var aver_asa=0;
	var aver_ar=0;
	var aver_sl=0;
	var aver_awc=0;
	var aver_aql=0;
	var aver_ata=0;
		
	while(globalTime<globalTimeMax){
   //   busy_agents_old=busy_agents_new;
	  var sum_occ=0;
	  var sum_asa=0;
	  var sum_ar=0;
	  var sum_sl=0;	
	  var sum_awc=0;
	  var sum_aql=0;
	  var sum_ata=0;
	  for (var i=0;i<numRealizations;i++) {
	  	results = models[i].makeOneStep();
	  	sum_occ += results.ao;
	  	sum_asa += results.asa; 
	  	sum_ar += results.ar; 
	  	sum_sl += results.sl;
	  	sum_awc += results.awc; 
	  	sum_aql += results.aql;	
	  	sum_ata += results.ata;	  
	  	};
      aver_occ=sum_occ/numRealizations;
      aver_asa=sum_asa/(numRealizations*points);
      aver_ar=sum_ar/numRealizations;
      aver_sl=sum_sl/numRealizations;
      aver_awc=sum_awc/numRealizations;
      aver_aql=sum_aql/numRealizations;
      aver_ata=sum_ata/numRealizations;
      busy_agents_new=aver_occ;
    //   if(Math.abs(busy_agents_new-busy_agents_old)/busy_agents_new<0.000001 && busy_agents_new!=busy_agents_old) {
    //   	alert("Break: old="+busy_agents_old+", new="+busy_agents_new);
     //  	break;};
     aocc.push({tm:globalTime,oc:aver_occ});
     // aocc.push({tm:globalTime,oc:aver_aql});
	  globalTime++;
	};
	return {'asa':aver_asa, 'ar':aver_ar,'ao':aver_occ,'sl':aver_sl,'awc':aver_awc,'aql':aver_aql,'ata':aver_ata,'points':points};
	
function poissonN(l) { if (Math.random()<=l/points) return 1; else return 0; };

};



var mb;
function calculate(indata){
	var resultsG={};
	mb=Ext.MessageBox.show({
              msg: 'Calculating, please wait...',
              progressText: 'Preparing...',
              width:300,
              icon:'ajax',
              iconHeight: 50,
              wait:true,
              waitConfig: {interval:100},
            });
            setTimeout(function(){calculateFull(indata)}, 1000); 
};

function calculateFull(indata){
	
	// input JSON object: {lambda,aht,slp,slt,aat,ao,asa}
	var calls=indata.calls;
	var aht=indata.aht;
	var slp=indata.slp;
	var slt=indata.slt;
	var aat=indata.aat;
	var asa=indata.asa;
	var index=indata.index;
	var myrec=hoursGrid.store.getAt(index);
	

	var diff=Infinity;
	var callsN;
	var newGamma=0;
	for(var i=0;i<hours;i++){  
  		callsN=hoursGrid.store.getAt(i).data.calls;
  		if(callsN){
  		  //alert('New: calls='+calls+',lambda='+lambda);
  		  if(parseInt(callsN)==calls && i!=index){
  			var rec=hoursGrid.store.getAt(i);
  			myrec.set('agents',rec.get('agents'));myrec.set('calls',rec.get('calls')); myrec.set('sl',String(rec.get('sl')).slice(0,4)); 
            myrec.set('ar',String(rec.get('ar')).slice(0,4));myrec.set('asa',String(rec.get('asa')).slice(0,4));
            myrec.set('occupancy',String(rec.get('occupancy')).slice(0,4));
            var rho=averageHandlingTime*rec.get('calls')/3600;
            myrec.set('gamma',(rec.get('agents')-rho)/Math.sqrt(rho));
            mb.hide();
            return //{'calls':rec.get('calls'),'m':rec.get('agents'),'asa':rec.get('asa'),'ar':rec.get('ar'),'ao':rec.get('occupancy'),'sl':rec.get('sl')};
  		  };
  		  var d=Math.abs(calls-parseInt(parseInt(callsN)));
  		  if(d<diff && i!=index){diff=d; newGamma=hoursGrid.store.getAt(i).data.gamma;}
       };
	};
    var lambda=calls/3600; 
	var m=Math.ceil(lambda*aht*(1-maxAR/100)+newGamma*Math.sqrt(lambda*aht));
 //alert('Agents: mNew='+m+', oldM='+Math.ceil(lambda*aht*(1-maxAR/100))+', gamma='+newGamma); 
	var br=0;
    var result={}, oldResult={};
    steps=1;b1=0;b2=0;b3=0;b4=0;b5=0;b6=0;
    while(true){ 
    	result=simulate(m,lambda,aht,aat,slt);  
   	    if        ((result.sl>=slp||!countSL) && (result.ar<=maxAR||!countAR) && (result.asa<=maxASA||!countASA)  && br==1){b1++;m--;}
     	else if   ((result.sl>=slp||!countSL) && (result.ar<=maxAR||!countAR) && (result.asa<=maxASA||!countASA)  && br==2){b2++;oldResult=result;break;}
    	else if   ((result.sl>=slp||!countSL) && (result.ar<=maxAR||!countAR) && (result.asa<=maxASA||!countASA)  && br==0){b3++;m--;br=1;} 
    	else if (!((result.sl>=slp||!countSL) && (result.ar<=maxAR||!countAR) && (result.asa<=maxASA||!countASA)) && br==0){b4++;m++;br=2;} 
    	else if (!((result.sl>=slp||!countSL) && (result.ar<=maxAR||!countAR) && (result.asa<=maxASA||!countASA)) && br==1){b5++;m++;break;}    
    	else if (!((result.sl>=slp||!countSL) && (result.ar<=maxAR||!countAR) && (result.asa<=maxASA||!countASA)) && br==2){b6++;m++;}
    	else {alert('Error in cycle')};
    	oldResult=result;
        steps++;
    };
    oldResult.m=m;
    oldResult.calls=calls;
    resultsG=oldResult;

    myrec.set('agents',m);myrec.set('calls',calls); myrec.set('sl',String(oldResult.sl).slice(0,4)); 
    myrec.set('ar',String(oldResult.ar).slice(0,4));myrec.set('asa',String(oldResult.asa).slice(0,4));
    myrec.set('occupancy',String(oldResult.ao).slice(0,4));
    var rho=averageHandlingTime*calls/3600;
    myrec.set('gamma',(m-rho)/Math.sqrt(rho));
    mb.hide();	
	return oldResult;
	
	
	
	//var result=simulate(m,lambda,aht,aat,slt);  //first run
	
};
