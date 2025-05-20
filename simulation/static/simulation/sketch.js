
let grassPatches = [];
let cows = [];
let alertLog = [];

let cowImg;
let sleepingCowImg;
let grasspatchImg;

let height = 600;
let width = 800;
let canvasWidth = 800;
let canvasHeight = 600;
let timeOfDay = 0.25;
let daySpeed = 0.001;

function preload() {
    cowImg = loadImage('/static/simulation/cow.png');
    sleepingCowImg = loadImage('/static/simulation/cow_sleeping.png');
    grasspatchImg = loadImage('/static/simulation/grasspatch.png');
}

function setup() {
    let canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent("simulation-canvas");
    angleMode(RADIANS);

    for (let i = 0; i < 10; i++) {
        cows.push(new Cow(random(width), random(height)));
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
        cow.draw();
    }
}

function logAlertToTable(cowId, temp, hr, time) {
    const table = document.getElementById("alert-log").querySelector("tbody");
    const row = document.createElement("tr");
    row.classList.add("alert-row");

    const cause = (temp < 35 || temp > 39) ? `Abnormal Temp (${temp.toFixed(1)}°C)` :
                 (hr < 55) ? `Low HR (${hr} bpm)` : "Unknown";

    row.innerHTML = `
        <td>${table.rows.length + 1}</td>
        <td>${cowId}</td>
        <td>${cause}</td>
        <td>${time}</td>
    `;

    table.prepend(row);
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

let Cow = function(x, y) {
    this.x = x;
    this.y = y;
    this.speedX = random(-0.5, 0.5);
    this.speedY = random(-0.5, 0.5);
    this.state = 'grazing';
    this.timer = int(random(100, 300));
    this.hunger = 100;
    this.maxHunger = 100;
    this.tiredness = 0;

    this.temperature = random(37.5, 38.5);
    this.heartrate = int(random(55, 65));
    this.isAlert = false;
    this.isSick = random(1) < 0.3;

    this.update = function() {
        this.timer--;
        this.hunger = constrain(this.hunger - 0.05, 0, this.maxHunger);
        this.tiredness = constrain(this.tiredness + random(0.1, 0.3), 0, 100);

        let tempDrift = this.isSick ? random(-0.05, 0.15) : random(-0.03, 0.03);
        let hrDrift = this.isSick ? int(random(-1, 2)) + 1 : int(random(-1, 2));
        this.temperature = constrain(this.temperature + tempDrift, 33.0, 41.5);
        this.heartrate = constrain(this.heartrate + hrDrift, 40, 100);

        let prevAlert = this.isAlert;
        this.isAlert = (this.temperature < 35.0 || this.temperature > 39.0 || this.heartrate < 55);

        if (this.isAlert && !prevAlert) {
            const cowId = this.x.toFixed(0) + "-" + this.y.toFixed(0);
            const time = new Date().toLocaleTimeString();
            alertLog.push({ id: cowId, temp: this.temperature.toFixed(1), hr: this.heartrate, time });
            logAlertToTable(cowId, this.temperature, this.heartrate, time);
        }

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
    };

    this.draw = function() {
        push();
        translate(this.x + 45, this.y + 45);
        if (this.speedX > 0.2) scale(-1, 1);
        imageMode(CENTER);
        if (this.isAlert) tint(255, 0, 0);
        if (this.state == 'sleeping') image(sleepingCowImg, 0, 0, 90, 90);
        else image(cowImg, 0, 0, 90, 90);
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

        if (this.isAlert) {
            fill(255, 0, 0);
            textSize(12);
            text("⚠️ VITALS", this.x + 20, this.y - 45);
        }

        if (this.state === 'eating') {
            fill(255);
            textSize(10);
            text("😋", this.x + 10, this.y - 10);
        }
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
