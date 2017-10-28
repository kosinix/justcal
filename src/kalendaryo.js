const lodash = require('lodash');
const moment = require('moment');
const util = require('util');

var helper = {
  /**
   * Generate an array containing numbers 1 to count
   * 
   * @param {number} count
   * @return {Array} 
   */
  generateDays: function(count){
    return Array.from(Array(count).keys()).map((e,i)=>i+1); // 1-count
  },

  /**
   * Returns date in ISO 8601 format in timezone 0: YYYY-MM-DDTHH:mm:ss.sssZ
   * 
   */
  isoDate: function(year, month, day, hour=0, min=0, s=0, ms=0){
    
    var year = lodash.padStart(year, 4, '0');
    var month = lodash.padStart(month, 2, '0');
    var day = lodash.padStart(day, 2, '0');

    var hour = lodash.padStart(hour, 2, '0');
    var min = lodash.padStart(min, 2, '0');
    var s = lodash.padStart(s, 2, '0');
    var ms = lodash.padStart(ms, 3, '0');
    
    
    return util.format(
      '%s-%s-%sT%s:%s:%s.%sZ', 
      year, month, day, hour, min, s, ms
    );
  },
  /**
   * Returns the timezone of the server.
   * 
   * @return {number}  Eg. for UTC+8:00, returns 8. for UTC-3:00 returns -3.
   */
  getMyTimeZone: function(){
    // Returns timezone in minutes relative to local time. Which means UTC+8:00 is -480. Yup.
    var offset = new Date().getTimezoneOffset(); 
    // Note: The 0 is to negate the offset because JS returns a negative number instead of a sane positive one.
    return 0 - (offset/60); 
  },

  /**
   * Get weekdays in an array
   * 
   * @param {number} weekStart The start of the week. Range from 0 to 6. Eg. 0-Sun, 1-Mon, ... 6-Sat
   * @return {Array} Array containing string names
   */
  getWeekDays: function(weekStart=0){
    var weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return lodash.concat(lodash.slice(weekDays, weekStart), lodash.slice(weekDays, 0, weekStart));
  }
}

class MonthView {
  /**
   * Create a month calendar
   * 
   * @param {number} month - Eg. 1-12
   * @param {number} year - Eg. 1979- 2100
   * @param {Object} [config] - The extra configuration options. All optional.
   */
  constructor(year, month, config){
    /**
     * @namespace
     * @property {number} weekStart - Values: 0 to 6
     * @property {number} padMode - Values: 0 to 1
     * @property {number} timeZone - Values: -12 to 14
     * @property {Function} dayCallBack - Map values to something else for date.
     * @property {Function} prefixCallBack - Map values to something else for date prefix.
     * @property {Function} suffixCallBack - Map values to something else for date suffix.
    */
    var defaults = {
      weekStart: 0,
      padMode: 0,
      timeZone: 0,
      dayCallBack: function(day){
        return day;
      },
      prefixCallBack: function(day){
        return day;
      },
      suffixCallBack: function(day){
        return day;
      }
    };
    
    config = Object.assign(defaults, config);

    this.momentNow = moment.utc().add(config.timeZone, 'hours');
    var isoDateString = helper.isoDate(year, month, 1); // First day of specific month
    this.momentCurrentMonth = moment.utc(isoDateString); 
    if(!this.momentCurrentMonth.isValid()){
      // Handle error
    }
    this.momentPrevMonth = moment.utc(isoDateString).subtract(1, 'days'); // Since we are already at first day of month, subtract 1 day
    this.momentNextMonth = moment.utc(isoDateString).endOf('month').add(1, 'days'); // Move to last day of month, then add 1 day

    this.year = year; // Year
    this.month = month; // Month 1-12    
    this.weekStart = config.weekStart; // 0-6 where 0 is Sunday and 6 is Saturday
    this.padMode = config.padMode; // 0-1
    this.name = this.momentCurrentMonth.format('MMM'); // String month name
    this.days = this.momentCurrentMonth.daysInMonth(); // Total month days. 1-n
    this.weekDays = helper.getWeekDays(this.weekStart);
    this.weekDayFirst = parseInt(this.momentCurrentMonth.format('d')); // First day of week. Zero-based. 0-6
    this.weekDayLast = parseInt(moment.utc(isoDateString).endOf('month').format('d')); // This months last day of week. Zero-based. 0-6
    this.matrix = [];
    this.prevMonthYear = this.momentPrevMonth.format('YYYY');
    this.prevMonthNumber = this.momentPrevMonth.format('M');
    this.nextMonthYear = this.momentNextMonth.format('YYYY');
    this.nextMonthNumber = this.momentNextMonth.format('M');

    this.dayCallBack = config.dayCallBack;
    this.prefixCallBack = config.prefixCallBack;
    this.suffixCallBack = config.suffixCallBack;
    
    this.matrixes();

  }

