var gDebug = false;  // global debug flag - enables detailed logging in functions

class CollectionDay {
    constructor(date, summary, description, isInHolidayWeek, isTrashOnly) {
        this.date = date;
        this.summary = summary;
        this.description = description;
        this.isInHolidayWeek = isInHolidayWeek;
        this.isTrashOnly = isTrashOnly;
    }
}

class Holiday {
    constructor(date, description) {
        this.date = date;
        this.description = description;
    }
}


/**
 * Collection to get day name for selected index value
 */
const dayName = ['Sun', 'Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Sat'];
var collectionDayName = '';

function trashCal(writeToIcsFile){
    let debug = gDebug || false;
    let sStartDate = $("#startDate").val();
    let sEndDate = $("#endDate").val();
    let sFirstRecycleDate = $("#firstRecycleCollectionDate").val();

    var startDate = new Date(sStartDate+'T00:00:00');
    var endDate = new Date(sEndDate+'T00:00:00');
    var firstRecycleDate = new Date(sFirstRecycleDate+'T00:00:00');
    
    let collectionDay = $('#collectionDay').val();
    collectionDayName = dayName[collectionDay];

    startDate = initializeStartDateToCollectionDay(startDate, collectionDay);
    
    var prevCollectionDay = startDate;
    var prevRecycleDay = startDate;
    
    if(daysDifference(startDate, firstRecycleDate) != 0 && !holidayWeekCheck(firstRecycleDate)) {
       prevRecycleDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()-7);
    }
        
    var nextCollectionDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

    var genRecycleAndHolidayOnly = $('#recycleOnlyInd').val()==='on';
    
    var collectionDays = [];

    while(nextCollectionDay <= endDate) {
        let isInHolidayWeek = holidayWeekCheck(nextCollectionDay);
        let isTrashOnly = false;
        let daysLastRecycled = daysDifference(prevRecycleDay, nextCollectionDay);

        if(isInHolidayWeek) {
            let modifiedDate = new Date(nextCollectionDay.getFullYear(), nextCollectionDay.getMonth(), nextCollectionDay.getDate()+1);
                        
            if(daysLastRecycled > 0 && daysLastRecycled <= 7) {
                isTrashOnly = true;
                //console.log('Holiday Week Trash Only',modifiedDate);
                collectionDays.push(new CollectionDay(modifiedDate, '*Holiday Week* Trash Only', '*Holiday Week* Trash Only', isInHolidayWeek, isTrashOnly));            
            } else {
                //console.log('Holiday Week',modifiedDate);
                prevRecycleDay = nextCollectionDay;        
                collectionDays.push(new CollectionDay(modifiedDate, '*Holiday Week*', '*Holiday Week*', isInHolidayWeek, isTrashOnly));
            }
            
            
        } else {

            if(daysLastRecycled > 7){
                prevRecycleDay = nextCollectionDay;

                if(genRecycleAndHolidayOnly){
                  //console.log(prevRecycleDay);
                    collectionDays.push(new CollectionDay(prevRecycleDay, 'Recycling Collection', 'Recycling Collection', isInHolidayWeek, isTrashOnly));
                }    
            } else if(!genRecycleAndHolidayOnly) {
                //console.log(prevRecycleDay);
                collectionDays.push(new CollectionDay(prevRecycleDay, 'Recycling Collection', 'Recycling Collection', isInHolidayWeek, isTrashOnly));
            }
            
            
        }
        
        nextCollectionDay = new Date(nextCollectionDay.getFullYear(), nextCollectionDay.getMonth(), nextCollectionDay.getDate()+7);
    }

    if(debug) console.log('collectionDays: ', collectionDays);
    if(debug) console.table(collectionDays);

    displayEvents(collectionDays);
    if(writeToIcsFile) {
        writeIcsFile(collectionDays);
    }
    
    return collectionDays;
}

/**
 * Creates ics file from the provided CollectionDay[]
 * @param {CollectionDay[]} collectionDays 
 */
