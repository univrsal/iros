import shutil
import os

NO_CGO = True


def find_files(path, ext):
    found = []
    for root, dirs, files in os.walk(path):
        for file in files:
            if file.endswith(ext):
                found.append(os.path.join(root, file))
    return found


def check_installed(name):
    if not shutil.which(name):
        print(name + " is not installed, please install " + name + " first")
        exit(1)


deps = ["go", "terser", "cleancss", "html-minifier"]

# check if all dependencies are installed
for dep in deps:
    check_installed(dep)

# build the go binary
shutil.rmtree("build", ignore_errors=True)

# run the go build command
print("Building the go binary")
if NO_CGO:
    os.system("CGO_ENABLED=0 go build -ldflags '-extldflags \"-static\"' -o build/ ..")
else:
    os.system("go build -o build/ ..")

# copy the web content to the build folder
shutil.copytree("../web", "build/web")
shutil.copytree("../templates", "build/templates")

js_files = find_files("build/web", ".js")
css_files = find_files("build/web", ".css")
html_files = find_files("build/web", ".html")

# minify the web content
print("Minifying js")
for file in js_files:
    os.system("terser --compress --mangle --output " + file + " " + file)

# minify the CSS content
print("Minifying css")
for file in css_files:
    os.system("cleancss -o " + file + " " + file)

# minify the HTML content
print("Minifying html")
for file in html_files:
    os.system(
        "html-minifier --collapse-whitespace --remove-comments -o " + file + " " + file
    )

# prepend all css, html and js files with the header
print("Prepending headers")
for file in js_files + css_files + html_files:
    with open(file, "r") as f:
        content = f.read()
    with open(file, "w") as f:
        if file.endswith(".html"):
            f.write(
                "<!-- Copyright (c) $current_year me <uni@vrsal.cc> :^) - Donut Steel -->\n"
            )
        else:
            f.write(
                "/* Copyright (c) $current_year me <uni@vrsal.cc> :^) - Donut Steel */\n"
            )

        f.write(content)
