
import requests
import json
import time

input = open("dict.csv", 'r')
output = open("dict_buff.csv", 'w')

def get_keywords(text):
    url = "https://labs.goo.ne.jp/api/keyword"
    appid = "68b6b3455c7aa96d4a453d5059e2c02e4060a6c1edc5e92e9c005b3af242cf7c"
    headers = {'Content-Type': 'application/json'}
    data = {'app_id': appid, 'title':"", 'body': text}
    r = requests.post(url, data=json.dumps(data), headers=headers)
    
    result = ""
    for keyword in r.json()['keywords']:
        result += list(keyword.keys())[0] + ","
    return result.strip(",")

lines = input.readlines()
for idx, line in enumerate(lines):
    if idx == 0: continue;
    time.sleep(10)
    
    # 1. pre-process
    row_buff = line.split("\",\"")
    # remove double quote
    row_buff[0] = row_buff[0].strip('\"\n')  # must remove \n too
    row_buff[1] = row_buff[1].strip('\"\n')
    
    # 2. vaildation filter
    # validate length
    if len(row_buff) != 2:
        print(row_buff[0] + ", length is not vaild. length = " + str(len(row_buff)))
        continue
    
    # 3. process
    keywords = get_keywords(row_buff[1])
    row_buff.append(keywords)
    
    # 4. post-process
    # insert double quote
    row_buff[0] = "\"" + row_buff[0] + "\""
    row_buff[1] = "\"" + row_buff[1] + "\""
    row_buff[2] = "\"" + row_buff[2] + "\""
    
    print(str(idx) + ":" + row_buff[2])
    output.write(','.join(row_buff) + "\n")