function writeIcsFile(collectionDays) {
    var output = 
        'BEGIN:VCALENDAR\n' 
        +'VERSION:3\n';
    
    var nameAttribute = $('#fileName').val();  
    var fileName = 'Recycling Calendar.ics';

    if(nameAttribute && nameAttribute.trim().length > 0) {
        fileName = nameAttribute + '.ics';
        output += 'NAME: '+nameAttribute + ' - ' + collectionDayName + ' \n';
    } else {
        output += 'NAME: Recycling and Holiday Trash Collection Schedule ' + collectionDayName + ' \n';
    }
        
    output +='PRODID:-//SOLUTIONSFTB INC - DBA DESIGNSFTB//TRASHCAL V1.0//EN\n';

    collectionDays.forEach(function(collectionDay) {
        output += 
        'BEGIN:VEVENT\r'
        +'DTSTART;VALUE=DATE:'+icalDateFormat(collectionDay.date)+'\n'
        +'DTEND;VALUE=DATE:'+icalDateFormat(collectionDay.date)+'\n'
        +'SUMMARY:'+collectionDay.summary+'\n'
        +'DESCRIPTION:'+collectionDay.description+'\n'
        +'END:VEVENT\n';
    });

    output += 'END:VCALENDAR';
    
    var elem = document.createElement('a');
    elem.setAttribute('href', 'data:text/calendar;charset=utf-8,' + encodeURIComponent(output));
    elem.setAttribute('download', fileName);

    elem.style.display = 'none';
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
}

/**
 * Checks if provided date is in a selected holiday week.
 * @param {Date} checkDate 
 * @returns {Boolean} true if provided date is in a selected holiday week.
 */
function holidayWeekCheck(checkDate) {
    let debug = gDebug || false;
    let isHolidayWeek = false;
    let selectedHolidays = getSelectedHolidays();

    if(selectedHolidays.length == 0) {
        selectedHolidays = getHolidaysForYear(new Date().getFullYear());
    }

    selectedHolidays.forEach(function(holiday) {   

        var diff = daysDifference(holiday.date, checkDate);
        
        if(diff==0) {
            isHolidayWeek = true;
            return;
        } else if (diff > 0) {
            if(diff == 1 && checkDate.getDay() == 1) {
                isHolidayWeek = true;
                return;
            } else if (diff <= 2 && checkDate.getDay() == 2) {
                isHolidayWeek = true;
                return;
            } else if (diff <= 3 && checkDate.getDay() == 3) {
                isHolidayWeek = true;
                return;
            } else if (diff <=4 && checkDate.getDay() == 4) {
                isHolidayWeek = true;
                return;
            } else if (diff <=5 && checkDate.getDay() == 5) {
                isHolidayWeek = true;
                return;
            } 
            
        }
    });

    if(debug) {
        if(isHolidayWeek) {
            console.log(formatDate(checkDate) + ' is a ' + dayName[checkDate.getDay()] + ' in holiday week!');
        } else {
            console.log(formatDate(checkDate) + ' is a ' + dayName[checkDate.getDay()] + ' is NOT in holiday week');
        }
    }
    return isHolidayWeek;

}

/**
 * Calculate the number of days difference between 2 dates (d1-d0)
 * @param {Date} d0 
 * @param {Date} d1 
 * @returns {Number} number of days between 2 provided dates
 */
function daysDifference(d0, d1) {
    var diff = new Date(+d1).setHours(12) - new Date(+d0).setHours(12);
    return Math.round(diff/8.64e7);
}
  
/**
 * Formats date value for presentation
 * @param {Date} date 
 * @returns date string in 'YYYY-MM-dd' format
 */
function formatDate(date){
    return [date.getFullYear(),('0'+(date.getMonth()+1)).slice(-2),('0'+date.getDate()).slice(-2)].join('-');
}

/**
 * Formats date value in iCalendar format
 * @param {Date} date 
 * @returns 
 */
function icalDateFormat(date){
    return [date.getFullYear(),('0'+(date.getMonth()+1)).slice(-2),('0'+date.getDate()).slice(-2)].join('');
}

/**
 * Calendar start date will not be equal to first collection date.  
 * Required for syncing prior collection days and holidays and for 'trash only' holidays.
 * @param {Date} startDate 
 * @param {Date} dayOfWeek 
 * @returns 
 */
function initializeStartDateToCollectionDay(startDate, dayOfWeek) {
    let debug = false || gDebug;
    var adjStartDate = startDate;

    if(debug) {
        console.log('initializeStartDate: '+ startDate +' startDateDay= ' + startDate.getDay() + ' dayOfWeek ' + dayOfWeek);
    }
    

    while(adjStartDate.getDay() != dayOfWeek) {
        adjStartDate.setDate(adjStartDate.getDate()+1);
        if(debug) {
            console.log('incremented day', adjStartDate);
        }
    }

    if(debug) {
        console.log('initializeStartDate: '+ adjStartDate +' adjStartDateDay= ' + adjStartDate.getDay() + ' dayOfWeek ' + dayOfWeek);
    }
    return adjStartDate;
}

/**
 * Generates checkbox fields and labels for list of holidays.
 */
