import re
from bs4 import BeautifulSoup
import string
import os, os.path
import pandas as pa
import progressbar
import pickle

def parse_subj(text):
    soup = BeautifulSoup(text)
    
    pairs = []

    pairs.append(('title', soup.find(size='+2').text))
    pairs.append(('subtitle', soup.find(size='+1').text))
    try:
        pairs.append(('subsubtitle', soup.find('i').text))
    except AttributeError:
        pairs.append(('subsubtitle', ''))
    
    for t in soup.find_all('tr'):
        c =  t.find_all('td')
        if len(c) == 2:
            k, v =c 
            pairs.append((k.text, v.text))

    pairs = [(string.lower(k), v) for (k, v) in pairs]
    pairs = [(re.sub('\s+', '_', k), v) for (k, v) in pairs]
    pairs = [(re.sub('[^A-z_]', '', k), v) for (k, v) in pairs]
    pairs = [(k, v.encode('ascii', 'xmlcharrefreplace')) for (k, v) in pairs]

    # Advanced Parsing
    course = dict(pairs)

    if 'course_description' in course.keys():
        course_description = course['course_description']
        if re.search('Prerequisite[s]*: ', course_description, flags=re.IGNORECASE):
            prereq = re.search('Prerequisite[s]*: (.*?)[\.\n;]', course_description, flags=re.IGNORECASE).group(1)
            prereq_courses = re.findall('(?:[A-Z]{2,4} )*[A-Z][0-9]{3,4}[a-z]*', prereq)
            prereq_permission = re.findall('permission', prereq, flags=re.IGNORECASE)

            if prereq_courses != []:
                course['prereq'] = prereq_courses
            if prereq_permission != []:
                course['permission'] = True


        if re.search('Corequisite[s]*: ', course_description, flags=re.IGNORECASE):
            prereq = re.search('Corequisite[s]*: (.*?)[\.\n;]', course_description, flags=re.IGNORECASE).group(1)
            coreq_courses = re.findall('(?:[A-Z]{2,4} )*[A-Z][0-9]{3,4}[a-z]*', prereq)

            if coreq_courses != []:
                course['coreq'] = coreq_courses

    return course


def build_file_list(base_path = './data/www.columbia.edu/cu/bulletin/uwb/'):
    file_list = []

    subjects_path = base_path + 'subj/'
    subjects = os.listdir(subjects_path)
    for s in subjects:
        s_path = subjects_path + s + '/'
        courses = os.listdir(s_path)
        courses = [c for c in courses if os.path.isdir(s_path + c)]
        for c in courses:
            file_list.append([base_path, 'subj/', s + '/', c + '/', 'index.html'])

    return file_list


if __name__ == '__main__':

    extract = False
    graph = True
    if extract:
        file_list = build_file_list()

        courses = []

        for i, f in enumerate(file_list):
            p =  string.join(f, '')
            text = open(p).read()
            c = parse_subj(text)
            c['path'] = f
            c['subj'] = f[2][:-1]
            courses.append(c)

            print i, len(file_list), c['title']


        df = pa.DataFrame(courses)
        pickle.dump(df, open('courses.pickle', 'w'))
        df.to_csv('courses.tsv', sep = '\t')

    if graph:
        df = pa.load('courses.pickle')
        df = df[pa.notnull(df.prereq)]

        f = open('courses.dot', 'w')
        f.write('digraph courses {\noutputorder=edgesfirst;\n')
        for i in df.itertuples():
            print i
            subj = re.sub('_', '', i[26])
            full_number = subj + ' ' + i[17]
            url = string.join(i[19], '')
            f.write('"%s"[URL="http://%s", tooltip="%s"];\n' % (full_number, url[7:], i[30]))

        for i in df.itertuples():
            subj = re.sub('_', '', i[26])
            full_number = subj + ' ' + i[17]
            for j in i[22]:
                if re.search('[A-Z]{2,4} [A-Z][0-9]{3,4}[a-z]*', j):
                    d =  re.search('[A-Z]{2,4} [A-Z][0-9]{3,4}[a-z]*', j).group(0)
                else:
                    d = subj + ' ' + re.search('[A-Z][0-9]{3,4}[a-z]*', j).group(0)

                f.write('"%s"->"%s";\n' % (full_number, d))
                print full_number, d
        f.write('}')
        f.close()
