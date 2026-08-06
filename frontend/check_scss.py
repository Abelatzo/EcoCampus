from pathlib import Path
import re
root = Path('src')
files = sorted(root.glob('*.scss'))
print('FILES', len(files))
for f in files:
    txt = f.read_text(encoding='utf-8-sig')
    original = txt
    txt = txt.replace('\ufeff', '')

    # Normalize imports to the shared variables file and deduplicate them.
    txt = re.sub(r"@use\s+['\"]\.\/variables['\"]\s*;", "@use './_variables';", txt)
    # Deduplicate any repeated import lines.
    lines = txt.splitlines()
    new_lines = []
    seen_import = False
    for line in lines:
        if line.strip() == "@use './_variables';":
            if not seen_import:
                new_lines.append(line)
                seen_import = True
            continue
        new_lines.append(line)
    txt = '\n'.join(new_lines)

    # Ensure a single import exists in every SCSS file except the variables file.
    if f.name != '_variables.scss':
        if not seen_import:
            txt = "@use './_variables';\n\n" + txt.lstrip('\n')

    if txt != original:
        f.write_text(txt, encoding='utf-8')
        print(f.name, 'fixed')
    else:
        print(f.name, 'no changes')
