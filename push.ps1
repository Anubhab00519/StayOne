$git = "C:\Program Files\Git\cmd\git.exe"
& $git init
& $git add .
& $git commit -m "Final project push without changes"
& $git branch -M main
& $git remote add origin https://github.com/Anubhab00519/StayOne.git
& $git push -u origin main --force
