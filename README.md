**Doodle based story Generator**

Hello ! 😊

I came across an experiment by google - Quick Draw, which enables users to draw doodles which in turn helps Neural Networks to learn and understand them more efficiently. Google has open-sourced the huge doodle images dataset (50M images 😮).

This time, instead of some model training or wasting some GPU xD, i decided to make something else, so moved towards p5.js and ml5.js .

So I made a webapp where user can draw some doodles, then DoodleNet will classify the doodles(not completely accurate predictions though, but still great) then you can generate an interesting story using GPT-3.5-turbo (ah yes, chatGPT 😁) revolving around the doodle classified tags, and you can download its pdf also.

But I have limited credits left for OpenAI API key (free account, you know 😶), so generate story function will give output only till credits are remaining.

Finally, deployed the website on Google Firebase console 🔥.

Wanna try, visit : https://doodle-story-gen.web.app/
