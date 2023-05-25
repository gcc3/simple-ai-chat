import unicodedata

input = open("dict.csv", 'r')
output = open("dict_buff.csv", 'w')

lines = input.readlines()
for line in lines:
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
    # text format
    row_buff[0] = unicodedata.normalize('NFKC', row_buff[0])  # full-width to half-width
    
    # 4. post-process
    # insert double quote
    row_buff[0] = "\"" + row_buff[0] + "\""
    row_buff[1] = "\"" + row_buff[1] + "\""
    output.write(','.join(row_buff) + "\n")
