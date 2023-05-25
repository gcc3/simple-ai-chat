import unicodedata

input = open("dict.csv", 'r')
output = open("dict_buff.csv", 'w')

Lines = input.readlines()
for line in Lines:
    row_buff = line.split("\",\"")
    # remove double quote
    row_buff[0] = row_buff[0].strip('\"\n')  # must remove \n too
    row_buff[1] = row_buff[1].strip('\"\n')
    # validate length
    if len(row_buff) != 2:
        print(row_buff[0] + ", length is not vaild. length = " + str(len(row_buff)))
        continue
    # process text
    row_buff[0] = unicodedata.normalize('NFKC', row_buff[0])  # full-width to half-width
    # insert double quote
    row_buff[0] = "\"" + row_buff[0] + "\""
    row_buff[1] = "\"" + row_buff[1] + "\""
    output.write(','.join(row_buff) + "\n")