  matrixes(){
    
    var days = helper.generateDays(this.days);
      
    days = days.map(function(day){
      var isoDateString = helper.isoDate(this.year, this.month, day);
      var monthDay = moment.utc(isoDateString);
      var nowString = (this.momentNow.format('YYYY-MM-DD') === monthDay.format("YYYY-MM-DD")) ? " now" : "";


      return {
        type: "day"+nowString,
        year: this.year,
        month: this.month,
        day: day,
        iso: isoDateString
      }
      
    }, this).map(this.dayCallBack, this);

    // Prepend prefix and append suffix to matrix
    this.matrix = lodash.concat(this.prefix(this.padMode), days, this.suffix(this.padMode)); 

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
        type: 'prefix blank',
        year: '',
        month: '',
        day: '',
        iso: ''
      }
    }, this);

    if(padMode==1){
      
      prefix = helper.generateDays(this.momentPrevMonth.daysInMonth()); // 1-n
      prefix = lodash.takeRight(prefix, prefixLength).map(function(day){
        var year = this.momentPrevMonth.format('YYYY');
        var month = this.momentPrevMonth.format('M');
        var isoDateString = helper.isoDate(year, month, day);

        return {
          type: 'prefix',
          year: year,
          month: month,
          day: day,
          iso: isoDateString
        }
      }, this);
    }
    prefix = prefix.map(this.prefixCallBack, this);
    return prefix;
  }

  suffix(padMode){

    // Suffix formula
    const weekDays = 6; // 0-6 (7) days in a week
    var suffixLength = weekDays - (this.weekDayLast - this.weekStart);
    if(suffixLength > 6){
      suffixLength = suffixLength - weekDays - 1;
    }
    
    var suffix = new Array(suffixLength).fill(0).map(function(value){

      return {
        type: 'suffix blank',
        year: '',
        month: '',
        day: '',
        iso: ''
      }
    }, this);

    if(padMode==1){
      
      var suffix = helper.generateDays(suffixLength)
        .map(function(day){
          var year = this.momentNextMonth.format('YYYY');
          var month = this.momentNextMonth.format('M');
          var isoDateString = helper.isoDate(year, month, day);
          
          return {
            type: 'suffix',
            year: year,
            month: month,
            day: day,
            iso: isoDateString
          }
        }, this);
    }
    suffix = suffix.map(this.suffixCallBack, this);
    
    return suffix;
  }

}

class DayView {
  /**
   * Create a day view for calendar
   * 
   * @param {number} year - Eg. 1979 to 2999
   * @param {number} month - Eg. 1 to 12
   * @param {number} day - Eg. 1 to 31
   * @param {Object} [config] - The extra configuration options. All optional.
   */
  constructor(year, month, day, config){
    /**
     * @namespace
     * @property {number} timeZone - Hour difference from UTC-0. Values: -12 to 14
    */
    var defaults = {
      timeZone: 0,
    };
    
    config = Object.assign(defaults, config);

    /**
     * @property {number} year - Number representing the year.
     * @property {number} month - Number representing the month. Values: 1 to 12
     * @property {number} day - Number representing the day. Values: 1 to 31
     */
    this.year = year;
    this.month = month;
    this.day = day;

    var isoDateString = helper.isoDate(year, month, day);
    
    /**
     * @property {Moment} moment - Instance of momentjs representing current day.
     * @property {Moment} prevDay - Instance of momentjs representing previous day.
     * @property {Moment} nextDay - Instance of momentjs representing next day.
     */
    this.moment = moment.utc(isoDateString).add(config.timeZone, 'hours');
    this.prevDay = moment.utc(isoDateString).add(config.timeZone, 'hours').subtract(1, 'days');
    this.nextDay = moment.utc(isoDateString).add(config.timeZone, 'hours').add(1, 'days');
  }
}
module.exports = {
  DayView: DayView,
  MonthView: MonthView,
  YearView: {},
  DecadeView: {},
  helper: helper
};
