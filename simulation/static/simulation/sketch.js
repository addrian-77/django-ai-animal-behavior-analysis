let grassPatches = [];
let cows = [];
let alertLog = [];

let cowImg;
let sleepingCowImg;
let baby_cowImg;
let sleeping_baby_CowImg;
let old_cowImg;
let sleeping_old_CowImg;
let grasspatchImg;
let heartImg;

let height = 800;
let width = 1000;
let canvasWidth = 1000;
let canvasHeight = 800;
let timeOfDay = 0.25;
let daySpeed = 0.001;

let hoveredCow = null;
let activeCow = null;
let activeDiagnosis = null;
let lastCowId = null;
let diagnosisBox = { x: 0, y: 0, w: 160, h: 40 };


let hoverDiagnosis = null;
let hoverPredictionTime = null;

let cowDiagnosis = null;

let totalcows = 0;

function preload() {
    heartImg = loadImage('/static/simulation/hearts.png');
    baby_cowImg = loadImage('/static/simulation/baby_cow.png');
    cowImg = loadImage('/static/simulation/cow.png');
    old_cowImg = loadImage('/static/simulation/old_cow.png');
    sleeping_baby_CowImg = loadImage('/static/simulation/baby_cow_sleeping.png');
    sleepingCowImg = loadImage('/static/simulation/cow_sleeping.png');
    sleeping_old_CowImg = loadImage('/static/simulation/old_cow_sleeping.png');
    grasspatchImg = loadImage('/static/simulation/grasspatch.png');
}

function setup() {
    let canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent("simulation-canvas");
    angleMode(RADIANS);

    for (let i = 0; i < 10; i++) {
        totalcows += 1;
        cows.push(new Cow(random(width), random(height), "Cow #" + totalcows));
    }
    for (let i = 0; i < 10; i++) {
        grassPatches.push(new Grass(random(width), random(height)));
    }
}

function draw() {
    timeOfDay += daySpeed;
    if (timeOfDay > 1) timeOfDay = 0;

    drawSky();

    for (let i = grassPatches.length - 1; i >= 0; i--) {
        grassPatches[i].update(i);
        grassPatches[i].draw();
    }

    for (let cow of cows) {
        cow.update();
        // Removed AI call here — now done on click only
        cow.draw();
    }

    // Draw diagnosis box at clicked cow's position (if any)
    if (hoveredCow && hoverDiagnosis) {
        fill(255);
        rect(hoveredCow.x + 60, hoveredCow.y - 70, 150, 60);
        fill(0);
        textSize(12);
        text(`Diagnosis: ${hoverDiagnosis}`, hoveredCow.x + 65, hoveredCow.y - 30);

        if (hoverPredictionTime !== null && hoverDiagnosis != "Loading...") {
            textSize(10);
            fill(100);
            text(`Prediction time: ${(hoverPredictionTime * 1000).toFixed(1)} ms`, hoveredCow.x + 65, hoveredCow.y - 45);
        }
    }
    for (let cow of cows) {
        if (cow.breeding && cow.breedingTimer > 0) {
            image(heartImg, cow.x + 35, cow.y - 60, 60, 60);
        }
    }
    drawHUD();
    if (this.analysisLog && this.analysisLog.length > 0) {
            fill(50);
            textSize(9);
            for (let i = 0; i < this.analysisLog.length; i++) {
                text(this.analysisLog[i], this.x + 20, this.y + 70 + i * 10);
            }
        }
        if (hoveredCow && hoveredCow.analysisLog.length > 0) {
        fill(255, 255, 255, 200);
        rect(hoveredCow.x + 60, hoveredCow.y - 10, 180, hoveredCow.analysisLog.length * 15 + 10, 10); // background box
        
        fill(0);
        textSize(10);
        for (let i = 0; i < hoveredCow.analysisLog.length; i++) {
            text(hoveredCow.analysisLog[i], hoveredCow.x + 65, hoveredCow.y + i * 15);
        }
    }

    fill(255, 200, 200, 180);
    rect(5, height - 120, 300, 110, 5); // background for log

    fill(0);
    textSize(12);
    text("Alert Log:", 10, height - 105);
    textSize(10);
    for (let i = 0; i < min(alertLog.length, 5); i++) {
        let alert = alertLog[alertLog.length - 1 - i]; // show latest first
        text(`${alert.time} - Cow ${alert.id} Temp: ${alert.temp}°C HR: ${alert.hr}`, 10, height - 90 + i * 20);
    }


}
function drawHUD() {
    fill(0);
    textSize(14);
    text(`Total Cows: ${cows.length}`, 10, 20);
    let sickCount = cows.filter(c => c.isAlert).length;
    text(`Sick Cows: ${sickCount}`, 10, 40);
    let avgTemp = cows.reduce((sum, c) => sum + c.temperature, 0) / cows.length;
    text(`Avg Temp: ${avgTemp.toFixed(2)}°C`, 10, 60);
}



