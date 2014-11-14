

//default paremeters
var dlambda=1;
var daht=100;
var dm=100;
var daat=10000;
// view parameters
var myWidth=600;

var gamma=-0.67;
var averageHandlingTime=180;
var averageAbTime=averageHandlingTime;
var maxAR=5;
var minSLp=80;
var slTime=20;
var maxASA=10;

var countSL=true;
var countASA=false;
var countAR=true;

var ahtText='<b><font color="red">'+averageHandlingTime+'</font></b> seconds';
var slText='<b><font color="red">'+minSLp+'%</font></b> of calls in <b><font color="red">'+slTime+'</font></b> seconds';
var aatText='<b><font color="red">'+averageAbTime+'</font></b> seconds';
var arText='<b><font color="red">'+maxAR+'%</font></b>';
var asaText='<b><font color="red">'+maxASA+'</font></b> seconds';

var hourNum=0;
var hours=24;
var firstHour=8;
var lastHour=17;
var hourLines=[];
for (var i=0;i<hours;i++) hourLines.push({hour:i+':00'});

var progressBar = Ext.create('Ext.ProgressBar', {
   renderTo: Ext.getBody(),
   width: 300
});

Ext.create('Ext.data.Store', {
    storeId:'hoursStore',
    fields:['hour','calls', 'agents', 'sl', 'ar','occupancy','asa','gamma'],
    data:{'items':hourLines},
    proxy: {
        type: 'memory',
        reader: {
            type: 'json',
            root: 'items'
        }
    }
});


var hoursGrid=Ext.create('Ext.grid.Panel', {
	
    title: '<font style="font-size: 12px;">Hourly Calls and Results</font>',
   // tools: [{type:"print"}],
    disabled:false,
    margin: "2 5 5 5",
    columnLines: true,
    cls: 'custom-dirty',
    viewConfig: { 
        stripeRows: false, 
        getRowClass:function(rec){return parseInt(rec.get('hour'))<lastHour && parseInt(rec.get('hour'))>=firstHour  ?'adult-row':'child-row';}  ,
    },
    store: Ext.data.StoreManager.lookup('hoursStore'),
    columns: [{  header: 'Hour', cls:'biggertext1', dataIndex: 'hour', width: 60, sortable: false, tdCls: 'custom-column3'},
        {text:'Input Parameters', cls:'biggertext1',
          columns:[
             {header: 'Number of Calls', cls:'biggertext',dataIndex: 'calls', width:110, sortable: false, //tdCls: 'custom-column',
                 editor: { xtype: 'textfield', allowBlank: false }
             },{header: 'Agents', cls:'biggertext1',dataIndex: 'agents', width:73,sortable: false,tooltip:'Staffing Level - Number of Agents',//tdCls: 'custom-column1',
                 // editor: { xtype: 'textfield', allowBlank: false }
                 editor: {
                   xtype: 'numberfield',
                   allowBlank: false,
                   minValue: 1,
                   maxValue: 600,
            }
         },
             
         ]},
         {text:'Output Parameters', cls:'biggertext1',
         columns:[
        {header: 'SL (%)', cls:'biggertext1',dataIndex: 'sl', width:60,sortable: false,tdCls: 'custom-column1',tooltip:'Service Level'},
        {header: 'AR (%)', cls:'biggertext1',dataIndex: 'ar', width:60,sortable: false,tdCls: 'custom-column1',tooltip:'Abandonment Rate'},
        {header: 'ASA (sec)', cls:'biggertext1',dataIndex: 'asa', width:70,sortable: false,tdCls: 'custom-column1',tooltip:'Average Speed of Answer'},
        {header: 'Occupancy (%)', cls:'biggertext1',dataIndex: 'occupancy', width:110,sortable: false,tdCls: 'custom-column1',tooltip:'Agent Occupancy'},
     //  {header:'gamma',dataIndex:'gamma'}      
      ]}
    ],
    selType: 'cellmodel',
    plugins: [
        Ext.create('Ext.grid.plugin.CellEditing', {
            clicksToEdit: 1
        })
    ],
   // viewConfig: {
    //    getRowClass:'price-fall'},
    height: 600,
    width: '100%', //420,
    listeners : {
                edit: function(editor,e,eOpts) {
                	if(e.colIdx==1){
                		if (parseInt(e.value)===0.0 || !parseInt(e.value)) {
                			if(!parseInt(e.value) && parseInt(e.value)!=0) {Ext.Msg.alert('Warning!','Number of calls is not a number!');};
                			e.record.set('calls',0); e.record.set('agents',0);
                            e.record.set('sl',0); e.record.set('ar',0); 
                            e.record.set('asa',0); e.record.set('occupancy',0);  
                        return;};
                        var calls=parseInt(e.value);
                        if(calls*averageHandlingTime/3600>=600){
                        	Ext.Msg.alert('Warning! It seems the number of agents is greater than 600','Ask BrightPattern professional service for help!');return;}
                 //       alert('lambda='+calls);
                       var parm={'calls':calls,'aht':averageHandlingTime,'slp':minSLp,'slt':slTime,'aat':averageAbTime,'asa':maxASA,'index':e.rowIdx};
                  
                       var result=calculate(parm);
                      // var result=calculateFull(parm);
                       e.record.set('calls',String(result.calls).slice(0,4));
                       e.record.set('agents',String(result.m).slice(0,4));
                       e.record.set('sl',String(result.sl).slice(0,4));
                       e.record.set('ar',String(result.ar).slice(0,4));
                       e.record.set('asa',String(result.asa).slice(0,4));
                       e.record.set('occupancy',String(result.ao).slice(0,4));
                       var rho=averageHandlingTime*result.calls/3600;
                       e.record.set('gamma',(result.m-rho)/Math.sqrt(rho));
                    }else{
                		if(!parseFloat(e.value)) {Ext.Msg.alert('Warning!','Number of agents is not a number!');return;};
                		if(!parseFloat(e.record.get('calls'))) {
                			Ext.Msg.alert('Warning!','Number of calls is not specified!');
                			e.record.set('agents',''); return;};
                		nAgents=e.value;                	
                	    e.record.set('agents',nAgents);
                	    var la=parseFloat(e.record.get('calls'))/3600;
                	    //alert("from agent, la="+la+', agents='+nAgents);
                        var result=simulate(nAgents,la,averageHandlingTime,averageAbTime,slTime);
                        e.record.set('sl',String(result.sl).slice(0,4));
                        e.record.set('ar',String(result.ar).slice(0,4)); 
                        e.record.set('asa',String(result.asa).slice(0,4)); 
                        e.record.set('occupancy',String(result.ao).slice(0,4)); 
                    };   
                 },
                 viewready:function(t,eOpt){t.getView().focusRow(20);},
            },
});


