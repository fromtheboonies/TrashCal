var gDebug = false;
var holidays = [
    new Date("2023-01-02T00:00:00"), // new years
    new Date("2023-05-29T00:00:00"), 
    new Date("2023-07-04T00:00:00"),
    new Date("2023-09-04T00:00:00"),
    new Date("2023-11-23T00:00:00"),
    new Date("2023-12-25T00:00:00"),
];

const dayName = ['Sun', 'Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Sat'];
var collectionDayName = '';

function trashCal(){
    
    var sStartDate = $("#startDate").val();
    var sEndDate = $("#endDate").val();

    var startDate = new Date(sStartDate+'T00:00:00');
    var endDate = new Date(sEndDate+'T00:00:00');
    
    var collectionDay = $('#collectionDay').val();
    collectionDayName = dayName[collectionDay];

    startDate = initializeStartDateToCollectionDay(startDate, collectionDay);

    var prevCollectionDay = startDate;
    var prevRecycleDay = startDate;
    var nextCollectionDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

    var genRecycleAndHolidayOnly = $('#recycleOnlyInd').val()==='on';
    

    var collectionDays = [];

    while(nextCollectionDay <= endDate) {
        var isInHolidayWeek = holidayWeekCheck(nextCollectionDay);
        var isTrashOnly = false;
        var daysLastRecycled = daysDifference(prevRecycleDay, nextCollectionDay);

        if(isInHolidayWeek) {
            var modifiedDate = new Date(nextCollectionDay.getFullYear(), nextCollectionDay.getMonth(), nextCollectionDay.getDate()+1);
            
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
    writeIcsFile(collectionDays);
 
}

function writeIcsFile(collectionDays) {
    var output = 
        'BEGIN:VCALENDAR\n' 
        +'VERSION:3\n';
    
    var nameAttribute = $('#fileName').val();  

    if(nameAttribute && nameAttribute.trim().length() > 0) {
        output += 'NAME: '+nameAttribute + ' ' + collectionDayName
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
    elem.setAttribute('download','Recycling Calendar.ics');

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
        if(diff==0 || (diff > 0 && diff <= 4 )) {
            isHolidayWeek = true;
            return;
        }
    });

    if(debug) {
        if(isHolidayWeek) {
            console.log(formatDate(checkDate) + ' is in holiday week!');
        } else {
            console.log(formatDate(checkDate) + ' is NOT in holiday week');
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

