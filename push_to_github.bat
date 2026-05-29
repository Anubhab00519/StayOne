@echo off
git init
git add .
git commit -m "Final push"
git branch -M main
git remote add origin https://github.com/Anubhab00519/StayOne.git
git push -u origin main --force