function mouseClicked() {
    let clickedCowFound = false;
    for (let cow of cows) {
        let d = dist(mouseX, mouseY, cow.x + 45, cow.y + 45);
        if (d < 45) {
            hoveredCow = cow; // set hoveredCow immediately
            hoverDiagnosis = "Loading...";
            let temp_temperature = cow.tempetature;
            let temp_heartrate = cow.heartarte;
            let temp_hunger = cow.hunger;
            let temp_tiredness = cow.tiredness;
            sendCowDataToAI(cow).then(prediction => {
                hoverDiagnosis = prediction;
                hoveredCow.analysisLog.push(`[${new Date().toLocaleTimeString()}] ${prediction}`);
                if (hoveredCow.analysisLog.length > 5) hoveredCow.analysisLog.shift(); // limit to 5 entries
                showPanel(
                    {
                        temperature: temp_temperature,
                        heartrate: temp_heartrate,
                        hunger: temp_hunger,
                        tiredness: temp_tiredness,
                    },
                    prediction,
                    hoverPredictionTime || 0
                );
            });

            clickedCowFound = true;
            break;
        }
    }
    if (!clickedCowFound) {
        // Clear diagnosis if clicked outside cows
        hoveredCow = null;
        hoverDiagnosis = null;
    }
}


function sendCowDataToAI(cow) {
    return fetch("/predict/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            temperature: cow.temperature,
            heartrate: cow.heartrate,
            hunger: cow.hunger,
            tiredness: cow.tiredness
        })
    })
    .then(res => res.json())
    .then(data => {
        console.log("AI Prediction:", data.prediction, "Time:", data.prediction_time);
        hoverPredictionTime = data.prediction_time;
        return data.prediction;
    })
    .catch(err => {
        console.error("AI error:", err);
        hoverPredictionTime = null;
        return "Error";
    });
}

function showPanel(data, diagnosis, predictionTime) {
    document.getElementById('input-data').innerText = JSON.stringify(data, null, 2);
    document.getElementById('ai-diagnosis').innerText = diagnosis;
    document.getElementById('prediction-time').innerText = `${predictionTime.toFixed(2)} s`;
    document.getElementById('ai-analysis-panel').style.display = 'block';
}

document.addEventListener('click', function(event) {
    const panel = document.getElementById('ai-analysis-panel');
    
    // If the panel is visible and the click target is outside the panel
    if (panel.style.display === 'block' && !panel.contains(event.target)) {
        hidePanel();
    }
});


function hidePanel() {
    document.getElementById('ai-analysis-panel').style.display = 'none';
}


function spawnCow(x, y) {
    totalcows += 1;
    cows.push(new Cow(x, y, "Cow #" + totalcows));
}

