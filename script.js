
/* global variables declaration */

let canvas;
let story;
let storyContainer;
let lines = []; 
let savedDoodles = [];
let doodlePredictions = [];
const opacityTimings = [1, 1.5, 2, 2.5, 3];

/* setup function */

function setup() {

  canvas = createCanvas(475, 400);
  strokeWeight(24);
  canvas.parent('drawing-board');
  background(255);

  // Buttons
  let clearBtn = select('#clear');
  clearBtn.mousePressed(clearCanvas); 

  let saveBtn = select('#save');
  saveBtn.mousePressed(saveDoodle);
  
  let processBtn = select('#process');
  processBtn.mousePressed(showDoodles);

  let generateStoryBtn = select('#generateStory');
  console.log(generateStoryBtn);
  generateStoryBtn.mousePressed(generateStory);

  let downloadStoryBtn = select('#downloadStory');
  downloadStoryBtn.mousePressed(downloadStory);

  let loadingMessage = createDiv('<div id="loading-spinner"></div> Generating story...').id('loading-message');
  loadingMessage.hide();
  select('#loading-message').hide();

  storyContainer = select('#story-container');
  if (!storyContainer) {
    console.error("The 'story' element was not found in the HTML document.");
  }

  createTwinklingStars();

  // extra...........hehe
  let madeByDiv = createDiv('Made by Devesh Yadav⭐').id('made-by');

}

/* Function to create twinkling stars with color transition and varied timings */

function createTwinklingStars() {
  const numStars = 100;
  const twinklingStarsContainer = document.querySelector('.twinkling-stars');

  for (let i = 0; i < numStars; i++) {
    const star = document.createElement('div');
    star.classList.add('twinkling-star');

    // call setRandomPosition function
    setRandomPosition(star);

    const duration = Math.random() * 2 + 1;
    star.style.animationDuration = `${duration}s`;

    star.style.animation = `twinkling ${getRandomOpacityTiming()}s infinite, colorTransition ${Math.random() * 3 + 2}s infinite`;

    twinklingStarsContainer.appendChild(star);
  }
}

/* Function to get a random opacity timing for stars */

function getRandomOpacityTiming() {
  const randomIndex = Math.floor(Math.random() * opacityTimings.length);
  return opacityTimings[randomIndex];
}

/* Function to set random position for a star */

function setRandomPosition(star) {
  const posX = Math.random() * window.innerWidth;
  const posY = Math.random() * window.innerHeight;

  star.style.left = `${posX}px`;
  star.style.top = `${posY}px`;
}

/* Main canvas doodle draw function */

function draw() {
  if (mouseIsPressed) {
    line(pmouseX, pmouseY, mouseX, mouseY);
    saveLine(); 
  }
}

/* Store line function */

function saveLine() {
  lines.push({
    x1: pmouseX, 
    y1: pmouseY,
    x2: mouseX,
    y2: mouseY
  });
}

/* Clear canvas function */
function clearCanvas() {
  background(255);
}

/* Function to save doodles */

function saveDoodle() {
  savedDoodles.push(canvas.elt.toDataURL());
  clearCanvas();
}

/* Function to show doodles with top 2 classified tags from DoodleNet modle*/
async function showDoodles() {
  let doodleList = select('#doodle-list');
  doodleList.html('');

  for (let i = 0; i < savedDoodles.length; i++) {
    let img = createImg(savedDoodles[i]);
    img.addClass('doodle-img');

    // Initialize the DoodleNet classifier
    const classifier = ml5.imageClassifier('DoodleNet', modelLoaded);

    // Classify the doodle image
    classifier.predict(img.elt, (err, results) => {
      if (!err) {
        
        let classificationResult = createP(`1) ${results[0].label} , 
        2) ${results[1].label} `);
        
        // Adjust styling for better visibility
        classificationResult.style('font-size', '16px');
        classificationResult.style('font-weight', '550'); 
        classificationResult.style('margin', '0'); 
        classificationResult.style('padding', '5px'); 
        classificationResult.style('color', '#414141');

        let container = createDiv();
        container.child(img);
        container.child(classificationResult);

        doodleList.child(container);
      }
    });
    doodlePredictions.push(await classifyDoodle(img));
  }
}

/* To check whether DoodleNet model is loaded or not */

function modelLoaded() {
  console.log('DoodleNet model loaded!');
}

/* Function to generate story from tags using gpt-3.5-turbo model by API call */

