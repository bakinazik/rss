import os
import re

def read_readme(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        return file.read()

def parse_readme(content):
    categories = {}
    current_category = None
    lines = content.split('\n')

    for line in lines:
        if line.startswith('# '):
            current_category = line[2:].strip()
            categories[current_category] = []
        elif line.startswith('|') and current_category:
            match = re.search(r'(https?://\S+)', line)
            if match:
                categories[current_category].append(match.group(1))

    return categories

def generate_opml(categories):
    opml_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
    opml_content += '<opml version="2.0">\n'
    opml_content += '  <head>\n'
    opml_content += '    <title>RSS Feeds</title>\n'
    opml_content += '  </head>\n'
    opml_content += '  <body>\n'

    for category, links in categories.items():
        opml_content += f'    <outline title="{category}" text="{category}">\n'
        for link in links:
            opml_content += f'      <outline type="rss" xmlUrl="{link}" />\n'
        opml_content += '    </outline>\n'

    opml_content += '  </body>\n'
    opml_content += '</opml>\n'

    return opml_content

def generate_individual_opml(categories):
    for category, links in categories.items():
        opml_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
        opml_content += '<opml version="2.0">\n'
        opml_content += '  <head>\n'
        opml_content += f'    <title>{category} RSS Feeds</title>\n'
        opml_content += '  </head>\n'
        opml_content += '  <body>\n'
        for link in links:
            opml_content += f'    <outline type="rss" xmlUrl="{link}" />\n'
        opml_content += '  </body>\n'
        opml_content += '</opml>\n'

        save_opml(f'{category.lower().replace(" ", "_")}_feeds.opml', opml_content)

def save_opml(file_path, content):
    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(content)

def main():
    readme_path = 'README.md'
    grouped_opml_path = 'grouped_feeds.opml'

    if not os.path.exists(readme_path):
        print(f'Error: {readme_path} not found.')
        return

    content = read_readme(readme_path)
    categories = parse_readme(content)
    
    # Generate and save grouped OPML file
    grouped_opml_content = generate_opml(categories)
    save_opml(grouped_opml_path, grouped_opml_content)
    
    # Generate and save individual OPML files for each category
    generate_individual_opml(categories)
    
    print('OPML files saved.')

if __name__ == '__main__':
    main()