function generateHolidayBoxes() {
    let datesContainer = document.getElementById("holidaysContainer");
    let year = document.getElementById('holidayYear');
    let holidays = [];

    // wipe current holidays list
    document.getElementById("holidaysContainer").replaceChildren();

    if (year != undefined && year.value != '') {
        holidays = getHolidaysForYear(year.value);
    } else {
        year = new Date().getFullYear();
        holidays = getHolidaysForYear(year);
    }
    

    holidays.forEach((holiday) => {
        let dateContainer = document.createElement("div");
        dateContainer.classList.add("input-group-text");
        
        let dateBox = document.createElement("input");
        dateBox.type = "checkbox";
        dateBox.value = holiday.date;
        dateBox.id = holiday.description.toLowerCase().replace(/[\W']/g, '');
        dateBox.name = "holidayBox";
        dateBox.title = formatDate(holiday.date);

        let label = document.createElement("label");
        label.htmlFor = dateBox.id;
        label.appendChild(document.createTextNode(holiday.description + ' ' + formatDate(holiday.date)));
        label.title = formatDate(holiday.date);

        dateContainer.appendChild(dateBox);
        dateContainer.appendChild(label);

        datesContainer.appendChild(dateContainer);
        
    })
}


/**
 * Iterates collectionDays collection and draws them as table rows and cells in events table
 * @param {CollectionDay[]} collectionDays 
 */
function displayEvents(collectionDays) {
    let tbody = $("#eventsTable tbody");
    tbody.empty(); // clear any rows before repopulating table
    

    collectionDays.forEach((collectionDay) => {
        let tr = document.createElement("tr");
        let d = document.createElement("td");

        d.textContent = formatDate(collectionDay.date);
        tr.appendChild(d);

        let s = document.createElement("td");
        s.textContent = collectionDay.summary;
        tr.appendChild(s);

        let holidayInd = document.createElement("td");
        holidayInd.textContent = collectionDay.isInHolidayWeek ? "Yes" : "No";
        tr.appendChild(holidayInd);

        let trashOnlyInd = document.createElement("td");
        trashOnlyInd.textContent = collectionDay.isTrashOnly ? "Yes" : "No";      
        tr.appendChild(trashOnlyInd);

        tbody.append(tr);
    })

}

/**
 * Get array of holidays that are checked.
 * @returns {Holiday[]} array of selected Holidays
 */
function getSelectedHolidays() {
    let selectedHolidays = [];
    try {
        $('input[name=\"holidayBox\"]').each((i,holiday) => {
            if(holiday.checked) { 
                selectedHolidays.push(holidays[i]);
            }
        });
      
    } catch (error) {
        console.error('error getting selected holidays', error);
    }
    
    return selectedHolidays;
}

/**
 * Initialize holiday selections to known group.
 * @param {string} holidayGroup 
 */
function setHolidaySelectionsByGroup(holidayGroup) {
    // uncheck all first
    $('input[name=\"holidayBox\"]').prop('checked', false);
    
    switch (holidayGroup) {
        case "lincoln":
            setLincolnHolidays();
            break;
        case "bismarck":
            setBismarckHolidays();
            break;
        
    }

}

function setLincolnHolidays() {
    $('#newyearsday').prop('checked',true);
    $('#martinlutherkingday').prop('checked',true);
    $('#presidentsday').prop('checked',true);
    $('#goodfriday').prop('checked',true);
    $('#memorialday').prop('checked',true);
    $('#independenceday').prop('checked',true);
    $('#laborday').prop('checked',true);
    $('#veteransday').prop('checked',true);
    $('#thanksgiving').prop('checked',true);
    $('#christmas').prop('checked',true);    
}

function setBismarckHolidays() {
    $('#newyearsday').prop('checked',true);
    $('#martinlutherkingday').prop('checked',true);
    $('#presidentsday').prop('checked',true);
    $('#goodfriday').prop('checked',true);
    $('#memorialday').prop('checked',true);
    $('#independenceday').prop('checked',true);
    $('#laborday').prop('checked',true);
    $('#veteransday').prop('checked',true);
    $('#thanksgiving').prop('checked',true);
    $('#christmas').prop('checked',true);
}

function testHolidayWeekCheck() {
    holidayWeekCheck(new Date("2022-07-03T00:00:00"));
    holidayWeekCheck(new Date("2022-07-04T00:00:00"));
    holidayWeekCheck(new Date("2022-07-05T00:00:00"));
    holidayWeekCheck(new Date("2022-11-23T00:00:00"));
    holidayWeekCheck(new Date("2022-11-25T00:00:00"));
    holidayWeekCheck(new Date("2022-12-30T00:00:00"));
}


function getHolidaysForYear(year) {
    
    const holidays = [
        // New Year's Day is January 1st
        new Holiday(new Date(`${year}-01-01T00:00:00`), 'New Years Day'),
        
        // Martin Luther King day is the third Monday of January
        new Holiday(calculateHolidayDate(year, { month: 0, week: 3, weekday: 1 }), 'Martin Luther King Day'),
        
        // President's Day is the third Monday of February
        new Holiday(calculateHolidayDate(year, { month: 1, week: 3, weekday: 1 }), 'President\'s Day'),
        
        // Good Friday is the day before Easter (Easter Sunday)
        new Holiday(calculateGoodFriday(year), 'Good Friday'),
        
        // Memorial Day is the last Monday of May
        new Holiday(calculateHolidayDate(year, { month: 4, week: -1, weekday: 1 }), 'Memorial Day'),
        
        // Independence Day is July 4th
        new Holiday(new Date(`${year}-07-04T00:00:00`), 'Independence Day'),
        
        // Labor Day is the first Monday of September
        new Holiday(calculateHolidayDate(year, { month: 8, week: 1, weekday: 1 }), 'Labor Day'),
        
        // Veteran's Day is November 11th (observed if on Sunday)
        new Holiday(new Date(`${year}-11-11T00:00:00`), 'Veteran\'s Day'),
        
        // Thanksgiving is the fourth Thursday of November
        new Holiday(calculateHolidayDate(year, { month: 10, week: 4, weekday: 4 }), 'Thanksgiving'),
        
        // Christmas is December 25th
        new Holiday(new Date(`${year}-12-25T00:00:00`), 'Christmas')
    ];
    
    return holidays;
}

function calculateGoodFriday(year) {
    const easter = calculateEaster(year);
    const goodFriday = new Date(easter);
    goodFriday.setDate(easter.getDate() - 2);
    return goodFriday;
}

/**
 * Function to calculate Easter Sunday based on 'Laurent Longre' Algorithm
 * https://stackoverflow.com/questions/1284314/easter-date-in-javascript
 * @param {number} year
 * @returns 
 */
function calculateEaster(year) {
    let M=3, 
    G= year % 19+1, 
    C= ~~(year/100)+1, 
    L=~~((3*C)/4)-12,
    E=(11*G+20+ ~~((8*C+5)/25)-5-L)%30, 
    D;
    
    E<0 && (E+=30);
    (E==25 && G>11 || E==24) && E++;
    (D=44-E)<21 && (D+=30);
    (D+=7-(~~((5*year)/4)-L-10+D)%7)>31 && (D-=31,M=4);

    return new Date(year, M-1, D);
}

/**
 * Returns date for provided parameters. 
 * Memorial Day is the last Monday of May - calculateHolidayDate(year, { month: 4, week: -1, weekday: 1 })
 * 
 * @param {number} year - YYYY
 * @param {number} month - 0-indexed month, 0 is January 
 * @param {number} week - -1 for last week of month, 1 for first instance of day in month, 2 for second, etc.
 * @param {number} weekday - 0-indexed day of the week, 0 is Sunday
 * @returns 
 */
function calculateHolidayDate(year, { month, week, weekday }) {
    if(isNaN(year)) {
        throw new Error("Invalid year");
    } else if(isNaN(month) || month < 0 || month > 11) {
        throw new Error("Invalid month - expected 0-11");
    } else if(isNaN(week) || week > 4 || week < -1 || week === 0) {
        throw new Error("Invalid week - expected values [-1 for last week, 1 for first week, 2 for second, 3 for third, 4 for fourth]");
    } else if(isNaN(weekday) || weekday > 6 || weekday < 0) {
        throw new Error("Invalid weekday - expected 0-6");
    }

    if (week === -1) { // Last week of the month
        // initialize to the last day of the month 
        let date = new Date(year, month + 1, 0);
        
        // iterate backwards to the specified weekday
        while (date.getDay() !== weekday) {
            date.setDate(date.getDate() - 1);
        }
        return date;
    } else {
        // initialize to first of month
        let date = new Date(year, month, 1);

        // Adjust to the specified weekday
        while (date.getDay() !== weekday) {
            date.setDate(date.getDate() + 1);
        }
        let weekCounter = 1;

        while (weekCounter !== week && weekCounter < 5) {
            date.setDate(date.getDate() + 7);
            weekCounter += 1;
        }
        
        return date;

    }
    
}

$(function(){
    // default the year input to current year
    let currYear = new Date().getFullYear(); 
    let yearField = document.getElementById('holidayYear');
    yearField.value = currYear;

    // default start and end dates to beginning and end of current year
    document.getElementById('startDate').defaultValue = currYear + '-01-01';
    document.getElementById('endDate').defaultValue = currYear + '-12-31';
    document.getElementById('firstRecycleCollectionDate').defaultValue = currYear + '-01-01';

    generateHolidayBoxes();

})

