(function(factory) {
    if (typeof define === 'function' && define.amd) {
        define([ 'jquery', 'moment' ], factory);
    }
    else {
        factory(jQuery, moment);
    }
})(function($, moment) {
    var defaults = {
        locale:'ISO', //date format
        date:'',//date for render
        defaultView:'month',//view
        work:{},//job's array,include start end title staff's id staff's name
        minStep:'15',
        dayStart:'6',
        dayEnd:'20',
        buttons:true, // show month week day
        navButtons:true //show next prev btns
    }
    var cView = {
        current:''
    };
    var cDate = '';
    $.fn.calendar = function(options){
        var args = Array.prototype.slice.call(arguments, 1);
        var res = this; // what this function will return (this jQuery object by default)
        var opt = $.extend( {}, defaults, options)
        this.each(function(i, _element) { // loop each DOM element involved
            var element = $(_element);
            cView.current = opt.defaultView;
            //var calendar = element.data('calendar'); // get the existing calendar object (if any)
            //var singleRes; // the returned value of this single method call
            var calendar = new timeLine(element, opt);
            element.data('calendar', calendar);
            calendar.render(cView.current);
            // a method call
            /*if (typeof options === 'string') {
                if (calendar && $.isFunction(calendar[options])) {
                    singleRes = calendar[options].apply(calendar, args);
                    if (!i) {
                        res = singleRes; // record the first method call result
                    }
                    if (options === 'destroy') { // for the destroy method, must remove Calendar object data
                        element.removeData('fullCalendar');
                    }
                }
            }
            // a new calendar initialization
            else if (!calendar) { // don't initialize twice
                calendar = new Calendar(element, options);
                element.data('fullCalendar', calendar);
                calendar.render();
            }*/
        });

        return res;
    }
    function getAllStaffsIds(works){
        var staffs = [];
        works.forEach(function(elem){
            if(staffs.indexOf(elem.staff_id)== -1)
                staffs.push(elem.staff_id);
        });
        return staffs;
    }
    function timeLine(element,options){
        //functions for calculating views width,cells width,etc
        function getHeaderWidth(element){
            return $(element).outerWidth();
        }
        function getBodyWidth(element){
            return $(element).outerWidth();
        }
        function calculateViewWidth(bodyWidth,date,view){ //date - moment object
            var mom = date; //local copy of moment()
            var daysCount = parseFloat(mom.endOf('month').format('DD'));
            var cellWidth = Math.round(bodyWidth / daysCount);
            return cellWidth - 1;
        }
        //copy options and container
        this._container = element;
        this._options = options;
        this._view = cView.current;
        this.date = (this._options.date == '') ? moment() : moment(this._options.date);
        //main render function
        this.render = function(view){
            var head = this.buildHead();
            var body = this.buildBody(this.date,view);
            var page = '<div class="c-container">'+head+body+'</div>';
            $(page).appendTo(this._container);
            var headCellWidth = $(this._container).find('.c-month-cell:first').outerWidth();
            var wrapOffset = $(this._container).offset();
            var staffs = getAllStaffsIds(this._options.work);
            for (i=0; i<staffs.length;i++){

            }
            $(this._container).find('div.c-month-empty').each(function(){
                var divId = $(this).attr('class').split(' ')[1];
                var accClass = (typeof divId == 'undefined') ? '*' : '.work-'+divId.split('-')[2];
                $(this).droppable({
                    greedy:true,
                    accept:accClass,
                    drop:function(event,ui){
                        console.log(ui);
                        var elem = ui.draggable[0];
                        if( ! $(elem).hasClass('c-mobile-elem')){
                            var sClass = 'staff-work-'+$(ui.draggable[0]).attr('id');
                            var elemId = $(elem).attr('id');
                            $('.c-timesheet-'+elemId).append('<div class="c-mobile-elem '+sClass+'" style="width:'+headCellWidth+'" id="'+sClass+'"></div>');
                            var offsetTrue = $('.c-month-cell').filter(function(index){
                                var off = $(this).offset();
                                if(Math.abs(off.left - ui.offset.left) < headCellWidth)
                                    return this; }).offset();
                            $('.'+sClass).offset({left:(offsetTrue.left + wrapOffset.left +1)});
                            $(elem).remove();
                            $('.'+sClass).draggable({
                                axis:'x',
                                containment:'parent',
                                stop:function(event,ui){
                                    var originalWidth = $(ui.helper[0]).outerWidth();
                                    //TODO:: Предотвратить Наложения элементов друг на друга
                                    var offsetTrue = $('.c-month-cell').filter(function(index){
                                        var off = $(this).offset();
                                        if(Math.abs(off.left - ui.offset.left) < (headCellWidth/2)+1)
                                            return this; }).offset();
                                    $(this).offset({left:(offsetTrue.left)});

                                },
                                drag:function(event,ui){
                                }
                            });
                            $('.'+sClass).resizable({
                                grid:[headCellWidth,0],
                                maxHeight:45
                            });
                        }
                    }
                });
            });
            this.bindEvents();
        }
        this.bindEvents = function(){
            $(this._container).find('a.c-month-btn').bind('click',[this,'month'],this.changeView);
            $(this._container).find('a.c-week-btn').bind('click',[this,'week'],this.changeView);
            $(this._container).find('a.c-day-btn').bind('click',[this,'day'],this.changeView);
            $(this._container).find('a.c-next-btn').bind('click',this,this.nextView);
            $(this._container).find('a.c-prev-btn').bind('click',this,this.prevView);
        }
        this.changeView = function(event){
            var object = event.data[0];
            var view = event.data[1];
            $(object._container).find('div.c-'+cView.current+'-wrap').remove();
            var body = object.buildBody(object.date,view);
            $(body).appendTo(object._container);
            cView.current = view;
            object._view = view;
            return false;
        } /** Change current view to day|week|month **/
        this.nextView = function(event){
            var object = event.data;
            var period = object._view.slice(0,1);
            if(period == 'm')
                period = period.toUpperCase();
            object.date.add(1,period);
            var view = object._view;
            $(object._container).find('div.c-'+ view +'-wrap').remove();
            var body = object.buildBody(object.date,view);
            $(body).appendTo(object._container);
            return false;
        } /** Next day|week|month **/
        this.prevView = function(event){
            var object = event.data;
            var period = object._view.slice(0,1);
            if(period == 'm')
                period = period.toUpperCase();
            object.date.add(-1,period);
            var view = object._view;
            $(object._container).find('div.c-'+ view +'-wrap').remove();
            var body = object.buildBody(object.date,view);
            $(body).appendTo(object._container);
            return false;
        } /** Previous day|week|month **/
        this.buildHead = _buildHead;
        this.buildBody = _buildBody;
        function _buildHead(){
            var html = '<div class="c-header">'+
                '<div class="c-view-btns">'+
                    '<a href="#" class="c-month-btn">Month</a>'+
                    '<a href="#" class="c-week-btn">Week</a>'+
                    '<a href="#" class="c-day-btn">Day</a>'+
                '</div>'+
                '<div class="c-change-view-btns">'+
                    '<a href="#" class="c-prev-btn"><</a>'+
                    '<a href="#" class="c-next-btn">></a>'+
                '</div></div>'
            return html;
        }
        function _buildBody(date,view){
            var html = '';
            switch(view){
                case 'day' :{
                    var day = new dayView(date,'ISO',this._options.dayStart,this._options.dayEnd);
                    html = day.buildDayView();
                    break;
                }
                case 'week' :{
                    var week = new weekView(date,'ISO');
                    html = week.buildWeekView();
                    break;
                }
                case 'month' :{
                    var month = new monthView(date,'ISO',this._options.work);
                    html = month.buildMonthView();
                    break;
                }
            }
            return html;
        }
    }
    function dayView(date,iso,start,end){
        this.date = date;
        this.iso = iso;
        this.start = parseInt(start);
        this.end = parseInt(end);
        this.buildDayView = _buildDayView;
        this.buildDay = _buildDay;
        function _buildDay(day,pos){ //day as moment() object
            var mom = this.date;
            var html = '<div class="c-day-wrap"><div class="c-day-cells-wrap"><div class="c-day-head"></div>';
            console.log(this.start);
            for(i=this.start;i<=this.end;i++){
                console.log(i);
                var current = mom.hour(i).minutes(0).format('YYYY-MM-DD HH:mm');
                var hour = mom.format('HH');
                var min = mom.format('mm');
                html+='<div class="c-day-cell" data-date="'+current+'">'+hour+'<sup>'+min+'</sup></div>';
            }
            html+='</div><div class="c-day-empty"></div>';
            return (html+'</div>');
        }
        function _buildDayView(){
            return this.buildDay();
        }
    }
    function weekView(date,iso){
        this.date = date;
        this.iso = iso;
        this.buildWeekView = _buildView;
        this.buildWeek = _buildWeek;
        function _buildWeek(week_num,pos){
            var start_mom ,end_mom = '';
            if(this.iso == 'ISO'){
                start_mom = moment().day('Monday').isoWeek(week_num);
                end_mom = moment().day('Sunday').isoWeek(week_num);
            }
            else{
                start_mom = moment().day('Sunday').week(week_num);
                end_mom = moment().day('Monday').week(week_num);
            }
            var html = '<div class="c-cells-wrap c-'+pos+'-week">'; //main wrap for head and empty cells
            var cellsHead = '<div class="c-cells-head">';
            var emptyCells = '<div class="">';
            while(start_mom <= end_mom){
                cellsHead += '<div class="c-week-cell">'+start_mom.format('DD.MM')+'</div>';
                start_mom.add(1,'days');
            }
            emptyCells += '<div class="c-week-empty"></div>';
            return (html + cellsHead + '</div>' + emptyCells + '</div></div>');
        }
        function _buildView(){
            var html = '<div class="c-week-wrap"><div class="c-week-cells-wrap">';
            var num = this.date.isoWeek();
            var cWeek = this.buildWeek(num,'current');
            return (html + cWeek + '</div></div>');
        };
    }
    function monthView(date,iso,works){ /**date is a moment() object**/
        this.date = date;
        this.iso = iso;
        this.buildMonthView = _buildView;
        this.buildMonth = _buildMonth;
        this.works = works;
        function _buildMonth(){
            var monthNumber = this.date.month(); //needle month number
            var html = '<div class="c-month-wrap"><div class="c-month-cells-wrap"><div class="c-month-head">';
            var sMonth = moment().month(monthNumber).startOf('month');
            var eMonth = moment().month(monthNumber).endOf('month');
            //var dayWidth = (1/(Math.floor(parseInt(eMonth.format('D'))/2) +1))*100; //width for day cell
            var dayWidth = (1/(Math.floor(parseInt(eMonth.format('D')))))*100;
            var staffsIds = getAllStaffsIds(this.works);
            var staffsTimesheetsHtml = [];
            var staffHtml = '';
            var empty = '<div class="c-month-empty">';
            var dates = '';
            var style = 'width:'+dayWidth+'%;';
            var tmp = 'width:'+(dayWidth)+'%;';
            var start = 1;
            for(i = 0;i < staffsIds.length; i++){
                staffsTimesheetsHtml[i] = '<div class="c-month-empty c-timesheet-'+staffsIds[i]+'">';
            }
            while(sMonth.format('YYYY-MM-DD') <= eMonth.format('YYYY-MM-DD')){
                var text = (start % 2 != 0) ? sMonth.format('D') : '.';
                dates += '<div class="c-month-cell" style="'+style+'" data-date="'+sMonth.format('YYYY-MM-DD')+'">'+text+'</div>';
                empty += '<div class="c-month-empty-cell" style="'+tmp+'"></div>';
                for(i = 0;i < staffsIds.length; i++){
                    staffsTimesheetsHtml[i] += '<div class="c-month-empty-cell c-timesheet-cell-'+staffsIds[i]+'" style="'+tmp+'"></div>';
                }
                sMonth.add(1,'d');
                start++;
            }
            for(i = 0;i < staffsIds.length; i++){
                staffsTimesheetsHtml[i] += '</div>';
                staffHtml+=staffsTimesheetsHtml[i];
            }
            return html + dates + '</div>' + empty + '</div>'+staffHtml+'</div>';
        }
        function _buildView(){
            return this.buildMonth();
        }
    }
});