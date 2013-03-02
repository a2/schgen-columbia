function array_intersect (arr1) {
  // http://kevin.vanzonneveld.net
  // +   original by: Brett Zamir (http://brett-zamir.me)
  // %        note 1: These only output associative arrays (would need to be
  // %        note 1: all numeric and counting from zero to be numeric)
  // *     example 1: $array1 = {'a' : 'green', 0:'red', 1: 'blue'};
  // *     example 1: $array2 = {'b' : 'green', 0:'yellow', 1:'red'};
  // *     example 1: $array3 = ['green', 'red'];
  // *     example 1: $result = array_intersect($array1, $array2, $array3);
  // *     returns 1: {0: 'red', a: 'green'}
  var retArr = {},
    argl = arguments.length,
    arglm1 = argl - 1,
    k1 = '',
    arr = {},
    i = 0,
    k = '';

  arr1keys: for (k1 in arr1) {
    arrs: for (i = 1; i < argl; i++) {
      arr = arguments[i];
      for (k in arr) {
        if (arr[k] === arr1[k1]) {
          if (i === arglm1) {
            retArr[k1] = arr1[k1];
          }
          // If the innermost loop always leads at least once to an equal value, continue the loop until done
          continue arrs;
        }
      }
      // If it reaches here, it wasn't found in at least one array, so try next value
      continue arr1keys;
    }
  }

  return retArr;
}

// http://stackoverflow.com/a/5860190
function array_combinations(array) {
	return Array.prototype.reduce.call(array, function(a, b) {
	  var ret = [];
	  a.forEach(function(a) {
	    b.forEach(function(b) {
	      ret.push(a.concat([b]));
	    });
	  });
	  return ret;
	}, [[]]);
}

function array_pairs(arr, allowsDuplicates) {
	var pairs = [];
	for (var i = 0; i <= arr.length - 2; ++i) {
		for (var j = i + !allowsDuplicates; j <= arr.length - 1; ++j) {
			pairs.push([arr[i], arr[j]]);
		}
	}
	return pairs;
}

