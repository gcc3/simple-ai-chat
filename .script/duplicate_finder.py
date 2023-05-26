
input = open("dict.csv", 'r')
output = open("dict_buff.csv", 'w')

dup_count = 0
lines = input.readlines()
for line_idx, line in enumerate(lines):
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
    
    # 3. remove duplicate
    found_dup = False
    for l in lines[line_idx + 1:]:
        l_buff = l.split("\",\"")
        l_buff[0] = l_buff[0].strip('\"\n')
        l_buff[1] = l_buff[1].strip('\"\n')
        if row_buff[0] == l_buff[0] and row_buff[1] == l_buff[1]:
            found_dup = True
            break
    if found_dup:
        dup_count += 1
        print(row_buff[0] + ", duplicate found.")
        continue
    
    # 4. post-process
    # insert double quote
    row_buff[0] = "\"" + row_buff[0] + "\""
    row_buff[1] = "\"" + row_buff[1] + "\""
    output.write(','.join(row_buff) + "\n")

# close file
input.close()
output.close()
print("duplicate count = " + str(dup_count))