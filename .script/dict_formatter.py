import unicodedata

input = open("dict.csv", 'r')
output = open("dict_buff.csv", 'w')
Lines = input.readlines()
for line in Lines:
    row_buff = line.split('\",\"')
    if len(row_buff) != 2:
        print(row_buff[0] + ", length is not vaild. length = " + str(len(row_buff)))
        continue
    row_buff[0] = unicodedata.normalize('NFKC', row_buff[0])  # full-width to half-width
    output.write('\",\"'.join(row_buff))