Ext.define('App.hourPanel',{
	extend: 'Ext.container.Container',
//	extend: 'Ext.form.Panel',
	id: 'hour_panel',
	frame:true,
	margin: "5 0 5 0",
    anchor: '100%',
    layout:'column',
    items:[{
                	xtype: 'displayfield',
            	    columnWidth:.1,
            	    layout: 'anchor',
                    labelWidth: 0,
                    margin: "0 20 0 10",
                    value:hourNum, 
                },{
                	xtype: 'textfield',
                	itemId:'arate',
            	    columnWidth:.18,
                    layout: 'anchor',
                    allowBlank:false,
                    labelWidth: 0,
                    margin: "0 0 0 0",
                    value:'' 
                },{
                	xtype: 'textfield',
            	    columnWidth:.15,
                    layout: 'anchor',
                    labelWidth: 0,
                    margin: "0 0 0 10",
                    value:'',
                    listeners : {
                         focus: function(thisp, eOptsp) { 
                         	alert("Click"+thisp.up("#hour_panel").down("#arate").getvalue());
                                 }
                     },
                },{
                	xtype: 'textfield',
            	    columnWidth:.2,
                    layout: 'anchor',
                    labelWidth: 0,
                    margin: "0 0 0 10",
                    value:''
                },{
                	xtype: 'textfield',
            	    columnWidth:.2,
                    layout: 'anchor',
                    labelWidth: 0,
                    margin: "0 0 0 10",
                    value:''
                },{
                	xtype: 'textfield',
            	    columnWidth:.15,
                    layout: 'anchor',
                    labelWidth: 0,
                    margin: "0 0 0 10",
                    value:''
                }
    ]
});

