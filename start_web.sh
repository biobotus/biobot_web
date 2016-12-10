#!/bin/sh

# Change directory to make sure the Python script is launched from the
# correct location in order to find local files properly
cd "${0%/*}"

# Send all arguments to Python script
/usr/bin/python3 biobot_web.py $@
