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

// http://jsfromhell.com/string/pad
//
// String.pad(length: Integer, [substring: String = " "], [type: Integer = 0]): String
// Returns the string with a substring padded on the left, right or both sides.
//
// length: amount of characters that the string must have
// substring: string that will be concatenated
// type: specifies the side where the concatenation will happen, where:
//           0 = left, 1 = right and 2 = both sides

String.prototype.pad = function(l, s, t){
    return s || (s = " "), (l -= this.length) > 0 ? (s = new Array(Math.ceil(l / s.length)
        + 1).join(s)).substr(0, t = !t ? l : t == 1 ? 0 : Math.ceil(l / 2))
        + this + s.substr(0, l - t) : this;
};

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
	var validSectionCombinations = [],
		busyTimes = [],
		pairs1to6 = array_pairs('123456', true),
		columbiaDays = "UMTWRFS",
		desiredSectionsForClasses = {};
	
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
		function bt_pad(num) {
			return num.toString().pad(2, "0");
		}
		function bt_timeString(date) {
			return bt_pad(date.getHours()) + ":" + bt_pad(date.getMinutes());
		}
		
		busyTimes = $.map($('#calendar').fullCalendar('clientEvents'), function(event, i) {
			return event.url ? null : [[columbiaDays[event.start.getDay()], bt_timeString(event.start), bt_timeString(event.end)]];
		});
		
		console.log(desiredSectionsForClasses);
		
		var newClasses = []
		$.each(classes, function(i, aClass) {
			var validSections = $.grep(aClass, function(section, i) {
				var regex = section['Course'].match(/([A-Za-z ]+[0-9 ]+)[A-Za-z]+([0-9]+)/),
					courseId = regex[1],
					sectionId = parseInt(regex[2]),
					desiredSections = desiredSectionsForClasses[courseId],
					rejectedSections = desiredSectionsForClasses['^'+courseId];
				
				if (!!desiredSections && desiredSections.indexOf(sectionId) == -1)
				{
					console.log('Rejecting section #'+sectionId);
					return false;
				}
				else if (!!rejectedSections && rejectedSections.indexOf(sectionId) != -1)
				{
					console.log('Rejecting section #'+sectionId);
					return false;
				}
				
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
		
		$.each(classes, function(i, sections) {
			if (!sections.length) {
				$("#no-permutations-modal").dialog('open');
				return false;
			}
		});
		
		var sectionCombinations = array_combinations(classes);
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
		
		var slider = $('#slider')
			.slider('option', 'max', validSectionCombinations.length - 1)
			.slider('option', 'value', 0),
			
			explanation = slider.add("#slider-explanation");
			
		if (validSectionCombinations.length > 1)
			explanation.show()
		else
			explanation.hide();
			
		$("#courses-list")
			.show();
		
		$('#calendar').fullCalendar('refetchEvents');
	}
	
	var API_TOKEN = '51314d99a237900002959a87';
	$(function() {
		$('#submit').click(function(ev) {
			var term = $('#term :selected').attr('name'),
				courseids = $('#courseids').val().split(/,\s*/),
				jxhr = [],
				result = [];
			
			sliderValue = 0;
			desiredSectionsForClasses = {};
			
			if (!courseids.length || (courseids.length == 1 && courseids[0] == ""))
			{
				validSectionCombinations = [];
				busyTimes = [];
				$('#calendar').fullCalendar('refetchEvents');
			}
			
			sliderValue = 0;
			desiredSectionsForClasses = {};

			$.each(courseids, function(i, val) {
				if (!val || !val.length)
					return;
				
				var results = val.match(/([A-Za-z ]+[0-9 ]+)(?:{(.*?)})?/),
					courseid = results[1];
				
				if (results[2] != undefined)
				{
					var sections = [],
						shouldExclude = results[2].indexOf('^') == 0;
						
					$.each(results[2].slice(!!shouldExclude).split(/\s*|\s*/), function(i, val) {
						sections.push(parseInt(val));
					});
					desiredSectionsForClasses[(shouldExclude?'^':'')+courseid.toUpperCase()] = sections;
				}
				
				jxhr.push(
					$.getJSON('http://data.adicu.com/courses?api_token='+API_TOKEN+'&term='+term+'&courseid='+courseid+'&jsonp=?', function(data) {
						result.push(data['data']);
					})
				);
			});
			$.when.apply($, jxhr).done(function() {
				parseArrayOfClassSections(result);
			});
		});
		
		$("#no-permutations-modal").dialog({
			modal: true,
			autoOpen: false
		});
		
		var calendar = $("#calendar"),
			
			sliderValue = 0;
		
		$("#slider").slider({
			value:0,
			min: 0,
			slide: function(event, ui) {
				sliderValue = ui["value"];
				calendar.fullCalendar('refetchEvents');
			}
		});
		
		calendar.fullCalendar({
			events: function(start, end, callback) {
				var events = [], list = $('#courses-list');
				list.html('');
				if (validSectionCombinations.length) {
					$.each(validSectionCombinations[sliderValue], function(i, section) {
						var url = ['http:\/\/www.columbia.edu\/cu\/bulletin\/uwb\/subj\/', section['Course'].replace(/([A-Za-z ]+)([0-9 ]+)([A-Za-z]+)([0-9]+)/, "$1/$3$2-"+section['Term']+"-$4")].join('');
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
									title: [section['CourseTitle'], ' (\u00A7', section['Course'].slice(-3), ')'].join(''),
									backgroundColor: '#405E74',
									editable: false
								});
							});
						});
						list.append(['<li><a href="', url, '" target="_blank">', section['CourseTitle'], ' (\u00A7', section['Course'].slice(-3), ') (', section['CallNumber'], ')</a></li>'].join(''));
					});
				} else if (busyTimes.length) {
					$("#no-permutations-modal").dialog('open');
				}
				if (busyTimes.length) {
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
							title: "Unavailable"
						});
					});
				}
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
			maxTime: '10:00pm',
			allDayDefault: false,
			editable: true,
			selectable: true,
			selectHelper: true,
			eventBackgroundColor: '#7F2425',
			eventBorderColor: 'black',
			contentHeight: 1000,
			select: function(start, end, allDay) {
				calendar.fullCalendar('renderEvent',
					{
						title: "Unavailable",
						start: start,
						end: end,
						allDay: allDay
					},
					false
				).fullCalendar('unselect');
			},
			eventClick: function(event) {
				if (event.url) {
					window.open(event.url);
					return false;
				}
				
				calendar.fullCalendar('removeEvents', event.id || event._id);
			}
		});
		
		$('#term').change(function(ev) {
			$.getJSON($(this).find(':selected').attr('name')+'.json', function(coursenames) {
				
				function split( val ) {
					return val.split( /,\s*/ );
				}
				function extractLast( term ) {
					return split( term ).pop();
				}
			
				$( "#courseids" )
					// don't navigate away from the field on tab when selecting an item
					.bind( "keydown", function( event ) {
						if ( event.keyCode === $.ui.keyCode.TAB &&
							$( this ).data( "ui-autocomplete" ).menu.active ) {
							event.preventDefault();
						}
						else if (event.keyCode === $.ui.keyCode.ENTER /* && !$( this ).data( "ui-autocomplete" ).menu.active */) {
							$('#submit').click();
							event.preventDefault()
						}
					})
					.autocomplete({
						minLength: 0,
						source: function( request, response ) {
							response( $.ui.autocomplete.filter(
							coursenames, extractLast( request.term ) ) );
						},
						focus: function(event, ui) {
							// prevent value inserted on focus
							return false;
						},
						select: function( event, ui ) {
								var terms = split( this.value );
								// remove the current input
								terms.pop();
								// add the selected item
								terms.push( ui.item.value );
								// add placeholder to get the comma-and-space at the end
								terms.push( "" );
								this.value = terms.join( ", " );
								return false;
							}
					})
					.data( "ui-autocomplete" )._renderItem = function( ul, item ) {
						return $( "<li>" )
							.append( "<a><span class=\"title\">" + item.value + "</span><br /><span class=\"subtitle\">" + item.name + "</span></a>" )
							.appendTo( ul );
					};	
			});
		}).change();
	});
})(jQuery, this);