var calc_form3=Ext.create('Ext.form.Panel', {
	frame:true,
    width: myWidth,
    //height: 500,
    itemId:'form_panel3',
    resizable : true,
    fieldDefaults: {
        msgTarget: 'side',
        labelWidth: 180  },
    defaultType: 'textfield',
    defaults: { anchor: '100%' },
    items:[hoursGrid],
    buttons:[{
    	text: 'Start Calculation',
        scale: 'large',
        hidden:true,
        item:'calc_btn',
        itemId:'calc_btn',
        name:'calc_btn',
        tooltip:'Start calculation process',
        handler: function(){
        	
        	var parm={'aht':averageHandlingTime,'slp':minSLp,'slt':slTime,'aat':averageAbTime};
        	var res=calculateGamma(parm);        	
        	gamma=res;
          //  Ext.getCmp('resultsFset').enable();

          
            },
    },{
         text:'ShowChart',
         scale:'large',
         hidden:true,
         handler:function(){
         storeChart.loadData(aocc);
         winChart.show()
       }
    },{
         text:'Export',
         //scale:'large',
         hidden:true,
         handler:function(){
           Ext.Msg.alert('Export results','Will be in next version'); 
       }
    },{
         text:'CalcDebug',
         scale:'large',
         hidden:true,
         handler:function(){
         	var m=3;
         	var lambda=5/3600;
         	var aht=180;
         	var aat=aht;
         	var slt=20;
            var r=simulate(m,lambda,aht,aat,slt);
             Ext.Msg.alert('Debugging simulation','AR='+r.ar+', SL='+r.sl+', ASA='+r.asa+', aql='+r.aql+', ao='+r.ao+', ata='+r.ata); 
            }
    },{
         text:'Debug2',
         //scale:'large',
         id:'mb7',
         hidden:true,
         handler:function(){
           Ext.Msg.alert('Debugging','gamma='+gamma+', steps='+steps+', b='+b1+','+b2+','+b3+','+b4+','+b5+','+b6); 
         //  hoursGrid.getView().focusRow(Math.ceil(hours/2)+7);

       }
    }]
});

var calc_form2=Ext.create('Ext.form.Panel', {
	title:'<font style="font-size: 12px;">Input Parameters<font style="font-size: 14px;">',
	frame:true,
    width: 420,
    height: '100%',
    margin: "2 0 5 0",
    itemId:'form_panel2',
    resizable : true,
    fieldDefaults: {
        msgTarget: 'side',
        labelWidth: 190  },
    defaultType: 'textfield',
    defaults: { anchor: '100%' },
    items:[{
    	xtype:'fieldset',
    	margin: "20 0 5 0",
       // title: 'Input Parameters',
        defaultType: 'displayfield',
        layout: 'anchor',
        defaults: { anchor: '100%'},
        items:[{
        	xtype:'fieldset',
            title: 'Handling Time',
            defaultType: 'displayfield',
            layout: 'anchor',
            defaults: { anchor: '100%'},
            items:[{
            	labelCls: 'biggertext',
            	fieldCls:'biggertext',
        	  fieldLabel: 'Average Handling Time',
              name: 'aht',
              itemId:'aht',
              id:'aht',
           // allowBlank:false,
              value: ahtText,
             }]
         },{
         	xtype:'fieldset',
            title: 'Service Level',
            defaultType: 'displayfield',
            layout: 'anchor',
            defaults: { anchor: '100%'},
            items:[{
            	labelCls: 'biggertext',
              fieldCls:'biggertext',
           	  fieldLabel:'Min Service Level',
           	  itemId:'sl',
           	  value:slText,
           	 }]
              },{
              	xtype:'fieldset',
            title: 'Call Abandonment',
            defaultType: 'displayfield',
            layout: 'anchor',
            
            defaults: { anchor: '100%'},
            items:[{
           	  fieldLabel:'Average Patience Time',
           	  itemId:'aat',
           	  labelCls: 'biggertext',
              fieldCls:'biggertext',
              value:aatText,
           },{
              fieldLabel:'Max Abandonment Rate',
              labelCls: 'biggertext',
              fieldCls:'biggertext',
           	  itemId:'ar',
              value:arText,
             }]
           },{
           	xtype:'fieldset',
            title: 'Average Speed of Answer',
            
            defaultType: 'displayfield',
            layout: 'anchor',
            defaults: { anchor: '100%'},
            items:[{
            	labelCls: 'biggertext',
              fieldCls:'biggertext',
             	fieldLabel:'Max Average Speed of Answer',
             	itemId:'asa',
             	
            	value:asaText,
           }]}
        ]
    }],
    buttons:[{
    	text:'Change Input Parameters',
    	scale:'large',
    	tooltip:'Change input parameters',
    	handler:function(){
    		change_win_form.show();
    		change_win_form.down('#caht').setValue(averageHandlingTime);
    		change_win_form.down('#csl').setValue(minSLp);
    		change_win_form.down('#cslt').setValue(slTime);
    		change_win_form.down('#caat').setValue(averageAbTime);
    		change_win_form.down('#car').setValue(maxAR);
    		change_win_form.down('#casa').setValue(maxASA);
    		
    		
    	}
    },]
	
});

 //Ext.getCmp('aat').add();
 
 var hourCont=calc_form2.down('#resultsFset');
 //hourCount.add(hoursGrid);

