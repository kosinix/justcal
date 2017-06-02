const lodash = require('lodash');
const moment = require('moment');

class CalendarMonth {
  constructor(month, year, weekStart){
    
    this.init(month, year, weekStart);
    
  } 
  init(month, year, weekStart){
    this.month = parseInt(month); // Month index. Zero-based. 0-11
    this.year = parseInt(year); // Year
    this.name = ''; // String month name
    this.days = null; // Total month days. 1-n
    this.weekDayFirst = ''; // First day of week. Zero-based. 0-6
    this.weekDayLast = ''; // This months last day of week. Zero-based. 0-6
    this.matrix = [];
    this.prevMonthId = null;
    this.prevMonthYear = null;
    this.nextMonthId = null;
    this.nextMonthYear = null;
    this.note = '';
    this.weekStart = weekStart; // 0-6 where 0 is Sunday and 6 is Saturday

    var month = month+1; // 0 based to 1 based
    var date1 = moment(this.isoDate(year, month, 1));
    if(date1.isValid()){
      this.name = date1.format('MMM');
      this.days = parseInt(date1.daysInMonth());
      this.weekDayFirst = parseInt(date1.format('d'));
      var date2 = moment(this.isoDate(year, month, this.days));
      if(date2.isValid()){
        this.weekDayLast = parseInt(date2.format('d'));
        this.matrixes();
      } // todo: err handler
    } // todo: err handler
  }
  matrixes(){
    
    var days = this.generateIncreasingArray(this.days).map(function(value){
      var iso = this.isoDate(this.year, this.month+1, value);

      return {
        type: "day",
        year: this.year,
        month: this.month+1,
        day: value,
        iso: iso
      }
      
    }, this);

    // TODO: move out
    var padMode = 1;

    this.matrix = lodash.concat(this.prefix(padMode), days, this.suffix(padMode)); // Prepend prefix to matrix

    // 1D into 2D array
    this.matrix = lodash.chunk(this.matrix, 7);
  }
  prefix(padMode){
    // Prefix formula
    var prefixLength = this.weekDayFirst - this.weekStart;
    if(prefixLength < 0){
      prefixLength += 7;
    }

    var prefix = new Array(prefixLength).fill(0).map(function(value){

      return {
        type: 'prefix',
        year: '',
        month: '',
        day: '',
        iso: ''
      }
    }, this);

    if(padMode==1){
      var prevMonth = moment( this.isoDate(this.year, this.month+1, '01') ).subtract(1, 'days');
      // TODO: Move globals remove this side effect of calling prefix func
      this.prevMonthId = prevMonth.format('M')-1;
      this.prevMonthYear = prevMonth.format('YYYY');

      prefix = this.generateIncreasingArray(prevMonth.daysInMonth()); // 1-n
      prefix = lodash.takeRight(prefix, prefixLength).map(function(value){
        var iso = this.isoDate(prevMonth.format('YYYY'), prevMonth.format('M'), value);

        return {
          type: 'prefix',
          year: prevMonth.format('YYYY'),
          month: prevMonth.format('M'),
          day: value,
          iso: iso
        }
      }, this);
    }
    return prefix;
  }

  suffix(padMode){

    // Suffix formula
    const weekDays = 6; // 0-6 (7) days in a week
    var suffixLength = weekDays - (this.weekDayLast - this.weekStart);
    if(suffixLength > 6){
      suffixLength = 6;
    }
    var suffix = new Array(suffixLength).fill(0).map(function(value){

      return {
        type: 'suffix',
        year: '',
        month: '',
        day: '',
        iso: ''
      }
    }, this);

    if(padMode==1){
      var nextMonth = moment( this.isoDate(this.year, this.month+1, this.days) ).add(1, 'days');
    
      // TODO: Move globals remove this side effect of calling suffix func
      this.nextMonthId = nextMonth.format('M')-1;
      this.nextMonthYear = nextMonth.format('YYYY');

      
      var suffix = this.generateIncreasingArray(suffixLength).map(function(value){
        var iso = this.isoDate(nextMonth.format('YYYY'), nextMonth.format('M'), value);

        return {
          type: 'suffix',
          year: nextMonth.format('YYYY'),
          month: nextMonth.format('M'),
          day: value,
          iso: iso
        }
      }, this);
    }
    return suffix;
  }

  // Generate ISO date
  isoDate(year, month, day){
    return lodash.padStart(year, 4, '0')+'-'+lodash.padStart(month, 2, '0')+'-'+lodash.padStart(day, 2, '0');
  }
  generateIncreasingArray(count){
    return Array.from(Array(count).keys()).map((e,i)=>i+1); // 1-count
  }
}

module.exports.calendarMonth = function(m, y, data) {
   return new CalendarMonth(m, y, data);
};