;(function ($, window, undefined) {
	var pairs1to6 = array_pairs('123456', true),
		columbiaDays = "UMTWRFS";
	
	function minutesSinceWeekStart(day, time) {
		var date = new Date("Mar 15, 1994 " + time);
		return columbiaDays.indexOf(day) * 1440 + date.getHours() * 60 + date.getMinutes();
	}
	
	function datesConflict(days1, start1, end1, days2, start2, end2) {
		if (!days1 || !days2) return false;
		var doesConflict = false;
		
		$.each(array_intersect(days1.split(''), days2.split('')), function(i, day) {
			var start1Mins = minutesSinceWeekStart(day, start1),
				end1Mins = minutesSinceWeekStart(day, end1),
				start2Mins = minutesSinceWeekStart(day, start2),
				end2Mins = minutesSinceWeekStart(day, end2);
			doesConflict = (start1Mins <= end2Mins) && (end1Mins >= start2Mins);
			return !doesConflict;
		});
		
		return doesConflict;
	}
	
	var meetsOn = 'MeetsOn', startTime = 'StartTime', endTime = 'EndTime';
	
	function parseArrayOfClassSections(classes) {
		var busyTimes = $.map($('#busy-times').text().split('\n'), function(val, i) {
			return [val.split(' ')];
		});
		
		var newClasses = []
		$.each(classes, function(i, aClass) {
			var validSections = $.grep(aClass, function(section, i) {
				var doesConflict = false;
				
				$.each(busyTimes, function(i, busyTimeArray) {
					$.each([1,2,3,4,5,6], function(i, num) {
						doesConflict = datesConflict(section[meetsOn+num], section[startTime+num], section[endTime+num], busyTimeArray[0], busyTimeArray[1], busyTimeArray[2]);
						return !doesConflict;
					});
					
					return !doesConflict;
				});
				
				return !doesConflict;
			});
			newClasses.push(validSections);
		});
		classes = newClasses;
		
		var sectionCombinations = array_combinations(classes),
			validSectionCombinations = [];
		$.each(sectionCombinations, function(i, sections) {
			var pairs = array_pairs(sections, false);
			
			var doesConflict = false;
			$.each(pairs, function(i, pair) {
				var el1 = pair[0], el2 = pair[1];
				
				$.each(pairs1to6, function(i, digitPair) {
					var d1 = digitPair[0], d2 = digitPair[1];
					doesConflict = datesConflict(el1[meetsOn+d1], el1[startTime+d1], el1[endTime+d1], el2[meetsOn+d2], el2[startTime+d2], el2[endTime+d2]);
					return !doesConflict;
				});
				
				return !doesConflict;
			});
			
			if (!doesConflict)
				validSectionCombinations.push(sections);
		});
		
		$('#results').show();
		
		$("#slider").slider({
			value:0,
			min: 0,
			max: validSectionCombinations.length - 1,
			slide: function(event, ui) {
				calendar.fullCalendar('refetchEvents');
			}
		});
		$( "#amount" ).val( "$" + $( "#slider" ).slider( "value" ) );
		
		
		var permutations = $('#permutations');
		permutations.html('');
		for (var i = 1; i <= validSectionCombinations.length; ++i) {
			permutations.append('<option value="p'+i+'">Permutation '+i+'</option>');
		}
		
		var calendar = $('#calendar');
		
		permutations.unbind().change(function(ev) {
			calendar.fullCalendar('refetchEvents');
		}).change();
		
		calendar.html('').fullCalendar({
			events: function(start, end, callback) {
				var events = [], index = $('#slider').slider("value"), list = $('#courses-list');
				list.html('');
				$.each(validSectionCombinations[index], function(i, section) {
					var url = ['http:\/\/www.columbia.edu\/cu\/bulletin\/uwb\/subj\/', section['Course'].replace(/([A-Z]{4})([0-9]{4})([A-Z])([0-9]{3})/, "$1/$3$2-"+section['Term']+"-$4")].join('');
					$.each([1,2,3,4,5,6], function(i, num) {
						if (!section[meetsOn+num]) return;
						$.each(section[meetsOn+num].split(''), function(i, day) {
							var startTimeString = section[startTime+num],
								startTimeHours = parseInt(startTimeString.slice(0,2)),
								startTimeMinutes = parseInt(startTimeString.slice(3,5)),
								endTimeString = section[endTime+num],
								endTimeHours = parseInt(endTimeString.slice(0,2)),
								endTimeMinutes = parseInt(endTimeString.slice(3,5));
							events.push({
								start: new Date(2013, 2, 3+columbiaDays.indexOf(day), startTimeHours, startTimeMinutes),
								end: new Date(2013, 2, 3+columbiaDays.indexOf(day), endTimeHours, endTimeMinutes),
								url: url,
								title: [section['CourseTitle'], ' (\u00A7', section['Course'].slice(-3), ') (', section['CallNumber'], ')'].join('')
							});
						});
					});
					list.append(['<li><a href="', url, '" target="_blank">', section['CourseTitle'], ' (\u00A7', section['Course'].slice(-3), ') (', section['CallNumber'], ')</a></li>'].join(''));
				});
				$.each(busyTimes, function(i, busyTimeArray) {
					var startTimeString = busyTimeArray[1],
						startTimeHours = parseInt(startTimeString.slice(0,2)),
						startTimeMinutes = parseInt(startTimeString.slice(3,5)),
						endTimeString = busyTimeArray[2],
						endTimeHours = parseInt(endTimeString.slice(0,2)),
						endTimeMinutes = parseInt(endTimeString.slice(3,5));
					events.push({
						start: new Date(2013, 2, 3+columbiaDays.indexOf(busyTimeArray[0]), startTimeHours, startTimeMinutes),
						end: new Date(2013, 2, 3+columbiaDays.indexOf(busyTimeArray[0]), endTimeHours, endTimeMinutes),
						title: "Unavailable",
						backgroundColor: 'red'
					});
				});
				callback(events);
			},
			defaultView: 'agendaWeek',
			header: null,
			columnFormat: { agendaWeek: 'ddd' },
			allDaySlot: false,
			year: 2013,
			month: 2,
			date: 3,
			minTime: '8:00am',
			maxTime: '8:00pm',
			contentHeight: 600,
			allDayDefault: false
		});
		
/*
		$('#results').html(function() {
			var result = ''
			$.each(validSectionCombinations, function(i, sections) {
				result += '<h3>Permutation '+(i+1)+'</h3><ul>';
				$.each(sections, function(i, section) {
					result += ['<li><a href="http:\/\/www.columbia.edu\/cu\/bulletin\/uwb\/subj\/', section['Course'].replace(/([A-Z]{4})([0-9]{4})([A-Z])([0-9]{3})/, "$1/$3$2-"+section['Term']+"-$4"), '" target="_blank">', section['CourseTitle'], ' (&sect;', section['Course'].slice(-3), ') (', section['CallNumber'], ')', '</a></li>'].join('');
				});
				result += '</ul>';
			});
			return result;
		});
*/
	}
	
	var API_TOKEN = '51314d99a237900002959a87';
	$(function() {
		$('#submit').click(function(ev) {
			var term = $('#term').val(),
				courseids = $('#courseids').val().split('\n'),
				jxhr = [],
				result = [];
			$.each(courseids, function(i, val) {
				jxhr.push(
					$.getJSON('http://data.adicu.com/courses?api_token='+API_TOKEN+'&term='+term+'&courseid='+val+'&jsonp=?', function(data) {
						data = data['data'];
						result.push(data);
					})
				);
			});
			$.when.apply($, jxhr).done(function() {
				parseArrayOfClassSections(result);
			});
		});
	});
})(jQuery, this);