Ext.onReady(function(){
	Ext.tip.QuickTipManager.init();
	// Ext.util.CSS.swapStyleSheet("theme","../extjs/resources/css/ext-all-gray.css");
	var cooks=Ext.decode(Ext.util.Cookies.get('wfmcObj'));
	//Ext.Msg.alert('Coocies','val='+Ext.util.Cookies.get('wfmcObj'));
	//Ext.Msg.alert('Cookies','val='+Ext.util.Cookies.get('wfmcObj'));  
	if(cooks!=null){
	  gamma=cooks.gamma;
      averageHandlingTime=cooks.aht;
      averageAbTime=cooks.aat;
      maxAR =cooks.ar;
      minSLp=cooks.slp;
      slTime=cooks.slt;
      maxASA=cooks.asa;
      ahtText='<b><font color="red">'+averageHandlingTime+'</font></b> seconds';
      slText='<b><font color="red">'+minSLp+'%</font></b> of calls in <b><font color="red">'+slTime+'</font></b> seconds';
      aatText='<b><font color="red">'+averageAbTime+'</font></b> seconds';
      arText='<b><font color="red">'+maxAR+'%</font></b>';
      asaText='<b><font color="red">'+maxASA+'</font></b> seconds';
      calc_form2.down('#aht').setValue(ahtText);
      calc_form2.down('#sl').setValue(slText);
      calc_form2.down('#aat').setValue(aatText);
      calc_form2.down('#ar').setValue(arText);
      calc_form2.down('#asa').setValue(asaText);
	};  
	 
	var calc_tab=Ext.create('Ext.panel.Panel', {
		frame:true,
      width: 980, //1055,
      cls:'my-title',
      title:'<font style="font-size: 14px;">BrightPattern Workforce Calculator</font>',
      tools: [{type:"help", handler:function(){ Ext.Msg.alert('About BrightPattern Workforce Calculator','Version 0.5'); }}],
   //    renderTo: document.body,
       renderTo:Ext.getBody(),
       headerCls:'biggertext',
        layout: 'hbox',
   //   renderTo: document.calc,
      items: [calc_form2,hoursGrid]
    });
    
});


