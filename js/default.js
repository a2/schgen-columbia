;(function ($, window, undefined) {
	$(function() {
		$('#submit').click(function(ev) {
			var term = $('#term').val(),
				courseids = $('#courseids').val().split(','),
				jxhr = [],
				result = [],
				daysOfTheWeek
			$.each(courseids, function(i, val) {
				jxhr.push(
					$.getJSON('http://data.adicu.com/courses?api_token=51314d99a237900002959a87&term='+term+'&courseid='+val+'&jsonp=?', function(data) {
						data = data['data'];
						result.push(data);
					})
				);
			});
			$.when.apply($, jxhr).done(function() {
				$('#result').text(JSON.stringify(result, null, '    '));
			});
		});
	});
})(jQuery, this);
