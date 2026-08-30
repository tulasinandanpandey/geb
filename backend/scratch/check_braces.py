with open("frontend/src/app/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Strip string literals and comments to avoid false matches
def strip_comments_and_strings(s):
    res = []
    i = 0
    in_single_comment = False
    in_multi_comment = False
    in_string = None # '"', "'", or "`"
    
    while i < len(s):
        char = s[i]
        
        # Handle string literals
        if in_string:
            if char == '\\':
                i += 2
                continue
            if char == in_string:
                in_string = None
            i += 1
            continue
            
        # Handle comments
        if in_single_comment:
            if char == '\n':
                in_single_comment = False
            i += 1
            continue
        if in_multi_comment:
            if s[i:i+2] == '*/':
                in_multi_comment = False
                i += 2
            else:
                i += 1
            continue
            
        if s[i:i+2] == '//':
            in_single_comment = True
            i += 2
            continue
        if s[i:i+2] == '/*':
            in_multi_comment = True
            i += 2
            continue
            
        if char in ['"', "'", '`']:
            in_string = char
            i += 1
            continue
            
        res.append(char)
        i += 1
        
    return "".join(res)

clean_code = strip_comments_and_strings(code)

# Now count the lines and track braces
braces = []
parentheses = []
brackets = []

lines = code.split('\n')
for line_idx, line in enumerate(lines):
    # Strip comments and strings for this line
    clean_line = strip_comments_and_strings(line)
    for char in clean_line:
        if char == '{':
            braces.append(line_idx + 1)
        elif char == '}':
            if braces:
                braces.pop()
            else:
                print(f"Extra closing brace '}}' at line {line_idx + 1}")
        elif char == '(':
            parentheses.append(line_idx + 1)
        elif char == ')':
            if parentheses:
                parentheses.pop()
            else:
                print(f"Extra closing parenthesis ')' at line {line_idx + 1}")

print(f"Unmatched opening braces (total {len(braces)}):")
for b in braces[-10:]:
    print(f"  Line {b}")

print(f"Unmatched opening parentheses (total {len(parentheses)}):")
for p in parentheses[-10:]:
    print(f"  Line {p}")