var change_form=Ext.create('Ext.form.Panel', {
	frame:true,
    width: 300,
    //height: 500,
    itemId:'change_form',
    resizable : true,
    fieldDefaults: {
        msgTarget: 'side',
        labelWidth: 210  },
    defaultType: 'textfield',
    defaults: { anchor: '100%' },
    items:[{
        	fieldLabel: 'Average Handling Time (sec)',
            name: 'caht',
            itemId:'caht',
            id:'caht',
            allowBlank:false,
            value: averageHandlingTime,
           },{
           	xtype:'fieldset',
            checkboxToggle:true,
            title: 'Account for Service Level?',
            defaultType: 'textfield',
            collapsed: false,
            layout: 'anchor',
            defaults: { anchor: '100%'},
            listeners : {
                expand: function(f,eOpts) {countSL=true; },
                collapse: function(f,eOpts) {countSL=false;}
            },
            items:[{
        	   fieldLabel: 'Min Service Level (%)',
               name: 'csl',
               itemId:'csl',
               id:'csl',
               allowBlank:false,
               value: minSLp,
              },{
        	    fieldLabel: 'Service Level Interval (sec)',
               name: 'cslt',
               itemId:'cslt',
               id:'cslt',
               allowBlank:false,
               value: slTime,
             }]
           },{
           	xtype:'fieldset',
            checkboxToggle:true,
            title: 'Account for Call Abandonment?',
            defaultType: 'textfield',
            collapsed: false,
            layout: 'anchor',
            defaults: { anchor: '100%'},
            listeners : {
                expand: function(f,eOpts) {countAR=true; },
                collapse: function(f,eOpts) {countAR=false;}
            },
            items:[{
        	    fieldLabel: 'Average Patience Time (sec)',
                name: 'caat',
                itemId:'caat',
                id:'caat',
                allowBlank:false,
                value: averageAbTime,
              },{
        	    fieldLabel: 'Max Abandonment Rate (sec)',
                name: 'car',
                itemId:'car',
                id:'car',
                allowBlank:false,
                value: maxAR,
              }]
           },{
            xtype:'fieldset',
            checkboxToggle:true,
            title: 'Account for Average Speed of Answer?',
            defaultType: 'textfield',
            collapsed: true,
            layout: 'anchor',
            defaults: { anchor: '100%'},
            listeners : {
                expand: function(f,eOpts) {countASA=true; },
                collapse: function(f,eOpts) {countASA=false;}
            },
            items:[{
        	   fieldLabel: 'Max Average Speed of Answer (sec)',
               name: 'casa',
               itemId:'casa',
               id:'casa',
               allowBlank:false,
               value: maxASA,
              }]
           }],
    buttons:[{
    	text:'Save&Calculate',
    	id:'mb8',
    	hidden:true,
    	handler:function(){
    		averageHandlingTime=this.up('#change_form').down('#caht').getValue();
    		ahtText='<b><font color="red">'+averageHandlingTime+'</font></b> seconds';
    		calc_form2.down('#aht').setValue(ahtText);
    		if(countSL){minSLp=this.up('#change_form').down('#csl').getValue();
    		   slTime=this.up('#change_form').down('#cslt').getValue();
    		   slText='<b><font color="red">'+minSLp+'%</font></b> of calls in <b><font color="red">'+slTime+'</font></b> seconds';
    		   calc_form2.down('#sl').setValue(slText);};
    		if(countAR) {averageAbTime=this.up('#change_form').down('#caat').getValue();
    		   aatText='<b><font color="red">'+averageAbTime+'</font></b> seconds';
    		   calc_form2.down('#aat').setValue(aatText);
    		   maxAR=this.up('#change_form').down('#car').getValue();
    		   arText='<b><font color="red">'+maxAR+'%</font></b>';
    		   calc_form2.down('#ar').setValue(arText);};
    		if(countASA){maxASA=this.up('#change_form').down('#casa').getValue();
    		  asaText='<b><font color="red">'+maxASA+'</font></b> seconds';   
    		  calc_form2.down('#asa').setValue(asaText);};
    		  
    		  
    	 	Ext.MessageBox.show({
              msg: 'Preparing for calculations, please wait...',
              progressText: 'Preparing...',
              width:300,
              wait:true,
              
              waitConfig: {interval:200},
          // icon:'save', //custom class in msg-box.html
           animateTarget: 'mb8'
            });
        setTimeout(function(){
	        var parm={'aht':averageHandlingTime,'slp':minSLp,'slt':slTime,'aat':averageAbTime};
        	var res=calculateGamma(parm);        	
        	gamma=res;
        	change_win_form.hide();
         	Ext.MessageBox.hide();
         	parm.ar=maxAR; parm.asa=maxASA;
         	parm.gamma=gamma;
         	Ext.util.Cookies.set('wfmcObj',Ext.encode(parm))
       	}, 4000); 
    	}
    },{
    	text:'Save',
    	handler:function(){
    		averageHandlingTime=this.up('#change_form').down('#caht').getValue();
    		ahtText='<b><font color="red">'+averageHandlingTime+'</font></b> seconds';
    		calc_form2.down('#aht').setValue(ahtText);
    		if(countSL){minSLp=this.up('#change_form').down('#csl').getValue();
    		   slTime=this.up('#change_form').down('#cslt').getValue();
    		   slText='<b><font color="red">'+minSLp+'%</font></b> of calls in <b><font color="red">'+slTime+'</font></b> seconds';
    		   calc_form2.down('#sl').setValue(slText);};
    		if(countAR) {averageAbTime=this.up('#change_form').down('#caat').getValue();
    		   aatText='<b><font color="red">'+averageAbTime+'</font></b> seconds';
    		   calc_form2.down('#aat').setValue(aatText);
    		   maxAR=this.up('#change_form').down('#car').getValue();
    		   arText='<b><font color="red">'+maxAR+'%</font></b>';
    		   calc_form2.down('#ar').setValue(arText);};
    		if(countASA){maxASA=this.up('#change_form').down('#casa').getValue();
    		  asaText='<b><font color="red">'+maxASA+'</font></b> seconds';   
    		  calc_form2.down('#asa').setValue(asaText);};
    		  
    		  var parm={'aht':averageHandlingTime,'slp':minSLp,'slt':slTime,'aat':averageAbTime,'asa':maxASA,'ar':maxAR};
    		  Ext.util.Cookies.set('wfmcObj',Ext.encode(parm));
    		  change_win_form.hide();
    	}
    },{
    	text:'Close Window',
    	handler:function(){
    		change_win_form.hide();
    	},
    }]       
});
	
var change_win_form =  Ext.create('Ext.window.Window', {
                       title: 'Change Input Parameters',
                       itemId:'wf_panel',
                       resizable : true,
                       renderTo:Ext.getBody(),
                    //   renderTo:Ext.getBody(),
                    //   height: 400,
                    //   width: 400,
                    //   bodyStyle: 'background:#777; padding:10px;',
                       layout: 'fit',
                      // items: [],
                       items: [change_form],
});
  

