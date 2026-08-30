with open("frontend/src/app/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

def strip_comments_and_strings(s):
    res = []
    i = 0
    in_single_comment = False
    in_multi_comment = False
    in_string = None
    
    while i < len(s):
        char = s[i]
        if in_string:
            if char == '\\':
                res.append(' ')
                res.append(' ')
                i += 2
                continue
            if char == in_string:
                in_string = None
            res.append(' ')
            i += 1
            continue
        if in_single_comment:
            if char == '\n':
                in_single_comment = False
                res.append('\n')
            else:
                res.append(' ')
            i += 1
            continue
        if in_multi_comment:
            if s[i:i+2] == '*/':
                in_multi_comment = False
                res.append(' ')
                res.append(' ')
                i += 2
            else:
                res.append(' ')
                i += 1
            continue
        if s[i:i+2] == '//':
            in_single_comment = True
            res.append(' ')
            res.append(' ')
            i += 2
            continue
        if s[i:i+2] == '/*':
            in_multi_comment = True
            res.append(' ')
            res.append(' ')
            i += 2
            continue
        if char in ['"', "'", '`']:
            in_string = char
            res.append(' ')
            i += 1
            continue
        res.append(char)
        i += 1
    return "".join(res)

clean_code = strip_comments_and_strings(code)
lines = clean_code.split('\n')

stack = []
for line_idx, line in enumerate(lines):
    line_num = line_idx + 1
    for char_idx, char in enumerate(line):
        if char == '{':
            stack.append((line_num, char_idx + 1))
        elif char == '}':
            if stack:
                stack.pop()
            else:
                print(f"ERROR: Extra closing brace '}}' at Line {line_num}, Col {char_idx + 1}")

print("\n--- Remaining stack at EOF ---")
for idx, item in enumerate(stack):
    # Print the line content
    orig_line = code.split('\n')[item[0] - 1]
    print(f"#{idx}: Opened at Line {item[0]}, Col {item[1]}: {orig_line.strip()[:60]}")
