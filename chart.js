//Ext.require('Ext.chart.*');


    var storeChart = Ext.create('Ext.data.JsonStore', {
        fields: ['tm', 'oc'],
        data: []
    });

     var winChart = Ext.create('Ext.window.Window', {
        width: 800,
        height: 600,
        minHeight: 400,
        minWidth: 550,
        maximizable: true,
        title: 'Simulation Results',
    //     autoShow: true,
        layout: 'fit',
        items: [{
            xtype: 'chart',
            style: 'background:#fff',
            itemId: 'chartCmp',
            store: storeChart,
            shadow: false,
            animate: false,
            axes: [{
                type: 'Numeric',
                minimum: 0,
                maximum: 100,
                position: 'left',
                fields: ['oc'],
                title: 'Agent Occupancy (%%)',
                grid: {
                    odd: {
                        fill: '#dedede',
                        stroke: '#ddd',
                        'stroke-width': 0.5
                    }
                }
            }, {
                type: 'Numeric',
                position: 'bottom',
                fields: 'tm',
                title: 'Time (ticks)',
                //dateFormat: 'M d',
                //groupBy: 'year,month,day',
                aggregateOp: 'sum',

                constrain: true,
               // fromDate: new Date(2011, 1, 1),
               // toDate: new Date(2011, 1, 7),
                grid: true
            }],
            series: [{
                type: 'line',
                smooth: false,
                axis: ['left', 'bottom'],
                xField: 'tm',
                yField: 'oc',
              /*  label: {
                    display: 'none',
                    field: 'visits',
                    renderer: function(v) { return v >> 0; },
                    'text-anchor': 'middle'
                },*/
                markerConfig: {
                    radius: 0.5,
                    size: 0.5
                }
            }]
        }]
    });