async function generateStory() {
  console.log('Generate Story button clicked');

  select('#loading-message').show();

  // Create a prompt string for GPT-3
  const storyPrompts = generateStoryPrompts(doodlePredictions);
  console.log('Story Prompts:', storyPrompts);

  const storyNameMessage = { role: 'user', content: '' }; 

  //prompt for creating the story using classified tags
  const userMessages = doodlePredictions.map((prediction, index) => {
    return { role: 'user', content: `As a creative storyteller, craft an intriguing and captivating story(very important : keep less than 2000 tokens in the story) based on the following tags: ${storyPrompts} .
    start by providing a captivating name for story in big letters, put colon ":" before the start of first line of story.
    Weave these tags into the narrative, using them to create compelling characters, fascinating objects, exciting incidents, 
    and any other elements that contribute to the richness of the story. Explore the relationships between the characters, 
    the significance of the objects, and the impact of the incidents, ensuring a tale that sparks imagination and leaves the 
    audience wanting more. provide some names to characters and try to frame a complete and systemetic story ` };
  });
  
  const conversation = [
    { role: 'system', content: 'You are a helpful assistant.' },
    storyNameMessage,
    ...userMessages,
  ];
  
  // calling the gpt-3.5-turbo model through API key
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_OPENAI_API_KEY_HERE', // Add your API key
  },
  body: JSON.stringify({
    model: 'gpt-3.5-turbo', // Add the model you want to use
    messages: conversation,
    max_tokens: 2500,
    temperature: 0.6, 
  }),
});

  if (response.ok) {

    select('#loading-message').hide();
    const data = await response.json();

    // Extracting the story name from the API response
    const storyName = data.choices[0].message.content.split('\n')[0];
    storyNameMessage.content = `-- ${storyName} --\n\n`;

    const storyText = data.choices[0].message.content;
    console.log('Generated Story:', storyText);
    
    // Adjusting lines and paragraphs
    const linesPerParagraph = 3;
    const lines = storyText.split('\n');
    const paragraphs = [];
    for (let i = 0; i < lines.length; i += linesPerParagraph) {
        paragraphs.push(lines.slice(i, i + linesPerParagraph).join(' '));
    }

    // Clear the previous story content
    storyContainer.html('');

    // Append story name
    storyContainer.child(createDiv(storyNameMessage.content).id('story-name').style('text-align', 'left').style('margin-bottom', '20px').style('font-size', '1.5em').style('font-family', 'Montserrat'));

    for (let i = 0; i < paragraphs.length; i++) {
      storyContainer.child(createDiv(paragraphs[i]).id('story').style('text-align', 'left').style('margin-bottom', '20px'));
  }
  } else {
    select('#loading-message').hide();
    console.error('Error generating story:', response.statusText);
  }
}

/* Function to classify doodles */

function classifyDoodle(img) {
  return new Promise((resolve, reject) => {
    const classifier = ml5.imageClassifier('DoodleNet', modelLoaded);
    classifier.predict(img.elt, (err, results) => {
      if (!err) {
        resolve(results.map(result => ({ label: result.label, confidence: result.confidence })));
      } else {
        reject(err);
      }
    });
  });
}

/* Function to extract tags as prompts for story */

function generateStoryPrompts(doodlePredictions) {
  // Extract doodle tags from predictions
  let prompts = doodlePredictions.map((prediction, index) => prediction[0].label).join(', ');
  return prompts;
}

/* Function to download the generated story as pdf */

function downloadStory() {
  const storyText = storyContainer.elt.innerText;

  if (typeof PDFLib === 'undefined') {
    console.error('PDFLib is not defined. Make sure the library is loaded.');
    return;
  }

  (async () => {
    try {
      const pdfDoc = await PDFLib.PDFDocument.create();
      const page = pdfDoc.addPage([650, 800]);

      let yPosition = 800 - 50;
      const maxWidth = 600;
      const fontSize = 12;

      const lines = storyText.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const words = line.split(' ');

        let currentLine = words[0];

        for (let j = 1; j < words.length; j++) {
          const testLine = currentLine + ' ' + words[j];
          const width = (testLine.length * fontSize) / 1.7;

          if (width <= maxWidth) {
            currentLine += ' ' + words[j];
          } else {
            page.drawText(currentLine, { x: 50, y: yPosition, size: 12, textAlignment: 'left' });
            page.drawText(currentLine, { x: 50, y: yPosition, size: 12, textAlignment: 'right', maxWidth });
            yPosition -= 15; 
            currentLine = words[j];
          }
        }

        page.drawText(currentLine, { x: 50, y: yPosition, size: 12, textAlignment: 'left' });
        page.drawText(currentLine, { x: 50, y: yPosition, size: 12, textAlignment: 'right', maxWidth });
        yPosition -= 15;
      }

      yPosition -= 20;

      const pdfBlob = await pdfDoc.save();
      const pdfBlobUrl = URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));

      const link = document.createElement('a');
      link.href = pdfBlobUrl;
      link.download = 'Doodle_story.pdf';
      link.click();
    } catch (error) {
      console.error('Error creating PDF:', error);
    }
  })();
}

// Loading  pdf-lib script directly from the CDN
(async () => {
  try {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js';
    script.type = 'text/javascript';

    // Add the script to the document
    document.head.appendChild(script);
  } catch (error) {
    console.error('Error loading PDFLib:', error);
  }
})();


