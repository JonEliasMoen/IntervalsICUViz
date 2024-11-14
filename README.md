# Intervals ICU performance Management Chart & Weather data from YR
Ever had the problem where you wonder if you still are in your optimal zone, while youre on the go.
Worry no more, i have made a react native app, which is indended for Android. But available for web/ios as well.

![image](https://github.com/user-attachments/assets/4cebe534-cf56-42aa-906e-a1baa3118ee0)
![image](https://github.com/user-attachments/assets/9785c7c8-3fb1-4649-b58b-cd36d6fef687)


The app gives a PMC panel which gives performance mangement values such as:
- ACWR (Acute chronic workload ratio)
- HRV (Heart rate variability)
- Ramprate
- Form
- Form %
- Running/Ride eftp/kg

# Setup
- npm install package.json
- npm run start
- Enter your intervals.icu developer key: https://forum.intervals.icu/t/api-access-to-intervals-icu/609

# Building
- The app can be built for android with expo and eas cli

# Bugs
- There is a problem with the button on android. Still working on this in Master branch. Just remove the <Button> from settings.tsx
- Loading data after user enters 
