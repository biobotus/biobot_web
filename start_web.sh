#!/bin/sh

# Change directory to make sure the Python script
# is launched from the correct location
cd "${0%/*}"

# Send all arguments to Python script
/usr/local/bin/python3 biobot_web.py $@
