from pathlib import Path
import re
files = [
    'Login.scss', 'Register.scss', 'Events.scss', 'MapView.scss', 'Reports.scss',
    'AdminPanel.scss', 'AdminUsers.scss', 'AdminEvents.scss', 'AdminMapView.scss', 'AdminReports.scss'
]
base = Path('src')
for name in files:
    path = base / name
    text = path.read_text(encoding='utf-8')
    text = text.replace('\\n', '\n').replace('\\r', '\r')
    text = re.sub(r"@import url\('https://fonts\.googleapis\.com/css2\?family=Poppins:wght@400;600;700&display=swap'\);\s*\r?\n", '', text)
    text = re.sub(r"@use\s*'\.\/variables';\s*\r?\n", '', text)
    text = re.sub(r"(?s)^\s*:root\s*\{.*?\}\s*\r?\n", '', text)
    text = text.lstrip()
    if not text.startswith("@use './_variables';"):
        text = "@use './_variables';\n\n" + text
    path.write_text(text, encoding='utf-8')
    print('fixed', name)
