import json
import re

j = json.load(open('doc.json'))

c = set((
    re.findall('([A-Z ]+[0-9 ]+)[A-Z]+[0-9]+', i['Course'])[0],
    i['CourseSubtitle'],)
    for i in j)


d = [{
    'name' : i[1],
    'id':i[0],
    'value': i[0]}
    for i in c]
json.dump(d, open('course_names.json', 'w'))
