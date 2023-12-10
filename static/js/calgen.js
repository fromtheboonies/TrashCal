var gDebug = false;
var lincolnHolidays = [
    new Date("2024-01-01T00:00:00"), // new years
    new Date("2024-05-27T00:00:00"), // memorial day
    new Date("2024-07-04T00:00:00"), // independence day
    new Date("2024-09-02T00:00:00"), // labor day
    new Date("2024-11-28T00:00:00"), // thanksgiving
    new Date("2024-12-25T00:00:00"), // christmas
];

var holidays = [
    new Date("2024-01-01T00:00:00"), // new years
    new Date("2024-01-15T00:00:00"), // Martin Luther King day
    new Date("2024-02-19T00:00:00"), // President's Day
    new Date("2024-03-29T00:00:00"), // Good Friday
    new Date("2024-05-27T00:00:00"), // memorial day
    new Date("2024-07-04T00:00:00"), // independence day
    new Date("2024-09-02T00:00:00"), // labor day
    new Date("2024-11-11T00:00:00"), // Veteran's Day
    new Date("2024-11-28T00:00:00"), // thanksgiving
    new Date("2024-12-25T00:00:00"), // christmas
];

const dayName = ['Sun', 'Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Sat'];
var collectionDayName = '';

function trashCal(writeToIcsFile){
    
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

    console.log('collectionDays: ', collectionDays);
    if(writeToIcsFile) {
        writeIcsFile(collectionDays);
    }
    
    return collectionDays;
}

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
       // +'LOCATION:Home\n'
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

function holidayWeekCheck(checkDate) {
    var debug = gDebug || false;
    var isHolidayWeek = false;
    
    holidays.forEach(function(holiday) {   
        var diff = daysDifference(holiday, checkDate);
        
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



function daysDifference(d0, d1) {
    var diff = new Date(+d1).setHours(12) - new Date(+d0).setHours(12);
    return Math.round(diff/8.64e7);
}
  
// Simple formatter
function formatDate(date){
    return [date.getFullYear(),('0'+(date.getMonth()+1)).slice(-2),('0'+date.getDate()).slice(-2)].join('-');
}

function icalDateFormat(date){
    return [date.getFullYear(),('0'+(date.getMonth()+1)).slice(-2),('0'+date.getDate()).slice(-2)].join('');
}
function initializeStartDateToCollectionDay(startDate, dayOfWeek) {
    var adjStartDate = startDate;

    console.log('initializeStartDate: '+ startDate +' startDateDay= ' + startDate.getDay() + ' dayOfWeek ' + dayOfWeek);

    while(adjStartDate.getDay() != dayOfWeek) {
        adjStartDate.setDate(adjStartDate.getDate()+1);
        console.log('incremented day', adjStartDate);
    }

    console.log('initializeStartDate: '+ adjStartDate +' adjStartDateDay= ' + adjStartDate.getDay() + ' dayOfWeek ' + dayOfWeek);
    return adjStartDate;
}


function testHolidayWeekCheck() {
    holidayWeekCheck(new Date("2022-07-03T00:00:00"));
    holidayWeekCheck(new Date("2022-07-04T00:00:00"));
    holidayWeekCheck(new Date("2022-07-05T00:00:00"));
    holidayWeekCheck(new Date("2022-11-23T00:00:00"));
    holidayWeekCheck(new Date("2022-11-25T00:00:00"));
    holidayWeekCheck(new Date("2022-12-30T00:00:00"));
}


class CollectionDay {
    constructor(date, summary, description, isInHolidayWeek, isTrashOnly) {
        this.date = date;
        this.summary = summary;
        this.description = description;
        this.isInHolidayWeek = isInHolidayWeek;
        this.isTrashOnly = isTrashOnly;
    }
}



$(function(){
    //$('#startDate').val('2022-01-01');
//    $('#startDate').datepicker({dateFormat: 'yyyy-mm-dd'});
})

