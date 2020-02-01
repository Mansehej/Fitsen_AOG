"use strict";

//1 second working

const functions = require("firebase-functions");
const {
  dialogflow,
  SimpleResponse,
  Suggestions,
  Place,
  BasicCard,
  SignIn,
  Image,
  MediaObject
} = require("actions-on-google");
const axios = require("axios");

function exitResponses() {
  var possibleResponse = [
    "Alright, have a nice day!",
    "Okay, Goodbye!",
    "Okay then, hope to see you again!",
    "It was a pleasure helping you. Goodbye!",
    "Alrightey, Good day!",
    "Cool. Bye bye!",
    "Alright! Hope to see you soon!"
  ];
  var pick = Math.round(Math.random() * possibleResponse.length);
  return possibleResponse[pick];
}

let shortExercise;
let lastLongExercise;

//Get Picture at End and congratulate

function firstUC(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getShortGroup(last) {
  var possibleResponse = ["eyes", "neck", "posture"];
  var sendResponse = [...possibleResponse];
  if (last != -1) {
    sendResponse.splice(sendResponse.indexOf(last), 1);
    console.log("Picked from: " + sendResponse);
  }
  var pick = sendResponse[Math.floor(Math.random() * sendResponse.length)];
  console.log("Picked exercise: " + pick);
  return pick;
}

function getLongGroup(last) {
  var possibleResponse = [
    "eyes",
    "neck",
    "posture",
    "wrist",
    "abs",
    "hamstring",
    "butt",
    "thigh",
    "calves",
    "forearms",
    "triceps",
    "chest",
    "cardio",
    "stretching"
  ];

  var sendResponse = [...possibleResponse];
  if (last != -1) {
    sendResponse.splice(sendResponse.indexOf(last), 1);
    console.log("Picked from: " + sendResponse);
  }
  var pick = sendResponse[Math.floor(Math.random() * sendResponse.length)];
  console.log("Picked exercise: " + pick);
  return pick;
}

function randomQuote() {
  var possibleResponse = [
    "The last three or four reps is what makes the muscle grow. This area of pain divides a champion from someone who is not a champion.", 
    "Success usually comes to those who are too busy to be looking for it.", 
    "All progress takes place outside the comfort zone.",
    "If you think lifting is dangerous, try being weak. Being weak is dangerous.",
    "The only place where success comes before work is in the dictionary.",
    "The clock is ticking. Are you becoming the person you want to be?",
    "Whether you think you can, or you think you can’t, you’re right.",
    "The successful warrior is the average man, with laser-like focus.",
    "You must expect great things of yourself before you can do them.",
    "Action is the foundational key to all success.",
    "Things may come to those who wait, but only the things left by those who hustle.",
    "Well done is better than well said.",
    "All our dreams can come true if we have the courage to pursue them.",
    "A champion is someone who gets up when they can’t.",
    "What hurts today makes you stronger tomorrow.",
    "If something stands between you and your success, move it. Never be denied.",
    "If you want something you’ve never had, you must be willing to do something you’ve never done.",
    "You have to think it before you can do it. The mind is what makes it all possible.",
    "Things work out best for those who make the best of how things work out.",
    "Success is walking from failure to failure with no loss of enthusiasm."
  ];
  var sendResponse = [...possibleResponse];
  var pick = sendResponse[Math.floor(Math.random() * sendResponse.length)];
  console.log("Picked exercise: " + pick);
  return pick;
}

const app = dialogflow({
  clientId:
    "332052772913-gavqo2oqhbrauq88inqvadkhe4gvabk4.apps.googleusercontent.com"
});

//Welcome
app.intent("Default Welcome Intent", conv => {
  console.log("Inside Welcome");
  console.log(conv.user.profile.payload);
  // conv.user.storage.pastShort = []
  conv.data.exitResponse = exitResponses()
  if (conv.user.profile.payload) {
    conv.ask(
      new SimpleResponse({
        speech: "Welcome back," + conv.user.profile.payload.given_name + ". What do you wish to do today?",
        text: "Welcome to Fitsen, " + conv.user.profile.payload.given_name + "!"
      })
    );

    conv.ask(
      new Suggestions([
        "Quick Workout",
        // "Meal Plans",
        "Meditation",
        // "Virtual Trainer",
        // "Virtual Therapist",
        "Motivation",
        "Binaural Beats",
          "White noise"
      ])
    );
  }

  //If new user
  else {
    conv.ask("Welcome to Fitsen. Please sign in to continue.");
    conv.ask(new SignIn());
  }
});

//Sign In
app.intent("Signin", (conv, params, signin) => {
  console.log(signin.status);
  if (signin.status === "OK") {
    conv.ask(
      new SimpleResponse({
        speech: "Welcome to Fitsen, " + conv.user.profile.payload.given_name,
        text: "Welcome to Fitsen, " + conv.user.profile.payload.given_name + "!"
      })
    );

    conv.ask(
      new Suggestions([
        "Quick Workout",
        // "Meal Plans",
        "Meditation",
        // "Virtual Trainer",
        // "Virtual Therapist",
        "Motivation",
        "Binaural Beats",
          "White noise"
      ])
    );
  } else {
    conv.close("Sorry, you need to be signed in to continue.");
  }
});

//Workout landing
app.intent("Workout", (conv, { userTime }) => {
  // console.log("Initial contexT: " + conv.queryResult.outputContexts)
  conv.data.exerciseCount = 0;
  console.log("In workout");
  let timeInMinutes;
  conv.data.id = []
  if (
    conv.user.storage.pastShort == undefined ||
    conv.user.storage.pastShort.length == 0
  ) {
    shortExercise = getShortGroup(-1);
  } else {
    console.log("Last array: " + conv.user.storage.pastShort);
    shortExercise = getShortGroup(
      conv.user.storage.pastShort[conv.user.storage.pastShort.length - 1]
    );
  }

  if (
    conv.user.storage.pastLong == undefined ||
    conv.user.storage.pastLong.length == 0
  ) {
    conv.user.storage.pastLong = [];
    lastLongExercise = "first";
  } else {
    console.log("Last array: " + conv.user.storage.pastLong);
    lastLongExercise =
      conv.user.storage.pastLong[conv.user.storage.pastLong.length - 1];
  }

  console.log(userTime.amount + userTime.unit);

  switch (userTime.unit) {
    case "s":
      timeInMinutes = Math.round(userTime.amount / 60);
      break;
    case "ms":
      timeInMinutes = Math.round(userTime.amount / 60000);
      break;
    case "h":
      timeInMinutes = Math.round(userTime.amount * 60);
      break;
    case "min":
      timeInMinutes = userTime.amount;
      break;
    default:
      timeInMinutes = -1;
  }

  console.log("Workout time: " + timeInMinutes);

  //Invalid time
  if (timeInMinutes < 0) {
    conv.ask("Please give a time between 2 and 30 minutes.");
  }

  //Time above 30 mins
  else if (timeInMinutes > 30) {
    conv.ask(
      "We can offer a maximum of 30 minutes of exercise. Please try again."
    );
  }

  //Time below 2 mins
  else if (timeInMinutes < 6) {
    conv.ask("We need a minimum of 6 minutes to exercise. Please try again.");
  }

  //Short Exercise
  // else if (timeInMinutes >= 2 && timeInMinutes < 5) {
  //   conv.data.userTime = timeInMinutes;
  //   if (conv.user.storage.pastShort == undefined) {
  //     conv.user.storage["pastShort"] = [];
  //   }
  //   //Card
  //   var uri =
  //     "https://fitsen.herokuapp.com/getExercise?bodyPart=" +
  //     firstUC(shortExercise) +
  //     "&time=" +
  //     timeInMinutes * 60;
  //   var encoded = encodeURI(uri);
  //   return getApi(encoded)
  //     .then(response => {
  //       console.log();
  //       conv.data.exerciseCount = 0;
  //       conv.data.currentSession = response.data.myArray;
  //       var currExercise = response.data.myArray;
  //       var title = currExercise[conv.data.exerciseCount].Title;
  //       var id = currExercise[conv.data.exerciseCount].id.toString();
  //       var description = currExercise[conv.data.exerciseCount].Description;
  //       var sets = currExercise[conv.data.exerciseCount].Sets;
  //       var reps = currExercise[conv.data.exerciseCount].Reps;
  //       var breakTime = currExercise[conv.data.exerciseCount].BreakTime;
  //       var gif = currExercise[conv.data.exerciseCount].Gif;
  //       var instructions = currExercise[conv.data.exerciseCount].Instructions;
  //       console.log("Inside exercise response " + conv.data.exerciseCount);
  //       conv.ask(
  //         new SimpleResponse({
  //           speech: "Let's do a " + shortExercise + " exercise!",
  //           text: "Let's do a " + shortExercise + " exercise!"
  //         })
  //       );

  //       conv.ask(
  //         new BasicCard({
  //           title: title,
  //           subtitle: "Sets: " + sets + "  \nReps: " + reps,
  //           text: description,
  //           image: new Image({
  //             url: gif,
  //             alt: title
  //           }),
  //           display: "CROPPED"
  //         })
  //       );


  //       console.log("ec " + conv.data.exerciseCount + " cs length " + conv.data.currentSession.length)
  //       if (conv.data.exerciseCount >= conv.data.currentSession.length-1) {
  //         conv.ask(new Suggestions(["Finish Workout", "Skip", "Exit"]));
  //       } else {
  //         conv.ask(new Suggestions(["Next", "Skip", "Exit"]));
  //       }
  //       conv.data.exerciseCount++;
        
  //       conv.data.id.push(id.toString())
  //       conv.user.storage.pastShort.push(shortExercise);

  //     })
  //     .catch(error => {
  //       if (error.response) {
  //         console.log("Response Data: " + error.response.data);
  //         console.log("response Status: " + error.response.status);
  //         console.log("Response Headers: " + error.response.headers);
  //       } else if (error.request) {
  //         console.log("Error request: " + error.request);
  //       } else {
  //         console.log("Error", error.message);
  //       }
  //       console.log("Error Config: " + error.config);
  //       conv.close("I apologize. There was an error.");
  //     });
  // }

  //Long exercise

  else {
    conv.data.userTime = timeInMinutes;

    if (lastLongExercise == "first") {
      conv.ask(
        new SimpleResponse({
          speech: "Great! Which body part do you want to focus on?",
          text: "Great! Which body part do you want to focus on?"
        })
      );
    } else {
      conv.ask(
        new SimpleResponse({
          speech:
            "I see that you performed some " +
            lastLongExercise +
            " exercises last time.",
          text:
            "You performed some " + lastLongExercise + " exercises last time."
        })
      );
      conv.ask(
        new SimpleResponse({
          speech: "Which body part do you want to focus on?",
          text: "Which body part do you want to focus on?"
        })
      );
    }
    conv.ask(
      new Suggestions([
        "Abs",
        "Chest",
        "Butt",
        "Posture",
        "Neck",
        "Triceps",
        "Stretching",
        "Exit"
      ])
    );
  }
});

//Focused workouts
app.intent("Workout - focused", (conv, { Exercises }) => {
  console.log("King exercise: " + Exercises);
  var uri =
    "https://fitsen.herokuapp.com/getExercise?bodyPart=" +
    firstUC(Exercises) +
    "&time=" +
    conv.data.userTime * 60;
  var encoded = encodeURI(uri);
  return getApi(encoded)
    .then(response => {
      conv.data.exerciseCount = 0;
      conv.data.currentSession = response.data.myArray;
      var currExercise = response.data.myArray;
      console.log(currExercise);
      var title = currExercise[conv.data.exerciseCount].Title;
      var description = currExercise[conv.data.exerciseCount].Description;
      var sets = currExercise[conv.data.exerciseCount].Sets;
      var reps = currExercise[conv.data.exerciseCount].Reps;
      var id = currExercise[conv.data.exerciseCount].id;
      var breakTime = currExercise[conv.data.exerciseCount].BreakTime;
      var gif = currExercise[conv.data.exerciseCount].Gif;
      var instructions = currExercise[conv.data.exerciseCount].Instructions;
      console.log("Inside exercise response " + conv.data.exerciseCount);
      if (conv.data.userTime > 15) {
        conv.ask(
          new SimpleResponse({
            speech:
              "Let's do a bit of stretching before your " +
              Exercises +
              " exercise.",
            text:
              "Let's do a bit of stretching before your " +
              Exercises +
              " exercise."
          })
        );
      } else {
        conv.ask(
          new SimpleResponse({
            speech: "I love " + Exercises + " exercises too!",
            text: "I love " + Exercises + " exercises too!"
          })
        );
      }

      conv.ask(
        new BasicCard({
          title: title,
          subtitle: "Sets: " + sets + "  \nReps: " + reps,
          text: description,
          image: new Image({
            url: gif,
            alt: title
          }),
          display: "CROPPED"
        })
      );

      conv.data.id.push(id.toString())

      console.log("ec " + conv.data.exerciseCount + " cs length " + conv.data.currentSession.length)

      if (conv.data.exerciseCount >= conv.data.currentSession.length-1) {
        conv.ask(new Suggestions(["Finish Workout", "Skip", "Exit"]));
      } else {
        conv.ask(new Suggestions(["Next", "Skip", "Exit"]));
      }
      conv.data.exerciseCount++;

      conv.user.storage.pastLong.push(Exercises);
    })
    .catch(error => {
      if (error.response) {
        console.log("Response Data: " + error.response.data);
        console.log("response Status: " + error.response.status);
        console.log("Response Headers: " + error.response.headers);
      } else if (error.request) {
        console.log("Error request: " + error.request);
      } else {
        console.log("Error", error.message);
      }
      console.log("Error Config: " + error.config);
      conv.close("I apologize. There was an error.");
    });
});

//Next workout
app.intent("Workout - next", (conv, { Continuition }) => {
  // console.log("next contexT: " + conv.data.exerciseCount + " = " + conv.queryResult.outputContexts)

  if (conv.data.exerciseCount < conv.data.currentSession.length) {
      var currExercise = conv.data.currentSession;
      var title = currExercise[conv.data.exerciseCount].Title;
      var description = currExercise[conv.data.exerciseCount].Description;
      var sets = currExercise[conv.data.exerciseCount].Sets;
      var reps = currExercise[conv.data.exerciseCount].Reps;
      var breakTime = currExercise[conv.data.exerciseCount].BreakTime;
      var gif = currExercise[conv.data.exerciseCount].Gif;
      var id = currExercise[conv.data.exerciseCount].id;
      console.log(gif);
      var instructions = currExercise[conv.data.exerciseCount].Instructions;
      console.log("Inside exercise response " + conv.data.exerciseCount);
      conv.ask(
        new SimpleResponse({
          speech: "Good work!",
          text: "Good work!"
        })
      );

      conv.ask(
        new BasicCard({
          title: title,
          subtitle: "Sets: " + sets + "  \nReps: " + reps,
          text: description,
          image: new Image({
            url: gif,
            alt: title
          }),
          display: "CROPPED"
        })
      );
      if (conv.data.exerciseCount >= conv.data.currentSession.length-1) {
        conv.ask(new Suggestions(["Finish Workout", "Skip", "Exit"]));
      } else {
        conv.ask(new Suggestions(["Next", "Skip", "Exit"]));
      }
      conv.data.exerciseCount++;

      if (Continuition == "Next") {
        conv.data.id.push(id.toString())
      }
    
  } else {
    conv.ask(
      new SimpleResponse({
        speech:
          "Your workout is complete! Say Finish Workout to complete your session.",
        text:
          "Your workout is complete! Tap 'Finish Workout' to complete your session."
      })
    );

    conv.ask(new Suggestions(["Finish Workout", "Exit"]));
  }
});

//Finish workout
app.intent("Workout - finish", (conv, { Finisher }) => {
  console.log("Inside finisher")
  console.log("Finish exercise: " + conv.data.id);
  console.log(conv.data.id)
  var dat = {
    "id" : conv.data.id
  }

  console.log(dat)

  // return getApiWithParams(encoded)

  return axios.get('https://fitsen.herokuapp.com/saveData', {
    params: {
      "email": conv.user.profile.payload.email,
      "list": dat
    }
  })
    .then(response => {

      console.log(response)
      var calories = response.data.calories
      if(calories == undefined) {
        calories = 7
      }

      conv.ask(
        new SimpleResponse({
          speech: "You burnt " + calories + " calories today! So, what next?",
          text: "Way to go!"
        })
      );

      conv.ask(
        new BasicCard({
          title: conv.user.profile.payload.given_name,
          subtitle: calories + " calories burnt!",
          // text: description,
          image: new Image({
            url: conv.user.profile.payload.picture,
            alt: conv.user.profile.payload.given_name
          }),
          display: "CROPPED"
        })
      );
      conv.ask(
        new Suggestions([
          "Another Workout",
          // "Meal Plans",
          "Meditation",
          // "Virtual Trainer",
          // "Virtual Therapist",
          "Motivation",
          "Binaural Beats",
          "White noise"
        ])
      );
      })
      
});

//Motivation
app.intent("Motivation", (conv) => {
  let quote = randomQuote();
  console.log(quote)
  conv.ask(
    new SimpleResponse({
      speech: quote,
      text: quote
    })
  );
  conv.ask(
    new SimpleResponse({
      speech: "So, what next?",
      text: "What next?"
    })
  );
  conv.ask(
    new Suggestions([
      "Another Motivational Quote",
      "Quick Workout",
      // "Meal Plans",
      "Meditation",
      // "Virtual Trainer",
      // "Virtual Therapist",
      "Binaural Beats",
       "White noise",
       "Exit"
    ])
  );
})

//Calming
app.intent("Calming", (conv) => {
  conv.ask(new SimpleResponse({
    speech:"<speak><audio src='https://drive.google.com/file/d/1Q-F2N1MBK42h2XLWfig3wnmoBoybn88L/view'></audio>Please choose between meditation, <break time='400ms'/> white noise, <break time='400ms'/>, or binaural beats</speak>",
    text: "Please tap one of the following suggestions."
  }));
  conv.ask(
    new Suggestions([
      "Meditation",
      "Binaural Beats",
      "White Noise",
      "Exit"
    ])
  );
})

app.intent("Meditation", (conv) => {

  console.log("Meditation")

  conv.ask(new SimpleResponse({
    speech: "Here's a guided meditation for you."  ,
    text: "The beginning to a clear mind."
  }));

  conv.ask(new MediaObject({
    name: 'Guided Meditation',
    url: 'https://health.ucsd.edu/av/mindfulness/20%20Min%20Seated%20Meditation.mp3',
    description: 'Narrated by UC San Diego Center for Integrative Medicine',
    image: new Image({
      url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcRZDJFXILPTCuVXWctpUxbv3PzQon0PqcPjplG5S_X3NcrL4gvt',
      alt: 'Spirituality',
    }),
  }));

  conv.ask(
    new Suggestions([
      "Binaural Beats",
      "White Noise",
      "Motivation",
      // "Virtual Therapist",
      "Quick Workout",
      // "Meal Plans",
      "Exit"
    ])
  );
})

app.intent("Binaural", (conv) => {

  console.log("Binaural")

  conv.ask(new SimpleResponse({
    speech: "Please wear headphones to experience the relaxing effect of these binaural beats."  ,
    text: "Please wear headphones to experience the relaxing effect of these binaural beats."
  }));

  conv.ask(new MediaObject({
    name: 'Relaxing Binaural Beats',
    url: 'https://ia902909.us.archive.org/13/items/RestorativeSleepMusicBinauralBeatsSleepInTheClouds432Hz/Pure%20Alpha%20Waves%20%2810%20Hz%29%20%20Relaxation.mp3',
    description: 'Pure Alpha waves (10Ghz)',
    image: new Image({
      url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcQNtEI6k5SaVztZ1t4ltsLbNTuOQIj3SgvltzrlL-h7VbDoHfSi',
      alt: 'Spirituality',
    }),
  }));

  conv.ask(
    new Suggestions([
      "Guided Meditation",
      "White Noise",
      "Motivation",
      // "Virtual Therapist",
      "Quick Workout",
      // "Meal Plans",
      "Exit"
    ])
  );
})

app.intent("White", (conv) => {

  console.log("White")

  conv.ask(new SimpleResponse({
    speech: "Please wear headphones to experience the concentration effect of white noise."  ,
    text: "Please wear headphones to experience the concentration effect of white noise."
  }));

  conv.ask(new MediaObject({
    name: 'White noise',
    url: 'https://firebasestorage.googleapis.com/v0/b/fitsen-4b19e.appspot.com/o/01-White-Noise-60min.mp3?alt=media&token=655c42d1-c748-4b7b-977c-9942eb0e46e7',
    description: 'TV Static',
    image: new Image({
      url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcSBZ1Gb6dCjdk2Qq6JD_UHXJ8MZsKZVlbSD-SPiLk18EluWowGu',
      alt: 'White Noise',
    }),
  }));

  conv.ask(
    new Suggestions([
      "Guided Meditation",
      "Binaural Beats",
      "Motivation",
      // "Virtual Therapist",
      "Quick Workout",
      // "Meal Plans",
      "Exit"
    ])
  );
})

app.intent('Exiter', (conv) => {
  conv.close(conv.data.exitResponse)
});

function getApi(url) {
  console.log(url);
  console.log(axios.get(url));
  return axios.get(url);
}

function getApiWithParams(url, params) {
  console.log(url);
  console.log(axios.get(url));
  return axios.get(url, {params:{data}});
}

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
