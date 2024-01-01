#!/bin/bash

python deploy.py
rsync -avz build/* root@vrsal.cc:/home/iros/ 
ssh root@vrsal.cc "cd /home/iros/ && chown iros:iros -R /home/iros && systemctl restart iros"