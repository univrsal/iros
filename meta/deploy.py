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


deps = ["go"]

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