function drawSky() {
    let daylight = sin(TWO_PI * timeOfDay);
    daylight = map(daylight, -1, 1, 0, 1);
    let baseR = 163;
    let baseG = 217;
    let baseB = 119;

    let arcRadius = 500;
    let centerX = canvasWidth / 2;
    let centerY = canvasHeight - 70;

    noStroke();

    if (timeOfDay >= 0.25 && timeOfDay <= 0.75) {
        let sunAngle = map(timeOfDay, 0.25, 0.75, PI, 0);
        let sunX = centerX + arcRadius * cos(sunAngle);
        let sunY = centerY - arcRadius * sin(sunAngle);

        background(baseR, baseG, baseB);
        fill(255, 204, 0);
        ellipse(sunX, sunY, 40, 40);
    } else {
        let moonTime = timeOfDay < 0.25 ? timeOfDay + 1 : timeOfDay;
        let moonAngle = map(moonTime, 0.75, 1.25, PI, 0);
        let moonX = centerX + arcRadius * cos(moonAngle);
        let moonY = centerY - arcRadius * sin(moonAngle);
        let brightnessFactor = 0.32;

        background(baseR * brightnessFactor, baseG * brightnessFactor, baseB * brightnessFactor);
        fill(220, 220, 255);
        ellipse(moonX, moonY, 30, 30);
    }
}
let Cow = function(x, y, name) {
    this.x = x;
    this.y = y;
    this.name = name
    this.speedX = random(-0.5, 0.5);
    this.speedY = random(-0.5, 0.5);
    this.state = 'grazing';
    this.timer = int(random(100, 300));
    this.hunger = 100;
    this.maxHunger = 100;
    this.tiredness = 0;

    this.temperature = random(37.5, 38.5);
    this.heartrate = int(random(55, 65));
    // this.isAlert = false;
    this.aiAssessment = '';

    this.age = 0; // in days or ticks
    this.lifespan = int(random(3000, 5000)); // random lifespan (adjust as needed)
    this.reproductionCooldown = 0; // ticks until cow can reproduce again
    this.gestation = false;
    this.gestationTimer = 0;
    this.breeding = false;
    this.breedingTimer = 0;
    this.aiAssessmentRequested = false;

    this.history = [];

    this.analysisLog = [];

    this.update = function() {
        this.history.push({
            temperature: this.temperature,
            heartrate: this.heartrate,
            hunger: this.hunger,
            tiredness: this.tiredness,
            tick: frameCount
        });
        if (this.history.length > 10) this.history.shift();
        this.timer--;
        this.hunger = constrain(this.hunger - 0.05, 0, this.maxHunger);
        this.tiredness = constrain(this.tiredness + random(0.1, 0.3), 0, 100);

        let tempDrift = this.isSick ? random(-0.05, 0.15) : random(-0.03, 0.03);
        let hrDrift = int(random(-1, 1));
        this.temperature = constrain(this.temperature + tempDrift, 33.0, 41.5);
        this.heartrate = constrain(this.heartrate + hrDrift, 40, 100);
        // Age and death
        this.age++;
        if (this.age > this.lifespan) {
            cows = cows.filter(c => c !== this); // Remove this cow from the herd
            return;
        }

        // Reproduction cooldown
        if (this.reproductionCooldown > 0) {
            this.reproductionCooldown--;
        }

        // Handle gestation
        if (this.age > this.lifespan / 3) {
            if (this.gestation) {
                this.gestationTimer--;
                if (this.gestationTimer <= 0) {
                    this.gestation = false;
                    this.breeding = true;
                    this.breedingTimer = 60; // 60 frames (~1 second)
                    this.reproductionCooldown = 1000; // Prevent immediate repeat
                    spawnCow(this.x + random(-20, 20), this.y + random(-20, 20));
                }
            }
        }

        if (!this.gestation && this.reproductionCooldown === 0) {
        for (let other of cows) {
            if (other !== this && !other.gestation && other.reproductionCooldown === 0) {
                let d = dist(this.x, this.y, other.x, other.y);
                if (d < 60) { // Close enough to mate
                    this.gestation = true;
                    this.gestationTimer = 600; // Gestation duration
                    break;
                }
            }
        }
    }

        // let prevAlert = this.isAlert;
        // this.isAlert = (this.temperature < 35.0 || this.temperature > 39.0 || this.heartrate < 55);
        // if (this.isAlert && !this.aiAssessmentRequested) {
        //     sendCowDataToAI(this);
        //     this.aiAssessmentRequested = true;
        // }


        // if (this.isAlert && !prevAlert) {
        //     const cowId = this.x.toFixed(0) + "-" + this.y.toFixed(0);
        //     const time = new Date().toLocaleTimeString();
        //     alertLog.push({ id: cowId, temp: this.temperature.toFixed(1), hr: this.heartrate, time });
        //     logAlertToTable(cowId, this.temperature, this.heartrate, time);
        // }

        if (this.tiredness > 80 && this.state !== 'sleeping') {
            this.state = 'sleeping';
            this.speedX = 0;
            this.speedY = 0;
            this.timer = int(random(200, 400));
        }

        if (this.hunger < 50 && this.state !== 'eating' && this.state !== 'sleeping') {
            let nearest = null;
            let minDist = Infinity;
            for (let grass of grassPatches) {
                if (!grass.eaten) {
                    let d = dist(this.x + 45, this.y + 45, grass.x + 30, grass.y + 30);
                    if (d < minDist) {
                        minDist = d;
                        nearest = grass;
                    }
                }
            }

            if (nearest) {
                let dx = nearest.x - this.x;
                let dy = nearest.y - this.y;
                let mag = sqrt(dx * dx + dy * dy);
                if (mag > 0) {
                    this.speedX = (dx / mag) * 0.5;
                    this.speedY = (dy / mag) * 0.5;
                }

                this.x += this.speedX;
                this.y += this.speedY;

                if (minDist < 30) {
                    nearest.consume();
                    this.state = 'eating';
                    this.timer = 100;
                    this.hunger += 50;
                    if (this.hunger > this.maxHunger) this.hunger = this.maxHunger;
                }
                return;
            }
        }

        if (this.timer <= 0 && this.state !== 'eating' && this.state !== 'sleeping') {
            let states = ['grazing', 'walking', 'resting'];
            this.state = random(states);
            if (this.state === 'walking') {
                this.speedX = random(-0.5, 0.5);
                this.speedY = random(-0.5, 0.5);
            } else if (this.state === 'grazing') {
                this.speedX = random(-0.2, 0.2);
                this.speedY = random(-0.2, 0.2);
            } else {
                this.speedX = 0;
                this.speedY = 0;
            }
            this.timer = int(random(200, 500));
        }

        switch (this.state) {
            case 'grazing':
                this.speedX = random(-0.2, 0.2);
                this.speedY = random(-0.2, 0.2);
                this.x += this.speedX;
                this.y += this.speedY;
                break;
            case 'walking':
                this.x += this.speedX;
                this.y += this.speedY;
                break;
            case 'eating':
                this.state = 'resting';
                break;
            case 'resting':
                break;
            case 'sleeping':
                if (this.timer <= 0) {
                    this.tiredness = 0;
                    this.state = 'grazing';
                }
                break;
        }

        this.x = constrain(this.x, 45, width - 45);
        this.y = constrain(this.y, 45, height - 45);
        let prevAlert = this.isAlert;
        this.isAlert = (this.temperature < 35.0 || this.temperature > 39.0 || this.heartrate < 55);

        if (prevAlert != this.isAlert) {
            this.aiAssessmentRequested = false;
        }
        if (this.isAlert && !this.aiAssessmentRequested) {
            this.aiAssessmentRequested = true;

            sendCowDataToAI(this).then(prediction => {
                this.aiAssessment = prediction;

                // Optional: log the alert
                const cowId = `${this.x.toFixed(0)}-${this.y.toFixed(0)}`;
                const time = new Date().toLocaleTimeString();
                alertLog.push({ id: cowId, temp: this.temperature.toFixed(1), hr: this.heartrate, time });
                console.log(`🚨 Alert for cow ${cowId}: ${prediction}`);
            });
        }
        this.applyDiagnosisEffect();

    };


    this.applyDiagnosisEffect = function() {
        if (!this.aiAssessment) return;

        switch (this.aiAssessment.toLowerCase()) {
            case 'healthy':
                // Cow behaves normally
                this.tiredness = max(0, this.tiredness - 0.1);
                this.hunger = max(0, this.hunger - 0.05);
                break;

            case 'sick':
                // Sick cows move slower, get tired faster, or act differently
                this.speedX *= 0.5;
                this.speedY *= 0.5;
                this.tiredness += 0.5; // gets tired faster
                if (this.state !== 'sleeping') this.state = 'resting';
                break;

            case 'hungry':
                // If AI predicts hunger, increase hunger loss or make cow seek food more aggressively
                this.hunger -= 0.2;
                if (this.state !== 'eating') this.state = 'walking'; // encourage movement toward food
                break;

            case 'tired':
                // If AI predicts tiredness, force sleep earlier
                if (this.state !== 'sleeping') this.state = 'sleeping';
                break;

            // Add more cases based on AI prediction labels you expect

            default:
                // Unknown diagnosis - no effect
                break;
        }
    };


    this.draw = function() {
        push();

        translate(this.x + 45, this.y + 45);
        if (this.speedX > 0.2) scale(-1, 1);
        imageMode(CENTER);
        if (this.isAlert) tint(255, 0, 0);
        if (this.age < this.lifespan / 4) {
            if (this.state == 'sleeping') image(sleeping_baby_CowImg, 0, 0, 90, 90);
            else image(baby_cowImg, 0, 0, 90, 90);
        } else if (this.age > 3 * this.lifespan / 4) {
            if (this.state == 'sleeping') image(sleeping_old_CowImg, 0, 0, 90, 90);
            else image(old_cowImg, 0, 0, 90, 90);
        } else {
            if (this.state == 'sleeping') image(sleepingCowImg, 0, 0, 90, 90);
            else image(cowImg, 0, 0, 90, 90);
        }
        noTint();
        pop();

        let barWidth = 50;

        let hungerRatio = this.hunger / this.maxHunger;
        fill(255, 0, 0); rect(this.x + 20, this.y, barWidth, 5);
        fill(0, 255, 0); rect(this.x + 20, this.y, barWidth * hungerRatio, 5);

        let tirednessRatio = this.tiredness / 100;
        fill(255, 0, 0); rect(this.x + 20, this.y - 10, barWidth, 5);
        fill(0, 0, 255); rect(this.x + 20, this.y - 10, barWidth * tirednessRatio, 5);

        fill(0);
        textSize(10);
        textAlign(LEFT);

        text(`🌡️ ${this.temperature.toFixed(1)}°C`, this.x + 20, this.y - 22);
        text(`❤️ ${this.heartrate} bpm`, this.x + 20, this.y - 34);
        textSize(10);
        text(`Age: ${this.age}`, this.x + 20, this.y - 46);
        if (this.gestation) {
            fill(255, 105, 180);
            text("🤰", this.x + 20, this.y - 58);
        }

        if (this.state === 'eating') {
            fill(255);
            textSize(10);
            text("😋", this.x + 10, this.y - 10);
        }
        if (this.breeding && this.breedingTimer > 0) {
            this.breedingTimer--;
            if (this.breedingTimer <= 0) {
                this.breeding = false;
            }
        }
        if (this.aiAssessment) {
            fill(255, 255, 0);
            textSize(10);
            text(`🤖 ${this.aiAssessment}`, this.x + 20, this.y - 80);
        }
        fill(0);
        textSize(12);
        text(this.name, this.x + 20, this.y - 60);

    };
};

let Grass = function(x, y) {
    this.x = x;
    this.y = y;
    this.eaten = false;
    this.respawnTimer = 0;

    this.update = function(index) {
        if (this.eaten) {
            this.respawnTimer--;
            if (this.respawnTimer <= 0) {
                grassPatches.splice(index, 1);
                grassPatches.push(new Grass(random(width - 60), random(height - 60)));
            }
        }
    };

    this.draw = function() {
        if (!this.eaten) {
            image(grasspatchImg, this.x, this.y, 60, 60);
        }
    };

    this.consume = function() {
        this.eaten = true;
        this.respawnTimer = 300;
    };
};
